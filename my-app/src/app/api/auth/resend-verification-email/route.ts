import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { buildVerificationEmail } from '@/lib/auth-email'
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
        { success: false, message: 'Missing authorization token.' },
        { status: 401 }
      )
    }

    const decoded = await adminAuth.verifyIdToken(idToken)
    const normalizedEmail = normalizeEmail(decoded.email || '')

    if (!decoded.uid || !normalizedEmail) {
      return NextResponse.json(
        { success: false, message: 'No pending verification was found for this account.' },
        { status: 404 }
      )
    }

    const rateLimit = await consumeServerRateLimit({
      scope: 'verification-email:resend',
      key: `${decoded.uid}:${normalizedEmail}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Please wait before requesting another verification email.' },
        { status: 429 }
      )
    }

    const pendingDoc = await adminDb.collection('pending_auth').doc(decoded.uid).get()

    if (!pendingDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'No pending verification was found for this account.',
        },
        { status: 404 }
      )
    }

    const pendingUser = pendingDoc.data() || {}
    if (normalizeEmail(String(pendingUser.email || '')) !== normalizedEmail) {
      return NextResponse.json(
        { success: false, message: 'Verification account mismatch.' },
        { status: 403 }
      )
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashOpaqueToken(token)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await pendingDoc.ref.set({
      tokenHash,
      token: null,
      email: normalizedEmail,
      normalizedEmail,
      expiresAt,
      updatedAt: new Date(),
    });

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    const message = buildVerificationEmail({
      verificationLink: link,
      recipientName: pendingUser.displayName,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: normalizedEmail,
      subject: message.subject,
      html: message.html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Could not resend verification email.",
      },
      { status: 500 }
    );
  }
}
