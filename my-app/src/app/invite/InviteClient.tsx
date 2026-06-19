'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FiAlertCircle,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi'
import { useAuth } from '@/context/AuthContext'
import { acceptInvitation, deleteInvitation, getInvitationsForEmail } from '@/lib/invitation.service'
import type { BusinessInvitation, UserRole } from '@/types/database'

function roleLabel(role: UserRole) {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'manager':
      return 'Manager'
    case 'support':
      return 'Support'
    case 'viewer':
      return 'Viewer'
    case 'user':
    default:
      return 'Member'
  }
}

function formatDate(date?: Date) {
  if (!date) return 'Unknown'
  return new Intl.DateTimeFormat('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function getRoleAccent(role: UserRole) {
  switch (role) {
    case 'admin':
      return { background: '#dbeafe', color: '#1d4ed8' }
    case 'manager':
      return { background: '#ede9fe', color: '#6d28d9' }
    case 'support':
      return { background: '#dcfce7', color: '#15803d' }
    case 'viewer':
    case 'user':
    default:
      return { background: '#e2e8f0', color: '#334155' }
  }
}

export default function InviteClient() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [invitations, setInvitations] = useState<BusinessInvitation[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()
  const { firebaseUser, dbUser, refreshCurrentUser } = useAuth()

  const inviteMode = searchParams.get('token') && searchParams.get('business')
  const verificationBlocked = /verifiser|verify/i.test(error)

  useEffect(() => {
    const handleInvite = async () => {
      const invitationId = searchParams.get('token')
      const businessId = searchParams.get('business')

      if (!firebaseUser) {
        setError('Du må være logget inn for å se og håndtere invitasjoner.')
        setLoading(false)
        return
      }

      if (invitationId && businessId) {
        try {
          const result = await acceptInvitation(invitationId, businessId, firebaseUser.uid)

          if (result.success) {
            await refreshCurrentUser()
            setMessage('Invitasjonen ble godtatt. Sender deg videre til arbeidsområdet ditt nå.')
            setTimeout(() => {
              router.push('/admin')
            }, 1200)
          } else {
            setError(result.message || 'Kunne ikke godta invitasjonen.')
          }
        } catch {
          setError('En feil oppstod mens vi prøvde å godta invitasjonen.')
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

      setError('Vi fant ingen emailadresse på denne kontoen.')
      setLoading(false)
    }

    void handleInvite()
  }, [firebaseUser, refreshCurrentUser, router, searchParams])

  const handleAccept = async (invite: BusinessInvitation) => {
    if (!firebaseUser) return

    setBusyId(invite.id)
    setError('')
    setMessage('')
    setResendMessage('')

    try {
      const result = await acceptInvitation(invite.id, invite.businessId, firebaseUser.uid)
      if (result.success) {
        await refreshCurrentUser()
        setMessage('Invitasjonen ble godtatt. Sender deg videre til arbeidsområdet ditt nå.')
        setTimeout(() => {
          router.push('/admin')
        }, 1200)
      } else {
        setError(result.message || 'Kunne ikke godta invitasjonen.')
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
    setResendMessage('')

    try {
      await deleteInvitation(invite.businessId, invite.id)
      const nextInvitations = firebaseUser.email ? await getInvitationsForEmail(firebaseUser.email) : []
      setInvitations(nextInvitations)
      setMessage(
        nextInvitations.length === 0
          ? 'Invitasjonen ble avslått og listen er nå tom.'
          : 'Invitasjonen ble fjernet fra listen din.'
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleResendVerification = async () => {
    if (!firebaseUser?.email) return

    setResendLoading(true)
    setResendMessage('')

    try {
      const idToken = await firebaseUser.getIdToken()
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: firebaseUser.email }),
      })

      const payload = await response.json()

      if (response.ok && payload.success) {
        setResendMessage('Vi har sendt en ny verifikasjonsmail. Bekreft emailen din og prøv å godta invitasjonen igjen.')
      } else {
        setResendMessage(payload.message || 'Kunne ikke sende verifikasjonsmail på nytt akkurat nå.')
      }
    } catch (resendError: any) {
      setResendMessage(resendError.message || 'Kunne ikke sende verifikasjonsmail på nytt akkurat nå.')
    } finally {
      setResendLoading(false)
    }
  }

  const expiringSoonCount = useMemo(
    () =>
      invitations.filter((invite) => {
        const msLeft = new Date(invite.expiresAt).getTime() - Date.now()
        return msLeft > 0 && msLeft <= 1000 * 60 * 60 * 48
      }).length,
    [invitations]
  )

  const heroSummary = useMemo(() => {
    if (inviteMode) {
      return 'We are opening a direct company invite link for this account.'
    }
    if (invitations.length === 0) {
      return 'You are all caught up. If a company invites you later, it will appear here.'
    }
    return `You have ${invitations.length} pending invitation${invitations.length === 1 ? '' : 's'} waiting for your decision.`
  }, [inviteMode, invitations.length])

  if (loading) {
    return (
      <main className="authPage authExperience">
        <div className="authShowcase">
          <section className="authBrandPanel">
            <div className="authBrandHeader">
              <div className="authBrandLogo">
                <Image src="/image/logo.png" alt="Vintra logo" width={40} height={40} />
              </div>
              <div className="authBrandName">
                <strong>Vintra</strong>
                <span>Workspace invitations</span>
              </div>
            </div>
            <div>
              <div className="authBrandEyebrow">Invite center</div>
              <h1>Preparing your workspace access.</h1>
            </div>
            <p className="authBrandLead">
              We are checking the active account, loading pending invitations, and verifying whether this link can be accepted.
            </p>
          </section>

          <section className="authCard authCardElevated">
            <div className="authCardHeader">
              <div className="authIconBadge">
                <FiClock size={24} />
              </div>
              <div>
                <p className="authKicker">Loading</p>
                <h2 className="authHeadline">Checking your invitation status</h2>
              </div>
            </div>

            <p className="authBody">
              This only takes a moment.
            </p>

            <div style={{ padding: '16px 0' }}>
              <div className="loading-spinner" />
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="authPage authExperience">
      <div className="authShowcase">
        <section className="authBrandPanel">
          <div className="authBrandHeader">
            <div className="authBrandLogo">
              <Image src="/image/logo.png" alt="Vintra logo" width={40} height={40} />
            </div>
            <div className="authBrandName">
              <strong>Vintra</strong>
              <span>Workspace invitations</span>
            </div>
          </div>

          <div>
            <div className="authBrandEyebrow">Invite center</div>
            <h1>Join the right team without guesswork.</h1>
          </div>

          <p className="authBrandLead">
            {heroSummary}
          </p>

          <div className="authFeatureList">
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiBriefcase size={18} />
              </div>
              <div>
                <strong>See each workspace clearly</strong>
                <span>Every invitation shows the company name, your role, and when the link expires.</span>
              </div>
            </div>
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiShield size={18} />
              </div>
              <div>
                <strong>Verification stays protected</strong>
                <span>If your account still needs email verification, we will tell you and help you resend that email right away.</span>
              </div>
            </div>
          </div>

          <div className="authBrandStats">
            <div className="authStatCard">
              <strong>{invitations.length}</strong>
              <span>Pending invitation{invitations.length === 1 ? '' : 's'} on this account.</span>
            </div>
            <div className="authStatCard">
              <strong>{expiringSoonCount}</strong>
              <span>Invitation{expiringSoonCount === 1 ? '' : 's'} expiring within 48 hours.</span>
            </div>
          </div>
        </section>

        <section className="authCard authCardElevated" style={{ gap: 20 }}>
          <div className="authCardHeader">
            <div className="authIconBadge">
              <FiUsers size={24} />
            </div>
            <div>
              <p className="authKicker">Your account</p>
              <h2 className="authHeadline">Invitation overview</h2>
            </div>
          </div>

          <p className="authBody">
            Signed in as {firebaseUser?.email || 'unknown account'}{dbUser ? '. This account is already attached to a workspace.' : '.'}
          </p>

          {message ? (
            <div className="authCallout success">
              <strong>Success</strong>
              <span>{message}</span>
            </div>
          ) : null}

          {error ? (
            <div className="authCallout error">
              <strong>Action needed</strong>
              <span>{error}</span>
            </div>
          ) : null}

          {verificationBlocked ? (
            <div className="authSecondarySurface">
              <div className="authInlineLinks" style={{ alignItems: 'flex-start' }}>
                <FiMail size={16} color="#2563eb" style={{ marginTop: 3 }} />
                <div style={{ flex: 1 }}>
                  <p className="authBody" style={{ marginBottom: 10 }}>
                    Verify your email first, then come back here and accept the invitation.
                  </p>
                  <button
                    type="button"
                    className="secondaryBtn"
                    onClick={handleResendVerification}
                    disabled={resendLoading || !firebaseUser?.email}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <FiRefreshCw size={15} />
                    {resendLoading ? 'Sending verification...' : 'Resend verification email'}
                  </button>
                </div>
              </div>
              {resendMessage ? (
                <p className="authTinyNote" style={{ marginTop: 12, color: /kunne ikke/i.test(resendMessage) ? '#b91c1c' : '#2563eb' }}>
                  {resendMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          {invitations.length === 0 ? (
            <div className="authSecondarySurface" style={{ padding: 24 }}>
              <div className="authCardHeader" style={{ alignItems: 'flex-start' }}>
                <div className="authIconBadge" style={{ width: 46, height: 46 }}>
                  <FiCheckCircle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>No pending invitations</h3>
                  <p className="authBody" style={{ marginTop: 8 }}>
                    If a business invites this email later, the invitation will show up here automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {invitations.map((invite) => {
                const accent = getRoleAccent(invite.role)
                const isBusy = busyId === invite.id

                return (
                  <article
                    key={invite.id}
                    style={{
                      border: '1px solid rgba(148, 163, 184, 0.24)',
                      borderRadius: 24,
                      padding: 22,
                      background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
                      boxShadow: '0 16px 34px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 18 }}>
                      <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '7px 12px',
                              borderRadius: 999,
                              background: accent.background,
                              color: accent.color,
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                            }}
                          >
                            {roleLabel(invite.role)}
                          </span>
                          <span className="authTinyNote" style={{ color: '#64748b' }}>
                            Pending company invitation
                          </span>
                        </div>

                        <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>
                          {invite.businessName || invite.businessId}
                        </h3>
                        <p className="authBody" style={{ marginTop: 8 }}>
                          Invitation for <strong style={{ color: '#0f172a' }}>{invite.email}</strong>
                        </p>

                        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                          <div className="authInlineLinks">
                            <FiCalendar size={15} color="#64748b" />
                            <span className="authTinyNote">Sent {formatDate(invite.createdAt)}</span>
                          </div>
                          <div className="authInlineLinks">
                            <FiAlertCircle size={15} color="#64748b" />
                            <span className="authTinyNote">Expires {formatDate(invite.expiresAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ minWidth: 220, display: 'grid', gap: 10, alignContent: 'start' }}>
                        <button
                          onClick={() => handleAccept(invite)}
                          disabled={isBusy}
                          className="primaryBtn fullWidth"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <FiCheckCircle size={16} />
                          {isBusy ? 'Accepting...' : 'Accept invitation'}
                        </button>
                        <button
                          onClick={() => handleDecline(invite)}
                          disabled={isBusy}
                          className="secondaryBtn fullWidth"
                          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <FiXCircle size={16} />
                          Decline
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          <div className="authInlineLinks" style={{ justifyContent: 'space-between' }}>
            <Link href={dbUser ? '/admin' : '/auth/login'} className="authTextLink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {dbUser ? 'Go to workspace' : 'Back to login'} <FiArrowRight size={16} />
            </Link>
            {!dbUser ? (
              <Link href="/auth/signup" className="authTextLink">
                Create another account
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  )
}
