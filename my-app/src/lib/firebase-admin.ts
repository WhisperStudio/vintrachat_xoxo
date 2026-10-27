import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

function requireAdminApp() {
  if (!admin.apps.length) {
    // Local development can use the developer's explicit ADC file. Hosted
    // environments still require the existing service-account configuration.
    const localCredentials = process.env.NODE_ENV === 'development'
      && !process.env.VERCEL
      && process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!projectId || (!(clientEmail && privateKey) && !localCredentials)) {
      throw Object.assign(new Error('Server authentication is not configured. Please contact support.'), {
        code: 'server/misconfigured',
      });
    }
    admin.initializeApp({
      projectId,
      credential: clientEmail && privateKey ? admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }) : admin.credential.applicationDefault(),
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
