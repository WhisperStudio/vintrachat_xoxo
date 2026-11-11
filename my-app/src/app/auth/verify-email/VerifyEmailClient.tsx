'use client'

import AuthFrame from '../AuthFrame'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiMail, FiShield, FiXCircle } from 'react-icons/fi'
import { auth } from '@/lib/firebase'
import { refreshVerificationSession } from '@/lib/verification-session.mjs'

export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const hasStartedRef = useRef(false)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    if (!token) {
      setStatus('error')
      setMessage('This verification link is missing the token it needs.')
      return
    }

    const runVerification = async () => {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
      const result = await response.json().catch(() => ({
        success: false,
        message: 'Verification failed.',
      }))

      if (response.ok && result.success) {
        setStatus('success')
        setMessage(result.message)

        if (result.businessId) {
          // Never navigate into a protected workspace with a stale unverified
          // session. A full navigation also reloads the account provider.
          const ready = await refreshVerificationSession(auth).catch(() => false)
          setIsRedirecting(true)
          setTimeout(() => {
            window.location.assign(ready ? '/admin' : '/auth/login')
          }, 2000)
        } else {
          await refreshVerificationSession(auth).catch(() => false)
        }

        return
      }

      setStatus('error')
      setMessage(result.message)
    }

    void runVerification().catch(() => {
      setStatus('error')
      setMessage('Could not verify your email right now. Check your connection and reload this page to try again.')
    })
  }, [token])

  return (
    <AuthFrame>
        <section className="authCard authCardElevated">
          {status === 'loading' && (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiMail size={24} />
                </div>
                <div>
                  <p className="authKicker">In progress</p>
                  <h2 className="authHeadline" id="auth-title">Verifying your email</h2>
                </div>
              </div>

              <p className="authBody">
                Hold tight while we confirm the verification link and prepare your next step.
              </p>

              <div style={{ padding: '18px 0' }}>
                <div className="loading-spinner" />
              </div>

              <div className="authCallout">
                <strong>Tip</strong>
                You can keep this tab open. We will update the page as soon as the verification check is complete.
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <p className="authKicker">Verified</p>
                  <h2 className="authHeadline">Your email is confirmed</h2>
                </div>
              </div>

              <p className="authBody">{message}</p>

              {isRedirecting ? (
                <>
                  <div className="authCallout success">
                    <strong>Email confirmed</strong>
                    <span>We are refreshing your session. You may be asked to sign in before opening your workspace.</span>
                  </div>
                  <div style={{ padding: '10px 0 0' }}>
                    <div className="loading-spinner" />
                  </div>
                </>
              ) : (
                <div className="authButtonStack">
                  <Link href="/auth/login" className="primaryBtn buttonLink fullWidth">
                    Continue to login
                  </Link>
                  <Link href="/auth/signup" className="secondaryBtn buttonLink fullWidth">
                    Create another account
                  </Link>
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge" style={{ color: '#b91c1c', background: 'linear-gradient(135deg, #fee2e2 0%, #fff1f2 100%)' }}>
                  <FiXCircle size={24} />
                </div>
                <div>
                  <p className="authKicker" style={{ color: '#b91c1c' }}>Verification failed</p>
                  <h2 className="authHeadline">This link could not be used</h2>
                </div>
              </div>

              <div className="authCallout error">
                <strong>What happened</strong>
                <span>{message}</span>
              </div>

              <p className="authBody">
                The link may already have been used, expired, or may not match an active signup anymore.
              </p>

              <div className="authButtonStack">
                <Link href="/auth/signup" className="primaryBtn buttonLink fullWidth">
                  Create a new account
                </Link>
                <Link href="/auth/login" className="secondaryBtn buttonLink fullWidth">
                  Go to login
                </Link>
              </div>
            </>
          )}

          <Link href="/auth/login" className="authTextLink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Back to login <FiArrowRight size={16} />
          </Link>
        </section>
    </AuthFrame>
  )
}
