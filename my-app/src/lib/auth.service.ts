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

import {
  AuthResponse,
  UserRole,
  BusinessUser,
  ChatWidgetConfig,
  Business,
  ChatAssistantConfig,
  ChatAnalytics,
  ChatAnalyticsEvent,
  SupportTaskCategory,
} from "@/types/database";
import {
  sanitizeBubbleStyleForPlan,
  type SubscriptionPlan,
} from "@/lib/subscription";
import { isVintraAdminEmail, normalizeEmail } from "@/lib/vintra-admin";
import { parseAllowedDomainsInput } from "@/lib/widget-security";

// ----------------------
// Google Auth
// ----------------------
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const pendingRef = doc(db, "pending_users", firebaseUser.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: true,
        message: "Du har invitasjoner som venter",
        redirectTo: "/invite",
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
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate?.() || new Date(),
    updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
    lastLogin: d.data().lastLogin?.toDate?.() || undefined,
  }));
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

function generateSecureSecret(bytesLength: number = 32) {
  const cryptoObject: any =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto || (globalThis as any).msCrypto || null)
      : null

  if (cryptoObject && typeof cryptoObject.getRandomValues === 'function') {
    const bytes = new Uint8Array(bytesLength)
    cryptoObject.getRandomValues(bytes)
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  return generateToken(bytesLength * 2)
}

export function generateChatWidgetKey() {
  return generateToken(24);
}

