import { Suspense } from 'react'
import VerifyEmailSentClient from './VerifyEmailSentClient'

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={<div>Laster...</div>}>
      <VerifyEmailSentClient />
    </Suspense>
  )
}