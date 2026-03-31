import {
  auth,
  db,
} from "@/lib/firebase";

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
} from "firebase/firestore";

import { User, Business, AuthResponse, UserRole } from "@/types/database";

// ----------------------
// Google Auth
// ----------------------
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        lastLogin: serverTimestamp(),
      });

      const user = userSnap.data() as User;

      return {
        success: true,
        message: "Innlogging vellykket",
        user,
        redirectTo: `/dashboard/${user.businessId}`,
      };
    }

    return {
      success: false,
      message: "Bruker finnes ikke",
      redirectTo: `/auth/signup?email=${firebaseUser.email}&uid=${firebaseUser.uid}`,
    };
  } catch (error) {
    console.error("Google login error:", error);
    return {
      success: false,
      message: "Innlogging feilet",
    };
  }
}

// ----------------------
// Get user / business
// ----------------------
export async function getCurrentUser(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
    return snap.exists() ? (snap.data() as User) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getBusinessInfo(businessId: string): Promise<Business | null> {
  try {
    const snap = await getDoc(doc(db, "business", businessId));
    return snap.exists() ? (snap.data() as Business) : null;
  } catch (err) {
    console.error(err);
    return null;
  }
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
// Logout
// ----------------------
export async function signOut() {
  await firebaseSignOut(auth);
}

// ----------------------
// Business helpers
// ----------------------
export async function getBusinessUsers(businessId: string): Promise<User[]> {
  const q = query(collection(db, "users"), where("businessId", "==", businessId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as User);
}

export async function updateUserRole(userId: string, role: UserRole) {
  await updateDoc(doc(db, "users", userId), {
    role,
    updatedAt: serverTimestamp(),
  });
}

// ----------------------
// Utilities
// ----------------------
export function generateChatWidgetKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 24 })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
}

// ----------------------
// Helper: Generate random token
// ----------------------
function generateToken(length: number = 30): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

// ----------------------
// Email/Password Auth: Sign Up
// ----------------------
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  isBusinessAdmin: boolean,
  businessName?: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Validate inputs
    if (!email.trim()) {
      return { success: false, message: 'Email er påkrevd' }
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'Passord må være minst 6 tegn' }
    }
    if (!displayName.trim()) {
      return { success: false, message: 'Navn er påkrevd' }
    }
    if (isBusinessAdmin && !businessName?.trim()) {
      return { success: false, message: 'Bedriftsnavn er påkrevd' }
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Generate verification token
    const verificationToken = generateToken()
    const verificationTokenExpiry = new Date()
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24)

    // Create business first if admin
    let businessId = ''
    if (isBusinessAdmin && businessName) {
      const businessRef = doc(collection(db, 'business'))
      businessId = businessRef.id
      
      await setDoc(businessRef, {
        businessName: businessName.trim(),
        adminId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      })
    }

    // Create Firestore user document
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userData: User = {
      id: firebaseUser.uid,
      email: email.trim(),
      displayName: displayName.trim(),
      role: isBusinessAdmin ? 'admin' : 'user',
      businessId: businessId || '',
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiry: verificationTokenExpiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(userRef, userData)

    // Send verification email via API
    await fetch('/api/auth/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token: verificationToken, displayName }),
    })

    return {
      success: true,
      message: 'Bruker opprettet. Verifiser email for å logge inn.',
      userId: firebaseUser.uid,
    }
  } catch (error: any) {
    console.error('Sign up error:', error)
    
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: 'Email er allerede i bruk' }
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, message: 'Passord er for svakt' }
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Ugyldig email adresse' }
    }

    return { success: false, message: 'Registrering feilet. Prøv igjen.' }
  }
}

