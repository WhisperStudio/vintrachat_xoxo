import type { BubbleIconChoice, ChatAnalytics, ChatWidgetConfig } from '@/types/database'

export type SubscriptionPlan = ChatWidgetConfig['plan']

export interface PlanLimits {
  maxDailyConversations: number | null
  maxTeamMembers: number | null
  orbAvailable: boolean
  extendedDesignOptions: boolean
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxDailyConversations: 200,
    maxTeamMembers: 1,
    orbAvailable: false,
    extendedDesignOptions: false,
  },
  pro: {
    maxDailyConversations: null,
    maxTeamMembers: 5,
    orbAvailable: true,
    extendedDesignOptions: true,
  },
  business: {
    maxDailyConversations: null,
    maxTeamMembers: null,
    orbAvailable: true,
    extendedDesignOptions: true,
  },
}

export function getPlanLimits(plan: SubscriptionPlan = 'free'): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

export function getPlanLabel(plan: SubscriptionPlan) {
  switch (plan) {
    case 'pro':
      return 'Pro'
    case 'business':
      return 'Enterprise'
    case 'free':
    default:
      return 'Free'
  }
}

export function getTodayUsageKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getDailyConversationCount(
  analytics: Partial<ChatAnalytics> | null | undefined,
  date = new Date()
) {
  const key = getTodayUsageKey(date)
  return Number(analytics?.dailyConversationCounts?.[key] || 0)
}

export function canUseBubbleIconChoice(plan: SubscriptionPlan, iconChoice: BubbleIconChoice) {
  if (iconChoice === 'orb') {
    return getPlanLimits(plan).orbAvailable
  }

  return true
}

export function sanitizeBubbleStyleForPlan<T extends { iconChoice: BubbleIconChoice }>(
  bubbleStyle: T,
  plan: SubscriptionPlan
): T {
  if (canUseBubbleIconChoice(plan, bubbleStyle.iconChoice)) {
    return bubbleStyle
  }

  return {
    ...bubbleStyle,
    iconChoice: 'chat',
  }
}
