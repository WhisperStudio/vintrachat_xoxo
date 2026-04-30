import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
