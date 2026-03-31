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
    const { email, displayName } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email required" },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const userQuery = await db.collection("users").where("email", "==", email).get();

    if (userQuery.empty) {
      // User not found - still return success for security
      return NextResponse.json({ success: true });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // If already verified, no need to resend
    if (userData.emailVerified) {
      return NextResponse.json({
        success: false,
        message: "Email er allerede verifisert",
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const verificationTokenExpiry = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    );

    // Update user with new token
    await userDoc.ref.update({
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: verificationTokenExpiry,
    });

    // Send verification email
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "Verifiser email adressen din",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hei ${userData.displayName || "Bruker"}!</h2>
          
          <p>Takk for at du registrerte deg. For å fullføre registreringen, verifiser email adressen din ved å klikke lenken nedenfor:</p>
          
          <p>
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verifiser email
            </a>
          </p>
          
          <p>Eller kopier denne lenken i nettleseren din:</p>
          <p style="word-break: break-all; color: #666;">
            ${verificationLink}
          </p>
          
          <p style="color: #999; font-size: 12px;">
            Lenken utløper om 24 timer.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            Hvis du ikke opprettet denne kontoen, kan du ignorere denne emailen.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Resend verification email error:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
