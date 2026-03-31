import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, token, newPassword } = await req.json();

    if (!uid || !token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const user = userDoc.data();

    // 🔥 FIX: check user exists
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User data missing" },
        { status: 500 }
      );
    }

    if (user.passwordResetToken !== token) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 400 }
      );
    }

    // 🔥 FIX: safe handling of expiry
    if (!user.passwordResetTokenExpiry) {
      return NextResponse.json(
        { success: false, message: "Token missing expiry" },
        { status: 400 }
      );
    }

    const expiry = new Date(user.passwordResetTokenExpiry);

    if (new Date() > expiry) {
      return NextResponse.json(
        { success: false, message: "Token expired" },
        { status: 400 }
      );
    }

    await adminAuth.updateUser(uid, {
      password: newPassword,
    });

    await userDoc.ref.update({
      passwordResetToken: "",
      passwordResetTokenExpiry: null,
    });

    return NextResponse.json({
      success: true,
      message: "Password updated",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}