// ----------------------
// Email/Password Auth: Sign In
// ----------------------
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  try {
    if (!email.trim()) {
      return { success: false, message: 'Email er påkrevd' }
    }
    if (!password.trim()) {
      return { success: false, message: 'Passord er påkrevd' }
    }

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user from Firestore
    const userRef = doc(db, 'users', firebaseUser.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return { success: false, message: 'Bruker ikke funnet i databasen' }
    }

    const user = userSnap.data() as User

    // Check if email is verified
    if (!user.emailVerified) {
      return { success: false, message: 'Email er ikke verifisert. Sjekk innboksen din.' }
    }

    // Update last login
    await updateDoc(userRef, {
      lastLogin: serverTimestamp(),
    })

    return {
      success: true,
      message: 'Innlogging vellykket',
      user,
    }
  } catch (error: any) {
    console.error('Sign in error:', error)

    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'Brukeren finnes ikke' }
    }
    if (error.code === 'auth/wrong-password') {
      return { success: false, message: 'Feil passord' }
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Ugyldig email' }
    }

    return { success: false, message: 'Innlogging feilet. Prøv igjen.' }
  }
}

// ----------------------
// Email/Password Auth: Verify Email
// ----------------------
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!token.trim()) {
      return { success: false, message: 'Ugyldig verifikasjonslenke' }
    }

    // Find user with this verification token
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('emailVerificationToken', '==', token))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { success: false, message: 'Ugyldig eller utløpt verifikasjonslenke' }
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data() as User

    // Check if token has expired
    if (!user.emailVerificationTokenExpiry) {
      return { success: false, message: 'Ugyldig eller utløpt verifikasjonslenke' }
    }

    const expiryTime = new Date(user.emailVerificationTokenExpiry).getTime()
    const now = new Date().getTime()

    if (now > expiryTime) {
      return { success: false, message: 'Verifikasjonslenken har utløpt' }
    }

    // Mark email as verified
    await updateDoc(doc(db, 'users', userDoc.id), {
      emailVerified: true,
      emailVerificationToken: '',
      emailVerificationTokenExpiry: null,
      updatedAt: serverTimestamp(),
    })

    return { success: true, message: 'Email verifisert! Du kan nå logge inn.' }
  } catch (error: any) {
    console.error('Email verification error:', error)
    return { success: false, message: 'Verifikasjon feilet. Prøv igjen.' }
  }
}

// ----------------------
// Email/Password Auth: Request Password Reset
// ----------------------
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!email.trim()) {
      return { success: false, message: 'Email er påkrevd' }
    }

    // Call API endpoint to generate token and send email
    const response = await fetch('/api/auth/request-password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error('Failed to request password reset')
    }

    // Always return success for security (prevent email enumeration)
    return { success: true, message: 'Sjekk email for lenke til å nullstille passord' }
  } catch (error: any) {
    console.error('Request password reset error:', error)
    // Still return success for security
    return { success: true, message: 'Sjekk email for lenke til å nullstille passord' }
  }
}

// ----------------------
// Email/Password Auth: Reset Password
// ----------------------
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!token.trim()) {
      return { success: false, message: 'Ugyldig reset lenke' }
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Passord må være minst 6 tegn' }
    }

    // Find user with this reset token
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('passwordResetToken', '==', token))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return { success: false, message: 'Ugyldig eller utløpt reset lenke' }
    }

    const userDoc = snapshot.docs[0]
    const user = userDoc.data() as User

    // Check if token has expired
    if (!user.passwordResetTokenExpiry) {
      return { success: false, message: 'Ugyldig eller utløpt reset lenke' }
    }

    const expiryTime = new Date(user.passwordResetTokenExpiry).getTime()
    const now = new Date().getTime()

    if (now > expiryTime) {
      return { success: false, message: 'Reset lenken har utløpt' }
    }

    // Call API to reset password (uses Firebase Admin SDK)
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: userDoc.id,
        newPassword,
        token,
      }),
    })

    if (!response.ok) {
      return { success: false, message: 'Passordopp resetting feilet' }
    }

    const result = await response.json()

    if (!result.success) {
      return { success: false, message: result.message || 'Passordopp resetting feilet' }
    }

    // Clear reset token from Firestore
    await updateDoc(doc(db, 'users', userDoc.id), {
      passwordResetToken: '',
      passwordResetTokenExpiry: null,
      updatedAt: serverTimestamp(),
    })

    return { success: true, message: 'Passord endret. Du kan nå logge inn med ditt nye passord.' }
  } catch (error: any) {
    console.error('Reset password error:', error)
    return { success: false, message: 'Passordopp resetting feilet. Prøv igjen.' }
  }
}
