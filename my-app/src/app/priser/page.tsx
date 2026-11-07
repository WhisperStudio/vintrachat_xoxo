import type { Metadata } from 'next'
import { Suspense } from 'react'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'Priser og abonnement | Vintra Chat',
  description: 'Start gratis med Vintra Chat. Velg Pro fra 299 kr eller Enterprise fra 999 kr per måned. Se priser, funksjoner og bruksgrenser.',
}
export default function PricingPage() {
  const testMode = !/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || '')
  const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PORTAL_CONFIGURATION_ID)
    && !(process.env.VERCEL_ENV === 'production' && testMode)
  return <Suspense fallback={<p>Laster abonnementer …</p>}><PricingClient configured={configured} testMode={testMode} /></Suspense>
}
