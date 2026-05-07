import { NextRequest, NextResponse } from 'next/server'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { isWidgetOriginPermitted, getRequestOrigin } from '@/lib/widget-security'
import { createWidgetEmbedToken, getOrCreateWidgetEmbedSecret } from '@/lib/widget-embed-token.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint, X-Vintra-Captcha-Token, X-Vintra-Debug',
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
    const requestOrigin = getRequestOrigin(req) || req.nextUrl.origin
    console.log('[widget/embed-token] request start', {
      widgetKey,
      requestOrigin,
      pathname: req.nextUrl.pathname,
    })

    if (!widgetKey) {
      console.log('[widget/embed-token] missing widget key')
      return NextResponse.json({ error: 'Missing widget key' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)
    if (!business?.id || !business.chatWidgetConfig) {
      console.log('[widget/embed-token] widget not found', {
        widgetKey,
        hasBusiness: Boolean(business),
        businessId: business?.id || null,
        hasConfig: Boolean(business?.chatWidgetConfig),
      })
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    console.log('[widget/embed-token] business resolved', {
      businessId: business.id,
      businessName: business.name,
      resolvedWidgetKey: business.chatWidgetKey,
      allowedDomains: business.chatWidgetConfig.allowedDomains || [],
    })

    const originCheck = isWidgetOriginPermitted(req, business.chatWidgetConfig.allowedDomains)
    if (!originCheck.allowed) {
      console.log('[widget/embed-token] origin blocked', {
        widgetKey,
        requestOrigin,
        reason: originCheck.reason,
        allowedDomains: business.chatWidgetConfig.allowedDomains || [],
      })
      return NextResponse.json({ error: originCheck.reason }, { status: 403, headers })
    }

    console.log('[widget/embed-token] origin allowed', {
      widgetKey,
      requestOrigin,
      internal: Boolean((originCheck as { internal?: boolean }).internal),
      debug: Boolean((originCheck as { debug?: boolean }).debug),
    })

    const secret = await getOrCreateWidgetEmbedSecret(business.id)
    console.log('[widget/embed-token] embed secret ready', {
      businessId: business.id,
      secretLength: secret.length,
    })

    const token = createWidgetEmbedToken({
      businessId: business.id,
      widgetKey,
      origin: requestOrigin,
      secret,
      expiresInSeconds: 12 * 60 * 60,
    })

    console.log('[widget/embed-token] token created', {
      businessId: business.id,
      widgetKey,
      origin: requestOrigin,
      expiresInSeconds: 12 * 60 * 60,
      tokenPrefix: token.slice(0, 12),
    })

    return NextResponse.json(
      {
        token,
        expiresInSeconds: 12 * 60 * 60,
      },
      { headers }
    )
  } catch (error) {
    const details =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : undefined

    console.error('[widget/embed-token] failed', {
      widgetKey: req.nextUrl.searchParams.get('key') || '',
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Failed to create embed token', details },
      { status: 500, headers }
    )
  }
}
