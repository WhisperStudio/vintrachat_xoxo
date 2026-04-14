'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { verifyEmail } from '@/lib/auth.service'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Ugyldig verifikasjonslenke')
      return
    }

    const verify = async () => {
      const result = await verifyEmail(token)

      if (result.success) {
        setStatus('success')
        setMessage(result.message)

        if (result.businessId) {
          setIsLoggingIn(true)
          setTimeout(() => {
            router.push('/admin')
          }, 2000)
        }
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    }

    verify()
  }, [token, router])

  return (
    <>
      <main className="authPage">
        <div className="authCard">
          {status === 'loading' && (
            <>
              <h1>Verifiserer email...</h1>
              <p>Vennligst vent mens vi verifiserer email adressen din.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1>✅ Email verifisert!</h1>
              <p>{message}</p>

              {isLoggingIn && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <p>Logger deg inn automatisk...</p>
                  <div className="loading-spinner" />
                </div>
              )}

              {!isLoggingIn && (
                <Link href="/auth/login">
                  <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                    Gå til innlogging
                  </button>
                </Link>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <h1>❌ Verifikasjon mislyktes</h1>
              <p style={{ color: '#d32f2f' }}>{message}</p>
              <p>Prøv å registrere deg igjen eller kontakt support.</p>
              <Link href="/auth/signup">
                <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                  Opprett ny konto
                </button>
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  )
}
