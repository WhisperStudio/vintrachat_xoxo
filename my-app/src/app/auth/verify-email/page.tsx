'use client'

import Header from '@/components/header'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { verifyEmail } from '@/lib/email-auth'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

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
      } else {
        setStatus('error')
        setMessage(result.message)
      }
    }

    verify()
  }, [token])

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">
          {status === 'loading' && (
            <>
              <h1>Veryfing Email...</h1>
              <p>Please wait while we verify your email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1>✅ Email Verified!</h1>
              <p>{message}</p>
              <Link href="/auth/login">
                <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                  Go to Login
                </button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <h1>❌ Verification Failed</h1>
              <p style={{ color: '#d32f2f' }}>{message}</p>
              <p>Try registering again or contact support.</p>
              <Link href="/auth/signup">
                <button className="primaryBtn fullWidth" style={{ marginTop: '20px' }}>
                  Create New Account
                </button>
              </Link>
            </>
          )}
        </div>
      </main>
    </>
  )
}
