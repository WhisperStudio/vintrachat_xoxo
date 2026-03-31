import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { email, displayName, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY!);

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "Verifiser email adressen din",
      html: `
        <div>
          <h2>Hei ${displayName || ""}</h2>
          <p>Klikk under for å verifisere:</p>
          <a href="${link}">Verifiser email</a>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Send verification email error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}