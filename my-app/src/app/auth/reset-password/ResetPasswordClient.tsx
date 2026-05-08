'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiKey, FiLock, FiShield, FiXCircle } from 'react-icons/fi'
import { resetPassword } from '@/lib/auth.service'

export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('This reset link is missing the token it needs.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Password is required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (!token) {
      setError('This reset link is no longer valid.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(token, password)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.message || 'We could not reset the password.')
      }
    } catch (err: any) {
      setError(err.message || 'We could not reset the password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="authPage authExperience">
      <div className="authShowcase">
        <section className="authBrandPanel">
          <div className="authBrandHeader">
            <div className="authBrandLogo">
              <Image src="/image/logo.png" alt="Vintra logo" width={40} height={40} />
            </div>
            <div className="authBrandName">
              <strong>Vintra</strong>
              <span>Protected account recovery</span>
            </div>
          </div>

          <div>
            <div className="authBrandEyebrow">Choose a new password</div>
            <h1>Finish your recovery with a strong new login.</h1>
          </div>

          <p className="authBrandLead">
            This secure reset flow updates your Firebase account directly once the token is verified.
          </p>

          <div className="authFeatureList">
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiShield size={18} />
              </div>
              <div>
                <strong>Server-verified link</strong>
                <span>Your reset token is checked on the server before any password change is accepted.</span>
              </div>
            </div>
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiLock size={18} />
              </div>
              <div>
                <strong>Immediate update</strong>
                <span>Once saved, your new password is ready for your next login right away.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="authCard authCardElevated">
          {!token ? (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge" style={{ color: '#b91c1c', background: 'linear-gradient(135deg, #fee2e2 0%, #fff1f2 100%)' }}>
                  <FiXCircle size={24} />
                </div>
                <div>
                  <p className="authKicker" style={{ color: '#b91c1c' }}>Invalid link</p>
                  <h2 className="authHeadline">This reset link cannot be used</h2>
                </div>
              </div>

              <div className="authCallout error">
                <strong>What to do next</strong>
                <span>Request a fresh password reset email to generate a new secure link.</span>
              </div>

              <Link href="/auth/forgot-password" className="primaryBtn buttonLink fullWidth">
                Request new reset link
              </Link>
            </>
          ) : success ? (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <p className="authKicker">Password updated</p>
                  <h2 className="authHeadline">Your account is ready again</h2>
                </div>
              </div>

              <p className="authBody">
                Your new password has been saved successfully. You can now sign in with it.
              </p>

              <div className="authCallout success">
                <strong>All set</strong>
                <span>Head back to login and continue with your updated password.</span>
              </div>

              <Link href="/auth/login" className="primaryBtn buttonLink fullWidth">
                Go to login
              </Link>
            </>
          ) : (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiKey size={24} />
                </div>
                <div>
                  <p className="authKicker">Reset password</p>
                  <h2 className="authHeadline">Create your new password</h2>
                </div>
              </div>

              <p className="authBody">
                Choose a password with at least 6 characters so we can finish your recovery securely.
              </p>

              <form onSubmit={handleSubmit}>
                <label>
                  <span>New password</span>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>

                <label>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </label>

                {error && <div className="errorBox">{error}</div>}

                <button className="primaryBtn fullWidth" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save new password'}
                </button>
              </form>
            </>
          )}

          <Link href="/auth/login" className="authTextLink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Back to login <FiArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  )
}
