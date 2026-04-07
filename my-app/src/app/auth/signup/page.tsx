'use client'

import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { signUpWithEmail } from '@/lib/auth.service'
import './signup.css'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function SignupPage() {
  const router = useRouter()

  const [step, setStep] = useState<'choice' | 'form'>('choice')
  const [accountType, setAccountType] = useState<'business' | 'user'>('business')
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (!accountType) {
      setError('Please select an account type to continue')
      return
    }

    if (accountType === 'business' && !businessName.trim()) {
      setError('Business name is required')
      return
    }

    setError('')
    setStep('form')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Full name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
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
        router.push(`/auth/verify-email-sent?email=${encodeURIComponent(email)}`)
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="authPage">
        <div className="authCard">

          {/* STEP 1: ACCOUNT TYPE */}
          {step === 'choice' && (
            <>
              <h1>Create your account</h1>
              <p style={{ marginBottom: '20px' }}>
                Choose how you want to use the platform
              </p>

              <div className="accountTypeGrid">

                {/* BUSINESS */}
                <div
                  className={`accountCard ${accountType === 'business' ? 'active' : ''}`}
                  onClick={() => {
                    setAccountType('business')
                    setError('')
                  }}
                >
                  <div className="cardHeader">
                    <div className={`radioDot ${accountType === 'business' ? 'active' : ''}`} />
                    <h3>Business Account</h3>
                  </div>

                  <p className="desc">
                    Create and manage a company workspace.
                  </p>

                  {accountType === 'business' && (
                    <ul className="featuresList">
                      <li>✔ Create a company</li>
                      <li>✔ Invite team members</li>
                      <li>✔ Manage users</li>
                    </ul>
                  )}

                  <small className="hint">
                    Choose this if you are setting up a company.
                  </small>
                </div>

                {/* USER */}
                <div
                  className={`accountCard ${accountType === 'user' ? 'active' : ''}`}
                  onClick={() => {
                    setAccountType('user')
                    setError('')
                  }}
                >
                  <div className="cardHeader">
                    <div className={`radioDot ${accountType === 'user' ? 'active' : ''}`} />
                    <h3>Personal User</h3>
                  </div>

                  <p className="desc">
                    Join an existing company.
                  </p>

                  {accountType === 'user' && (
                    <ul className="featuresList">
                      <li>✔ Join via invitation</li>
                      <li>✔ Access assigned workspace</li>
                    </ul>
                  )}

                  <small className="hint">
                    Choose this if your company invited you.
                  </small>
                </div>
              </div>

              {accountType === 'business' && (
                <label>
                  <span>Company name</span>
                  <input
                    type="text"
                    placeholder="e.g. Acme Inc."
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </label>
              )}

              {error && <div className="errorBox">{error}</div>}

              <button
                className="primaryBtn fullWidth"
                onClick={handleContinue}
              >
                Continue
              </button>

              <p className="authSwitch">
                Already have an account? <Link href="/auth/login">Log in</Link>
              </p>
            </>
          )}

          {/* STEP 2: FORM */}
          {step === 'form' && (
            <>
              <h1>Create your account</h1>
              <p>Enter your details below</p>

              <form onSubmit={handleSignup}>
                <label>
                  <span>Full name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </label>

                <label>
                  <span>Email address</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  <span>Password</span>
                  <div className="inputWrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="togglePassword"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                <label>
                  <span>Confirm password</span>
                  <div className="inputWrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="togglePassword"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                {error && <div className="errorBox">{error}</div>}

                <button className="primaryBtn fullWidth" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                <button
                  type="button"
                  className="backBtn"
                  onClick={() => {
                    setStep('choice')
                    setError('')
                  }}
                >
                  Back
                </button>
              </form>

              <p className="authSwitch">
                Already have an account? <Link href="/auth/login">Log in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}