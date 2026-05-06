import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireVintraAdmin, VintraAdminAuthError } from '@/lib/vintra-admin.server'
import { getAllowedGeminiModels, getGeminiModelCandidates } from '@/lib/gemini-models.server'

type GeminiHealth = {
  status: 'online' | 'degraded' | 'offline'
  primaryModel: string
  activeFallbackModel: string | null
  lastHealthyModel: string | null
  model: string
  latencyMs?: number
  checkedAt: string
  detail?: string
  uptimePercent: number
  fallbackModels: Array<{
    model: string
    status: 'online' | 'degraded' | 'offline'
    latencyMs?: number
    detail?: string
  }>
}

function normalizeGeminiModel(model: string | null | undefined) {
  const value = String(model || '').trim()
  const cleaned = value.startsWith('models/') ? value.slice('models/'.length) : value
  const allowed = getAllowedGeminiModels()
  return allowed.includes(cleaned) ? cleaned : 'gemini-2.5-flash-lite'
}

function toIso(value: any) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function mapUsers(users: any[]) {
  return users.map((docSnap) => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      email: String(data.email || ''),
      displayName: data.displayName || null,
      role: data.role || 'user',
      status: data.status || 'active',
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
      lastLogin: toIso(data.lastLogin),
    }
  })
}

