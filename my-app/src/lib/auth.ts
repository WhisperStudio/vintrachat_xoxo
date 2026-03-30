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
  Timestamp,
} from "firebase/firestore";
import { User, Business, UserRole, AuthResponse } from "@/types/database";

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("profile");
googleProvider.addScope("email");

/**
 * Sign in with Google
 * Sjekker om bruker finnes i database, hvis ja logg inn
 * Hvis nei, send til signup flow
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const googleUser = result.user;

    // Sjekk om bruker finnes allerede
    const userDoc = await getDoc(doc(db, "users", googleUser.uid));

    if (userDoc.exists()) {
      // Bruker finnes, oppdater lastLogin
      await updateDoc(doc(db, "users", googleUser.uid), {
        lastLogin: serverTimestamp(),
      });

      const userData = userDoc.data() as User;
      return {
        success: true,
        message: "Innlogging vellykket",
        user: userData,
        redirectTo: `/dashboard/${userData.businessId}`,
      };
    } else {
      // Bruker finnes ikke, send til signup
      return {
        success: false,
        message: "Bruker finnes ikke, må registrere seg først",
        redirectTo: `/auth/signup?email=${googleUser.email}&uid=${googleUser.uid}`,
      };
    }
  } catch (error) {
    console.error("Google sign in error:", error);
    return {
      success: false,
      message: "Innlogging feilet. Prøv igjen.",
    };
  }
}

/**
 * Sign up new user / create new business
 * Bruker velger om de er bedriftsadmin eller vanlig bruker
 */
export async function signUpNewUser(
  firebaseUser: FirebaseUser,
  isBusinessAdmin: boolean,
  businessName?: string,
  displayName?: string
): Promise<AuthResponse> {
  try {
    if (isBusinessAdmin && !businessName) {
      return {
        success: false,
        message: "Bedriftsnavn er påkrevd for bedriftsadmin",
      };
    }

    // Generer random chat widget key
    const chatWidgetKey = generateChatWidgetKey();

    // Opprett bedrift
    const businessData: Business = {
      id: "", // Settes senere
      businessName: businessName || "Min bedrift",
      adminEmail: firebaseUser.email || "",
      users: [firebaseUser.uid],
      createdAt: new Date(),
      updatedAt: new Date(),
      chatWidgetKey: chatWidgetKey,
      chatWidgetConfig: {
        designLevel: "standard",
        colorTheme: "modern",
        position: "bottom-right",
      },
    };

    // Lagre bedrift i Firestore
    const businessRef = doc(collection(db, "business"));
    businessData.id = businessRef.id;
    await setDoc(businessRef, {
      ...businessData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create user document
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      businessId: businessRef.id,
      role: "admin", // Alle nye brukere starter som admin når de opprettet bedriften
      displayName: displayName || firebaseUser.displayName || "",
      photoURL: firebaseUser.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    await setDoc(doc(db, "users", firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return {
      success: true,
      message: "Registrering vellykket",
      user: userData,
      redirectTo: `/dashboard/${businessRef.id}`,
    };
  } catch (error) {
    console.error("Sign up error:", error);
    return {
      success: false,
      message: "Registrering feilet. Prøv igjen.",
    };
  }
}

/**
 * Sign out current user
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
export async function getCurrentUserFromDB(
  firebaseUser: FirebaseUser | null
): Promise<User | null> {
  if (!firebaseUser) return null;

  try {
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

/**
 * Get business info
 */
export async function getBusinessInfo(businessId: string): Promise<Business | null> {
  try {
    const businessDoc = await getDoc(doc(db, "business", businessId));
    if (businessDoc.exists()) {
      return businessDoc.data() as Business;
    }
    return null;
  } catch (error) {
    console.error("Error fetching business:", error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function setupAuthListener(
  callback: (authUser: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
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

/**
 * Update business chat widget config
 */
export async function updateChatWidgetConfig(
  businessId: string,
  config: any
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "business", businessId), {
      chatWidgetConfig: config,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating widget config:", error);
    return false;
  }
}

/**
 * Get all users in a business
 */
export async function getBusinessUsers(businessId: string): Promise<User[]> {
  try {
    const q = query(
      collection(db, "users"),
      where("businessId", "==", businessId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as User);
  } catch (error) {
    console.error("Error fetching business users:", error);
    return [];
  }
}

/**
 * Update user role by admin
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<boolean> {
  try {
    await updateDoc(doc(db, "users", userId), {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user role:", error);
    return false;
  }
}
