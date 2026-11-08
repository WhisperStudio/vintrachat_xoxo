import Stripe from 'stripe'
import { getAdminDb } from '@/lib/firebase-admin'
import { BillingError, createBillingService } from '@/lib/billing/service.mjs'

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new BillingError(503, 'Stripe er ikke konfigurert ennå.')
  if (process.env.VERCEL_ENV === 'production' && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && !process.env.STRIPE_SECRET_KEY.startsWith('rk_live_')) {
    throw new BillingError(503, 'Ekte betaling er ikke aktivert ennå.')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20000 })
}

export function billingService(requestOrigin?: string) {
  const raw = process.env.BILLING_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
  let origin: string
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error()
    origin = url.origin
  } catch { throw new BillingError(503, 'Betalingsadressen er ikke konfigurert.') }
  // Preserve the customer's login on our verified production domains. Other
  // hosts (including preview URLs) use the configured canonical return address.
  if (requestOrigin && [origin, 'https://chat.vintrastudio.com', 'https://vintranordic.com', 'https://www.vintranordic.com'].includes(requestOrigin)) {
    origin = requestOrigin
  }
  return createBillingService({ db: getAdminDb(), stripe: stripeClient(), origin,
    portalConfiguration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || '' })
}
