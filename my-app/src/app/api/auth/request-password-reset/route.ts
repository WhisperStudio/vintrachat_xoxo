import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { buildPasswordResetEmail } from "@/lib/auth-email";

function generateToken(length: number = 30): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ success: true });
    }

    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (error: any) {
      if (error?.code === "auth/user-not-found") {
        return NextResponse.json({ success: true });
      }
      throw error;
    }

    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await adminDb.collection("pending_password_resets").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: normalizedEmail,
      displayName: userRecord.displayName || "",
      token: resetToken,
      createdAt: new Date(),
      expiresAt,
    });

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    const message = buildPasswordResetEmail({
      resetLink,
      recipientName: userRecord.displayName || undefined,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: normalizedEmail,
      subject: message.subject,
      html: message.html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Request password reset error:", err);
    return NextResponse.json(
      { success: false, message: "Could not start password reset." },
      { status: 500 }
    );
  }
}
