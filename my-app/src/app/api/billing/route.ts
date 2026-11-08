import { NextRequest, NextResponse } from 'next/server'
import { verifyActiveUserToken } from '@/lib/verified-auth.server'
import { billingService } from '@/lib/billing.server'
import { BillingError } from '@/lib/billing/service.mjs'

export const runtime = 'nodejs'
export const maxDuration = 180

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin')
    if (origin && origin !== req.nextUrl.origin && origin !== process.env.BILLING_APP_URL) {
      return NextResponse.json({ error: 'Ugyldig opprinnelse.' }, { status: 403 })
    }
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Logg inn først.' }, { status: 401 })
    let actor
    try { actor = await verifyActiveUserToken(token) }
    catch { return NextResponse.json({ error: 'Innloggingen er utløpt. Logg inn på nytt.' }, { status: 401 }) }
    const { action, ...data } = await req.json()
    const service = billingService(req.nextUrl.origin)
    const actions = { status: service.status, checkout: service.checkout, confirm: service.confirm,
      portal: service.manage, refresh: service.refresh }
    if (!Object.hasOwn(actions, action)) return NextResponse.json({ error: 'Ugyldig handling.' }, { status: 400 })
    const result = await actions[action as keyof typeof actions](actor, data)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof BillingError) return NextResponse.json({ error: error.message }, { status: error.status })
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Ugyldig forespørsel.' }, { status: 400 })
    console.error('Billing request failed', error instanceof Error ? error.name : 'unknown')
    return NextResponse.json({ error: 'Kunne ikke kontakte betalingstjenesten. Prøv igjen.' }, { status: 502 })
  }
}
