import LoadingAnimation from '@/components/LoadingAnimation'
import { Suspense } from 'react'
import VerifyEmailSentClient from './VerifyEmailSentClient'

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={<LoadingAnimation label="Laster..." />}>
      <VerifyEmailSentClient />
    </Suspense>
  )
}