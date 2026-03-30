import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = require("../../../../serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin SDK initialization failed:", error);
  }
}

/**
 * POST /api/auth/reset-password
 * 
 * Securely updates user password after verifying reset token using Firebase Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!admin.apps.length) {
      console.error("Firebase Admin SDK not initialized");
      return NextResponse.json(
        { message: "Server configuration error. Contact support." },
        { status: 500 }
      );
    }

    const { token, newPassword, email } = await request.json();

    if (!token || !newPassword || !email) {
      return NextResponse.json(
        { message: "Token, email, og passord er påkrevd" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Passordet må være minst 6 tegn" },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // Find user with this token
    const usersRef = db.collection("users");
    const query = await usersRef.where("passwordResetToken", "==", token).get();

    if (query.empty) {
      return NextResponse.json(
        { message: "Ugyldig reset token" },
        { status: 400 }
      );
    }

    const userDoc = query.docs[0];
    const userData = userDoc.data();

    // Verify email matches
    if (userData.email !== email) {
      return NextResponse.json(
        { message: "Email stemmer ikke" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (!userData.passwordResetTokenExpiry || userData.passwordResetTokenExpiry.toDate() < new Date()) {
      return NextResponse.json(
        { message: "Reset token er utløpt" },
        { status: 400 }
      );
    }

    // Update Firebase Auth password using Admin SDK
    try {
      await admin.auth().updateUser(userData.id, {
        password: newPassword,
      });
    } catch (authError: any) {
      console.error("Firebase Auth update error:", authError);
      return NextResponse.json(
        { message: "Kunne ikke oppdatere passord i Firebase Auth" },
        { status: 500 }
      );
    }

    // Clear reset token from Firestore
    await userDoc.ref.update({
      passwordResetToken: admin.firestore.FieldValue.delete(),
      passwordResetTokenExpiry: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Passord er blitt nullstilt! Logg inn med ditt nye passord.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { message: "Serverfeil: " + error.message },
      { status: 500 }
    );
  }
}
