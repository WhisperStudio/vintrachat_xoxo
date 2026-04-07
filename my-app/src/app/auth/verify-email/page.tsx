import { Suspense } from 'react'
import VerifyEmailClient from './VerifyEmailClient'

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Verifiserer email...</div>}>
      <VerifyEmailClient />
    </Suspense>
  )
}