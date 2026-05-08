import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const resetQuery = await adminDb
      .collection("pending_password_resets")
      .where("token", "==", String(token))
      .limit(1)
      .get();

    if (resetQuery.empty) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 404 }
      );
    }

    const resetDoc = resetQuery.docs[0];
    const resetData = resetDoc.data();
    const expiry = toDate(resetData.expiresAt);

    if (!expiry || new Date() > expiry) {
      await resetDoc.ref.delete();
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const uid =
      typeof resetData.uid === "string" && resetData.uid
        ? resetData.uid
        : (await adminAuth.getUserByEmail(String(resetData.email))).uid;

    await adminAuth.updateUser(uid, {
      password: String(newPassword),
    });

    await resetDoc.ref.delete();

    return NextResponse.json({
      success: true,
      message: "Password updated.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
