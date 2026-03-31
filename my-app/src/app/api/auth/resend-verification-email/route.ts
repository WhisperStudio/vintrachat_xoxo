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

    if (!email) return NextResponse.json({ success: true });

    const userQuery = await adminDb
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) return NextResponse.json({ success: true });

    const userDoc = userQuery.docs[0];
    const user = userDoc.data();

    if (user.emailVerified) {
      return NextResponse.json({
        success: false,
        message: "Email allerede verifisert",
      });
    }

    const token = generateToken();

    await userDoc.ref.update({
      emailVerificationToken: token,
      emailVerificationTokenExpiry: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    const resend = new Resend(process.env.RESEND_API_KEY!);

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "Verifiser email",
      html: `
        <h2>Verifiser email</h2>
        <a href="${link}">Klikk her for å verifisere</a>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}