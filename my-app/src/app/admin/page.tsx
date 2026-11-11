import LoadingAnimation from '@/components/LoadingAnimation'
import { Suspense } from 'react'
import AdminWorkspace from './AdminWorkspace'

export default function AdminPage() {
  const testMode = !/^(sk|rk)_live_/.test(process.env.STRIPE_SECRET_KEY || '')
  const configured = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PORTAL_CONFIGURATION_ID)
    && !(process.env.VERCEL_ENV === 'production' && testMode)
  return <Suspense fallback={<LoadingAnimation label="Laster arbeidsområdet…" />}><AdminWorkspace billingConfigured={configured} billingTestMode={testMode} /></Suspense>
}
