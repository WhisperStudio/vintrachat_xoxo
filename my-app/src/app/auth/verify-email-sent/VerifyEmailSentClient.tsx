'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiMail,
  FiShield,
} from 'react-icons/fi'

export default function VerifyEmailSentClient() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email address'

  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setTimeout(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendMessage('')
    setResendStatus('idle')

    try {
      const response = await fetch('/api/auth/resend-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json()

      if (response.ok && payload.success) {
        setResendStatus('success')
        setResendMessage('A fresh verification email is on the way. Check your inbox in a minute or two.')
        setCooldown(60)
      } else {
        setResendStatus('error')
        setResendMessage(payload.message || 'We could not resend the verification email right now.')
      }
    } catch (error: any) {
      setResendStatus('error')
      setResendMessage(error.message || 'We could not resend the verification email right now.')
    } finally {
      setResendLoading(false)
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
              <span>Websites and AI chatbots for businesses</span>
            </div>
          </div>

          <div>
            <div className="authBrandEyebrow">Account verification</div>
            <h1>One more click and your workspace is ready.</h1>
          </div>

          <p className="authBrandLead">
            We have sent a branded verification email so you can activate your account securely and move straight into setup.
          </p>

          <div className="authFeatureList">
            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiMail size={18} />
              </div>
              <div>
                <strong>Check the message from Vintra</strong>
                <span>Open the verification email and use the secure button inside it to confirm your address.</span>
              </div>
            </div>

            <div className="authFeatureItem">
              <div className="authFeatureIcon">
                <FiShield size={18} />
              </div>
              <div>
                <strong>Protected activation</strong>
                <span>Your verification link is unique to your signup flow so only the account owner can finish setup.</span>
              </div>
            </div>
          </div>

          <div className="authBrandStats">
            <div className="authStatCard">
              <strong>24h</strong>
              <span>Verification links stay active long enough to finish onboarding calmly.</span>
            </div>
            <div className="authStatCard">
              <strong>60s</strong>
              <span>Short resend cooldown to prevent accidental spam and keep delivery clean.</span>
            </div>
          </div>
        </section>

        <section className="authCard authCardElevated">
          <div className="authCardHeader">
            <div className="authIconBadge">
              <FiCheckCircle size={24} />
            </div>
            <div>
              <p className="authKicker">Verification sent</p>
              <h2 className="authHeadline">Check your inbox</h2>
            </div>
          </div>

          <p className="authBody">
            Your activation link has been sent to the email address below. Once you confirm it, your Vintra account can continue into login or workspace setup.
          </p>

          <div className="authEmailChip">
            <FiMail size={16} />
            <span>{email}</span>
          </div>

          <div className="authCallout">
            <strong>Delivery tip</strong>
            If you do not see the email shortly, check spam, promotions, and any shared mailbox filters before requesting another one.
          </div>

          <ul className="authSteps">
            <li>
              <span className="authStepIndex">1</span>
              <div className="authStepText">
                <strong>Open the Vintra email</strong>
                <span>Look for the verification message with the Vintra branding and confirmation button.</span>
              </div>
            </li>
            <li>
              <span className="authStepIndex">2</span>
              <div className="authStepText">
                <strong>Verify your email address</strong>
                <span>Click the button inside the email to activate your account securely.</span>
              </div>
            </li>
            <li>
              <span className="authStepIndex">3</span>
              <div className="authStepText">
                <strong>Continue into your account</strong>
                <span>After verification, head to login or continue into your new workspace if your session is still active.</span>
              </div>
            </li>
          </ul>

          {resendMessage && (
            <div className={`authCallout ${resendStatus === 'success' ? 'success' : 'error'}`}>
              <strong>{resendStatus === 'success' ? 'Email sent again' : 'Resend failed'}</strong>
              <span>{resendMessage}</span>
            </div>
          )}

          <div className="authButtonStack">
            <button
              className="primaryBtn fullWidth"
              onClick={handleResendEmail}
              disabled={resendLoading || cooldown > 0}
            >
              {resendLoading ? 'Sending...' : cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend verification email'}
            </button>

            <Link href="/auth/login" className="secondaryBtn buttonLink fullWidth">
              Go to login
            </Link>
          </div>

          <div className="authSecondarySurface">
            <div className="authInlineLinks">
              <FiClock size={16} color="#64748b" />
              <span className="authBody">Still waiting? Give the mailbox a minute before sending again.</span>
            </div>
          </div>

          <div className="authInlineLinks">
            <Link href="/auth/signup" className="authTextLink">
              Start over
            </Link>
            <span className="authTinyNote">Need a different address or made a typo? Create the account again with the correct email.</span>
          </div>

          <Link href="/auth/login" className="authTextLink" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Continue to login <FiArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  )
}
