import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { countWords, getClientIp } from '@/lib/widget-security'
import { enforceWidgetRateLimit } from '@/lib/widget-rate-limit.server'
import { authorizeWidgetRequest, getOrCreateWidgetEmbedSecret } from '@/lib/widget-embed-token.server'
import { createWidgetCaptchaChallenge, verifyWidgetCaptchaToken } from '@/lib/widget-captcha.server'

const MAX_WIDGET_FEEDBACK_WORDS = 400

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint, X-Vintra-Captcha-Token, X-Vintra-Debug',
    Vary: 'Origin',
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

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const body = await req.json()
    const widgetKey = String(body.widgetKey || '')
    const sessionId = String(body.sessionId || '')
    const rating = Number(body.rating || 0)
    const text = String(body.text || '').trim()
    const visitorName = body.visitorName ? String(body.visitorName).trim() : ''
    const pageTitle = body.pageTitle ? String(body.pageTitle) : undefined
    const pageUrl = body.pageUrl ? String(body.pageUrl) : undefined
    const countryCode = String(body.countryCode || getRequestCountryCode(req) || 'XX')
      .trim()
      .toUpperCase()
    const fingerprint = String(req.headers.get('x-vintra-fingerprint') || body.fingerprint || '').trim()
    const captchaToken = String(req.headers.get('x-vintra-captcha-token') || body.captchaToken || '').trim()

    if (!widgetKey || !sessionId || !text || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Missing widget key, sessionId, rating or text' },
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
      action: 'widget-feedback',
      rules: [
        { windowMs: 60_000, maxRequests: 3 },
      ],
      captchaRules: [
        { windowMs: 60_000, maxRequests: 30 },
        { windowMs: 3_600_000, maxRequests: 120 },
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
          error: `You're submitting feedback too quickly. Please wait ${rateLimitCheck.retryAfterSeconds}s and try again.`,
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
        },
        { status: 429, headers }
      )
    }

    if (countWords(text) > MAX_WIDGET_FEEDBACK_WORDS) {
      return NextResponse.json(
        { error: `Feedback is too long. Max ${MAX_WIDGET_FEEDBACK_WORDS} words.` },
        { status: 400, headers }
      )
    }

    const feedbackRef = adminDb
      .collection('businesses')
      .doc(business.id)
      .collection('feedback')
      .doc()

    await feedbackRef.set({
      businessId: business.id,
      widgetKey,
      sessionId,
      visitorName: visitorName || null,
      rating,
      text,
      pageTitle: pageTitle || null,
      pageUrl: pageUrl || null,
      countryCode,
      source: 'widget',
      createdAt: FieldValue.serverTimestamp(),
    })

    await adminDb.collection('businesses').doc(business.id).update({
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json(
      {
        success: true,
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget feedback error:', error)
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500, headers })
  }
}
