import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

function getAdminApp() {
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

const app = getAdminApp();

export const adminAuth = admin.auth(app);
export const adminDb = admin.firestore(app);