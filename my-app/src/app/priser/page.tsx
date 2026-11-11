import LoadingAnimation from '@/components/LoadingAnimation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import PricingClient from './PricingClient'
import { PLANS } from '@/lib/billing/catalog.mjs'

export const metadata: Metadata = {
  title: 'Priser og abonnement | Vintra Chat',
  description: 'Start gratis med Vintra Chat. Velg Pro fra 299 kr eller Enterprise fra 999 kr per måned. Se priser, funksjoner og bruksgrenser.',
}
export default function PricingPage() {
  const testMode = !/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || '')
  const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PORTAL_CONFIGURATION_ID)
    && !(process.env.VERCEL_ENV === 'production' && testMode)
  const pricingData = {
    '@context': 'https://schema.org', '@type': 'Product', name: 'Vintra Chat AI-chatbot',
    description: 'Abonnement for AI-chatbot på eksisterende nettside. Nettsideutvikling er en separat tjeneste. Gratis er en gratisplan, ikke en tidsbegrenset prøveperiode.',
    offers: Object.entries(PLANS).flatMap(([id, plan]) => (id === 'free' ? ['monthly'] : ['monthly', 'yearly']).map(cycle => ({
      '@type': 'Offer', name: `Vintra Chat ${plan.name} – ${cycle === 'monthly' ? 'månedlig' : 'årlig'}`,
      priceCurrency: 'NOK', price: (cycle === 'monthly' ? plan.monthly : plan.yearly) / 100,
      description: `${cycle === 'monthly' ? 'Faktureres per måned.' : 'Totalpris faktureres per år, ikke per måned.'} ${id === 'free' ? 'Gratisplan uten betalingskort; ikke en tidsbegrenset prøveperiode.' : ''} ${plan.conversations} samtaler og ${plan.messages} meldinger per dag er bruksgrenser, ikke priser. Nettsidebygging inngår ikke i denne prisen.`,
    }))),
  }
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingData).replace(/</g, '\\u003c') }} /><Suspense fallback={<LoadingAnimation label="Laster abonnementer …" />}><PricingClient configured={configured} testMode={testMode} /></Suspense></>
}
