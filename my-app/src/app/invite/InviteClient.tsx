'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { acceptInvitation, deleteInvitation, getInvitationsForEmail } from '@/lib/invitation.service'
import type { BusinessInvitation } from '@/types/database'

export default function InviteClient() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const router = useRouter()
  const { firebaseUser, refreshCurrentUser } = useAuth()

  useEffect(() => {
    const handleInvite = async () => {
      const invitationId = searchParams.get('token')
      const businessId = searchParams.get('business')

      if (!firebaseUser) {
        setError('Du må være logget inn')
        setLoading(false)
        return
      }

      if (invitationId && businessId) {
        try {
          const result = await acceptInvitation(invitationId, businessId, firebaseUser.uid)

          if (result.success) {
            await refreshCurrentUser()
            setMessage('Invitasjon akseptert! Omdirigerer...')
            setTimeout(() => {
              router.push('/admin')
            }, 1200)
          } else {
            setError(result.message || 'Kunne ikke akseptere invitasjon')
          }
        } catch {
          setError('En feil oppstod')
        } finally {
          setLoading(false)
        }
        return
      }

      if (firebaseUser.email) {
        const nextInvitations = await getInvitationsForEmail(firebaseUser.email)
        setInvitations(nextInvitations)
        setLoading(false)
        return
      }

      setError('Fant ingen invitasjoner')
      setLoading(false)
    }

    handleInvite()
  }, [firebaseUser, refreshCurrentUser, router, searchParams])

  const handleAccept = async (invite: BusinessInvitation) => {
    if (!firebaseUser) return

    setBusyId(invite.id)
    setError('')
    setMessage('')

    try {
      const result = await acceptInvitation(invite.id, invite.businessId, firebaseUser.uid)
      if (result.success) {
        await refreshCurrentUser()
        setMessage('Invitasjon akseptert! Omdirigerer...')
        setTimeout(() => {
          router.push('/admin')
        }, 1200)
      } else {
        setError(result.message || 'Kunne ikke akseptere invitasjon')
      }
    } finally {
      setBusyId(null)
    }
  }

  const handleDecline = async (invite: BusinessInvitation) => {
    if (!firebaseUser) return

    setBusyId(invite.id)
    setError('')
    setMessage('')

    try {
      await deleteInvitation(invite.businessId, invite.id)
      const nextInvitations = firebaseUser.email ? await getInvitationsForEmail(firebaseUser.email) : []
      setInvitations(nextInvitations)
      setMessage(nextInvitations.length === 0 ? 'Invitasjon slettet.' : '')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Behandler invitasjon...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <main className="min-h-[calc(100vh-88px)] bg-gradient-to-b from-slate-50 to-white px-6 py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Invitations</p>
              <h1 className="text-3xl font-bold text-slate-900">Your invitations</h1>
              <p className="mt-2 text-slate-600">Accept or decline pending company invites here.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total</div>
              <div className="text-2xl font-bold text-slate-900">{invitations.length}</div>
            </div>
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Suksess</h2>
              <p className="mt-2 text-slate-700">{message}</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Feil</h2>
              <p className="mt-2 text-slate-700">{error}</p>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4">
            {invitations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">0 invitations</h2>
                <p className="mt-2 text-slate-600">No pending invitations yet.</p>
              </div>
            ) : (
              invitations.map((invite) => (
                <article key={invite.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {invite.businessName || invite.businessId}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">Role: {invite.role}</p>
                      <p className="mt-1 text-xs text-slate-500">Invitation for {invite.email}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={busyId === invite.id}
                        className="rounded-full bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-70"
                      >
                        {busyId === invite.id ? 'Accepting...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleDecline(invite)}
                        disabled={busyId === invite.id}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-70"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  )
}
