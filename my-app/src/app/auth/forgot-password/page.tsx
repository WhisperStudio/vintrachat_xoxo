'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiKey, FiMail, FiShield } from 'react-icons/fi'
import { requestPasswordReset } from '@/lib/auth.service'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setSubmitted(true)
      } else {
        setError(result.message || 'We could not send a reset email right now.')
      }
    } catch (err: any) {
      setError(err.message || 'We could not send a reset email right now.')
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
              <span>Secure account recovery</span>
            </div>
          </div>

          <div>
            <div className="authBrandEyebrow">Password recovery</div>
            <h1>Get back into your account safely.</h1>
          </div>

          <p className="authBrandLead">
            We send a secure reset link to the inbox tied to your Vintra account, so you can create a new password without exposing your workspace.
          </p>

          <div className="authFeatureList">
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiKey size={18} />
              </div>
              <div>
                <strong>One secure link</strong>
                <span>Each reset request generates a fresh password link that only the account owner can use.</span>
              </div>
            </div>
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiShield size={18} />
              </div>
              <div>
                <strong>Short expiry window</strong>
                <span>Reset links expire after one hour so old emails cannot be reused later.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="authCard authCardElevated">
          {!submitted ? (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiMail size={24} />
                </div>
                <div>
                  <p className="authKicker">Reset password</p>
                  <h2 className="authHeadline">Send recovery email</h2>
                </div>
              </div>

              <p className="authBody">
                Enter the email tied to your account and we will send you a branded reset link.
              </p>

              <form onSubmit={handleSubmit}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                {error && <div className="errorBox">{error}</div>}

                <button className="primaryBtn fullWidth" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <div className="authInlineLinks">
                <span className="authTinyNote">Remembered it after all?</span>
                <Link href="/auth/login" className="authTextLink">
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="authCardHeader">
                <div className="authIconBadge">
                  <FiCheckCircle size={24} />
                </div>
                <div>
                  <p className="authKicker">Email sent</p>
                  <h2 className="authHeadline">Check your inbox</h2>
                </div>
              </div>

              <p className="authBody">
                If an account exists for this address, a password reset email is now on its way.
              </p>

              <div className="authEmailChip">
                <FiMail size={16} />
                <span>{email}</span>
              </div>

              <div className="authCallout success">
                <strong>Next step</strong>
                <span>Open the email from Vintra and use the button inside it within 1 hour.</span>
              </div>

              <div className="authButtonStack">
                <Link href="/auth/login" className="primaryBtn buttonLink fullWidth">
                  Return to login
                </Link>
                <button className="secondaryBtn fullWidth" type="button" onClick={() => setSubmitted(false)}>
                  Use a different email
                </button>
              </div>
            </>
          )}

          <Link href="/auth/login" className="authTextLink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Continue to login <FiArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  )
}
