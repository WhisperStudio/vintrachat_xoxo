import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { getDailyConversationCount, getPlanLimits, getTodayUsageKey } from '@/lib/subscription'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

type IncomingMessage = {
  id?: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
}

type GeminiResult = {
  reply: string
  needsHumanSupport: boolean
  modelUsed: string
}

class GeminiApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'GeminiApiError'
    this.status = status
  }
}

const fallbackSupportKeywords = [
  'support',
  'human',
  'person',
  'agent',
  'contact',
  'call me',
  'email me',
  'customer service',
]

const fallbackFeedbackKeywords = [
  'feedback',
  'review',
  'rating',
  'star',
  'stars',
  'vurdering',
  'anmeldelse',
  'tilbakemelding',
]

function trimHistory(history: unknown[]): IncomingMessage[] {
  return history
    .filter((message): message is IncomingMessage => {
      return (
        typeof message === 'object' &&
        message !== null &&
        'text' in message &&
        typeof message.text === 'string' &&
        message.text.trim().length > 0
      )
    })
    .slice(-10)
    .map((message): IncomingMessage => ({
      id: message.id || crypto.randomUUID(),
      role: message.role === 'assistant' ? 'assistant' : 'user',
      text: message.text.trim(),
      createdAt: message.createdAt || new Date().toISOString(),
    }))
}

function didUserRequestHumanSupport(message: string, keywords: string[]) {
  const normalized = message.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

function didUserRequestFeedback(message: string, keywords: string[]) {
  const normalized = message.toLowerCase()
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))
}

function getRequestCountryCode(req: NextRequest) {
  const headerCountry =
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    (req as any).geo?.country

  const country = String(headerCountry || 'XX').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(country) ? country : 'XX'
}

