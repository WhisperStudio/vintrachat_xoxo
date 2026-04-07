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

import { AuthResponse, UserRole, BusinessUser, ChatWidgetConfig, Business } from "@/types/database";

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
  displayName: string,
  accountType?: 'business' | 'user',
  businessName?: string
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
        accountType,
        businessName,
      }),
    });

    // Lagre midlertidig verification token i pending_auth
    await setDoc(doc(db, "pending_auth", cred.user.uid), {
      email,
      displayName,
      token,
      accountType,
      businessName,
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
  const userId = docSnap.id;

  try {
    if (data.accountType === 'business' && data.businessName) {
      // OPPRETT BUSINESS + ADMIN USER
      const businessId = await createBusiness(userId, data.businessName, data.email);
      
      // Slett pending_auth etter vellykket opprettelse
      await deleteDoc(docSnap.ref);
      
      return { 
        success: true, 
        message: `Business "${data.businessName}" opprettet! Du er nå admin.`,
        businessId 
      };
    } else {
      // VANLIG BRUKER - legg til i pending_users (venter på invitasjon)
      await setDoc(doc(db, "pending_users", userId), {
        email: data.email,
        displayName: data.displayName,
        createdAt: serverTimestamp(),
      });

      await deleteDoc(docSnap.ref);

      return { 
        success: true, 
        message: "Email verifisert. Du venter nå på invitasjon fra en bedrift." 
      };
    }
  } catch (err) {
    console.error("Verify email error:", err);
    return { success: false, message: "Feil ved verifisering" };
  }
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

  // Default chat widget config
  const defaultWidgetConfig: ChatWidgetConfig = {
  plan: "free",
  billingCycle: "monthly",
  colorTheme: "modern",
  position: "bottom-right",

  bubbleStyle: {
    showStatus: true,
    showCloseButton: true,
    borderType: "rounded",
    shadowType: "medium",
    animationType: "fade",
    sizeType: "medium",
  },

  headerStyle: {
    showStatus: true,
    showCloseButton: true,
    borderType: "rounded",
    shadowType: "light",
    showAvatar: true,
    showTitle: true,
  },

  bodyStyle: {
    borderType: "none",
    shadowType: "none",
    messageStyle: "bubble",
    showTimestamps: true,
    showReadReceipts: false,
  },

  footerStyle: {
    showSendButton: true,
    borderType: "none",
    shadowType: "none",
    inputStyle: "rounded",
    showPlaceholder: true,
  },

  customBranding: {
    title: businessName,
    description: "Vi er her for å hjelpe deg!",
  },

  settings: {
    autoOpen: false,
    delayMs: 3000,
  },
};

  // business root
  await setDoc(businessRef, {
    name: businessName,
    email,
    ownerId: userId,
    chatWidgetKey: generateChatWidgetKey(),
    chatWidgetConfig: defaultWidgetConfig,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // legg user som admin
  await setDoc(
    doc(db, `businesses/${businessId}/users/${userId}`),
    {
      email,
      role: "admin",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return businessId;
}

// ----------------------
// SIGN IN
// ----------------------
export async function signInWithEmail(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Sjekk om user er pending_users (venter på invitasjon)
    const pendingRef = doc(db, "pending_users", cred.user.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: false,
        message: "Du må akseptere invitasjon først. Sjekk emailen din.",
      };
    }

    // Sjekk om user eksisterer i business structure
    const userExists = await getCurrentUser(cred.user);
    
    if (!userExists) {
      return {
        success: false,
        message: "Bruker ikke funnet. Du må verifisere emailen din først.",
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

// ----------------------
// REQUEST PASSWORD RESET
// ----------------------
export async function requestPasswordReset(email: string) {
  try {
    const token = generateToken();
    
    // Lagre token i pending_password_resets
    await setDoc(doc(collection(db, "pending_password_resets")), {
      email,
      token,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });
    
    // Send email (implementer senere)
    console.log(`Password reset token for ${email}: ${token}`);
    
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ----------------------
// RESET PASSWORD
// ----------------------
export async function resetPassword(token: string, newPassword: string) {
  try {
    const q = query(
      collection(db, "pending_password_resets"),
      where("token", "==", token),
      where("expiresAt", ">", new Date())
    );
    
    const snap = await getDocs(q);
    
    if (snap.empty) {
      return { success: false, message: "Ugyldig eller utløpt token" };
    }
    
    const resetDoc = snap.docs[0];
    const email = resetDoc.data().email;
    
    // Finn bruker basert på email (i business structure)
    const usersRef = collection(db, "businesses");
    const businessQuery = query(usersRef, where("email", "==", email));
    const businessSnap = await getDocs(businessQuery);
    
    if (businessSnap.empty) {
      return { success: false, message: "Bruker ikke funnet" };
    }
    
    // Reset passord i Firebase Auth
    // Dette krever Firebase Admin SDK - implementer senere
    console.log(`Would reset password for ${email}`);
    
    // Slett reset token
    await deleteDoc(resetDoc.ref);
    
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ----------------------
// GET CURRENT USER (fra business)
// ----------------------
export async function getCurrentUser(firebaseUser: FirebaseUser) {
  // Sjekk om user er admin/owner først
  const businessesRef = collection(db, "businesses");
  const ownerQuery = query(businessesRef, where("ownerId", "==", firebaseUser.uid));
  const ownerSnap = await getDocs(ownerQuery);
  
  if (!ownerSnap.empty) {
    // User er admin/owner
    const businessDoc = ownerSnap.docs[0];
    const userDoc = await getDoc(
      doc(db, `businesses/${businessDoc.id}/users/${firebaseUser.uid}`)
    );
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: userData.email || firebaseUser.email || "",
        displayName: userData.displayName,
        businessId: businessDoc.id,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate(),
      } as BusinessUser;
    }
  }
  
  // Sjekk om user er vanlig user i noen business
  const businessDocs = await getDocs(businessesRef);
  
  for (const businessDoc of businessDocs.docs) {
    const userDoc = await getDoc(
      doc(db, `businesses/${businessDoc.id}/users/${firebaseUser.uid}`)
    );
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: firebaseUser.uid,
        email: userData.email || firebaseUser.email || "",
        displayName: userData.displayName,
        businessId: businessDoc.id,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
        lastLogin: userData.lastLogin?.toDate(),
      } as BusinessUser;
    }
  }
  
  return null;
}

// ----------------------
// GET BUSINESS INFO
// ----------------------
export async function getBusinessInfo(
  businessId: string
): Promise<Business | null> {
  const businessRef = doc(db, "businesses", businessId);
  const snap = await getDoc(businessRef);

  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      email: data.email,
      ownerId: data.ownerId,
      chatWidgetKey: data.chatWidgetKey,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      chatWidgetConfig: data.chatWidgetConfig,
    };
  }

  return null;
}

// ----------------------
// UPDATE CHAT WIDGET CONFIG
// ----------------------
export async function updateChatWidgetConfig(
  businessId: string,
  config: Partial<ChatWidgetConfig>
) {
  try {
    const businessRef = doc(db, "businesses", businessId);
    
    await updateDoc(businessRef, {
      "chatWidgetConfig": config,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, message: "Widget config oppdatert" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}