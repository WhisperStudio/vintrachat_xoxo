import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { buildVerificationEmail } from "@/lib/auth-email";
import { normalizeEmail } from "@/lib/vintra-admin";

function generateToken(length: number = 30): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function findPendingAuthByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  const normalizedQuery = await adminDb
    .collection("pending_auth")
    .where("normalizedEmail", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!normalizedQuery.empty) {
    return normalizedQuery.docs[0];
  }

  const exactQuery = await adminDb
    .collection("pending_auth")
    .where("email", "==", String(email).trim())
    .limit(1)
    .get();

  if (!exactQuery.empty) {
    return exactQuery.docs[0];
  }

  const fallbackScan = await adminDb.collection("pending_auth").limit(100).get();
  return (
    fallbackScan.docs.find((docSnap) => {
      const data = docSnap.data();
      return normalizeEmail(String(data.normalizedEmail || data.email || "")) === normalizedEmail;
    }) || null
  );
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return NextResponse.json({ success: true });
    }

    const pendingDoc = await findPendingAuthByEmail(normalizedEmail);

    if (!pendingDoc) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending verification was found for this email.",
        },
        { status: 404 }
      );
    }

    const pendingUser = pendingDoc.data();
    const token = generateToken();

    await pendingDoc.ref.update({
      token,
      email: normalizeEmail(String(pendingUser.email || normalizedEmail)),
      normalizedEmail,
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
