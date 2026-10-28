'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FiArrowRight, FiLock } from 'react-icons/fi'
import AuthFrame, { PasswordField } from '../AuthFrame'
import { signInWithEmail } from '@/lib/auth.service'
import { useAuth } from '@/context/AuthContext'
import { authPagesI18n, useVintraLanguage } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { firebaseUser, isAuthenticated, loading, error: accountError, refreshCurrentUser, logout } = useAuth()
  const { language } = useVintraLanguage()
  const text = authPagesI18n[language]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/admin')
    }
  }, [firebaseUser?.email, isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError(text.login.emailRequired)
      return
    }

    if (!password.trim()) {
      setError(text.login.passwordRequired)
      return
    }

    setLoginLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (result.success) {
        // The provider must finish loading the verified account before the
        // protected admin page can render. Its effect above handles that move.
        if (result.redirectTo && result.redirectTo !== '/admin') {
          router.push(result.redirectTo)
        }
      } else {
        setError(result.message)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.login.failed)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <AuthFrame>
      <div className="nordicAuthIntro">
        <span className="nordicAuthFormIcon"><FiLock aria-hidden="true" /></span>
        <h1 id="auth-title">{language === 'no' ? 'Velkommen tilbake.' : 'Welcome back.'}</h1>
        <p>{language === 'no' ? 'Logg inn og fortsett der du slapp.' : 'Sign in and pick up where you left off.'}</p>
      </div>
      {loading ? (
        <div className="nordicAuthLoading" role="status"><span className="nordicAuthSpinner" />{text.loading}</div>
      ) : (
        <>
          <form className="nordicAuthForm" onSubmit={handleSubmit} aria-busy={loginLoading}>
            <div className="nordicAuthField">
              <label htmlFor="email">{language === 'no' ? 'E-postadresse' : 'Email address'}</label>
              <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder={language === 'no' ? 'deg@bedrift.no' : 'you@company.com'} value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <PasswordField id="password" label={text.login.password} placeholder={text.login.passwordPlaceholder} value={password} onChange={setPassword} autoComplete="current-password" />
            <div className="nordicAuthForgot"><Link href="/auth/forgot-password">{text.login.forgotPassword}</Link></div>
            {(error || accountError) && <div className="nordicAuthError" role="alert">{error || accountError}</div>}
            <button className="nordicAuthSubmit" type="submit" disabled={loginLoading}>
              {loginLoading ? <><span className="nordicAuthSpinner" />{text.login.submitting}</> : <>{text.login.submit}<FiArrowRight aria-hidden="true" /></>}
            </button>
          </form>
          {accountError && (
            <button type="button" className="nordicAuthBack" onClick={() => {
              setError('')
              if (firebaseUser) void refreshCurrentUser()
              else window.location.reload()
            }}>
              {language === 'no' ? 'Prøv å hente kontoen igjen' : 'Try loading your account again'}
            </button>
          )}
          {firebaseUser && accountError && (
            <button type="button" className="nordicAuthBack" onClick={async () => {
              try { await logout(); setError('') }
              catch { setError(language === 'no' ? 'Kunne ikke logge ut. Prøv igjen.' : 'Could not sign out. Please try again.') }
            }}>
              {language === 'no' ? 'Logg ut og bruk en annen konto' : 'Sign out and use another account'}
            </button>
          )}
          <p className="nordicAuthSwitch">{text.login.noAccount} <Link href="/auth/signup">{text.login.createAccount}<FiArrowRight aria-hidden="true" /></Link></p>
        </>
      )}
    </AuthFrame>
  )
}
