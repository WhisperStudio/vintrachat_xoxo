import { auth, db } from "@/lib/firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import { AuthResponse, UserRole } from "@/types/database";

// ----------------------
// Google Auth
// ----------------------
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    // Sjekk om user er pending
    const pendingRef = doc(db, "pending_users", firebaseUser.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: false,
        message: "Du må akseptere invitasjon først",
      };
    }

    return {
      success: true,
      message: "Innlogging OK",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Innlogging feilet" };
  }
}

// ----------------------
// Get business users
// ----------------------
export async function getBusinessUsers(businessId: string) {
  const ref = collection(db, `businesses/${businessId}/users`);
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data());
}

// ----------------------
// Update role
// ----------------------
export async function updateUserRole(
  businessId: string,
  userId: string,
  role: UserRole
) {
  await updateDoc(doc(db, `businesses/${businessId}/users/${userId}`), {
    role,
    updatedAt: serverTimestamp(),
  });
}

// ----------------------
// Logout
// ----------------------
export async function signOut() {
  await firebaseSignOut(auth);
}

// ----------------------
// Auth listener
// ----------------------
export function setupAuthListener(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

// ----------------------
// Utils
// ----------------------
function generateToken(length: number = 30) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

export function generateChatWidgetKey() {
  return generateToken(24);
}

// ----------------------
// SIGN UP (INGEN DB SAVE)
// ----------------------
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const token = generateToken();

    // ❗ IKKE lagre user i Firestore enda

    await fetch("/api/auth/send-verification-email", {
      method: "POST",
      body: JSON.stringify({
        email,
        token,
        displayName,
      }),
    });

    // Lagre midlertidig verification token i pending_auth
    await setDoc(doc(db, "pending_auth", cred.user.uid), {
      email,
      displayName,
      token,
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Sjekk email for verifisering",
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ----------------------
// VERIFY EMAIL
// ----------------------
export async function verifyEmail(token: string) {
  const q = query(
    collection(db, "pending_auth"),
    where("token", "==", token)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return { success: false, message: "Ugyldig token" };
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data();

  // legg til i pending_users
  await setDoc(doc(db, "pending_users", docSnap.id), {
    email: data.email,
    displayName: data.displayName,
    createdAt: serverTimestamp(),
  });

  await deleteDoc(docSnap.ref);

  return { success: true, message: "Email verifisert" };
}

// ----------------------
// CREATE BUSINESS (ADMIN)
// ----------------------
export async function createBusiness(
  userId: string,
  businessName: string,
  email: string
) {
  const businessRef = doc(collection(db, "businesses"));

  const businessId = businessRef.id;

  // business root
  await setDoc(businessRef, {
    name: businessName,
    email,
    ownerId: userId,
    chatWidgetKey: generateChatWidgetKey(),
    createdAt: serverTimestamp(),
  });

  // legg user som admin
  await setDoc(
    doc(db, `businesses/${businessId}/users/${userId}`),
    {
      email,
      role: "admin",
      status: "active",
      createdAt: serverTimestamp(),
    }
  );

  return businessId;
}

// ----------------------
// ACCEPT INVITE
// ----------------------
export async function acceptInvite(
  userId: string,
  businessId: string,
  role: UserRole
) {
  const pendingRef = doc(db, "pending_users", userId);
  const snap = await getDoc(pendingRef);

  if (!snap.exists()) return;

  const data = snap.data();

  await setDoc(
    doc(db, `businesses/${businessId}/users/${userId}`),
    {
      ...data,
      role,
      status: "active",
      createdAt: serverTimestamp(),
    }
  );

  await deleteDoc(pendingRef);
}

// ----------------------
// SIGN IN
// ----------------------
export async function signInWithEmail(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const pendingRef = doc(db, "pending_users", cred.user.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: false,
        message: "Du må akseptere invitasjon først",
      };
    }

    return {
      success: true,
      message: "Innlogging OK",
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}