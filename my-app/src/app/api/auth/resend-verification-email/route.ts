import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";
import { buildVerificationEmail } from "@/lib/auth-email";

function generateToken(length: number = 30): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: true });
    }

    const pendingQuery = await adminDb
      .collection("pending_auth")
      .where("email", "==", String(email).trim())
      .limit(1)
      .get();

    if (pendingQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "No pending verification was found for this email.",
        },
        { status: 404 }
      );
    }

    const pendingDoc = pendingQuery.docs[0];
    const pendingUser = pendingDoc.data();
    const token = generateToken();

    await pendingDoc.ref.update({ token });

    const resend = new Resend(process.env.RESEND_API_KEY!);
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
    const message = buildVerificationEmail({
      verificationLink: link,
      recipientName: pendingUser.displayName,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: String(email).trim(),
      subject: message.subject,
      html: message.html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { success: false, message: "Could not resend verification email." },
      { status: 500 }
    );
  }
}
