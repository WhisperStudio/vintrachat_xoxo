import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = require("../../../../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
    }

    const db = admin.firestore();

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
    const userRecord = await admin.auth().createUser({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    await db.collection("users").doc(userRecord.uid).set({
      ...data,
      id: userRecord.uid,
      emailVerified: true,
      createdAt: admin.firestore.Timestamp.now(),
    });

    await docRef.ref.delete();

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/success`);

  } catch (err) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/error`);
  }
}
