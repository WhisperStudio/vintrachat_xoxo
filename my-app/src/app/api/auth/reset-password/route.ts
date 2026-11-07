import { validRecord } from '@/lib/auth-records.server'
import crypto from 'node:crypto'
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

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
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
      .where("tokenHash", "==", hashToken(String(token)))
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
    if (!validRecord('reset', resetDoc.id, resetData)) {
      return NextResponse.json({ success: false, message: 'Request a new password reset link.' }, { status: 400 });
    }
    const expiry = toDate(resetData.expiresAt);

    if (!expiry || new Date() > expiry) {
      await resetDoc.ref.delete();
      return NextResponse.json(
        { success: false, message: "Invalid or expired reset link." },
        { status: 400 }
      );
    }

    const uid = resetDoc.id;

    const account = await adminAuth.getUser(uid);
    if (account.disabled || account.email?.trim().toLowerCase() !== String(resetData.email || '').trim().toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset link.' }, { status: 400 });
    }

    // Consume before changing Auth, so parallel requests cannot reuse the link.
    // A failed Auth update requires requesting a fresh link.
    const consumed = await adminDb.runTransaction(async transaction => {
      const current = await transaction.get(resetDoc.ref);
      const record = current.data();
      if (!record || record.tokenHash !== hashToken(String(token)) || !validRecord('reset', uid, record)) return false;
      const expiresAt = toDate(record.expiresAt);
      if (!expiresAt || expiresAt.getTime() <= Date.now()) return false;
      transaction.delete(resetDoc.ref);
      return true;
    });
    if (!consumed) {
      return NextResponse.json({ success: false, message: 'Invalid or expired reset link.' }, { status: 400 });
    }

    await adminAuth.updateUser(uid, {
      password: String(newPassword),
    });

    await adminAuth.revokeRefreshTokens(uid);

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
