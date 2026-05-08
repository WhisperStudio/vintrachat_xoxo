import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
    }

    const querySnap = await adminDb
      .collection("pendingUsers")
      .where("token", "==", token)
      .get();

    if (querySnap.empty) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/invalid`);
    }

    const docRef = querySnap.docs[0];
    const data = docRef.data();

    if (action === "reject") {
      await docRef.ref.delete();
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/rejected`);
    }

    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    await adminDb.collection("users").doc(userRecord.uid).set({
      ...data,
      id: userRecord.uid,
      emailVerified: true,
      createdAt: new Date(),
    });

    await docRef.ref.delete();

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/success`);
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
  }
}
