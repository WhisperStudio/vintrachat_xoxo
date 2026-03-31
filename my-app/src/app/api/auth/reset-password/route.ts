import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = require("../../../../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { uid, newPassword, token } = await req.json();

    if (!uid || !newPassword || !token) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Passord må være minst 6 tegn" },
        { status: 400 }
      );
    }

    // Verify token exists and hasn't expired
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Bruker ikke funnet" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    if (!userData?.passwordResetToken || userData.passwordResetToken !== token) {
      return NextResponse.json(
        { success: false, message: "Ugyldig reset token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    const tokenExpiry = userData.passwordResetTokenExpiry?.toDate?.() || new Date(0);
    if (new Date() > tokenExpiry) {
      return NextResponse.json(
        { success: false, message: "Reset token har utløpt" },
        { status: 400 }
      );
    }

    // Update password using Firebase Admin SDK
    const auth = admin.auth();
    await auth.updateUser(uid, {
      password: newPassword,
    });

    // Clear the reset token from Firestore
    await userDoc.ref.update({
      passwordResetToken: "",
      passwordResetTokenExpiry: null,
    });

    return NextResponse.json({
      success: true,
      message: "Passord endret. Du kan nå logge inn med ditt nye passord.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Passordopp resetting feilet" },
      { status: 500 }
    );
  }
}
