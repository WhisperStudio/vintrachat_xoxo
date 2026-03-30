import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/auth/send-verification-email
 * Server-side endpoint to send verification email (avoids CORS issues)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    console.log("🔑 Checking Resend config...");
    console.log("   API Key exists?", !!apiKey);
    console.log("   API Key length:", apiKey?.length);
    console.log("   API Key starts with 're_'?", apiKey?.startsWith("re_"));
    console.log("   App URL:", appUrl);

    if (!apiKey) {
      console.error("❌ Missing NEXT_PUBLIC_RESEND_API_KEY");
      console.error("   Current env vars:", Object.keys(process.env).filter(k => k.includes("RESEND") || k.includes("API")));
      return NextResponse.json(
        { message: "Server configuration error: Missing NEXT_PUBLIC_RESEND_API_KEY. Check .env.local file." },
        { status: 500 }
      );
    }

    if (!apiKey.startsWith("re_")) {
      console.error("❌ Invalid Resend API key format. Should start with 're_'");
      console.error("   Received key starts with:", apiKey.substring(0, 5));
      return NextResponse.json(
        { message: "Server configuration error: Invalid Resend API key format" },
        { status: 500 }
      );
    }

    if (!appUrl) {
      console.error("❌ Missing NEXT_PUBLIC_APP_URL environment variable");
      return NextResponse.json(
        { message: "Server configuration error: Missing app URL" },
        { status: 500 }
      );
    }

    // Initialize Resend with validated key
    const resend = new Resend(apiKey);
    console.log("✅ Resend client initialized");

    const { email, displayName, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { message: "Email og token er påkrevd" },
        { status: 400 }
      );
    }

    const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    console.log("Sending verification email to:", email);

    const result = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || "noreply@vintrachat.com",
      to: email,
      subject: "Verifiser din email - VOTE",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hallo ${displayName || "Bruker"}! 👋</h2>
          <p>Takk for at du registrerte deg på VOTE. Klikk på knappen under for å verifisere din email:</p>
          
          <div style="margin: 30px 0;">
            <a href="${verifyLink}" style="
              display: inline-block;
              padding: 12px 30px;
              background: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: bold;
            ">
              Verifiser Email
            </a>
          </div>

          <p style="color: #666;">
            Eller kopier denne lenken:
            <br/>
            <small style="word-break: break-all;">${verifyLink}</small>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

          <p style="color: #999; font-size: 12px;">
            Denne lenken utløper om 24 timer.
            <br/>
            Hvis du ikke registrerte deg, ignorer denne mailen.
          </p>
        </div>
      `,
    });

    console.log("Resend API response:", result);

    // Resend SDK returns { data, error, headers } structure
    const resendResult = result as any;
    if (!resendResult.data || !resendResult.data.id) {
      const errorMsg = resendResult.error 
        ? (typeof resendResult.error === 'object' ? JSON.stringify(resendResult.error) : String(resendResult.error))
        : "No email ID returned";
      console.error("Resend error:", errorMsg);
      return NextResponse.json(
        { message: `Failed to send email: ${errorMsg}` },
        { status: 500 }
      );
    }

    const emailId = resendResult.data.id;
    console.log("Email sent successfully:", emailId);

    return NextResponse.json(
      { success: true, message: "Verifikasjonsmail sendt!", id: emailId },
      { status: 200 }
    );
  } catch (error: any) {
    const errorMsg = error?.message || JSON.stringify(error);
    console.error("Send verification email error:", errorMsg);
    return NextResponse.json(
      { message: `Server error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
