'use client'

import AuthFrame from '../AuthFrame'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiMail } from 'react-icons/fi'
import { auth } from '@/lib/firebase'
import { useVintraLanguage } from '@/lib/i18n'
import { useVerifiedAccount } from '../useVerifiedAccount'
import { withTimeout } from '@/lib/with-timeout'

export default function VerifyEmailSentClient() {
  const email = useSearchParams().get('email') || ''
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const { check, checking } = useVerifiedAccount(true, undefined, email)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<'sent' | 'error' | 'waiting' | 'signin' | null>(null)
  const [cooldown, setCooldown] = useState(0)
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function resend() {
    setSending(true)
    setNotice(null)
    try {
      await withTimeout(auth.authStateReady(), 12000, 'Timeout')
      const user = auth.currentUser
      if (!user || (email && user.email?.toLowerCase() !== email.toLowerCase())) { setNotice('signin'); return }
      const idToken = await withTimeout(user.getIdToken(), 12000, 'Timeout')
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ language }), signal: AbortSignal.timeout(20000),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) { if (response.status === 429) setCooldown(60); throw new Error('Send failed') }
      if (payload.alreadyVerified) { await check(); return }
      setNotice('sent')
      setCooldown(60)
    } catch { setNotice('error') } finally { setSending(false) }
  }

  return <AuthFrame>
    <div className="nordicAuthIntro">
      <div className="nordicAuthFormIcon" aria-hidden="true"><FiMail /></div>
      <h1 id="auth-title">{no ? 'Sjekk innboksen din.' : 'Check your inbox.'}</h1>
      <p>{no ? 'Åpne e-posten fra Vintra og trykk på «Bekreft e-postadresse».' : 'Open the email from Vintra and select “Verify email address”.'}</p>
      {email && <p className="verificationEmail">{email}</p>}
      <p>{no ? 'Denne siden går videre automatisk når e-posten er bekreftet. Sjekk søppelpost hvis du ikke finner meldingen.' : 'This page continues automatically once your email is confirmed. Check spam if you cannot find the message.'}</p>
    </div>
    <button type="button" className="nordicAuthSubmit" disabled={checking} onClick={async () => { if (!await check()) setNotice(auth.currentUser ? 'waiting' : 'signin') }}>
      {checking ? (no ? 'Sjekker …' : 'Checking …') : (no ? 'Jeg har bekreftet e-posten' : 'I’ve confirmed my email')}
    </button>
    <button type="button" className="nordicAuthBack verificationResend" onClick={() => void resend()} disabled={sending || cooldown > 0}>
      {sending ? (no ? 'Sender …' : 'Sending …') : cooldown > 0 ? (no ? `Send på nytt om ${cooldown} s` : `Resend in ${cooldown}s`) : (no ? 'Send ny bekreftelseslenke' : 'Send a new verification link')}
    </button>
    <p role="status" className="verificationNotice">{notice === 'sent' ? (no ? 'Ny lenke er sendt. Bruk den nyeste e-posten.' : 'A new link has been sent. Use the latest email.') : notice === 'error' ? (no ? 'Kunne ikke sende nå. Vent litt og prøv igjen.' : 'Could not send right now. Wait a little and try again.') : notice === 'waiting' ? (no ? 'Ikke bekreftet ennå. Åpne lenken i e-posten og prøv igjen.' : 'Not confirmed yet. Open the email link and try again.') : notice === 'signin' ? (no ? 'Logg inn med kontoen du vil bekrefte for å fortsette.' : 'Sign in with the account you want to verify to continue.') : ''}</p>
    <Link href="/auth/login" className="nordicAuthBack">{no ? 'Til innlogging' : 'Go to sign in'}</Link>
  </AuthFrame>
}
