import { Suspense } from 'react'
import InviteClient from './InviteClient'

export default function InvitePage() {
  return (
    <Suspense fallback={<div>Laster invitasjon...</div>}>
      <InviteClient />
    </Suspense>
  )
}