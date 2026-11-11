import LoadingAnimation from '@/components/LoadingAnimation'
import { Suspense } from 'react'
import InviteClient from './InviteClient'

export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingAnimation label="Laster invitasjon..." />}>
      <InviteClient />
    </Suspense>
  )
}