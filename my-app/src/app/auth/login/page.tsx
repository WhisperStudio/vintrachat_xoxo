'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/auth.service'
import { useAuth } from '@/context/AuthContext'
import { authPagesI18n, useVintraLanguage } from '@/lib/i18n'

export default function LoginPage() {
  const router = useRouter()
  const { firebaseUser, isAuthenticated, loading } = useAuth()
  const { language } = useVintraLanguage()
  const text = authPagesI18n[language]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/admin')
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
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || text.login.failed)
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <main className="authPage">
      {loading ? (
        <div className="authCard">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner" />
            <p>{text.loading}</p>
          </div>
        </div>
      ) : (
        <div className="authCard">
          <h1>{text.login.title}</h1>
          <p>{text.login.body}</p>

          <form onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="din@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              <span>{text.login.password}</span>
              <input
                type="password"
                placeholder={text.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <div className="errorBox">{error}</div>}

            <button className="primaryBtn fullWidth" type="submit" disabled={loginLoading}>
              {loginLoading ? text.login.submitting : text.login.submit}
            </button>
          </form>

          <p className="authSwitch">
            <Link href="/auth/forgot-password">{text.login.forgotPassword}</Link>
          </p>

          <p className="authSwitch" style={{ marginTop: '20px' }}>
            {text.login.noAccount} <Link href="/auth/signup">{text.login.createAccount}</Link>
          </p>
        </div>
      )}
    </main>
  )
}
