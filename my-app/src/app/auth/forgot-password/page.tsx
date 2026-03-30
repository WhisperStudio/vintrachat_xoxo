'use client'

import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/email-auth'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">
          {!submitted ? (
            <>
              <h1>Glemt Passord?</h1>
              <p>Skriv inn din email så sender vi deg instruksjoner for å nullstille passordet.</p>

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

                <button className="primaryBtn fullWidth" type="submit" disabled={loading}>
                  {loading ? 'Sender...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="authSwitch" style={{ marginTop: '20px' }}>
                Husket du passordet? <Link href="/auth/login">Logg inn</Link>
              </p>
            </>
          ) : (
            <>
              <h1>✅ Lenkje Sendt!</h1>
              <p>Vi har sendt instruksjoner for å nullstille passordet til:</p>
              <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>{email}</p>

              <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                <p>
                  Sjekk din innboks (og spam-mappen) for instruksjonene. Lenken utløper om 1 time.
                </p>
              </div>

              <Link href="/auth/login">
                <button className="primaryBtn fullWidth">Tilbake til Innlogging</button>
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  )
}
