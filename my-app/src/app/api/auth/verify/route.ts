import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
    }

    const querySnap = await db
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

    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    await db.collection("users").doc(userRecord.uid).set({
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