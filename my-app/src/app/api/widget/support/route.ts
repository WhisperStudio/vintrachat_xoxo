import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

    const chatRef = adminDb.collection('businesses').doc(business.id).collection('supportChats').doc(sessionId)
    const snap = await chatRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Support chat not found' }, { status: 404, headers })
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

    const chatRef = adminDb.collection('businesses').doc(business.id).collection('supportChats').doc(sessionId)
    const snap = await chatRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Support chat not found' }, { status: 404, headers })
    }

    const data = snap.data() || {}
    const businessRef = adminDb.collection('businesses').doc(business.id)

    await chatRef.update({
      preview: message,
      updatedAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      countryCode: countryCode || data.countryCode || null,
      messages: FieldValue.arrayUnion({
        id: crypto.randomUUID(),
        role: 'user',
        text: message,
        createdAt: new Date().toISOString(),
      }),
    })

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
