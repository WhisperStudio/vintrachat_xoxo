'use client'

import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/auth.service'

export default function SignupPage() {
  const router = useRouter()
  
  const [step, setStep] = useState<'choice' | 'form'>('choice')
  const [accountType, setAccountType] = useState<'business' | 'user' | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (!accountType) {
      setError('Velg hva slags konto du vil opprette')
      return
    }

    if (accountType === 'business' && !businessName.trim()) {
      setError('Bedriftsnavn er påkrevd')
      return
    }

    setError('')
    setStep('form')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!displayName.trim()) {
      setError('Navn er påkrevd')
      return
    }

    if (!email.trim()) {
      setError('Email er påkrevd')
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

    setLoading(true)

    try {
      const result = await signUpWithEmail(
        email,
        password,
        displayName,
        accountType || undefined,
        businessName || undefined
      )

      if (result.success) {
        // Redirect to verification sent page
        router.push(`/auth/verify-email-sent?email=${encodeURIComponent(email)}`)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Registrering feilet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">
          {step === 'choice' && (
            <>
              <h1>Opprett Konto</h1>
              <p>Velg hva slags konto du vil opprette</p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accountType"
                    value="business"
                    checked={accountType === 'business'}
                    onChange={(e) => {
                      setAccountType('business')
                      setError('')
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <span>
                    <strong>Bedriftsadmin</strong>
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>Jeg oppretter bedriftskonto og blir admin</p>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="accountType"
                    value="user"
                    checked={accountType === 'user'}
                    onChange={(e) => {
                      setAccountType('user')
                      setError('')
                    }}
                    style={{ marginRight: '10px' }}
                  />
                  <span>
                    <strong>Bruker</strong>
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>Jeg venter på invitasjon fra bedrift</p>
                  </span>
                </label>
              </div>

              {accountType === 'business' && (
                <label>
                  <span>Bedriftsnavn</span>
                  <input
                    type="text"
                    placeholder="F.eks. Acme AS"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </label>
              )}

              {error && <div className="errorBox">{error}</div>}

              <button
                className="primaryBtn fullWidth"
                type="button"
                onClick={handleContinue}
                disabled={!accountType}
              >
                Neste
              </button>

              <p className="authSwitch" style={{ marginTop: '20px' }}>
                Har du allerede bruker? <Link href="/auth/login">Logg inn</Link>
              </p>
            </>
          )}

          {step === 'form' && (
            <>
              <h1>Opprett Konto</h1>
              <p>Fyll inn dine opplysninger</p>

              <form onSubmit={handleSignup}>
                <label>
                  <span>Navn</span>
                  <input
                    type="text"
                    placeholder="Ditt navn"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </label>

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
                  {loading ? 'Oppretter...' : 'Opprett Konto'}
                </button>

                <button
                  className="secondaryBtn fullWidth"
                  type="button"
                  onClick={() => {
                    setStep('choice')
                    setError('')
                    setDisplayName('')
                    setEmail('')
                    setPassword('')
                    setConfirmPassword('')
                  }}
                  disabled={loading}
                  style={{ marginTop: '10px', background: '#f0f0f0', color: '#333' }}
                >
                  Tilbake
                </button>
              </form>

              <p className="authSwitch" style={{ marginTop: '20px' }}>
                Har du allerede bruker? <Link href="/auth/login">Logg inn</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}