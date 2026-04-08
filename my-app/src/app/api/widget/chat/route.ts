import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'

type IncomingMessage = {
  id?: string
  role: 'user' | 'assistant'
  text: string
  createdAt?: string
}

type GeminiResult = {
  reply: string
  needsHumanSupport: boolean
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

function buildPrompt(args: {
  businessName: string
  systemPrompt: string
  businessContext: string
  restrictions: string
  strictContextOnly: boolean
  supportKeywords: string[]
  history: IncomingMessage[]
  message: string
}) {
  const historyText = args.history
    .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.text}`)
    .join('\n')

  return [
    `You are the website assistant for ${args.businessName}.`,
    args.systemPrompt,
    args.strictContextOnly
      ? 'Use only the provided business context for factual claims. If context is missing, say that clearly.'
      : 'Use the provided context as your primary source, but you may answer generally when the context is silent.',
    `Business context:\n${args.businessContext || 'No business context has been configured yet.'}`,
    `Restrictions:\n${args.restrictions || 'No additional restrictions configured.'}`,
    `Treat these phrases as likely requests for human support: ${args.supportKeywords.join(', ')}`,
    'Return JSON with keys "reply" and "needsHumanSupport".',
    'Set "needsHumanSupport" to true only when the user explicitly asks to contact support, a human, an agent, or similar human follow-up.',
    'Keep the reply concise and suitable for a website chat widget.',
    historyText ? `Conversation so far:\n${historyText}` : 'Conversation so far:\nNo previous messages.',
    `Latest user message:\n${args.message}`,
  ].join('\n\n')
}

async function generateGeminiReply(prompt: string, model: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return {
      reply:
        'AI is ready in the app, but Gemini is not configured yet. Add GEMINI_API_KEY to enable live answers.',
      needsHumanSupport: false,
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
        generationConfig: {
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
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini request failed: ${response.status} ${errorText}`)
  }

  const json = await response.json()
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('Gemini returned no text')
  }

  const parsed = JSON.parse(rawText)

  return {
    reply: typeof parsed.reply === 'string' ? parsed.reply : 'I could not generate a reply.',
    needsHumanSupport: Boolean(parsed.needsHumanSupport),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const widgetKey = String(body.widgetKey || '')
    const message = String(body.message || '').trim()
    const sessionId = String(body.sessionId || crypto.randomUUID())
    const pageTitle = body.pageTitle ? String(body.pageTitle) : undefined
    const pageUrl = body.pageUrl ? String(body.pageUrl) : undefined
    const history = trimHistory(Array.isArray(body.history) ? body.history : [])

    if (!widgetKey || !message) {
      return NextResponse.json({ error: 'Missing widget key or message' }, { status: 400 })
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    const assistantConfig = business.chatAssistantConfig || {
      enabled: true,
      provider: 'gemini' as const,
      model: 'gemini-2.0-flash',
      strictContextOnly: true,
      systemPrompt: '',
      businessContext: '',
      restrictions: '',
      supportTriggerKeywords: fallbackSupportKeywords,
      handoffMessage:
        'I will flag this conversation for human follow-up so the team can contact you.',
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
        history,
        message,
      })

      const result = await generateGeminiReply(
        prompt,
        assistantConfig.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      )

      aiReply = result.reply
      aiWantsHumanSupport = result.needsHumanSupport
    }

    const needsHumanSupport = heuristicsTriggered || aiWantsHumanSupport
    const finalReply =
      needsHumanSupport && assistantConfig.handoffMessage
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
    const isNewSupportChat = needsHumanSupport && !supportChatSnap.exists

    const analyticsUpdates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
      'chatAnalytics.totalMessages': FieldValue.increment(1),
      'chatAnalytics.lastChatAt': FieldValue.serverTimestamp(),
    }

    if (!body.sessionId) {
      analyticsUpdates['chatAnalytics.totalSessions'] = FieldValue.increment(1)
      analyticsUpdates['chatAnalytics.aiOnlySessions'] = FieldValue.increment(1)
    }

    if (needsHumanSupport) {
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
    }

    await businessRef.update(analyticsUpdates)

    return NextResponse.json({
      sessionId,
      reply: finalReply,
      supportRequested: needsHumanSupport,
    })
  } catch (error) {
    console.error('Widget chat error:', error)
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}
