import { NextRequest, NextResponse } from "next/server";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getApps } from "firebase-admin/app";

// Initialize Firebase Admin with existing config
if (!getApps().length) {
  const firebaseConfig = {
    apiKey: "AIzaSyACOy6kYZk53gDkbTO9oqxDIAw7DU8mBi8",
    authDomain: "vintrasolutions-f58a7.firebaseapp.com",
    projectId: "vintrasolutions-f58a7",
    storageBucket: "vintrasolutions-f58a7.firebasestorage.app",
    messagingSenderId: "474220063641",
    appId: "1:474220063641:web:c3a00a9b2912254b360108",
    measurementId: "G-130FHQ5Y4E"
  };

  initializeApp(firebaseConfig);
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

    const query = await db.collection("pendingUsers")
      .where("token", "==", token)
      .get();

    if (query.empty) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/invalid`);
    }

    const docRef = query.docs[0];
    const data = docRef.data();

    if (action === "reject") {
      await docRef.ref.delete();
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/rejected`);
    }

    // APPROVE
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

  } catch (err) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
  }
}
