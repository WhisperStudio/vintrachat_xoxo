'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiMail } from 'react-icons/fi'
import { requestPasswordReset } from '@/lib/auth.service'
import { useVintraLanguage } from '@/lib/i18n'
import { siteConfig } from '@/lib/site-config'
import AuthFrame from '../AuthFrame'

export default function ForgotPasswordPage() {
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => { if (submitted) title.current?.focus() }, [submitted])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await requestPasswordReset(email.trim())
      if (result.success) setSubmitted(true)
      else setError(result.message || (no ? 'Kunne ikke sende lenken. Prøv igjen.' : 'Could not send the link. Please try again.'))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (no ? 'Noe gikk galt. Prøv igjen.' : 'Something went wrong. Please try again.'))
    } finally { setLoading(false) }
  }

  return (
    <AuthFrame recovery>
      <div className="nordicAuthIntro">
        <span className="nordicAuthFormIcon">{submitted ? <FiCheckCircle aria-hidden="true" /> : <FiMail aria-hidden="true" />}</span>
        <h1 id="auth-title" ref={title} tabIndex={-1}>{submitted ? (no ? 'Sjekk innboksen din.' : 'Check your inbox.') : (no ? 'Glemt passordet?' : 'Forgot your password?')}</h1>
        <p>{submitted ? (no ? 'Hvis e-postadressen er knyttet til en konto, sender vi deg en lenke for å velge et nytt passord.' : 'If this email address is linked to an account, we’ll send you a link to choose a new password.') : (no ? 'Skriv inn e-postadressen du bruker hos Vintra, så hjelper vi deg videre.' : 'Enter the email address you use with Vintra and we’ll help you get back in.')}</p>
      </div>
      {submitted ? (
        <div className="nordicAuthForm">
          <div className="nordicAuthRecoveryEmail"><FiMail aria-hidden="true" /><strong>{email.trim()}</strong></div>
          <ol className="nordicAuthRecoverySteps"><li>{no ? 'Åpne e-posten fra Vintra.' : 'Open the email from Vintra.'}</li><li>{no ? 'Følg lenken og velg et nytt passord.' : 'Follow the link and choose a new password.'}</li></ol>
          <p className="nordicAuthHint">{no ? 'Finner du ikke e-posten? Se i søppelpost, og kontroller at adressen er riktig.' : 'Can’t find the email? Check your spam folder and make sure the address is correct.'}</p>
          <Link href="/auth/login" className="nordicAuthSubmit">{no ? 'Til innlogging' : 'Back to sign in'}<FiArrowRight aria-hidden="true" /></Link>
          <button className="nordicAuthBack" type="button" onClick={() => { setSubmitted(false); setError('') }}>{no ? 'Bruk en annen e-postadresse' : 'Use a different email address'}</button>
        </div>
      ) : (
        <form className="nordicAuthForm" onSubmit={handleSubmit} aria-busy={loading}>
          <div className="nordicAuthField"><label htmlFor="recovery-email">{no ? 'E-postadresse' : 'Email address'}</label><input id="recovery-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder={no ? 'deg@bedrift.no' : 'you@company.com'} value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          {error && <div className="nordicAuthError" role="alert">{error}</div>}
          <button className="nordicAuthSubmit" type="submit" disabled={loading}>{loading ? <><span className="nordicAuthSpinner" />{no ? 'Sender lenke…' : 'Sending link…'}</> : <>{no ? 'Send tilbakestillingslenke' : 'Send reset link'}<FiArrowRight aria-hidden="true" /></>}</button>
          <Link href="/auth/login" className="nordicAuthBack"><FiArrowLeft aria-hidden="true" />{no ? 'Tilbake til innlogging' : 'Back to sign in'}</Link>
        </form>
      )}
      <p className="nordicAuthSwitch">{no ? 'Trenger du hjelp?' : 'Need a hand?'} <a href={`mailto:${siteConfig.contact.email}`}>{no ? 'Kontakt oss' : 'Contact support'}</a></p>
    </AuthFrame>
  )
}
