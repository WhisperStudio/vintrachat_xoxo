'use client'

import AuthFrame from '../AuthFrame'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiCheckCircle, FiMail, FiAlertCircle } from 'react-icons/fi'
import { useVintraLanguage } from '@/lib/i18n'
import { useVerifiedAccount } from '../useVerifiedAccount'

export default function VerifyEmailClient() {
  const router = useRouter()
  const token = useSearchParams().get('token')
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [userId, setUserId] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const { check, checking } = useVerifiedAccount(status === 'success' && !!userId, userId)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timer = setTimeout(() => controller.abort(), 20000)
    setStatus('loading')
    setUserId(undefined)
    async function verify() {
      if (!token) throw new Error('Missing token')
      const response = await fetch('/api/auth/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }), signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error('Verification failed')
      if (active) {
        setUserId(result.userId)
        setStatus('success')
      }
    }
    void verify().catch(() => { if (active) setStatus('error') }).finally(() => clearTimeout(timer))
    return () => { active = false; clearTimeout(timer); controller.abort() }
  }, [token, attempt])

  return (
    <AuthFrame>
      <div className="nordicAuthIntro" aria-live="polite">
        <div className="nordicAuthFormIcon" aria-hidden="true">
          {status === 'success' ? <FiCheckCircle /> : status === 'error' ? <FiAlertCircle /> : <FiMail />}
        </div>
        <h1 id="auth-title">{status === 'success' ? (no ? 'E-posten er bekreftet.' : 'Email confirmed.') : status === 'error' ? (no ? 'Vi kunne ikke bekrefte lenken.' : 'We could not confirm this link.') : (no ? 'Bekrefter e-posten din …' : 'Confirming your email …')}</h1>
        <p>{status === 'success'
          ? (no ? 'Vi åpner kontoen din automatisk hvis du fortsatt er innlogget. Åpnet du lenken i en annen nettleser, logger du inn der først.' : 'We’ll open your account automatically if you’re still signed in. If you opened the link in another browser, sign in there first.')
          : status === 'error'
            ? (no ? 'Prøv igjen, eller logg inn for å få en ny lenke. Bruk den nyeste e-posten; lenken er gyldig i 24 timer.' : 'Try again, or sign in to request a new link. Use the latest email; the link is valid for 24 hours.')
            : (no ? 'Dette tar vanligvis bare noen sekunder.' : 'This usually takes just a few seconds.')}</p>
      </div>
      {status === 'success' && <button type="button" className="nordicAuthSubmit" onClick={async () => { if (!await check()) router.push('/auth/login') }} disabled={checking}>
        {checking ? (no ? 'Åpner kontoen …' : 'Opening your account …') : (no ? 'Fortsett til kontoen' : 'Continue to your account')}
      </button>}
      {status === 'error' && token && <button type="button" className="nordicAuthSubmit" onClick={() => setAttempt(value => value + 1)}>{no ? 'Prøv igjen' : 'Try again'}</button>}
      <Link href="/auth/login" className="nordicAuthBack">{no ? 'Fortsett til innlogging' : 'Continue to sign in'}</Link>
    </AuthFrame>
  )
}
