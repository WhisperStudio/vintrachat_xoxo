import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { buildVerificationEmail } from '@/lib/auth-email'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { hashOpaqueToken } from '@/lib/pending-auth.server'
import { consumeServerRateLimit } from '@/lib/server-rate-limit'
import { normalizeEmail } from '@/lib/vintra-admin'

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || ''
    const idToken = authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice(7).trim()
      : ''

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: 'Missing authorization token' },
        { status: 401 }
      )
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const { displayName, accountType, businessName } = await req.json()
    const email = normalizeEmail(decoded.email || '')

    if (!decoded.uid || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing fields' },
        { status: 400 }
      )
    }

    const emailRateLimit = await consumeServerRateLimit({
      scope: 'verification-email:email',
      key: email,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })
    const userRateLimit = await consumeServerRateLimit({
      scope: 'verification-email:user',
      key: decoded.uid,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    })

    if (!emailRateLimit.allowed || !userRateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait before requesting another verification email.' },
        { status: 429 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY!)
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashOpaqueToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await adminDb.collection('pending_auth').doc(decoded.uid).set(
      {
        email,
        normalizedEmail: email,
        displayName: typeof displayName === 'string' ? displayName.trim() : '',
        tokenHash,
        token: null,
        accountType: accountType === 'business' ? 'business' : 'user',
        ...(accountType === 'business' && typeof businessName === 'string' && businessName.trim()
          ? { businessName: businessName.trim() }
          : {}),
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    )

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`
    const message = buildVerificationEmail({
      verificationLink: link,
      recipientName: displayName,
    })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: message.subject,
      html: message.html,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Send verification email error:', err)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
