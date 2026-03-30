'use client'

import Header from '@/components/header'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { resetPassword } from '@/lib/email-auth'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Ugyldig reset lenke')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Passord er påkrevd')
      return
    }

    if (password.length < 6) {
      setError('Passord må være minst 6 tegn')
      return
    }

    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens')
      return
    }

    if (!token) {
      setError('Ugyldig reset lenke')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <>
        <Header />
        <main className="authPage">
          <div className="authCard">
            <h1>❌ Ugyldig Lenke</h1>
            <p>Denne reset-lenken er ugyldig eller utløpt.</p>
            <Link href="/auth/forgot-password">
              <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                Be om Ny Link
              </button>
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (success) {
    return (
      <>
        <Header />
        <main className="authPage">
          <div className="authCard">
            <h1>✅ Passord Nullstilt!</h1>
            <p>Ditt passord er blitt nullstilt. Du kan nå logge inn med det nye passordet.</p>
            <Link href="/auth/login">
              <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                Gå til Innlogging
              </button>
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">
          <h1>Nullstill Passord</h1>
          <p>Skriv inn ditt nye passord</p>

          <form onSubmit={handleSubmit}>
            <label>
              <span>Nytt Passord</span>
              <input
                type="password"
                placeholder="Minst 6 tegn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label>
              <span>Bekreft Passord</span>
              <input
                type="password"
                placeholder="Gjenta passordet"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {error && <div className="errorBox">{error}</div>}

            <button className="primaryBtn fullWidth" type="submit" disabled={loading}>
              {loading ? 'Nullstiller...' : 'Nullstill Passord'}
            </button>
          </form>

          <p className="authSwitch" style={{ marginTop: '20px' }}>
            <Link href="/auth/login">Tilbake til Innlogging</Link>
          </p>
        </div>
      </main>
    </>
  )
}
