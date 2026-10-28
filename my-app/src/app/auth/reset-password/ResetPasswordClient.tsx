'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiKey, FiLink } from 'react-icons/fi'
import { resetPassword } from '@/lib/auth.service'
import { useVintraLanguage } from '@/lib/i18n'
import AuthFrame, { PasswordField } from '../AuthFrame'

export default function ResetPasswordClient() {
  const token = useSearchParams().get('token')
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => { if (success) title.current?.focus() }, [success])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!password.trim() || password.length < 6) { setError(no ? 'Passordet må ha minst 6 tegn.' : 'Use at least 6 characters.'); return }
    if (password !== confirmPassword) { setError(no ? 'Passordene er ikke like.' : 'Passwords do not match.'); return }
    if (!token) return
    setLoading(true)
    try {
      const result = await resetPassword(token, password)
      if (result.success) { setSuccess(true); setPassword(''); setConfirmPassword('') }
      else setError(result.message || (no ? 'Kunne ikke oppdatere passordet. Be om en ny lenke og prøv igjen.' : 'Could not update your password. Request a new link and try again.'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (no ? 'Noe gikk galt. Prøv igjen.' : 'Something went wrong. Please try again.'))
    } finally { setLoading(false) }
  }

  return (
    <AuthFrame recovery>
      <div className="nordicAuthIntro">
        <span className="nordicAuthFormIcon">{!token ? <FiLink aria-hidden="true" /> : success ? <FiCheckCircle aria-hidden="true" /> : <FiKey aria-hidden="true" />}</span>
        <h1 id="auth-title" ref={title} tabIndex={-1}>{!token ? (no ? 'Du trenger en ny lenke.' : 'Let’s get you a new link.') : success ? (no ? 'Passordet er oppdatert.' : 'Your password is updated.') : (no ? 'En ny start.' : 'A fresh start.')}</h1>
        <p>{!token ? (no ? 'Denne lenken er ufullstendig. Be om en ny e-post for å tilbakestille passordet ditt.' : 'This link is incomplete. Request a new email to reset your password.') : success ? (no ? 'Alt er klart. Du kan nå logge inn med det nye passordet ditt.' : 'You’re all set. Sign in with your new password to continue.') : (no ? 'Velg et nytt passord for Vintra-kontoen din.' : 'Choose a new password for your Vintra account.')}</p>
      </div>
      {!token ? (
        <Link href="/auth/forgot-password" className="nordicAuthSubmit">{no ? 'Send meg en ny lenke' : 'Request a new link'}<FiArrowRight aria-hidden="true" /></Link>
      ) : success ? (
        <Link href="/auth/login" className="nordicAuthSubmit">{no ? 'Logg inn' : 'Sign in'}<FiArrowRight aria-hidden="true" /></Link>
      ) : (
        <form className="nordicAuthForm" onSubmit={handleSubmit} aria-busy={loading}>
          <PasswordField id="new-password" label={no ? 'Nytt passord' : 'New password'} placeholder={no ? 'Minst 6 tegn' : 'At least 6 characters'} value={password} onChange={setPassword} minLength={6} hint={no ? 'Bruk gjerne flere ord som er lette for deg å huske.' : 'Try several words that are easy for you to remember.'} />
          <PasswordField id="confirm-password" label={no ? 'Bekreft nytt passord' : 'Confirm new password'} placeholder={no ? 'Gjenta passordet' : 'Repeat your password'} value={confirmPassword} onChange={setConfirmPassword} minLength={6} />
          {error && <div className="nordicAuthError" role="alert">{error}</div>}
          <button className="nordicAuthSubmit" type="submit" disabled={loading}>{loading ? <><span className="nordicAuthSpinner" />{no ? 'Lagrer passord…' : 'Saving password…'}</> : <>{no ? 'Lagre nytt passord' : 'Save new password'}<FiArrowRight aria-hidden="true" /></>}</button>
          {error && <Link href="/auth/forgot-password" className="nordicAuthBack">{no ? 'Be om en ny tilbakestillingslenke' : 'Request a new reset link'}</Link>}
        </form>
      )}
      <p className="nordicAuthSwitch"><Link href="/auth/login"><FiArrowLeft aria-hidden="true" />{no ? 'Tilbake til innlogging' : 'Back to sign in'}</Link></p>
    </AuthFrame>
  )
}
