import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { normalizeConversationCards } from '@/lib/conversation-cards'

type AssistantConfigBody = Record<string, any>

function removeUndefinedValues<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => removeUndefinedValues(entry)) as T
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefinedValues(entryValue)])
    ) as T
  }

  return value
}

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

function buildDefaultAssistantConfig(businessName = '') {
  return {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    strictContextOnly: true,
    strictness: 'balanced',
    systemPrompt:
      'You are a helpful customer service assistant. Use approved business information first, stay honest, and do not invent facts.',
    businessContext: '',
    businessProfile: {
      businessName,
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
      'Do not invent company policies, prices, or guarantees that are not in the configured context.',
    supportTriggerKeywords: ['support', 'human', 'agent', 'contact'],
    humanSupportEnabled: true,
    handoffMessage:
      'I will flag this conversation for human follow-up so the team can contact you.',
    faqSuggestionsEnabled: true,
    faqSuggestions: [
      'What are your opening hours?',
      'How do I contact support?',
      'What services do you offer?',
    ],
    conversationCardsEnabled: true,
    conversationCardsLimit: 4,
    conversationCards: [],
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

function normalizeAssistantConfig(body: AssistantConfigBody, businessName = '') {
  const defaults = buildDefaultAssistantConfig(businessName)

  return {
    ...defaults,
    ...body,
    businessProfile: {
      ...defaults.businessProfile,
      ...(body.businessProfile || {}),
    },
    knowledgeBase: {
      ...defaults.knowledgeBase,
      ...(body.knowledgeBase || {}),
      websiteUrls: Array.isArray(body.knowledgeBase?.websiteUrls)
        ? body.knowledgeBase.websiteUrls.map((value: string) => String(value).trim()).filter(Boolean)
        : defaults.knowledgeBase.websiteUrls,
      uploadedDocuments: Array.isArray(body.knowledgeBase?.uploadedDocuments)
        ? body.knowledgeBase.uploadedDocuments
        : defaults.knowledgeBase.uploadedDocuments,
      keyFAQs: Array.isArray(body.knowledgeBase?.keyFAQs)
        ? body.knowledgeBase.keyFAQs.map((value: string) => String(value).trim()).filter(Boolean)
        : defaults.knowledgeBase.keyFAQs,
    },
    integrations: {
      ...defaults.integrations,
      ...(body.integrations || {}),
    },
    widgetIcons: {
      ...defaults.widgetIcons,
      ...(body.widgetIcons || {}),
    },
    supportTriggerKeywords: Array.isArray(body.supportTriggerKeywords)
      ? body.supportTriggerKeywords.map((value: string) => String(value).trim()).filter(Boolean)
      : defaults.supportTriggerKeywords,
    faqSuggestions: Array.isArray(body.faqSuggestions)
      ? body.faqSuggestions.map((value: string) => String(value).trim()).filter(Boolean)
      : defaults.faqSuggestions,
    conversationCards: normalizeConversationCards(body.conversationCards || defaults.conversationCards),
    conversationCardsLimit: Number.isFinite(body.conversationCardsLimit)
      ? Math.max(1, Math.min(12, Math.floor(Number(body.conversationCardsLimit))))
      : defaults.conversationCardsLimit,
    enabled: typeof body.enabled === 'boolean' ? body.enabled : defaults.enabled,
    provider: typeof body.provider === 'string' ? body.provider : defaults.provider,
    model: typeof body.model === 'string' ? body.model : defaults.model,
    strictContextOnly:
      typeof body.strictContextOnly === 'boolean' ? body.strictContextOnly : defaults.strictContextOnly,
    strictness: typeof body.strictness === 'string' ? body.strictness : defaults.strictness,
    systemPrompt: typeof body.systemPrompt === 'string' ? body.systemPrompt : defaults.systemPrompt,
    businessContext: typeof body.businessContext === 'string' ? body.businessContext : defaults.businessContext,
    restrictions: typeof body.restrictions === 'string' ? body.restrictions : defaults.restrictions,
    humanSupportEnabled:
      typeof body.humanSupportEnabled === 'boolean' ? body.humanSupportEnabled : defaults.humanSupportEnabled,
    handoffMessage: typeof body.handoffMessage === 'string' ? body.handoffMessage : defaults.handoffMessage,
    faqSuggestionsEnabled:
      typeof body.faqSuggestionsEnabled === 'boolean' ? body.faqSuggestionsEnabled : defaults.faqSuggestionsEnabled,
    startLanguage: typeof body.startLanguage === 'string' ? body.startLanguage : defaults.startLanguage,
    replyInUserLanguage:
      typeof body.replyInUserLanguage === 'boolean' ? body.replyInUserLanguage : defaults.replyInUserLanguage,
    responseStyle: typeof body.responseStyle === 'string' ? body.responseStyle : defaults.responseStyle,
    extraInstructions:
      typeof body.extraInstructions === 'string' ? body.extraInstructions : defaults.extraInstructions,
    forceSelectedModelOnly:
      typeof body.forceSelectedModelOnly === 'boolean'
        ? body.forceSelectedModelOnly
        : defaults.forceSelectedModelOnly,
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || ''
    const token = authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice(7).trim()
      : ''

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }

    const decoded = await adminAuth.verifyIdToken(token)
    const body = await req.json()
    const businessId = String(body.businessId || '').trim()

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessSnap = await businessRef.get()
    if (!businessSnap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessData = businessSnap.data() || {}
    const userRef = businessRef.collection('users').doc(decoded.uid)
    const userSnap = await userRef.get()
    const isAdmin =
      Boolean(userSnap.exists && String(userSnap.data()?.role || '').toLowerCase() === 'admin') ||
      String(businessData.ownerId || '') === decoded.uid

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const widgetKey = String(body.widgetKey || businessData.activeChatWidgetKey || businessData.chatWidgetKey || '').trim()
    const assistantConfig = removeUndefinedValues(
      normalizeAssistantConfig(body.assistantConfig || {}, String(businessData.name || ''))
    )
    const widgetsSnap = await businessRef.collection('chatWidgets').get()
    const batch = adminDb.batch()

    batch.update(businessRef, {
      chatAssistantConfig: assistantConfig,
      ...(widgetKey ? { activeChatWidgetKey: widgetKey } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    })

    widgetsSnap.docs.forEach((widgetDoc) => {
      batch.set(
        widgetDoc.ref,
        {
          widgetKey: String(widgetDoc.data().widgetKey || widgetDoc.id),
          assistantConfig,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    })

    if (widgetKey && !widgetsSnap.docs.some((widgetDoc) => widgetDoc.id === widgetKey)) {
      const widgetRef = businessRef.collection('chatWidgets').doc(widgetKey)
      batch.set(
        widgetRef,
        {
          widgetKey,
          assistantConfig,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await batch.commit()

    return NextResponse.json({ success: true, widgetKey })
  } catch (error) {
    console.error('Chat widget update error:', error)
    const headers = corsHeaders(req.headers.get('origin'))
    const details = process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined
    return NextResponse.json({ error: 'Failed to update assistant config', details }, { status: 500, headers })
  }
}
