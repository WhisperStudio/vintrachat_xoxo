import { NextRequest, NextResponse } from 'next/server'
import { billingService, stripeClient } from '@/lib/billing.server'

export const runtime = 'nodejs'
export const maxDuration = 180
const handled = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded',
  'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
  'invoice.paid', 'invoice.payment_failed', 'invoice.payment_action_required'])

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  let event
  try { event = stripeClient().webhooks.constructEvent(await req.text(), signature, secret) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  try {
    if (handled.has(event.type)) await billingService().webhook(event)
    return NextResponse.json({ received: true })
  } catch {
    // Non-2xx makes Stripe retry. Never acknowledge a failed entitlement write.
    console.error('Stripe webhook processing failed', event.id, event.type)
    return NextResponse.json({ error: 'Please retry' }, { status: 500 })
  }
}
