import { NextRequest, NextResponse } from 'next/server'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { getClientIp, getRequestOrigin, isWidgetOriginPermitted } from '@/lib/widget-security'
import { getOrCreateWidgetEmbedSecret } from '@/lib/widget-embed-token.server'
import { verifyWidgetCaptchaChallenge } from '@/lib/widget-captcha.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint',
    Vary: 'Origin',
  }
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
    const challengeToken = String(body.challengeToken || '')
    const answer = String(body.answer || '').trim()
    const sessionId = String(body.sessionId || '')
    const fingerprint = String(body.fingerprint || '')

    if (!widgetKey || !challengeToken || !answer) {
      return NextResponse.json(
        { error: 'Missing widget key, challenge token or answer' },
        { status: 400, headers }
      )
    }

    const business = await getBusinessByWidgetKey(widgetKey)
    if (!business?.id || !business.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const originCheck = isWidgetOriginPermitted(req, business.chatWidgetConfig.allowedDomains)
    if (!originCheck.allowed) {
      return NextResponse.json({ error: originCheck.reason }, { status: 403, headers })
    }

    const secret = await getOrCreateWidgetEmbedSecret(business.id)
    const verification = verifyWidgetCaptchaChallenge({
      secret,
      challengeToken,
      answer,
      businessId: business.id,
      widgetKey,
      sessionId,
      fingerprint,
      clientIp: getClientIp(req),
    })

    if (!verification.valid) {
      return NextResponse.json({ error: verification.reason }, { status: 400, headers })
    }

    return NextResponse.json(
      {
        captchaToken: verification.captchaToken,
        expiresInSeconds: verification.expiresInSeconds,
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget captcha verify error:', error)
    return NextResponse.json({ error: 'Failed to verify captcha' }, { status: 500, headers })
  }
}
