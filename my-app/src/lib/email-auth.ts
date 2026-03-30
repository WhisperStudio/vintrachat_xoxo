import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User as DBUser, Business, UserRole } from "@/types/database";
import { Resend } from "resend";

// Initialize Resend (API key should be in .env.local)
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

// Enable persistent login
setPersistence(auth, browserLocalPersistence).catch(console.error);

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  isBusinessAdmin: boolean,
  businessName?: string
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Generate email verification token
    const verificationToken = generateToken();

    // Create database user
    const userData: DBUser = {
      id: firebaseUser.uid,
      email,
      businessId: "", // Will be set if business admin
      role: "user",
      displayName,
      photoURL: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
      emailVerified: true, // AUTO-VERIFIED FOR DEVELOPMENT - Remove this for production
      // emailVerificationToken: verificationToken,
      // emailVerificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    // If business admin, create business first
    if (isBusinessAdmin && businessName) {
      const businessData: Business = {
        id: "", // Will be set by Firestore
        businessName,
        adminEmail: email,
        users: [firebaseUser.uid],
        createdAt: new Date(),
        updatedAt: new Date(),
        chatWidgetKey: generateChatWidgetKey(),
        chatWidgetConfig: {
          designLevel: "standard",
          colorTheme: "modern",
          position: "bottom-right",
        },
      };

      const businessRef = doc(collection(db, "business"));
      businessData.id = businessRef.id;

      await setDoc(businessRef, {
        ...businessData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      userData.businessId = businessRef.id;
      userData.role = "admin";
    }

    // Save user to database
    await setDoc(doc(db, "users", firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Send verification email
    // await sendVerificationEmail(email, verificationToken, displayName); // DISABLED FOR DEVELOPMENT

    return {
      success: true,
      message: "Bruker opprettet! Du er nå logget inn.",
      userId: firebaseUser.uid,
    };
  } catch (error: any) {
    console.error("Signup error:", error);
    let message = "Registrering feilet";

    if (error.code === "auth/email-already-in-use") {
      message = "Email er allerede i bruk";
    } else if (error.code === "auth/weak-password") {
      message = "Passordet er for svakt (minst 6 tegn)";
    } else if (error.code === "auth/invalid-email") {
      message = "Ugyldig email adresse";
    }

    return { success: false, message };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: DBUser }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user from database
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

    if (!userDoc.exists()) {
      return {
        success: false,
        message: "Brukerdata finnes ikke",
      };
    }

    const userData = userDoc.data() as DBUser;

    // Check if email is verified (DISABLED FOR DEVELOPMENT - Remove for production)
    // if (!userData.emailVerified) {
    //   await firebaseSignOut(auth);
    //   return {
    //     success: false,
    //     message: "Email er ikke verifisert. Sjekk din innboks for verifikasjonslenke.",
    //   };
    // }

    // Update last login
    await updateDoc(doc(db, "users", firebaseUser.uid), {
      lastLogin: serverTimestamp(),
    });

    return {
      success: true,
      message: "Innlogging vellykket",
      user: userData,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    let message = "Innlogging feilet";

    if (error.code === "auth/user-not-found") {
      message = "Bruker ikke funnet";
    } else if (error.code === "auth/wrong-password") {
      message = "Feil passord";
    } else if (error.code === "auth/invalid-email") {
      message = "Ugyldig email";
    }

    return { success: false, message };
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user with this token
    const q = query(
      collection(db, "users"),
      where("emailVerificationToken", "==", token)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Ugyldig verifikasjonstoken" };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as DBUser;

    // Check if token is expired
    if (!userData.emailVerificationTokenExpiry || userData.emailVerificationTokenExpiry < new Date()) {
      return { success: false, message: "Verifikasjonstoken er utløpt" };
    }

    // Update user
    await updateDoc(userDoc.ref, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: "Email verifisert! Du kan nå logge inn." };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, message: "Verifikasjon feilet" };
  }
}

/**
 * Send password reset email
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user exists
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Don't reveal if email exists or not (security)
      return {
        success: true,
        message: "Hvis email finnes, vil du motta instruksjoner for å nullstille passord.",
      };
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as DBUser;

    // Save reset token
    await updateDoc(userDoc.ref, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry,
    });

    // Send reset email
    await sendPasswordResetEmail(email, resetToken, userData.displayName || "Bruker");

    return {
      success: true,
      message: "Hvis email finnes, vil du motta instruksjoner for å nullstille passord.",
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      success: false,
      message: "Kunne ikke prosessere forespørsel",
    };
  }
}

/**
 * Reset password with token
 * Makes API call to backend for secure password update
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find user with this token
    const q = query(
      collection(db, "users"),
      where("passwordResetToken", "==", token)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Ugyldig reset token" };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as DBUser;

    // Check if token is expired
    if (!userData.passwordResetTokenExpiry || userData.passwordResetTokenExpiry < new Date()) {
      return { success: false, message: "Reset token er utløpt" };
    }

    // Call backend API to update password securely
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        newPassword,
        email: userData.email,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.message || "Kunne ikke nullstille passord" };
    }

    return { success: true, message: "Passord er blitt nullstilt! Logg inn med ditt nye passord." };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return {
      success: false,
      message: "Kunne ikke nullstille passord",
    };
  }
}

/**
 * Send verification email (via API endpoint to avoid CORS)
 */
async function sendVerificationEmail(email: string, token: string, displayName: string): Promise<void> {
  try {
    console.log("🚀 Sending verification email to:", email);
    console.log("📧 Token:", token.substring(0, 10) + "...");

    const response = await fetch("/api/auth/send-verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, displayName }),
    });

    console.log("📨 API response status:", response.status);
    console.log("📨 API response headers:", response.headers);

    if (!response.ok) {
      let errorData: any = null;
      let errorText = "";
      
      try {
        errorText = await response.text();
        console.log("📨 API response text:", errorText);
        
        if (errorText) {
          errorData = JSON.parse(errorText);
        } else {
          errorData = { message: `HTTP ${response.status}: No response body` };
        }
      } catch (parseError) {
        console.error("❌ Could not parse error response:", parseError);
        errorData = { 
          message: `HTTP ${response.status}`,
          rawText: errorText || "(empty)"
        };
      }

      console.error("❌ Failed to send verification email:", errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: Kunne ikke sende email`);
    }

    const data = await response.json();
    console.log("✅ Verification email sent successfully:", data.id || data);
  } catch (error: any) {
    console.error("❌ Send verification email error:", error.message || error);
    throw error; // Re-throw so caller knows about it
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email: string, token: string, displayName: string): Promise<void> {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || "noreply@vintrachat.com",
      to: email,
      subject: "Nullstill passord - VOTE",
      html: `
        <h2>Hei ${displayName}!</h2>
        <p>Du har bedt om å nullstille passordet ditt. Klikk på lenken under:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          Nullstill Passord
        </a>
        <p style="margin-top: 20px; color: #666;">
          Eller kopier denne lenken: ${resetLink}
        </p>
        <p style="color: #999; font-size: 12px;">
          Denne lenken utløper om 1 time. Hvis du ikke ba om dette, ignorer denne mailen.
        </p>
      `,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
}

/**
 * Get current user from database
 */
export async function getCurrentUser(): Promise<DBUser | null> {
  try {
    if (!auth.currentUser) return null;

    const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as DBUser;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function setupAuthListener(callback: (authUser: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Generate random token
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate random chat widget key
 */
function generateChatWidgetKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