async function checkGeminiModel(modelApiKey: string, model: string): Promise<{
  status: 'online' | 'degraded' | 'offline'
  model: string
  latencyMs?: number
  detail?: string
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const started = Date.now()

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${modelApiKey}`,
      { signal: controller.signal }
    )

    if (response.ok) {
      return {
        status: 'online' as const,
        model,
        latencyMs: Date.now() - started,
      }
    }

    const errorText = await response.text().catch(() => '')
    const errorSnippet = String(errorText || '').trim().slice(0, 240)

    return {
      status: 'degraded' as const,
      model,
      latencyMs: Date.now() - started,
      detail: errorSnippet
        ? `Gemini responded with ${response.status}: ${errorSnippet}`
        : `Gemini responded with ${response.status}`,
    }
  } catch (error) {
    return {
      status: 'offline' as const,
      model,
      detail: error instanceof Error ? error.message : 'Unknown Gemini error',
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function checkGeminiHealth(options?: {
  primaryModelOverride?: string | null
  strictModelOnly?: boolean
}): Promise<GeminiHealth> {
  const apiKey = process.env.GEMINI_API_KEY
  const primaryModel = normalizeGeminiModel(
    String(options?.primaryModelOverride || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').trim()
  )
  const strictModelOnly = Boolean(options?.strictModelOnly)
  const checkedAt = new Date().toISOString()
  const fallbackModels = strictModelOnly
    ? [primaryModel]
    : await getGeminiModelCandidates(primaryModel, apiKey)

  if (!apiKey) {
    return {
      status: 'offline',
      primaryModel,
      activeFallbackModel: null,
      lastHealthyModel: null,
      model: primaryModel,
      checkedAt,
      detail: 'Missing GEMINI_API_KEY',
      uptimePercent: 0,
      fallbackModels: fallbackModels.map((model) => ({
        model,
        status: 'offline' as const,
        detail: 'Missing GEMINI_API_KEY',
      })),
    }
  }

  const modelChecks: Array<{
    status: 'online' | 'degraded' | 'offline'
    model: string
    latencyMs?: number
    detail?: string
  }> = []
  for (const model of fallbackModels) {
    modelChecks.push(await checkGeminiModel(apiKey, model))
  }

  const primaryCheck = modelChecks[0] || {
    status: 'offline' as const,
    model: primaryModel,
    detail: 'No Gemini models configured',
  }
  const firstOnlineIndex = modelChecks.findIndex((entry) => entry.status === 'online')
  const recoveredWithFallback = firstOnlineIndex > 0
  const selectedCheck =
    firstOnlineIndex >= 0
      ? modelChecks[firstOnlineIndex]
      : primaryCheck
  const onlineCount = modelChecks.filter((entry) => entry.status === 'online').length
  const uptimePercent = modelChecks.length ? Math.round((onlineCount / modelChecks.length) * 100) : 0
  const selectedStatus =
    firstOnlineIndex >= 0
      ? (recoveredWithFallback ? 'degraded' : 'online')
      : primaryCheck.status
  const selectedDetail = recoveredWithFallback
    ? `Primary model was unavailable; using fallback model ${selectedCheck.model}.`
    : primaryCheck.detail

  return {
    status: selectedStatus,
    primaryModel: primaryCheck.model,
    activeFallbackModel: recoveredWithFallback ? selectedCheck.model : null,
    lastHealthyModel: selectedCheck.status === 'online' ? selectedCheck.model : null,
    model: selectedCheck.model,
    latencyMs: selectedCheck.latencyMs,
    checkedAt,
    detail: selectedDetail,
    uptimePercent,
    fallbackModels: modelChecks.map((entry) => ({
      model: entry.model,
      status: entry.status,
      latencyMs: entry.latencyMs,
      detail: entry.detail,
    })),
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminUser = await requireVintraAdmin(req)
    const requestedModelRaw = req.nextUrl.searchParams.get('model')?.trim() || null
    const requestedModel = normalizeGeminiModel(requestedModelRaw)
    const strictModelOnly =
      req.nextUrl.searchParams.get('strict') === '1' ||
      req.nextUrl.searchParams.get('strictModelOnly') === '1'

    const businessSnap = await adminDb.collection('businesses').get()

    const aggregateAnalytics = {
      totalSessions: 0,
      totalMessages: 0,
      aiOnlySessions: 0,
      supportRequests: 0,
      savedSupportChats: 0,
      dailyConversationCounts: {} as Record<string, number>,
      countryCounts: {} as Record<string, number>,
      modelUsage: {} as Record<string, number>,
    }

    const businesses = await Promise.all(
      businessSnap.docs.map(async (businessDoc) => {
        const data = businessDoc.data()
        const [usersSnap, chatsSnap, categoriesSnap] = await Promise.all([
          businessDoc.ref.collection('users').get(),
          businessDoc.ref.collection('supportChats').orderBy('updatedAt', 'desc').limit(5).get(),
          Promise.resolve(Array.isArray(data.supportTaskCategories) ? data.supportTaskCategories : []),
        ])

        const users = mapUsers(usersSnap.docs)
        const latestChat = chatsSnap.docs[0]?.data() || null
        const analytics = data.chatAnalytics || {}

        aggregateAnalytics.totalSessions += Number(analytics.totalSessions || 0)
        aggregateAnalytics.totalMessages += Number(analytics.totalMessages || 0)
        aggregateAnalytics.aiOnlySessions += Number(analytics.aiOnlySessions || 0)
        aggregateAnalytics.supportRequests += Number(analytics.supportRequests || 0)
        aggregateAnalytics.savedSupportChats += Number(analytics.savedSupportChats || 0)

        const dailyConversationCounts = analytics.dailyConversationCounts || {}
        Object.entries(dailyConversationCounts).forEach(([key, value]) => {
          aggregateAnalytics.dailyConversationCounts[key] =
            (aggregateAnalytics.dailyConversationCounts[key] || 0) + Number(value || 0)
        })

        const countryCounts = analytics.countryCounts || {}
        Object.entries(countryCounts).forEach(([key, value]) => {
          aggregateAnalytics.countryCounts[key] =
            (aggregateAnalytics.countryCounts[key] || 0) + Number(value || 0)
        })

        const modelUsage = analytics.modelUsage || {}
        Object.entries(modelUsage).forEach(([key, value]) => {
          aggregateAnalytics.modelUsage[key] =
            (aggregateAnalytics.modelUsage[key] || 0) + Number(value || 0)
        })

        return {
          id: businessDoc.id,
          name: String(data.name || ''),
          email: String(data.email || ''),
          ownerId: String(data.ownerId || ''),
          widgetKey: String(data.chatWidgetKey || ''),
          plan: data.chatWidgetConfig?.plan || 'free',
          assistantEnabled: Boolean(data.chatAssistantConfig?.enabled),
          assistantModel: String(data.chatAssistantConfig?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'),
          assistantConfig: data.chatAssistantConfig
            ? {
                enabled: Boolean(data.chatAssistantConfig.enabled),
                model: String(data.chatAssistantConfig.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'),
                systemPrompt: String(data.chatAssistantConfig.systemPrompt || ''),
                businessContext: String(data.chatAssistantConfig.businessContext || ''),
                restrictions: String(data.chatAssistantConfig.restrictions || ''),
                supportTriggerKeywords: Array.isArray(data.chatAssistantConfig.supportTriggerKeywords)
                  ? data.chatAssistantConfig.supportTriggerKeywords
                  : [],
                handoffMessage: String(data.chatAssistantConfig.handoffMessage || ''),
                faqSuggestionsEnabled: Boolean(data.chatAssistantConfig.faqSuggestionsEnabled),
                faqSuggestions: Array.isArray(data.chatAssistantConfig.faqSuggestions)
                  ? data.chatAssistantConfig.faqSuggestions
                  : [],
                replyInUserLanguage: Boolean(data.chatAssistantConfig.replyInUserLanguage ?? true),
                responseStyle: String(data.chatAssistantConfig.responseStyle || ''),
                extraInstructions: String(data.chatAssistantConfig.extraInstructions || ''),
              }
            : null,
          lastChatAt: toIso(data.chatAnalytics?.lastChatAt),
          updatedAt: toIso(data.updatedAt),
          userCount: users.length,
          chatCount: chatsSnap.size,
          users,
          categories: categoriesSnap.map((category: any) => ({
            id: String(category.id || ''),
            name: String(category.name || ''),
            default: Boolean(category.default),
            createdAt: toIso(category.createdAt),
            updatedAt: toIso(category.updatedAt),
          })),
          latestChat: latestChat
            ? {
                id: String(latestChat.sessionId || ''),
                preview: String(latestChat.preview || ''),
                status: String(latestChat.status || ''),
                updatedAt: toIso(latestChat.updatedAt),
              }
            : null,
        }
      })
    )

    const totalUsers = businesses.reduce((sum, business) => sum + business.userCount, 0)
    const totalChats = businesses.reduce((sum, business) => sum + business.chatCount, 0)
    const health = await checkGeminiHealth({
      primaryModelOverride: requestedModel,
      strictModelOnly,
    })
    const latestActivity = businesses
      .map((business) => business.lastChatAt)
      .filter(Boolean)
      .sort()
      .at(-1) || null

    const topCountries = Object.entries(aggregateAnalytics.countryCounts)
      .map(([code, count]) => ({ code, count: Number(count || 0) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const modelUsageEntries = Object.entries(aggregateAnalytics.modelUsage)
      .map(([model, count]) => ({ model, count: Number(count || 0) }))
      .sort((a, b) => b.count - a.count)

    const configuredModelUsage = businesses
      .reduce<Record<string, number>>((acc, business) => {
        const model = business.assistantModel || 'unknown'
        acc[model] = (acc[model] || 0) + Math.max(1, business.chatCount || business.userCount || 0)
        return acc
      }, {})
    const configuredModels = Object.entries(configuredModelUsage)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)

    const averageMessagesPerSession =
      aggregateAnalytics.totalSessions > 0
        ? aggregateAnalytics.totalMessages / aggregateAnalytics.totalSessions
        : 0

    return NextResponse.json({
      adminEmail: adminUser.email || null,
      totals: {
        businesses: businesses.length,
        users: totalUsers,
        chats: totalChats,
      },
      health,
      latestActivity,
      requestedModel,
      strictModelOnly,
      analytics: {
        totalSessions: aggregateAnalytics.totalSessions,
        totalMessages: aggregateAnalytics.totalMessages,
        aiOnlySessions: aggregateAnalytics.aiOnlySessions,
        supportRequests: aggregateAnalytics.supportRequests,
        savedSupportChats: aggregateAnalytics.savedSupportChats,
        averageMessagesPerSession,
        dailyConversationCounts: aggregateAnalytics.dailyConversationCounts,
        countryCounts: aggregateAnalytics.countryCounts,
        topCountries,
        modelUsage: modelUsageEntries,
        configuredModels,
      },
      businesses,
    })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin summary error:', error)
    return NextResponse.json({ error: 'Failed to load Vintra admin summary' }, { status: 500 })
  }
}
