'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCheck, FiUsers } from 'react-icons/fi'
import AuthFrame, { PasswordField } from '../AuthFrame'
import { signUpWithEmail } from '@/lib/auth.service'
import { authPagesI18n, useVintraLanguage } from '@/lib/i18n'

export default function SignupPage() {
  const router = useRouter()
  const { language } = useVintraLanguage()
  const text = authPagesI18n[language].signup

  const [step, setStep] = useState<'choice' | 'form'>('choice')
  const [accountType, setAccountType] = useState<'business' | 'user'>('business')
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const stepTitle = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)

  useEffect(() => {
    if (previousStep.current !== step) {
      stepTitle.current?.focus()
      previousStep.current = step
    }
  }, [step])

  const handleContinue = () => {
    if (!accountType) {
      setError(text.selectType)
      return
    }

    if (accountType === 'business' && !businessName.trim()) {
      setError(text.businessRequired)
      return
    }

    setError('')
    setStep('form')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError(text.nameRequired)
      return
    }

    if (!email.trim()) {
      setError(text.emailRequired)
      return
    }

    if (password.length < 6) {
      setError(text.passwordLength)
      return
    }

    if (password !== confirmPassword) {
      setError(text.passwordMismatch)
      return
    }

    setLoading(true)

    try {
      const result = await signUpWithEmail(
        email,
        password,
        displayName,
        accountType || undefined,
        businessName || undefined
      )

      if (result.success) {
        router.push(`/auth/verify-email-sent?email=${encodeURIComponent(email)}`)
      } else {
        setError(result.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.failed)
    } finally {
      setLoading(false)
    }
  }

  const no = language === 'no'

  return (
    <AuthFrame signup>
      <ol className="nordicAuthSteps" aria-label={no ? 'Registreringssteg' : 'Registration steps'}>
        <li aria-current={step === 'choice' ? 'step' : undefined} className={step === 'form' ? 'is-complete' : ''}><span>{step === 'form' ? <FiCheck aria-hidden="true" /> : '1'}</span>{no ? 'Arbeidsområde' : 'Workspace'}</li>
        <li aria-current={step === 'form' ? 'step' : undefined}><span>2</span>{no ? 'Din konto' : 'Your account'}</li>
      </ol>
      <div className="nordicAuthIntro">
        <h1 id="auth-title" ref={stepTitle} tabIndex={-1}>{step === 'choice' ? (no ? 'Her starter det.' : 'Your next chapter.') : (no ? 'Hyggelig å møte deg.' : 'Nice to meet you.')}</h1>
        <p>{step === 'choice' ? (no ? 'Et eget sted for bedriften, eller en plass på laget?' : 'A workspace of your own, or a place on the team?') : (no ? 'Opprett kontoen din for å komme i gang.' : 'Create your account to get started.')}</p>
      </div>

      {step === 'choice' ? (
        <form className="nordicAuthForm" onSubmit={(event) => { event.preventDefault(); handleContinue() }}>
          <fieldset className="nordicAuthAccountOptions">
            <legend className="nordicAuthSrOnly">{text.selectType}</legend>
            {(['business', 'user'] as const).map((type) => (
              <label className="nordicAuthAccount" key={type}>
                <input type="radio" name="accountType" value={type} checked={accountType === type} onChange={() => { setAccountType(type); setError('') }} />
                <span className="nordicAuthAccountBody">
                  <span className="nordicAuthAccountIcon">{type === 'business' ? <FiBriefcase aria-hidden="true" /> : <FiUsers aria-hidden="true" />}</span>
                  <span className="nordicAuthAccountCopy"><strong>{type === 'business' ? (no ? 'Opprett en bedrift' : 'Create a workspace') : (no ? 'Bli med i et team' : 'Join your team')}</strong><span>{type === 'business' ? (no ? 'Samle kundedialogen og inviter teamet ditt.' : 'Bring customer conversations and your team together.') : (no ? 'For deg som er invitert til en eksisterende bedrift.' : 'For you who have been invited to an existing workspace.')}</span></span>
                  <span className="nordicAuthRadio"><FiCheck aria-hidden="true" /></span>
                </span>
              </label>
            ))}
          </fieldset>
          {accountType === 'business' ? (
            <div className="nordicAuthField">
              <label htmlFor="businessName">{text.companyName}</label>
              <input id="businessName" name="organization" autoComplete="organization" type="text" placeholder={no ? 'Navnet på bedriften din' : 'Your company name'} value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
            </div>
          ) : <p className="nordicAuthHint">{no ? 'Bruk e-postadressen invitasjonen ble sendt til. Du godtar invitasjonen etter at kontoen er opprettet.' : 'Use the email address your invitation was sent to. You can accept the invitation once your account is created.'}</p>}
          {error && <div className="nordicAuthError" role="alert">{error}</div>}
          <button className="nordicAuthSubmit" type="submit">{text.continue}<FiArrowRight aria-hidden="true" /></button>
        </form>
      ) : (
        <form className="nordicAuthForm" onSubmit={handleSignup} aria-busy={loading}>
          <div className="nordicAuthSelection"><span>{accountType === 'business' ? <FiBriefcase aria-hidden="true" /> : <FiUsers aria-hidden="true" />}{accountType === 'business' ? businessName : (no ? 'Bli med i et team' : 'Join your team')}</span><button type="button" disabled={loading} onClick={() => { setStep('choice'); setError('') }}>{no ? 'Endre' : 'Change'}</button></div>
          <div className="nordicAuthField">
            <label htmlFor="displayName">{text.fullName}</label>
            <input id="displayName" name="name" type="text" autoComplete="name" placeholder={text.fullNamePlaceholder} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
          </div>
          <div className="nordicAuthField">
            <label htmlFor="email">{text.emailAddress}</label>
            <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder={no ? 'deg@bedrift.no' : 'you@company.com'} value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="nordicAuthPasswordGrid">
            <PasswordField id="password" label={text.password} placeholder={text.passwordPlaceholder} value={password} onChange={setPassword} minLength={6} />
            <PasswordField id="confirmPassword" label={text.confirmPassword} placeholder={text.confirmPasswordPlaceholder} value={confirmPassword} onChange={setConfirmPassword} minLength={6} />
          </div>
          <p className="nordicAuthHint">{no ? 'Vi sender deg en e-post for å bekrefte kontoen din.' : 'We’ll send you an email to verify your account.'}</p>
          {error && <div className="nordicAuthError" role="alert">{error}</div>}
          <button className="nordicAuthSubmit" type="submit" disabled={loading}>{loading ? <><span className="nordicAuthSpinner" />{text.creating}</> : <>{text.create}<FiArrowRight aria-hidden="true" /></>}</button>
          <button type="button" className="nordicAuthBack" disabled={loading} onClick={() => { setStep('choice'); setError('') }}><FiArrowLeft aria-hidden="true" />{text.back}</button>
        </form>
      )}
      <p className="nordicAuthSwitch">{text.alreadyHaveAccount} <Link href="/auth/login">{text.login}<FiArrowRight aria-hidden="true" /></Link></p>
    </AuthFrame>
  )
}
