'use client'

import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { signInWithEmail } from '@/lib/auth.service'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    setLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (result.success && result.user) { 
        // Redirect to dashboard
        if (result.user.businessId) {
          router.push(`/dashboard/${result.user.businessId}`)
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Innlogging feilet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="authPage">
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

            <button className="primaryBtn fullWidth" type="submit" disabled={loading}>
              {loading ? 'Logger inn...' : 'Logg Inn'}
            </button>
          </form>

          <p className="authSwitch">
            <Link href="/auth/forgot-password">Glemt passord?</Link>
          </p>

          <p className="authSwitch" style={{ marginTop: '20px' }}>
            Har du ikke bruker? <Link href="/auth/signup">Opprett konto</Link>
          </p>
        </div>
      </main>
    </>
  )
}