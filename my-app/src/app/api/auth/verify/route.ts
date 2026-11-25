import { authLinkOrigin } from '@/lib/auth-link-origin'
import { NextRequest, NextResponse } from 'next/server'
import { activatePendingAuthToken } from '@/lib/pending-auth.server'
import { consumeServerRateLimit } from '@/lib/server-rate-limit'
import { getClientIp } from '@/lib/widget-security'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    const trimmedToken = String(token || '').trim()

    if (!trimmedToken) {
      return NextResponse.json(
        { success: false, message: 'Mangler verifiseringstoken.' },
        { status: 400 }
      )
    }

    const rateLimit = await consumeServerRateLimit({
      scope: 'auth-verify-email',
      key: `${getClientIp(req)}:${trimmedToken.slice(0, 12)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'For mange verifiseringsforsøk. Prøv igjen senere.' },
        { status: 429 }
      )
    }

    const result = await activatePendingAuthToken(trimmedToken)
    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Verify route error:', error)
    return NextResponse.json(
      { success: false, message: 'Serverfeil under verifisering.' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(`${authLinkOrigin(req.url)}/auth/verify-email${req.nextUrl.search}`)
}
