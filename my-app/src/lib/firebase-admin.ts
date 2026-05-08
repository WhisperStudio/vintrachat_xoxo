import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

function requireAdminApp() {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase environment variables");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  return admin.app();
}

export function getAdminAuth() {
  return admin.auth(requireAdminApp());
}

export function getAdminDb() {
  return admin.firestore(requireAdminApp());
}

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminAuth() as object, prop, receiver);
  },
});

export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminDb() as object, prop, receiver);
  },
});
