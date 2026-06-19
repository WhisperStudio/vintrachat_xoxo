import crypto from 'node:crypto'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { defaultConversationCards } from '@/lib/conversation-cards'
import type {
  ChatAnalytics,
  ChatAssistantConfig,
  ChatWidgetConfig,
  SupportTaskCategory,
} from '@/types/database'
import { normalizeEmail } from '@/lib/vintra-admin'

function generateToken(length = 30) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length })
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join('')
}

function generateSecureSecret(bytesLength = 32) {
  return crypto.randomBytes(bytesLength).toString('hex')
}

function generateChatWidgetKey() {
  return generateToken(24)
}

export function hashOpaqueToken(token: string) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex')
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
}))

function buildDefaultWidgetConfig(businessName: string): ChatWidgetConfig {
  return {
    plan: 'free',
    billingCycle: 'monthly',
    colorTheme: 'modern',
    appearance: {
      glassLookEnabled: false,
    },
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
    widgetIcons: {
      launcherIcon: 'FiMessageCircle',
      avatarIcon: 'FiMessageCircle',
      heroIcon: 'FiMessageCircle',
      closeIcon: 'FiX',
      backIcon: 'FiArrowLeft',
      sendIcon: 'FiSend',
      aiIcon: 'FiCpu',
      supportIcon: 'FiLifeBuoy',
      userIcon: 'FiUser',
    },
    visibility: {
      showOnPaths: [],
      hideOnPaths: [],
    },
    settings: {
      autoOpen: false,
      delayMs: 3000,
      tasksEnabled: false,
      reviewsEnabled: false,
    },
    allowedDomains: [],
  }
}

function buildDefaultAssistantConfig(businessName: string, email: string): ChatAssistantConfig {
  return {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    strictContextOnly: true,
    strictness: 'balanced',
    systemPrompt:
      'You are a helpful customer service assistant for the business. Use approved business information, keep answers concise, and be honest about uncertainty.',
    businessContext: '',
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
    widgetIcons: {
      avatarIcon: 'FiMessageCircle',
      heroIcon: 'FiMessageCircle',
      aiIcon: 'FiCpu',
      supportIcon: 'FiLifeBuoy',
      userIcon: 'FiUser',
    },
    startLanguage: 'English',
    replyInUserLanguage: true,
    responseStyle: 'Friendly, clear, and concise',
    extraInstructions: 'Always keep answers short unless the user asks for more detail.',
    forceSelectedModelOnly: false,
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

function readDate(value: unknown) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value && 'toDate' in value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

async function createBusinessWithWidgetsServer(userId: string, businessName: string, email: string) {
  const normalizedEmail = normalizeEmail(email)
  const businessRef = adminDb.collection('businesses').doc()
  const businessId = businessRef.id
  const widgetKey = generateChatWidgetKey()
  const widgetConfig = buildDefaultWidgetConfig(businessName)
  const assistantConfig = buildDefaultAssistantConfig(businessName, normalizedEmail)

  await businessRef.set({
    name: businessName,
    email: normalizedEmail,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await businessRef.collection('users').doc(userId).set({
    email: normalizedEmail,
    role: 'admin',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await businessRef.collection('chatWidgets').doc(widgetKey).set({
    widgetKey,
    name: 'Main widget',
    config: widgetConfig,
    assistantConfig,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return businessId
}

export async function activatePendingAuthToken(rawToken: string) {
  const token = String(rawToken || '').trim()
  if (!token) {
    return { success: false as const, message: 'Ugyldig token' }
  }

  const tokenHash = hashOpaqueToken(token)
  let snap = await adminDb
    .collection('pending_auth')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get()

  if (snap.empty) {
    snap = await adminDb
      .collection('pending_auth')
      .where('token', '==', token)
      .limit(1)
      .get()
  }

  if (snap.empty) {
    return { success: false as const, message: 'Ugyldig token' }
  }

  const docSnap = snap.docs[0]
  const data = docSnap.data() || {}
  const userId = docSnap.id
  const expiresAt = readDate(data.expiresAt)

  if (!expiresAt || expiresAt.getTime() < Date.now()) {
    await docSnap.ref.delete().catch(() => undefined)
    return { success: false as const, message: 'Verifiseringslenken har utløpt.' }
  }

  const email = normalizeEmail(String(data.email || data.normalizedEmail || ''))
  if (!email) {
    return { success: false as const, message: 'Fant ingen gyldig konto for verifisering.' }
  }

  try {
    const authUser = await adminAuth.getUser(userId)
    const authEmail = normalizeEmail(authUser.email || '')
    if (!authEmail || authEmail !== email) {
      return { success: false as const, message: 'Verifiseringsdata stemmer ikke med kontoen.' }
    }
  } catch {
    return { success: false as const, message: 'Fant ingen gyldig konto for verifisering.' }
  }

  try {
    if (data.accountType === 'business' && typeof data.businessName === 'string' && data.businessName.trim()) {
      const existingBusiness = await adminDb
        .collection('businesses')
        .where('ownerId', '==', userId)
        .limit(1)
        .get()

      if (!existingBusiness.empty) {
        await docSnap.ref.delete().catch(() => undefined)
        return {
          success: true as const,
          message: `Business "${data.businessName.trim()}" opprettet! Du er nå admin.`,
          businessId: existingBusiness.docs[0].id,
        }
      }

      const businessId = await createBusinessWithWidgetsServer(userId, data.businessName.trim(), email)
      await docSnap.ref.delete()

      return {
        success: true as const,
        message: `Business "${data.businessName.trim()}" opprettet! Du er nå admin.`,
        businessId,
      }
    }

    await adminDb.collection('pending_users').doc(userId).set({
      email,
      displayName: typeof data.displayName === 'string' ? data.displayName.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await docSnap.ref.delete()

    return {
      success: true as const,
      message: 'Email verifisert. Du venter nå på invitasjon fra en bedrift.',
    }
  } catch (error) {
    console.error('Verify email error:', error)
    return { success: false as const, message: 'Feil ved verifisering' }
  }
}
