'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/auth.service'
import { useAuth } from '@/context/AuthContext'
import { isVintraAdminEmail } from '@/lib/vintra-admin'

export default function LoginPage() {
  const router = useRouter()
  const { firebaseUser, isAuthenticated, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Redirect hvis allerede innlogget
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(isVintraAdminEmail(firebaseUser?.email) ? '/vintra-admin' : '/admin')
    }
  }, [firebaseUser?.email, isAuthenticated, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email er påkrevd')
      return
    }

    if (!password.trim()) {
      setError('Passord er påkrevd')
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
      setError(err.message || 'Innlogging feilet')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <>
      <main className="authPage">
        {loading ? (
          <div className="authCard">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner" />
              <p>Laster...</p>
            </div>
          </div>
        ) : (
          <div className="authCard">
            <h1>Logg Inn</h1>
            <p>Logg inn med din email og passord</p>

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
                <span>Passord</span>
                <input
                  type="password"
                  placeholder="Ditt passord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <div className="errorBox">{error}</div>}

              <button className="primaryBtn fullWidth" type="submit" disabled={loginLoading}>
                {loginLoading ? 'Logger inn...' : 'Logg Inn'}
              </button>
            </form>

            <p className="authSwitch">
              <Link href="/auth/forgot-password">Glemt passord?</Link>
            </p>

            <p className="authSwitch" style={{ marginTop: '20px' }}>
              Har du ikke bruker? <Link href="/auth/signup">Opprett konto</Link>
            </p>
          </div>
        )}
      </main>
    </>
  )
}
