import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { adminDb } from "@/lib/firebase-admin";

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

    const userQuery = await adminDb
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const resetToken = generateToken();

      await userDoc.ref.update({
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: new Date(Date.now() + 1000 * 60 * 60),
      });

      const resend = new Resend(process.env.RESEND_API_KEY!);

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: "Nullstill passordet ditt",
        html: `
          <h2>Nullstill passord</h2>
          <a href="${resetLink}">Klikk her for å nullstille passord</a>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Request password reset error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}