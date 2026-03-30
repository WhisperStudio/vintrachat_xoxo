'use client'

import Header from '@/components/header'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function VerifyEmailSentPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'din email'
  
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Timer for resend button cooldown
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => {
      setCooldown(cooldown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendMessage('')

    try {
      const response = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token: 'placeholder', // This will be generated on backend if needed
          displayName: 'Bruker',
        }),
      })

      if (response.ok) {
        setResendMessage('✅ Verifikasjonsmail sendt på nytt! Sjekk inboxen din.')
        setCooldown(60) // 60 second cooldown
      } else {
        const error = await response.json()
        setResendMessage('❌ ' + (error.message || 'Kunne ikke sende email igjen'))
      }
    } catch (error: any) {
      setResendMessage('❌ En feil oppstod: ' + error.message)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px',
            }}>
              ✅
            </div>
            <h1>All done!</h1>
            <p style={{ color: '#666', marginTop: '10px' }}>
              We have sent a verification link to your email:
            </p>
            <p style={{
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '20px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
            }}>
              {email}
            </p>
          </div>

          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '15px',
            borderRadius: '4px',
            marginBottom: '20px',
            borderLeft: '4px solid #007bff',
          }}>
            <p style={{ margin: 0 }}>
              <strong>💡 Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
            </p>
          </div>

          <h3 style={{ marginTop: '25px', marginBottom: '15px' }}>Next Step:</h3>
          <ol style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>📧 Open the mail from us</li>
            <li>🔗 Click on the "Verify Email" link</li>
            <li>✨ You will be redirected to the login page</li>
            <li>🔐 Log in with your email and password</li>
          </ol>

          {resendMessage && (
            <div style={{
              padding: '12px',
              borderRadius: '4px',
              marginTop: '20px',
              backgroundColor: resendMessage.includes('✅') ? '#e8f5e9' : '#ffebee',
              color: resendMessage.includes('✅') ? '#2e7d32' : '#c62828',
              border: `1px solid ${resendMessage.includes('✅') ? '#c8e6c9' : '#ffcdd2'}`,
            }}>
              {resendMessage}
            </div>
          )}

          <button
            onClick={handleResendEmail}
            disabled={resendLoading || cooldown > 0}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px',
              backgroundColor: cooldown > 0 ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'background-color 0.3s',
            }}
          >
            {resendLoading ? 'Sender...' : cooldown > 0 ? `Send again (${cooldown}s)` : 'Send again'}
          </button>

          <div style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '15px' }}>
              After verification, you can log in here:
            </p>
            <Link href="/auth/login" style={{ textDecoration: 'none' }}>
              <button style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#efefef'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              >
                Go to Login
              </button>
            </Link>
          </div>

          <p style={{
            marginTop: '20px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
          }}>
            Need help? <Link href="/auth/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Try registering again</Link>
          </p>
        </div>
      </main>
    </>
  )
}