function createAnalyticsEvent(
  kind: string,
  sessionId: string,
  countryCode?: string
) {
  return {
    id: crypto.randomUUID(),
    kind,
    sessionId,
    countryCode,
    createdAt: new Date(),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function supportsNativeJsonMode(model: string) {
  return !model.toLowerCase().startsWith('gemma-')
}

function parseModelList(value?: string | null) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function getGeminiModelFallbacks(primaryModel: string) {
  const configuredFallbacks = parseModelList(process.env.GEMINI_MODEL_FALLBACKS)
  const defaultFallbacks = ['gemma-3-27b-it', 'gemma-3-12b-it', 'gemma-3-4b-it', 'gemma-3-1b-it']
  const preferredOrder = configuredFallbacks.length > 0 ? configuredFallbacks : defaultFallbacks
  return [primaryModel, ...preferredOrder].filter((model, index, self) => self.indexOf(model) === index)
}

function extractGeminiResult(rawText: string): Omit<GeminiResult, 'modelUsed'> {
  try {
    const parsed = JSON.parse(rawText)

    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply : 'I could not generate a reply.',
      needsHumanSupport: Boolean(parsed.needsHumanSupport),
    }
  } catch {
    const replyMatch = rawText.match(/"reply"\s*:\s*"([\s\S]*?)"/)
    const supportMatch = rawText.match(/"needsHumanSupport"\s*:\s*(true|false)/i)

    const reply = replyMatch?.[1]
      ? replyMatch[1]
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .trim()
      : rawText.trim()

    return {
      reply: reply || 'I could not generate a reply.',
      needsHumanSupport: supportMatch?.[1]?.toLowerCase() === 'true',
    }
  }
}

function buildPrompt(args: {
  businessName: string
  systemPrompt: string
  businessContext: string
  restrictions: string
  strictContextOnly: boolean
  supportKeywords: string[]
  faqSuggestions: string[]
  replyInUserLanguage: boolean
  responseStyle: string
  extraInstructions: string
  history: IncomingMessage[]
  message: string
}) {
  const historyText = args.history
    .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.text}`)
    .join('\n')

  const faqSuggestions = args.faqSuggestions
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
  const faqText = faqSuggestions.length
    ? faqSuggestions.map((item) => `- ${item}`).join('\n')
    : 'No FAQ suggestions configured.'

  const languageRule = args.replyInUserLanguage
    ? 'Reply in the same language as the latest user message. Match Norwegian with Norwegian and English with English.'
    : 'Reply in the language that best fits the conversation and business context.'

  return [
    `You are the website assistant for ${args.businessName}.`,
    args.systemPrompt,
    languageRule,
    args.strictContextOnly
      ? 'Use only the provided business context for factual claims. If context is missing, say that clearly.'
      : 'Use the provided context as your primary source, but you may answer generally when the context is silent.',
    `Business context:\n${args.businessContext || 'No business context has been configured yet.'}`,
    `Restrictions:\n${args.restrictions || 'No additional restrictions configured.'}`,
    args.responseStyle ? `Response style:\n${args.responseStyle}` : 'Response style:\nKeep the answer natural and helpful.',
    args.extraInstructions ? `Extra instructions:\n${args.extraInstructions}` : 'Extra instructions:\nNone.',
    `FAQ suggestions / common questions to anticipate:\n${faqText}`,
    `Treat these phrases as likely requests for human support: ${args.supportKeywords.join(', ')}`,
    'Return JSON with keys "reply" and "needsHumanSupport".',
    'Set "needsHumanSupport" to true only when the user explicitly asks to contact support, a human, an agent, or similar human follow-up.',
    'Keep the reply concise and suitable for a website chat widget.',
    historyText ? `Conversation so far:\n${historyText}` : 'Conversation so far:\nNo previous messages.',
    `Latest user message:\n${args.message}`,
  ].join('\n\n')
}

function buildNameRequestReply() {
  return 'To contact human support, please write your name first. Is there anything else I can help you with?'
}

async function generateGeminiReply(prompt: string, model: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      reply:
        'AI is ready in the app, but Gemini is not configured yet. Add GEMINI_API_KEY to enable live answers.',
      needsHumanSupport: false,
      modelUsed: model,
    }
  }

  const retryDelays = [800, 1600, 3000]
  const modelCandidates = getGeminiModelFallbacks(model)

  for (const candidate of modelCandidates) {
    const useNativeJsonMode = supportsNativeJsonMode(candidate)

    for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: useNativeJsonMode
              ? {
                  responseMimeType: 'application/json',
                  responseJsonSchema: {
                    type: 'object',
                    properties: {
                      reply: {
                        type: 'string',
                        description: 'The assistant reply shown to the visitor.',
                      },
                      needsHumanSupport: {
                        type: 'boolean',
                        description:
                          'True only when the visitor explicitly asks for human support or contact.',
                      },
                    },
                    required: ['reply', 'needsHumanSupport'],
                  },
                }
              : undefined,
          }),
        }
      )

      if (response.ok) {
        const json = await response.json()
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!rawText) {
          throw new Error('Gemini returned no text')
        }

        return {
          ...extractGeminiResult(rawText),
          modelUsed: candidate,
        }
      }

      const errorText = await response.text()
      const retryable =
        response.status === 429 ||
        response.status === 503 ||
        /quota|resource exhausted|too many requests/i.test(errorText)

      if (retryable && attempt < retryDelays.length) {
        await sleep(retryDelays[attempt])
        continue
      }

      if (retryable) {
        break
      }

      throw new GeminiApiError(response.status, `Gemini request failed: ${response.status} ${errorText}`)
    }
  }

  throw new Error('Gemini request failed after retries and model fallbacks')
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: NextRequest) {
  try {
    const headers = corsHeaders(req.headers.get('origin'))
    const body = await req.json()
    const widgetKey = String(body.widgetKey || '')
    const message = String(body.message || '').trim()
    const sessionId = String(body.sessionId || crypto.randomUUID())
    const pageTitle = body.pageTitle ? String(body.pageTitle) : undefined
    const pageUrl = body.pageUrl ? String(body.pageUrl) : undefined
    const visitorName = body.visitorName ? String(body.visitorName).trim() : ''
    const countryCode = getRequestCountryCode(req)
    const requestHumanSupport = Boolean(body.requestHumanSupport)
    const supportRequestText = body.supportRequestText ? String(body.supportRequestText).trim() : ''
    const history = trimHistory(Array.isArray(body.history) ? body.history : [])
    const requestFeedbackForm = didUserRequestFeedback(message, fallbackFeedbackKeywords)

    if (!widgetKey || (!message && !requestHumanSupport)) {
      return NextResponse.json(
        { error: 'Missing widget key or message' },
        { status: 400, headers }
      )
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const plan = business.chatWidgetConfig.plan || 'free'
    const planLimits = getPlanLimits(plan)
    const todayKey = getTodayUsageKey()
    const currentDailyConversationCount = getDailyConversationCount(business.chatAnalytics, new Date())
    const isNewConversation = !body.sessionId

    if (
      plan === 'free' &&
      isNewConversation &&
      planLimits.maxDailyConversations !== null &&
      currentDailyConversationCount >= planLimits.maxDailyConversations
    ) {
      return NextResponse.json(
        { error: 'The Limit for todays usages is met' },
        { status: 429, headers }
      )
    }

    const assistantConfig = business.chatAssistantConfig || {
      enabled: true,
      provider: 'gemini' as const,
      model: 'gemma-3-4b-it',
      strictContextOnly: true,
      systemPrompt: '',
      businessContext: '',
      restrictions: '',
      supportTriggerKeywords: fallbackSupportKeywords,
      handoffMessage:
        'I understand. I am putting you through to a human assistant now. Please hold on while I connect you with someone available.',
      faqSuggestionsEnabled: false,
      faqSuggestions: [],
      replyInUserLanguage: true,
      responseStyle: '',
      extraInstructions: '',
    }

    if (requestFeedbackForm) {
      const businessRef = adminDb.collection('businesses').doc(business.id)
      const todayKey = getTodayUsageKey()
      const analyticsTimelineEvents = [createAnalyticsEvent('visitor-message', sessionId, countryCode)]

      if (!body.sessionId) {
        analyticsTimelineEvents.unshift(createAnalyticsEvent('session-start', sessionId, countryCode))
      }

      const finalReply = 'Absolutely. I opened a quick feedback form for you.'

      await businessRef.update({
        updatedAt: FieldValue.serverTimestamp(),
        'chatAnalytics.totalMessages': FieldValue.increment(1),
        'chatAnalytics.lastChatAt': FieldValue.serverTimestamp(),
        [`chatAnalytics.countryCounts.${countryCode}`]: FieldValue.increment(1),
        'chatAnalytics.timeline': FieldValue.arrayUnion(...analyticsTimelineEvents),
        ...(body.sessionId ? {} : {
          'chatAnalytics.totalSessions': FieldValue.increment(1),
          'chatAnalytics.aiOnlySessions': FieldValue.increment(1),
          [`chatAnalytics.dailyConversationCounts.${todayKey}`]: FieldValue.increment(1),
        }),
      })

      return NextResponse.json(
        {
          sessionId,
          reply: finalReply,
          feedbackFormRequested: true,
          countryCode,
        },
        { headers }
      )
    }

    if (requestHumanSupport) {
      if (!visitorName) {
        return NextResponse.json(
          {
            sessionId,
            reply: buildNameRequestReply(),
            supportRequested: false,
            visitorNameRequired: true,
            countryCode,
          },
          { headers }
        )
      }

      if (!supportRequestText) {
        return NextResponse.json(
          { error: 'Missing support request text' },
          { status: 400, headers }
        )
      }

      const now = new Date()
      const userSupportMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: supportRequestText,
        createdAt: now.toISOString(),
      }
      const assistantSupportMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: assistantConfig.handoffMessage || buildNameRequestReply(),
        createdAt: now.toISOString(),
      }
      const supportMessages = [userSupportMessage, assistantSupportMessage]
      const businessRef = adminDb.collection('businesses').doc(business.id)
      const supportChatRef = businessRef.collection('supportChats').doc(sessionId)
      const supportChatSnap = await supportChatRef.get()
      const isNewSupportChat = !supportChatSnap.exists

      await supportChatRef.set(
        {
          sessionId,
          widgetKey,
          businessId: business.id,
          status: 'needs-human',
          source: 'widget',
          preview: supportRequestText,
          visitorName,
          countryCode,
          pageTitle: pageTitle || null,
          pageUrl: pageUrl || null,
          messageCount: supportMessages.length,
          messages: supportMessages,
          supportRequestedAt: supportChatSnap.exists
            ? supportChatSnap.data()?.supportRequestedAt || FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          createdAt: supportChatSnap.exists
            ? supportChatSnap.data()?.createdAt || FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      const analyticsUpdates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
        'chatAnalytics.totalMessages': FieldValue.increment(1),
        'chatAnalytics.lastChatAt': FieldValue.serverTimestamp(),
        'chatAnalytics.supportRequests': FieldValue.increment(isNewSupportChat ? 1 : 0),
        'chatAnalytics.savedSupportChats': FieldValue.increment(isNewSupportChat ? 1 : 0),
        [`chatAnalytics.countryCounts.${countryCode}`]: FieldValue.increment(1),
        'chatAnalytics.timeline': FieldValue.arrayUnion(
          createAnalyticsEvent('support-request', sessionId, countryCode)
        ),
      }

      await businessRef.update(analyticsUpdates)

      return NextResponse.json(
        {
          sessionId,
          reply: assistantConfig.handoffMessage || 'The chat has been handed over to human support.',
          supportRequested: true,
          countryCode,
        },
        { headers }
      )
    }

    const supportKeywords =
      assistantConfig.supportTriggerKeywords?.length > 0
        ? assistantConfig.supportTriggerKeywords
        : fallbackSupportKeywords

    const heuristicsTriggered = didUserRequestHumanSupport(message, supportKeywords)

    let aiReply = 'The AI assistant is currently disabled.'
    let aiWantsHumanSupport = false

    if (assistantConfig.enabled) {
      const prompt = buildPrompt({
        businessName: business.name,
        systemPrompt: assistantConfig.systemPrompt,
        businessContext: assistantConfig.businessContext,
        restrictions: assistantConfig.restrictions,
        strictContextOnly: assistantConfig.strictContextOnly,
        supportKeywords,
        faqSuggestions:
          assistantConfig.faqSuggestionsEnabled && Array.isArray(assistantConfig.faqSuggestions)
            ? assistantConfig.faqSuggestions
            : [],
        replyInUserLanguage: assistantConfig.replyInUserLanguage !== false,
        responseStyle: assistantConfig.responseStyle || '',
        extraInstructions: assistantConfig.extraInstructions || '',
        history,
        message,
      })

      try {
        const result = await generateGeminiReply(
          prompt,
          assistantConfig.model || process.env.GEMINI_MODEL || 'gemma-3-4b-it'
        )

        aiReply = result.reply
        aiWantsHumanSupport = result.needsHumanSupport
        assistantConfig.model = result.modelUsed
      } catch (error) {
        if (error instanceof GeminiApiError && (error.status === 429 || error.status === 503)) {
          console.warn('Gemini temporarily unavailable:', error.message)
          aiReply =
            'AI assistant is temporarily unavailable right now. Please try again in a little while.'
          aiWantsHumanSupport = false
        } else {
          throw error
        }
      }
    }

    const needsHumanSupport = heuristicsTriggered || aiWantsHumanSupport
    const requiresName = needsHumanSupport && !visitorName
    const finalReply =
      requiresName
      ? buildNameRequestReply()
        : needsHumanSupport && assistantConfig.handoffMessage
        ? `${aiReply}\n\n${assistantConfig.handoffMessage}`.trim()
        : aiReply

    const now = new Date()
    const messageTimeline: IncomingMessage[] = [
      ...history,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: message,
        createdAt: now.toISOString(),
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: finalReply,
        createdAt: now.toISOString(),
      },
    ]

    const businessRef = adminDb.collection('businesses').doc(business.id)
    const supportChatRef = businessRef.collection('supportChats').doc(sessionId)
    const supportChatSnap = await supportChatRef.get()
    const existingSupportChat = supportChatSnap.exists ? supportChatSnap.data() || {} : null
    const isNewSupportChat = needsHumanSupport && !requiresName && !supportChatSnap.exists

    const analyticsTimelineEvents = [createAnalyticsEvent('visitor-message', sessionId, countryCode)]

    if (!body.sessionId) {
      analyticsTimelineEvents.unshift(createAnalyticsEvent('session-start', sessionId, countryCode))
    }

    if (needsHumanSupport && !requiresName) {
      analyticsTimelineEvents.push(createAnalyticsEvent('support-request', sessionId, countryCode))
    }

    const analyticsUpdates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      'chatAnalytics.totalMessages': FieldValue.increment(1),
      'chatAnalytics.lastChatAt': FieldValue.serverTimestamp(),
      [`chatAnalytics.countryCounts.${countryCode}`]: FieldValue.increment(1),
      'chatAnalytics.timeline': FieldValue.arrayUnion(...analyticsTimelineEvents),
    }

    if (isNewConversation) {
      analyticsUpdates['chatAnalytics.totalSessions'] = FieldValue.increment(1)
      analyticsUpdates['chatAnalytics.aiOnlySessions'] = FieldValue.increment(1)
      analyticsUpdates[`chatAnalytics.dailyConversationCounts.${todayKey}`] = FieldValue.increment(1)
    }

    if (assistantConfig.enabled) {
      analyticsUpdates[`chatAnalytics.modelUsage.${assistantConfig.model || process.env.GEMINI_MODEL || 'gemma-3-4b-it'}`] =
        FieldValue.increment(1)
    }

    if (needsHumanSupport && !requiresName) {
      analyticsUpdates['chatAnalytics.supportRequests'] = FieldValue.increment(
        isNewSupportChat ? 1 : 0
      )
      analyticsUpdates['chatAnalytics.savedSupportChats'] = FieldValue.increment(
        isNewSupportChat ? 1 : 0
      )
      if (!body.sessionId) {
        analyticsUpdates['chatAnalytics.aiOnlySessions'] = FieldValue.increment(-1)
      }

      await supportChatRef.set(
        {
          sessionId,
          widgetKey,
          businessId: business.id,
          status: 'needs-human',
          source: 'widget',
          preview: message,
          visitorName: visitorName || null,
          countryCode,
          pageTitle: pageTitle || null,
          pageUrl: pageUrl || null,
          messageCount: messageTimeline.length,
          messages: messageTimeline,
          supportRequestedAt: supportChatSnap.exists
            ? supportChatSnap.data()?.supportRequestedAt || FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          createdAt: supportChatSnap.exists
            ? supportChatSnap.data()?.createdAt || FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    } else if (existingSupportChat) {
      await supportChatRef.set(
        {
          sessionId,
          widgetKey,
          businessId: business.id,
          status:
            existingSupportChat.status === 'ai-active'
              ? 'ai-active'
              : existingSupportChat.status || 'ai-active',
          source: 'widget',
          preview: message,
          visitorName: visitorName || existingSupportChat.visitorName || null,
          countryCode: countryCode || existingSupportChat.countryCode || null,
          pageTitle: pageTitle || existingSupportChat.pageTitle || null,
          pageUrl: pageUrl || existingSupportChat.pageUrl || null,
          messageCount: messageTimeline.length,
          messages: messageTimeline,
          supportRequestedAt:
            existingSupportChat.supportRequestedAt || FieldValue.serverTimestamp(),
          createdAt: existingSupportChat.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await businessRef.update(analyticsUpdates)

    return NextResponse.json({
      sessionId,
      reply: finalReply,
      supportRequested: needsHumanSupport && !requiresName,
      visitorNameRequired: requiresName,
      countryCode,
    }, { headers })
  } catch (error) {
    console.error('Widget chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500, headers: corsHeaders(req.headers.get('origin')) }
    )
  }
}
