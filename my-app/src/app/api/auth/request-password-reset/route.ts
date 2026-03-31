import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = require("../../../../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Helper: Generate random token
function generateToken(length: number = 30): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function POST(req: NextRequest) {
  try {
    const { email, token } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email required" }, { status: 400 });
    }

    const db = admin.firestore();
    const userQuery = await db.collection("users").where("email", "==", email).get();

    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      const resetToken = token || generateToken();

      await userDoc.ref.update({
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 1000 * 60 * 60) // 1 hour
        ),
      });

      const resend = new Resend(process.env.RESEND_API_KEY!);

      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: "Nullstill passordet ditt",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Nullstill passord</h2>
            
            <p>Vi mottok en forespørsel om å nullstille passordet ditt. Klikk lenken nedenfor for å sette et nytt passord:</p>
            
            <p>
              <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Nullstill passord
              </a>
            </p>
            
            <p>Eller kopier denne lenken i nettleseren din:</p>
            <p style="word-break: break-all; color: #666;">
              ${resetLink}
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Lenken utløper om 1 time.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              Hvis du ikke ba om å nullstille passordet, kan du ignorere denne emailen. Passordet ditt er fortsatt trygt.
            </p>
          </div>
        `,
      });
    }

    // Always return success for security (prevent email enumeration)
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Request password reset error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
