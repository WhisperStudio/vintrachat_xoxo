import { auth, db } from "@/lib/firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type AuthError,
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
  limit,
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
  AssistantBusinessProfile,
  AssistantKnowledgeBase,
  AssistantIntegrationSettings,
  ChatAnalytics,
  ChatAnalyticsEvent,
  SupportTaskCategory,
  ChatWidgetRecord,
} from "@/types/database";
import { defaultConversationCards, normalizeConversationCards } from '@/lib/conversation-cards'
import {
  sanitizeBubbleStyleForPlan,
  getPlanLimits,
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

function buildDefaultWidgetConfig(businessName: string): ChatWidgetConfig {
  return {
    plan: 'free',
    billingCycle: 'monthly',
    colorTheme: 'modern',
    position: 'bottom-right',
    bubbleStyle: {
      showStatus: true,
      iconChoice: 'chat',
      borderType: 'rounded',
      shadowType: 'medium',
      animationType: 'fade',
      sizeType: 'medium',
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
      borderType: 'rounded',
      shadowType: 'light',
      showAvatar: true,
      showTitle: true,
    },
    bodyStyle: {
      borderType: 'none',
      shadowType: 'none',
      messageStyle: 'bubble',
      showTimestamps: true,
      showReadReceipts: false,
      showConversationCards: true,
      conversationCardsLayout: 'grid',
      conversationCardsStyle: 'modern',
    },
    footerStyle: {
      showSendButton: true,
      borderType: 'none',
      shadowType: 'none',
      inputStyle: 'rounded',
      showPlaceholder: true,
    },
    customBranding: {
      title: businessName,
      description: 'Vi er her for å hjelpe deg!',
    },
    settings: {
      autoOpen: false,
      delayMs: 3000,
    },
    allowedDomains: [],
  }
}

function buildDefaultAssistantConfig(): ChatAssistantConfig {
  return {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    strictContextOnly: true,
    strictness: 'balanced',
    systemPrompt:
      "You are a helpful customer service assistant for the business. Use approved business information, keep answers concise, and be honest about uncertainty.",
    businessContext: '',
    businessProfile: {
      businessName: '',
      industry: '',
      shortDescription: '',
      toneOfVoice: 'professional, warm, helpful',
      language: 'English',
      multilingual: false,
      mainGoal: 'convert visitors into leads',
      fallbackContact: '',
    },
    knowledgeBase: {
      websiteUrls: [],
      uploadedDocuments: [],
      manualNotes: '',
      openingHours: '',
      contactInfo: '',
      addresses: '',
      keyFAQs: [],
    },
    integrations: {
      replyToQuestions: true,
      collectLeads: true,
      bookMeetings: false,
      routeToPages: true,
      createSupportTickets: false,
      fetchOrderStatus: false,
      handoffToHuman: true,
    },
    restrictions:
      'Do not invent policies, prices, opening hours, or legal guarantees. Only answer from the provided business context when possible.',
    supportTriggerKeywords: [
      'support',
      'human',
      'person',
      'agent',
      'contact',
      'call me',
      'ring me',
      'email me',
    ],
    humanSupportEnabled: true,
    handoffMessage:
      'I can help with that. I will flag this conversation for human follow-up so the team can contact you.',
    faqSuggestionsEnabled: true,
    faqSuggestions: [
      'What are your opening hours?',
      'How do I contact support?',
      'What services do you offer?',
    ],
    conversationCardsEnabled: true,
    conversationCardsLimit: 4,
    conversationCards: defaultConversationCards,
    startLanguage: 'English',
    replyInUserLanguage: true,
    responseStyle: 'Friendly, clear, and concise',
    extraInstructions: 'Always keep answers short unless the user asks for more detail.',
    forceSelectedModelOnly: false,
  }
}

function mergeWidgetConfig(
  config: Partial<ChatWidgetConfig> | undefined,
  businessName: string
): ChatWidgetConfig {
  const defaults = buildDefaultWidgetConfig(businessName)

  if (!config) return defaults

  return {
    ...defaults,
    ...config,
    allowedDomains: parseAllowedDomainsInput(config.allowedDomains ?? defaults.allowedDomains),
    bubbleStyle: {
      ...defaults.bubbleStyle,
      ...(config.bubbleStyle || {}),
      orbStyle: {
        hoverEnabled: config.bubbleStyle?.orbStyle?.hoverEnabled ?? defaults.bubbleStyle.orbStyle!.hoverEnabled,
        hoverGlyph: config.bubbleStyle?.orbStyle?.hoverGlyph ?? defaults.bubbleStyle.orbStyle!.hoverGlyph,
        replyEnabled: config.bubbleStyle?.orbStyle?.replyEnabled ?? defaults.bubbleStyle.orbStyle!.replyEnabled,
        replyGlyphs: config.bubbleStyle?.orbStyle?.replyGlyphs ?? defaults.bubbleStyle.orbStyle!.replyGlyphs,
        inactiveEnabled: config.bubbleStyle?.orbStyle?.inactiveEnabled ?? defaults.bubbleStyle.orbStyle!.inactiveEnabled,
        inactiveGlyphs: config.bubbleStyle?.orbStyle?.inactiveGlyphs ?? defaults.bubbleStyle.orbStyle!.inactiveGlyphs,
        inactivityMinMinutes:
          config.bubbleStyle?.orbStyle?.inactivityMinMinutes ?? defaults.bubbleStyle.orbStyle!.inactivityMinMinutes,
        inactivityMaxMinutes:
          config.bubbleStyle?.orbStyle?.inactivityMaxMinutes ?? defaults.bubbleStyle.orbStyle!.inactivityMaxMinutes,
      },
    },
    headerStyle: {
      ...defaults.headerStyle,
      ...(config.headerStyle || {}),
    },
    bodyStyle: {
      ...defaults.bodyStyle,
      ...(config.bodyStyle || {}),
    },
    footerStyle: {
      ...defaults.footerStyle,
      ...(config.footerStyle || {}),
    },
    customBranding: {
      ...defaults.customBranding,
      ...(config.customBranding || {}),
      logoStyle: {
        zoom: config.customBranding?.logoStyle?.zoom ?? defaults.customBranding.logoStyle!.zoom,
        focusX: config.customBranding?.logoStyle?.focusX ?? defaults.customBranding.logoStyle!.focusX,
        focusY: config.customBranding?.logoStyle?.focusY ?? defaults.customBranding.logoStyle!.focusY,
      },
    },
    settings: {
      ...defaults.settings,
      ...(config.settings || {}),
    },
  }
}

function mergeAssistantConfig(
  base?: Partial<ChatAssistantConfig> | null,
  override?: Partial<ChatAssistantConfig> | null
): ChatAssistantConfig {
  const defaults = buildDefaultAssistantConfig()
  const baseConfig = base || {}
  const overrideConfig = override || {}

  return {
    ...defaults,
    ...baseConfig,
    ...overrideConfig,
    businessProfile: {
      ...(defaults.businessProfile || {}),
      ...(baseConfig.businessProfile || {}),
      ...(overrideConfig.businessProfile || {}),
    } as AssistantBusinessProfile,
    knowledgeBase: {
      ...(defaults.knowledgeBase || {}),
      ...(baseConfig.knowledgeBase || {}),
      ...(overrideConfig.knowledgeBase || {}),
    } as AssistantKnowledgeBase,
    integrations: {
      ...(defaults.integrations || {}),
      ...(baseConfig.integrations || {}),
      ...(overrideConfig.integrations || {}),
    } as AssistantIntegrationSettings,
    strictness:
      overrideConfig.strictness ||
      baseConfig.strictness ||
      defaults.strictness ||
      'balanced',
    supportTriggerKeywords:
      (overrideConfig.supportTriggerKeywords ||
        baseConfig.supportTriggerKeywords ||
        defaults.supportTriggerKeywords) as string[],
    faqSuggestions:
      (overrideConfig.faqSuggestions ||
        baseConfig.faqSuggestions ||
        defaults.faqSuggestions) as string[],
    conversationCards: normalizeConversationCards(
      overrideConfig.conversationCards ||
        baseConfig.conversationCards ||
        defaults.conversationCards
    ),
    enabled:
      overrideConfig.enabled ?? baseConfig.enabled ?? defaults.enabled,
    provider:
      overrideConfig.provider || baseConfig.provider || defaults.provider,
    model:
      overrideConfig.model || baseConfig.model || defaults.model,
    strictContextOnly:
      overrideConfig.strictContextOnly ?? baseConfig.strictContextOnly ?? defaults.strictContextOnly,
    systemPrompt:
      overrideConfig.systemPrompt || baseConfig.systemPrompt || defaults.systemPrompt,
    businessContext:
      overrideConfig.businessContext ?? baseConfig.businessContext ?? defaults.businessContext,
    restrictions:
      overrideConfig.restrictions || baseConfig.restrictions || defaults.restrictions,
    humanSupportEnabled:
      overrideConfig.humanSupportEnabled ?? baseConfig.humanSupportEnabled ?? defaults.humanSupportEnabled,
    handoffMessage:
      overrideConfig.handoffMessage || baseConfig.handoffMessage || defaults.handoffMessage,
    faqSuggestionsEnabled:
      overrideConfig.faqSuggestionsEnabled ?? baseConfig.faqSuggestionsEnabled ?? defaults.faqSuggestionsEnabled,
    conversationCardsEnabled:
      overrideConfig.conversationCardsEnabled ??
      baseConfig.conversationCardsEnabled ??
      defaults.conversationCardsEnabled,
    conversationCardsLimit:
      Number.isFinite(overrideConfig.conversationCardsLimit)
        ? Number(overrideConfig.conversationCardsLimit)
        : Number.isFinite(baseConfig.conversationCardsLimit)
          ? Number(baseConfig.conversationCardsLimit)
          : defaults.conversationCardsLimit,
    startLanguage:
      overrideConfig.startLanguage || baseConfig.startLanguage || defaults.startLanguage,
    replyInUserLanguage:
      overrideConfig.replyInUserLanguage ?? baseConfig.replyInUserLanguage ?? defaults.replyInUserLanguage,
    responseStyle:
      overrideConfig.responseStyle || baseConfig.responseStyle || defaults.responseStyle,
    extraInstructions:
      overrideConfig.extraInstructions || baseConfig.extraInstructions || defaults.extraInstructions,
    forceSelectedModelOnly:
      overrideConfig.forceSelectedModelOnly ?? baseConfig.forceSelectedModelOnly ?? defaults.forceSelectedModelOnly,
  }
}

function buildDefaultChatAnalytics(): ChatAnalytics {
  return {
    totalSessions: 0,
    totalMessages: 0,
    aiOnlySessions: 0,
    supportRequests: 0,
    savedSupportChats: 0,
    dailyConversationCounts: {},
    countryCounts: {},
    modelUsage: {},
    timeline: [],
  }
}

function mapWidgetRecord(docSnap: { id: string; data: () => any }): ChatWidgetRecord {
  const data = docSnap.data() || {}
  return {
    id: docSnap.id,
    widgetKey: String(data.widgetKey || docSnap.id),
    name: String(data.name || 'Chat Widget'),
    config: mergeWidgetConfig(
      data.config || data.chatWidgetConfig,
      String(data.name || 'Chat Widget')
    ),
    assistantConfig: data.assistantConfig as ChatAssistantConfig | undefined,
    isDefault: Boolean(data.isDefault),
    createdAt: data.createdAt?.toDate?.() || new Date(0),
    updatedAt: data.updatedAt?.toDate?.() || new Date(0),
  }
}

function sortChatWidgetsByCreation(widgets: ChatWidgetRecord[]) {
  return [...widgets].sort((left, right) => {
    const leftTime = left.createdAt?.getTime?.() || 0
    const rightTime = right.createdAt?.getTime?.() || 0

    if (leftTime !== rightTime) return leftTime - rightTime
    if (left.isDefault !== right.isDefault) return left.isDefault ? -1 : 1

    return left.name.localeCompare(right.name)
  })
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
    const normalizedEmail = normalizeEmail(email)
    const normalizedAccountType = accountType || 'user';
    const normalizedBusinessName =
      normalizedAccountType === 'business' ? businessName?.trim() || undefined : undefined;

    const cred = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

    const token = generateToken();

    // ❗ IKKE lagre user i Firestore enda

    await fetch("/api/auth/send-verification-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        token,
        displayName,
        accountType: normalizedAccountType,
        businessName: normalizedBusinessName,
      }),
    });

    // Lagre midlertidig verification token i pending_auth
    await setDoc(doc(db, "pending_auth", cred.user.uid), {
      email: normalizedEmail,
      normalizedEmail,
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
      const businessId = await createBusinessWithWidgets(userId, data.businessName, data.email);
      
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
    showConversationCards: true,
    conversationCardsLayout: 'grid',
    conversationCardsStyle: 'modern',
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
  model: "gemini-2.5-flash-lite",
  strictContextOnly: true,
  strictness: 'balanced',
  systemPrompt:
    "You are a helpful customer service assistant for the business. Use approved business information, keep answers concise, and be honest about uncertainty.",
  businessContext: "",
  businessProfile: {
    businessName,
    industry: '',
    shortDescription: '',
    toneOfVoice: 'professional, warm, helpful',
    language: 'English',
    multilingual: false,
    mainGoal: 'convert visitors into leads',
    fallbackContact: email,
  },
  knowledgeBase: {
    websiteUrls: [],
    uploadedDocuments: [],
    manualNotes: '',
    openingHours: '',
    contactInfo: '',
    addresses: '',
    keyFAQs: [],
  },
  integrations: {
    replyToQuestions: true,
    collectLeads: true,
    bookMeetings: false,
    routeToPages: true,
    createSupportTickets: false,
    fetchOrderStatus: false,
    handoffToHuman: true,
  },
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
  humanSupportEnabled: true,
  handoffMessage:
    "I can help with that. I will flag this conversation for human follow-up so the team can contact you.",
  faqSuggestionsEnabled: true,
  faqSuggestions: [
    'What are your opening hours?',
    'How do I contact support?',
    'What services do you offer?',
  ],
  conversationCardsEnabled: true,
  conversationCardsLimit: 4,
  conversationCards: defaultConversationCards,
  startLanguage: 'English',
  replyInUserLanguage: true,
  responseStyle: 'Friendly, clear, and concise',
  extraInstructions: 'Always keep answers short unless the user asks for more detail.',
  forceSelectedModelOnly: false,
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

export async function createBusinessWithWidgets(
  userId: string,
  businessName: string,
  email: string
) {
  const businessRef = doc(collection(db, 'businesses'))
  const businessId = businessRef.id
  const widgetKey = generateChatWidgetKey()
  const widgetConfig = buildDefaultWidgetConfig(businessName)
  const assistantConfig = buildDefaultAssistantConfig()

  await setDoc(businessRef, {
    name: businessName,
    email,
    ownerId: userId,
    chatWidgetKey: widgetKey,
    activeChatWidgetKey: widgetKey,
    chatWidgetEmbedSecret: generateSecureSecret(32),
    chatWidgetConfig: widgetConfig,
    chatAssistantConfig: assistantConfig,
    chatAnalytics: buildDefaultChatAnalytics(),
    supportTaskCategories: defaultSupportTaskCategories,
    onboarding: {
      tutorialCompletedAt: null,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(db, `businesses/${businessId}/users/${userId}`), {
    email,
    role: 'admin',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await setDoc(doc(db, `businesses/${businessId}/chatWidgets/${widgetKey}`), {
    widgetKey,
    name: 'Main widget',
    config: widgetConfig,
    assistantConfig,
    isDefault: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return businessId
}

// ----------------------
// SIGN IN
// ----------------------
export async function signInWithEmail(email: string, password: string) {
  const trimmedEmail = String(email || "").trim()
  const normalizedEmail = normalizeEmail(email)

  try {
    let cred

    try {
      cred = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    } catch (firstErr: any) {
      const firstCode = String(firstErr?.code || "")

      if (
        normalizedEmail &&
        normalizedEmail !== trimmedEmail &&
        (
          firstCode === "auth/invalid-credential" ||
          firstCode === "auth/invalid-login-credentials" ||
          firstCode === "auth/user-not-found" ||
          firstCode === "auth/wrong-password"
        )
      ) {
        cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        throw firstErr
      }
    }

    const pendingRef = doc(db, "pending_users", cred.user.uid);
    const pendingSnap = await getDoc(pendingRef);

    if (pendingSnap.exists()) {
      return {
        success: true,
        message: "Du har invitasjoner som venter.",
        redirectTo: "/invite",
      };
    }

    const signedInEmail = normalizeEmail(cred.user.email || normalizedEmail)
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
    const authError = err as AuthError
    const code = authError.code || ""

    if (
      code === "auth/invalid-credential" ||
      code === "auth/invalid-login-credentials" ||
      code === "auth/user-not-found" ||
      code === "auth/wrong-password"
    ) {
      try {
        const emailCandidates = Array.from(new Set([trimmedEmail, normalizedEmail].filter(Boolean)))

        for (const candidateEmail of emailCandidates) {
          const pendingQuery = query(
            collection(db, "pending_auth"),
            where("email", "==", candidateEmail),
            limit(1)
          )
          const pendingSnap = await getDocs(pendingQuery)

          if (pendingSnap.empty) continue

          return {
            success: false,
            message:
              "Kontoen din er ikke ferdig verifisert ennå. Sjekk verifikasjonsmailen eller be om å få den sendt på nytt.",
          }
        }
      } catch (pendingErr) {
        console.error("Pending auth lookup failed:", pendingErr)
      }

      return {
        success: false,
        message: "Feil email eller passord. Prøv igjen eller nullstill passordet ditt.",
      }
    }

    if (code === "auth/invalid-email") {
      return {
        success: false,
        message: "Emailadressen er ugyldig.",
      }
    }

    if (code === "auth/too-many-requests") {
      return {
        success: false,
        message: "For mange innloggingsforsøk. Vent litt og prøv igjen.",
      }
    }

    return { success: false, message: authError.message || "Innlogging feilet" };
  }
}

// ----------------------
// REQUEST PASSWORD RESET
// ----------------------
export async function requestPasswordReset(email: string) {
  try {
    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    return {
      success: Boolean(response.ok && data.success),
      message: data.message,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ----------------------
// RESET PASSWORD
// ----------------------
export async function resetPassword(token: string, newPassword: string) {
  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    return {
      success: Boolean(response.ok && data.success),
      message: data.message,
    };

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
    const widgetSnap = await getDocs(collection(db, `businesses/${businessId}/chatWidgets`))
      const widgets = sortChatWidgetsByCreation(widgetSnap.docs.map(mapWidgetRecord))
      const activeChatWidgetKey = String(data.activeChatWidgetKey || data.chatWidgetKey || widgets[0]?.widgetKey || '')
      const activeWidget =
        widgets.find((widget) => widget.widgetKey === activeChatWidgetKey) ||
        widgets[0] ||
        null
      const chatWidgetConfig = activeWidget?.config
        || (data.chatWidgetConfig ? mergeWidgetConfig(data.chatWidgetConfig, String(data.name || 'Chat Widget')) : undefined)
      const chatWidgetKey = activeWidget?.widgetKey || data.chatWidgetKey || ''
      const chatAssistantConfig = mergeAssistantConfig(data.chatAssistantConfig, activeWidget?.assistantConfig)
      const normalizedWidgets = widgets.map((widget) => ({
        ...widget,
        assistantConfig: mergeAssistantConfig(data.chatAssistantConfig, widget.assistantConfig),
      }))

      return {
      id: snap.id,
      name: data.name,
      email: data.email,
      ownerId: data.ownerId,
      chatWidgetKey,
      activeChatWidgetKey: chatWidgetKey || activeChatWidgetKey || undefined,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      chatWidgetConfig,
        chatWidgets: normalizedWidgets.length
          ? normalizedWidgets
          : chatWidgetConfig
            ? [{
                id: chatWidgetKey || 'default-widget',
                widgetKey: chatWidgetKey || String(data.chatWidgetKey || 'default-widget'),
                name: 'Main widget',
                config: chatWidgetConfig,
                assistantConfig: chatAssistantConfig,
                isDefault: true,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              }]
            : [],
      chatAssistantConfig,
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
  config: Partial<ChatWidgetConfig>,
  widgetKey?: string
) {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const existingSnap = await getDoc(businessRef);
    const existingData = existingSnap.exists() ? existingSnap.data() || {} : {};
    const existingConfig = (existingData.chatWidgetConfig || {}) as Partial<ChatWidgetConfig>;
    const targetWidgetKey = String(
      widgetKey || existingData.activeChatWidgetKey || existingData.chatWidgetKey || generateChatWidgetKey()
    )
    const widgetRef = doc(db, `businesses/${businessId}/chatWidgets/${targetWidgetKey}`)
    const widgetSnap = await getDoc(widgetRef)
    const widgetData = widgetSnap.exists() ? widgetSnap.data() || {} : {}
    const baseConfig = (widgetData.config || existingConfig || {}) as Partial<ChatWidgetConfig>
    const plan = (config?.plan || baseConfig.plan || 'free') as SubscriptionPlan
    const allowedDomains =
      config?.allowedDomains !== undefined
        ? parseAllowedDomainsInput(config.allowedDomains)
        : parseAllowedDomainsInput(baseConfig.allowedDomains)
    const mergedConfig: Partial<ChatWidgetConfig> = {
      ...baseConfig,
      ...config,
      allowedDomains,
      bubbleStyle: config?.bubbleStyle
        ? sanitizeBubbleStyleForPlan(config.bubbleStyle, plan)
        : baseConfig.bubbleStyle,
    }

    const widgetDocPayload = {
      widgetKey: targetWidgetKey,
      name: String(widgetData.name || config?.customBranding?.title || existingData.name || 'Chat Widget'),
      config: mergedConfig,
      isDefault: Boolean(widgetData.isDefault || targetWidgetKey === existingData.chatWidgetKey || targetWidgetKey === existingData.activeChatWidgetKey),
      createdAt: widgetData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(widgetRef, widgetDocPayload, { merge: true })

    if (!widgetKey || targetWidgetKey === existingData.chatWidgetKey || targetWidgetKey === existingData.activeChatWidgetKey) {
      await updateDoc(businessRef, {
        chatWidgetKey: targetWidgetKey,
        activeChatWidgetKey: targetWidgetKey,
        chatWidgetConfig: mergedConfig,
        updatedAt: serverTimestamp(),
      })
    } else {
      await updateDoc(businessRef, {
        updatedAt: serverTimestamp(),
      })
    }

    return { success: true, message: "Widget config oppdatert", widgetKey: targetWidgetKey };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function listChatWidgets(businessId: string) {
  const businessRef = doc(db, 'businesses', businessId)
  const businessSnap = await getDoc(businessRef)
  const businessData = businessSnap.exists() ? businessSnap.data() || {} : {}
  const widgetSnap = await getDocs(collection(db, `businesses/${businessId}/chatWidgets`))
  const widgets = sortChatWidgetsByCreation(widgetSnap.docs.map(mapWidgetRecord))

  if (widgets.length > 0) {
    return widgets
  }

  const legacyConfig = businessData.chatWidgetConfig as Partial<ChatWidgetConfig> | undefined
  if (!legacyConfig) return []

  const legacyWidgetKey = String(businessData.chatWidgetKey || businessData.activeChatWidgetKey || 'main-widget')
  return [{
    id: legacyWidgetKey,
    widgetKey: legacyWidgetKey,
    name: 'Main widget',
    config: mergeWidgetConfig(legacyConfig, String(businessData.name || 'Chat Widget')),
    assistantConfig: businessData.chatAssistantConfig as ChatAssistantConfig | undefined,
    isDefault: true,
    createdAt: businessData.createdAt?.toDate?.() || new Date(),
    updatedAt: businessData.updatedAt?.toDate?.() || new Date(),
  }]
}

export async function createChatWidget(
  businessId: string,
  name?: string,
  templateWidgetKey?: string,
  assistantConfigOverride?: Partial<ChatAssistantConfig>
) {
  const businessRef = doc(db, 'businesses', businessId)
  const businessSnap = await getDoc(businessRef)
  if (!businessSnap.exists()) {
    return { success: false, message: 'Business not found' }
  }

  const businessData = businessSnap.data() || {}
  const widgets = await listChatWidgets(businessId)
  const currentPlan = (businessData.chatWidgetConfig?.plan || widgets[0]?.config?.plan || 'free') as SubscriptionPlan
  const widgetLimit = getPlanLimits(currentPlan).maxWidgets

  if (widgetLimit !== null && widgets.length >= widgetLimit) {
    return {
      success: false,
      message:
        currentPlan === 'free'
          ? 'Free plan supports only one chat widget.'
          : `Plan limit reached for ${currentPlan}.`,
    }
  }

  const sourceWidget =
    (templateWidgetKey
      ? widgets.find((widget) => widget.widgetKey === templateWidgetKey)
      : undefined) ||
    widgets[0] ||
    {
      id: 'template',
      widgetKey: 'template',
      name: 'Main widget',
      config: buildDefaultWidgetConfig(String(businessData.name || 'Chat Widget')),
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

  const widgetKey = generateChatWidgetKey()
  const widgetRef = doc(db, `businesses/${businessId}/chatWidgets/${widgetKey}`)
  const widgetName = String(name || `Widget ${widgets.length + 1}`)

  await setDoc(widgetRef, {
    widgetKey,
    name: widgetName,
    config: {
      ...sourceWidget.config,
      customBranding: {
        ...sourceWidget.config.customBranding,
        title: name || sourceWidget.config.customBranding?.title || widgetName,
      },
    },
    assistantConfig:
      assistantConfigOverride ||
      sourceWidget.assistantConfig ||
      (businessData.chatAssistantConfig as ChatAssistantConfig | undefined) ||
      buildDefaultAssistantConfig(),
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { success: true, widgetKey, message: 'Chat widget created' }
}

export async function setActiveChatWidget(
  businessId: string,
  widgetKey: string
) {
  const businessRef = doc(db, 'businesses', businessId)
  const widgetRef = doc(db, `businesses/${businessId}/chatWidgets/${widgetKey}`)
  const widgetSnap = await getDoc(widgetRef)

  if (!widgetSnap.exists()) {
    return { success: false, message: 'Widget not found' }
  }

  const widgetData = widgetSnap.data() || {}

  await updateDoc(businessRef, {
    chatWidgetKey: widgetKey,
    activeChatWidgetKey: widgetKey,
    chatWidgetConfig: widgetData.config || null,
    chatAssistantConfig: widgetData.assistantConfig || null,
    updatedAt: serverTimestamp(),
  })

  return { success: true, message: 'Active widget updated' }
}

export async function deleteChatWidget(
  businessId: string,
  widgetKey: string
) {
  const businessRef = doc(db, 'businesses', businessId)
  const widgetRef = doc(db, `businesses/${businessId}/chatWidgets/${widgetKey}`)
  const businessSnap = await getDoc(businessRef)
  const widgetSnap = await getDoc(widgetRef)

  if (!businessSnap.exists() || !widgetSnap.exists()) {
    return { success: false, message: 'Widget not found' }
  }

  const widgets = await listChatWidgets(businessId)

  await deleteDoc(widgetRef)

  const remainingWidgets = widgets.filter((widget) => widget.widgetKey !== widgetKey)
  const nextActive = remainingWidgets[0]
  if (nextActive) {
    await updateDoc(businessRef, {
      chatWidgetKey: nextActive.widgetKey,
      activeChatWidgetKey: nextActive.widgetKey,
      chatWidgetConfig: nextActive.config,
      chatAssistantConfig: nextActive.assistantConfig || null,
      updatedAt: serverTimestamp(),
    })
  } else {
    await updateDoc(businessRef, {
      chatWidgetKey: '',
      activeChatWidgetKey: '',
      chatWidgetConfig: null,
      chatAssistantConfig: null,
      updatedAt: serverTimestamp(),
    })
  }

  return { success: true, message: 'Widget deleted' }
}

export async function updateChatAssistantConfig(
  businessId: string,
  config: Partial<ChatAssistantConfig>,
  widgetKey?: string
) {
  try {
    const businessRef = doc(db, "businesses", businessId);
    const businessSnap = await getDoc(businessRef)
    const businessData = businessSnap.exists() ? businessSnap.data() || {} : {}
    const targetWidgetKey = String(widgetKey || businessData.activeChatWidgetKey || businessData.chatWidgetKey || '')
    const widgetRef = targetWidgetKey ? doc(db, `businesses/${businessId}/chatWidgets/${targetWidgetKey}`) : null
    const widgetSnap = widgetRef ? await getDoc(widgetRef) : null
    const widgetData = widgetSnap?.exists() ? widgetSnap.data() || {} : {}
    const mergedAssistantConfig = mergeAssistantConfig(
      businessData.chatAssistantConfig as Partial<ChatAssistantConfig> | undefined,
      widgetData.assistantConfig as Partial<ChatAssistantConfig> | undefined
    )
    const nextAssistantConfig = mergeAssistantConfig(mergedAssistantConfig, config)

    if (widgetRef) {
      await setDoc(widgetRef, {
        widgetKey: targetWidgetKey,
        assistantConfig: nextAssistantConfig,
        createdAt: widgetSnap?.exists() ? widgetData.createdAt || serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }

    await updateDoc(businessRef, {
      chatAssistantConfig: nextAssistantConfig,
      ...(targetWidgetKey ? { activeChatWidgetKey: targetWidgetKey } : {}),
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: "AI config oppdatert" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