const defaultSupportTaskCategories: SupportTaskCategory[] = [
  'general',
  'security',
  'system',
  'billing',
  'account',
].map((name) => ({
  id: name,
  name: name.charAt(0).toUpperCase() + name.slice(1),
  default: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

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
    const normalizedAccountType = accountType || 'user';
    const normalizedBusinessName =
      normalizedAccountType === 'business' ? businessName?.trim() || undefined : undefined;

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
        accountType: normalizedAccountType,
        businessName: normalizedBusinessName,
      }),
    });

    // Lagre midlertidig verification token i pending_auth
    await setDoc(doc(db, "pending_auth", cred.user.uid), {
      email,
      displayName,
      token,
      accountType: normalizedAccountType,
      ...(normalizedBusinessName ? { businessName: normalizedBusinessName } : {}),
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
    iconChoice: "chat",
    borderType: "rounded",
    shadowType: "medium",
    animationType: "fade",
    sizeType: "medium",
    orbStyle: {
      hoverEnabled: true,
      hoverGlyph: 'A',
      replyEnabled: false,
      replyGlyphs: '',
      inactiveEnabled: false,
      inactiveGlyphs: '',
      inactivityMinMinutes: 2,
      inactivityMaxMinutes: 4,
    },
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
  allowedDomains: [],
};

const defaultAssistantConfig: ChatAssistantConfig = {
  enabled: true,
  provider: "gemini",
  model: "gemma-3-4b-it",
  strictContextOnly: true,
  systemPrompt:
    "You are the company's website assistant. Be helpful, concise, and honest. If the answer is not supported by the provided business context, say so clearly and ask the visitor to contact support.",
  businessContext: "",
  restrictions:
    "Do not invent policies, prices, opening hours, or legal guarantees. Only answer from the provided business context when possible.",
  supportTriggerKeywords: [
    "support",
    "human",
    "person",
    "agent",
    "contact",
    "call me",
    "ring me",
    "email me",
  ],
  handoffMessage:
    "I can help with that. I will flag this conversation for human follow-up so the team can contact you.",
  faqSuggestionsEnabled: true,
  faqSuggestions: [
    'What are your opening hours?',
    'How do I contact support?',
    'What services do you offer?',
  ],
  replyInUserLanguage: true,
  responseStyle: 'Friendly, clear, and concise',
  extraInstructions: 'Always keep answers short unless the user asks for more detail.',
};

const defaultChatAnalytics: ChatAnalytics = {
  totalSessions: 0,
  totalMessages: 0,
  aiOnlySessions: 0,
  supportRequests: 0,
  savedSupportChats: 0,
  dailyConversationCounts: {},
  countryCounts: {},
  modelUsage: {},
  timeline: [],
};

  // business root
  await setDoc(businessRef, {
    name: businessName,
    email,
    ownerId: userId,
    chatWidgetKey: generateChatWidgetKey(),
    chatWidgetEmbedSecret: generateSecureSecret(32),
    chatWidgetConfig: defaultWidgetConfig,
    chatAssistantConfig: defaultAssistantConfig,
    chatAnalytics: defaultChatAnalytics,
  supportTaskCategories: defaultSupportTaskCategories,
  onboarding: {
    tutorialCompletedAt: null,
  },
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

    const pendingRef = doc(db, "pending_users", cred.user.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: true,
        message: "Du har invitasjoner som venter.",
        redirectTo: "/invite",
      };
    }

    const signedInEmail = normalizeEmail(cred.user.email || email)
    if (isVintraAdminEmail(signedInEmail)) {
      return {
        success: true,
        message: 'Vintra admin innlogging OK',
        redirectTo: '/admin',
      }
    }

    const userExists = await getCurrentUser(cred.user);

    if (!userExists) {
      return {
        success: false,
        message: "Bruker ikke funnet. Du m? verifisere emailen din f?rst.",
      };
    }

    return {
      success: true,
      message: "Innlogging OK",
      redirectTo: "/admin",
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
export async function getCurrentUser(firebaseUser: FirebaseUser): Promise<BusinessUser | null> {
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
      chatAssistantConfig: data.chatAssistantConfig,
      chatAnalytics: data.chatAnalytics
        ? {
            ...data.chatAnalytics,
            dailyConversationCounts: data.chatAnalytics.dailyConversationCounts || {},
            countryCounts: data.chatAnalytics.countryCounts || {},
            modelUsage: data.chatAnalytics.modelUsage || {},
            timeline: Array.isArray(data.chatAnalytics.timeline)
              ? data.chatAnalytics.timeline.map((event: any) => ({
                  id: event.id || crypto.randomUUID(),
                  kind: event.kind,
                  sessionId: event.sessionId || '',
                  countryCode: event.countryCode || undefined,
                  createdAt: event.createdAt?.toDate?.() || new Date(event.createdAt || Date.now()),
                })) as ChatAnalyticsEvent[]
              : [],
            lastChatAt: data.chatAnalytics.lastChatAt?.toDate?.() || undefined,
          }
        : undefined,
      supportTaskCategories: Array.isArray(data.supportTaskCategories)
        ? data.supportTaskCategories.map((category: any) => ({
            id: category.id,
            name: category.name,
            default: Boolean(category.default),
            createdAt: category.createdAt?.toDate?.() || new Date(),
            updatedAt: category.updatedAt?.toDate?.() || new Date(),
          }))
        : [],
      onboarding: data.onboarding
        ? {
            tutorialCompletedAt:
              data.onboarding.tutorialCompletedAt?.toDate?.() || data.onboarding.tutorialCompletedAt || null,
          }
        : undefined,
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
    const existingSnap = await getDoc(businessRef);
    const existingConfig = existingSnap.exists()
      ? ((existingSnap.data()?.chatWidgetConfig || {}) as Partial<ChatWidgetConfig>)
      : {};
    const plan = (config?.plan || 'free') as SubscriptionPlan;
    const allowedDomains =
      config?.allowedDomains !== undefined
        ? parseAllowedDomainsInput(config.allowedDomains)
        : parseAllowedDomainsInput(existingConfig.allowedDomains);
    const mergedConfig: Partial<ChatWidgetConfig> = {
      ...existingConfig,
      ...config,
      allowedDomains,
      bubbleStyle: config?.bubbleStyle
        ? sanitizeBubbleStyleForPlan(config.bubbleStyle, plan)
        : existingConfig.bubbleStyle,
    };
    
    await updateDoc(businessRef, {
      "chatWidgetConfig": mergedConfig,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, message: "Widget config oppdatert" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateChatAssistantConfig(
  businessId: string,
  config: Partial<ChatAssistantConfig>
) {
  try {
    const businessRef = doc(db, "businesses", businessId);

    await updateDoc(businessRef, {
      chatAssistantConfig: config,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: "AI config oppdatert" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
