import { NextRequest, NextResponse } from 'next/server'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { isWidgetOriginPermitted, getRequestOrigin } from '@/lib/widget-security'
import { createWidgetEmbedToken, getOrCreateWidgetEmbedSecret } from '@/lib/widget-embed-token.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint, X-Vintra-Captcha-Token',
    Vary: 'Origin',
  }
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
    const widgetKey = req.nextUrl.searchParams.get('key') || ''
    if (!widgetKey) {
      return NextResponse.json({ error: 'Missing widget key' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)
    if (!business?.id || !business.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const originCheck = isWidgetOriginPermitted(req, business.chatWidgetConfig.allowedDomains)
    if (!originCheck.allowed) {
      return NextResponse.json({ error: originCheck.reason }, { status: 403, headers })
    }

    const requestOrigin = getRequestOrigin(req) || req.nextUrl.origin
    const secret = await getOrCreateWidgetEmbedSecret(business.id)
    const token = createWidgetEmbedToken({
      businessId: business.id,
      widgetKey,
      origin: requestOrigin,
      secret,
      expiresInSeconds: 12 * 60 * 60,
    })

    return NextResponse.json(
      {
        token,
        expiresInSeconds: 12 * 60 * 60,
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget embed token error:', error)
    return NextResponse.json({ error: 'Failed to create embed token' }, { status: 500, headers })
  }
}
