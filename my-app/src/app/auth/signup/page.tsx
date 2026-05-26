'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { signUpWithEmail } from '@/lib/auth.service'
import { authPagesI18n, useVintraLanguage } from '@/lib/i18n'
import './signup.css'

export default function SignupPage() {
  const router = useRouter()
  const { language } = useVintraLanguage()
  const text = authPagesI18n[language].signup

  const [step, setStep] = useState<'choice' | 'form'>('choice')
  const [accountType, setAccountType] = useState<'business' | 'user'>('business')
  const [businessName, setBusinessName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleContinue = () => {
    if (!accountType) {
      setError(text.selectType)
      return
    }

    if (accountType === 'business' && !businessName.trim()) {
      setError(text.businessRequired)
      return
    }

    setError('')
    setStep('form')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError(text.nameRequired)
      return
    }

    if (!email.trim()) {
      setError(text.emailRequired)
      return
    }

    if (password.length < 6) {
      setError(text.passwordLength)
      return
    }

    if (password !== confirmPassword) {
      setError(text.passwordMismatch)
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
      setError(err.message || text.failed)
    } finally {
      setLoading(false)
    }
  }

  const passwordToggleLabel = showPassword ? text.hidePassword : text.showPassword

  return (
    <main className="authPage">
      <div className="authCard">
        {step === 'choice' && (
          <>
            <h1>{text.title}</h1>
            <p style={{ marginBottom: '20px' }}>{text.choiceBody}</p>

            <div className="accountTypeGrid">
              <div
                className={`accountCard ${accountType === 'business' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('business')
                  setError('')
                }}
              >
                <div className="cardHeader">
                  <div className={`radioDot ${accountType === 'business' ? 'active' : ''}`} />
                  <h3>{text.businessAccount}</h3>
                </div>

                <p className="desc">{text.businessDesc}</p>

                {accountType === 'business' && (
                  <ul className="featuresList">
                    {text.businessFeatures.map((feature) => (
                      <li key={feature}>- {feature}</li>
                    ))}
                  </ul>
                )}

                <small className="hint">{text.businessHint}</small>
              </div>

              <div
                className={`accountCard ${accountType === 'user' ? 'active' : ''}`}
                onClick={() => {
                  setAccountType('user')
                  setError('')
                }}
              >
                <div className="cardHeader">
                  <div className={`radioDot ${accountType === 'user' ? 'active' : ''}`} />
                  <h3>{text.personalUser}</h3>
                </div>

                <p className="desc">{text.personalDesc}</p>

                {accountType === 'user' && (
                  <ul className="featuresList">
                    {text.personalFeatures.map((feature) => (
                      <li key={feature}>- {feature}</li>
                    ))}
                  </ul>
                )}

                <small className="hint">{text.personalHint}</small>
              </div>
            </div>

            {accountType === 'business' && (
              <label>
                <span>{text.companyName}</span>
                <input
                  type="text"
                  placeholder={text.companyPlaceholder}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </label>
            )}

            {error && <div className="errorBox">{error}</div>}

            <button className="primaryBtn fullWidth" onClick={handleContinue}>
              {text.continue}
            </button>

            <p className="authSwitch">
              {text.alreadyHaveAccount} <Link href="/auth/login">{text.login}</Link>
            </p>
          </>
        )}

        {step === 'form' && (
          <>
            <h1>{text.title}</h1>
            <p>{text.formBody}</p>

            <form onSubmit={handleSignup}>
              <label>
                <span>{text.fullName}</span>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder={text.fullNamePlaceholder}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

              <label>
                <span>{text.emailAddress}</span>
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
                <span>{text.password}</span>
                <div className="inputWrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    placeholder={text.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="togglePassword"
                    aria-label={passwordToggleLabel}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              <label>
                <span>{text.confirmPassword}</span>
                <div className="inputWrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder={text.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="togglePassword"
                    aria-label={passwordToggleLabel}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </label>

              {error && <div className="errorBox">{error}</div>}

              <button className="primaryBtn fullWidth" disabled={loading}>
                {loading ? text.creating : text.create}
              </button>

              <button
                type="button"
                className="backBtn"
                onClick={() => {
                  setStep('choice')
                  setError('')
                }}
              >
                {text.back}
              </button>
            </form>

            <p className="authSwitch">
              {text.alreadyHaveAccount} <Link href="/auth/login">{text.login}</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
