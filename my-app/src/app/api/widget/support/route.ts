import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { countWords, getClientIp } from '@/lib/widget-security'
import { enforceWidgetRateLimit } from '@/lib/widget-rate-limit.server'
import { authorizeWidgetRequest, getOrCreateWidgetEmbedSecret } from '@/lib/widget-embed-token.server'
import { createWidgetCaptchaChallenge, verifyWidgetCaptchaToken } from '@/lib/widget-captcha.server'

const MAX_WIDGET_MESSAGE_WORDS = 400

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint, X-Vintra-Captcha-Token, X-Vintra-Debug',
    Vary: 'Origin',
  }
}

function mapMessage(message: any) {
  return {
    id: message.id || crypto.randomUUID(),
    role:
      message.role === 'assistant' ||
      message.role === 'support' ||
      message.role === 'system'
        ? message.role
        : 'user',
    text: String(message.text || ''),
    createdAt:
      typeof message.createdAt?.toDate === 'function'
        ? message.createdAt.toDate().toISOString()
        : String(message.createdAt || new Date().toISOString()),
  }
}

function getRequestCountryCode(req: NextRequest) {
  const headerCountry =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    (req as any).geo?.country

  const country = String(headerCountry || 'XX').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : 'XX'
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const widgetKey = req.nextUrl.searchParams.get('key')
    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (!widgetKey || !sessionId) {
      return NextResponse.json({ error: 'Missing widget key or sessionId' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.id) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const access = await authorizeWidgetRequest({ req, business })
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403, headers })
    }

    const chatRef = adminDb.collection('businesses').doc(business.id).collection('supportChats').doc(sessionId)
    const snap = await chatRef.get()

    if (!snap.exists) {
      return NextResponse.json(
        {
          sessionId,
          status: 'none',
          messageCount: 0,
          visitorName: null,
          countryCode: null,
          messages: [],
        },
        { headers }
      )
    }

    const data = snap.data() || {}

    return NextResponse.json(
      {
        sessionId,
        status: data.status || 'needs-human',
        messageCount: Number(data.messageCount || 0),
        visitorName: data.visitorName,
        countryCode: data.countryCode,
        messages: Array.isArray(data.messages) ? data.messages.map(mapMessage) : [],
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget support GET error:', error)
    return NextResponse.json({ error: 'Failed to load support chat' }, { status: 500, headers })
  }
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const body = await req.json()
    const widgetKey = String(body.widgetKey || '')
    const sessionId = String(body.sessionId || '')
    const message = String(body.message || '').trim()
    const countryCode = String(body.countryCode || getRequestCountryCode(req) || 'XX').toUpperCase()
    const fingerprint = String(req.headers.get('x-vintra-fingerprint') || body.fingerprint || '').trim()
    const captchaToken = String(req.headers.get('x-vintra-captcha-token') || body.captchaToken || '').trim()

    if (!widgetKey || !sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing widget key, sessionId or message' },
        { status: 400, headers }
      )
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.id) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const access = await authorizeWidgetRequest({ req, business })
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403, headers })
    }

    const captchaSecret = await getOrCreateWidgetEmbedSecret(business.id)
    const captchaVerification = captchaToken
      ? verifyWidgetCaptchaToken({
          secret: captchaSecret,
          captchaToken,
          businessId: business.id,
          widgetKey,
          sessionId,
          fingerprint,
          clientIp: getClientIp(req),
        })
      : { valid: false as const }

    const rateLimitCheck = await enforceWidgetRateLimit({
      businessId: business.id,
      widgetKey,
      clientId: getClientIp(req),
      sessionId,
      fingerprint,
      action: 'widget-support',
      rules: [
        { windowMs: 10_000, maxRequests: 4 },
        { windowMs: 60_000, maxRequests: 12 },
      ],
      captchaRules: [
        { windowMs: 60_000, maxRequests: 60 },
        { windowMs: 3_600_000, maxRequests: 240 },
      ],
      captchaTokenValid: captchaVerification.valid,
    })

    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.captchaRequired) {
        const challenge = createWidgetCaptchaChallenge({
          secret: captchaSecret,
          businessId: business.id,
          widgetKey,
          sessionId,
          fingerprint,
          clientIp: getClientIp(req),
        })

        return NextResponse.json(
          {
            error: 'Captcha required',
            captchaRequired: true,
            captchaQuestion: challenge.question,
            captchaToken: challenge.challengeToken,
            captchaExpiresInSeconds: challenge.expiresInSeconds,
          },
          { status: 429, headers }
        )
      }

      return NextResponse.json(
        {
          error: `You're sending messages too quickly. Please wait ${rateLimitCheck.retryAfterSeconds}s and try again.`,
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
        { status: 429, headers }
      )
    }

    if (countWords(message) > MAX_WIDGET_MESSAGE_WORDS) {
      return NextResponse.json(
        { error: `Message is too long. Max ${MAX_WIDGET_MESSAGE_WORDS} words.` },
        { status: 400, headers }
      )
    }

    const chatRef = adminDb.collection('businesses').doc(business.id).collection('supportChats').doc(sessionId)
    const snap = await chatRef.get()

    const data = snap.data() || {}
    const businessRef = adminDb.collection('businesses').doc(business.id)

    const nextMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: message,
      createdAt: new Date().toISOString(),
    }

    await chatRef.set(
      {
        sessionId,
        businessId: business.id,
        widgetKey,
        status: data.status || 'needs-human',
        source: 'widget',
        preview: message,
        visitorName: data.visitorName || null,
        countryCode: countryCode || data.countryCode || null,
        pageTitle: data.pageTitle || null,
        pageUrl: data.pageUrl || null,
        messageCount: FieldValue.increment(1),
        messages: FieldValue.arrayUnion(nextMessage),
        supportRequestedAt: data.supportRequestedAt || FieldValue.serverTimestamp(),
        createdAt: data.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    await businessRef.update({
      updatedAt: FieldValue.serverTimestamp(),
      'chatAnalytics.totalMessages': FieldValue.increment(1),
      'chatAnalytics.lastChatAt': FieldValue.serverTimestamp(),
      [`chatAnalytics.countryCounts.${countryCode}`]: FieldValue.increment(1),
      'chatAnalytics.timeline': FieldValue.arrayUnion({
        id: crypto.randomUUID(),
        kind: 'visitor-message',
        sessionId,
        countryCode,
        createdAt: new Date(),
      }),
    })

    const nextSnap = await chatRef.get()
    const nextData = nextSnap.data() || data

    return NextResponse.json(
      {
        sessionId,
        status: nextData.status || data.status || 'needs-human',
        messageCount: Number(nextData.messageCount || 0),
        visitorName: nextData.visitorName || data.visitorName,
        countryCode: nextData.countryCode || data.countryCode || countryCode,
        messages: Array.isArray(nextData.messages) ? nextData.messages.map(mapMessage) : [],
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget support POST error:', error)
    return NextResponse.json({ error: 'Failed to update support chat' }, { status: 500, headers })
  }
}
