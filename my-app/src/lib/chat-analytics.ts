import type { ChatAnalytics, ChatAnalyticsEvent } from '@/types/database'

export const ANALYTICS_TIME_ZONE = 'Europe/Oslo'

export type ChatAnalyticsDailyStat = {
  totalMessages: number
  totalSessions: number
  supportRequests: number
  savedSupportChats: number
  countryCounts: Record<string, number>
  hours: Record<string, number>
}

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: ANALYTICS_TIME_ZONE,
  hour: '2-digit',
  hour12: false,
})

const monthFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
})

function getDateParts(dateInput: Date | string | number) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const parts = dayFormatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '1970'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  const day = parts.find((part) => part.type === 'day')?.value || '01'

  return { year, month, day }
}

export function getAnalyticsDayKey(dateInput: Date | string | number = new Date()) {
  const { year, month, day } = getDateParts(dateInput)
  return `${year}-${month}-${day}`
}

export function getAnalyticsHourKey(dateInput: Date | string | number = new Date()) {
  const value = hourFormatter.format(dateInput instanceof Date ? dateInput : new Date(dateInput))
  return String(value).padStart(2, '0')
}

export function getAnalyticsMonthKey(dateInput: Date | string | number = new Date()) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  const parts = monthFormatter.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || '1970'
  const month = parts.find((part) => part.type === 'month')?.value || '01'
  return `${year}-${month}`
}

export function getAnalyticsWeekdayIndex(dateInput: Date | string | number) {
  const { year, month, day } = getDateParts(dateInput)
  const utcDay = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()
  return (utcDay + 6) % 7
}

export function buildHourlyStatMap() {
  return Object.fromEntries(
    Array.from({ length: 24 }, (_, hour) => [String(hour).padStart(2, '0'), 0])
  ) as Record<string, number>
}

export function buildEmptyDailyStat(): ChatAnalyticsDailyStat {
  return {
    totalMessages: 0,
    totalSessions: 0,
    supportRequests: 0,
    savedSupportChats: 0,
    countryCounts: {},
    hours: buildHourlyStatMap(),
  }
}

export function normalizeDailyStat(value: Partial<ChatAnalyticsDailyStat> | null | undefined) {
  return {
    ...buildEmptyDailyStat(),
    ...(value || {}),
    countryCounts: { ...(value?.countryCounts || {}) },
    hours: {
      ...buildHourlyStatMap(),
      ...(value?.hours || {}),
    },
  } satisfies ChatAnalyticsDailyStat
}

export function normalizeDailyStatsMap(
  stats: Record<string, Partial<ChatAnalyticsDailyStat>> | null | undefined
) {
  return Object.fromEntries(
    Object.entries(stats || {}).map(([key, value]) => [key, normalizeDailyStat(value)])
  ) as Record<string, ChatAnalyticsDailyStat>
}

export function toDate(value: any): Date {
  if (!value) return new Date()
  if (typeof value?.toDate === 'function') return value.toDate()
  return new Date(value)
}

export function buildDailyStatsFromEvents(events: ChatAnalyticsEvent[]) {
  const stats: Record<string, ChatAnalyticsDailyStat> = {}

  events.forEach((event) => {
    const createdAt = toDate(event.createdAt)
    const dayKey = getAnalyticsDayKey(createdAt)
    const hourKey = getAnalyticsHourKey(createdAt)
    const day = stats[dayKey] || buildEmptyDailyStat()

    switch (event.kind) {
      case 'session-start':
        day.totalSessions += 1
        if (event.countryCode) {
          day.countryCounts[event.countryCode] = (day.countryCounts[event.countryCode] || 0) + 1
        }
        break
      case 'visitor-message':
      case 'assistant-reply':
      case 'support-message':
        day.totalMessages += 1
        day.hours[hourKey] = (day.hours[hourKey] || 0) + 1
        break
      case 'support-request':
        day.totalMessages += 1
        day.supportRequests += 1
        day.savedSupportChats += 1
        day.hours[hourKey] = (day.hours[hourKey] || 0) + 1
        break
      default:
        break
    }

    stats[dayKey] = day
  })

  return stats
}

export function normalizeChatAnalytics(
  analytics: Partial<ChatAnalytics> | null | undefined
): ChatAnalytics {
  const timeline = Array.isArray(analytics?.timeline) ? analytics.timeline : []
  const fallbackDailyStats = buildDailyStatsFromEvents(timeline)
  const storedDailyStats = normalizeDailyStatsMap(analytics?.dailyStats || {})
  const mergedDailyStats = normalizeDailyStatsMap({
    ...fallbackDailyStats,
    ...storedDailyStats,
  })

  return {
    totalSessions: Number(analytics?.totalSessions || 0),
    totalMessages: Number(analytics?.totalMessages || 0),
    aiOnlySessions: Number(analytics?.aiOnlySessions || 0),
    supportRequests: Number(analytics?.supportRequests || 0),
    savedSupportChats: Number(analytics?.savedSupportChats || 0),
    dailyConversationCounts: { ...(analytics?.dailyConversationCounts || {}) },
    countryCounts: { ...(analytics?.countryCounts || {}) },
    modelUsage: { ...(analytics?.modelUsage || {}) },
    timeline,
    lastChatAt: analytics?.lastChatAt ? toDate(analytics.lastChatAt) : undefined,
    dailyStats: mergedDailyStats,
  }
}
