import type { BubbleIconChoice, Business, ChatAnalytics, ChatWidgetConfig } from '@/types/database'

export type SubscriptionPlan = ChatWidgetConfig['plan']
export type PlanFeatureKey =
  | 'orbLauncher'
  | 'extendedDesignOptions'
  | 'multipleWidgets'
  | 'customInterfaceIcons'
  | 'glassLook'

export interface PlanFeatureAvailability {
  available: boolean
  feature: PlanFeatureKey
  plan: SubscriptionPlan
  requiredPlan?: SubscriptionPlan
}

export interface PlanLimits {
  maxDailyConversations: number | null
  maxTeamMembers: number | null
  maxWidgets: number | null
  orbAvailable: boolean
  extendedDesignOptions: boolean
}

const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxDailyConversations: 200,
    maxTeamMembers: 1,
    maxWidgets: 1,
    orbAvailable: false,
    extendedDesignOptions: false,
  },
  pro: {
    maxDailyConversations: null,
    maxTeamMembers: 5,
    maxWidgets: null,
    orbAvailable: true,
    extendedDesignOptions: true,
  },
  business: {
    maxDailyConversations: null,
    maxTeamMembers: null,
    maxWidgets: null,
    orbAvailable: true,
    extendedDesignOptions: true,
  },
}

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  free: 0,
  pro: 1,
  business: 2,
}

const FEATURE_MIN_PLAN: Record<PlanFeatureKey, SubscriptionPlan> = {
  orbLauncher: 'pro',
  extendedDesignOptions: 'pro',
  multipleWidgets: 'pro',
  customInterfaceIcons: 'pro',
  glassLook: 'pro',
}

export function normalizeSubscriptionPlan(plan?: string | null): SubscriptionPlan {
  if (plan === 'pro' || plan === 'business' || plan === 'free') {
    return plan
  }

  return 'free'
}

export function planMeetsMinimum(plan: SubscriptionPlan, minimumPlan: SubscriptionPlan) {
  return PLAN_ORDER[plan] >= PLAN_ORDER[minimumPlan]
}

export function getEffectiveBusinessPlan(
  business?: Pick<Business, 'chatWidgetConfig' | 'chatWidgets' | 'activeChatWidgetKey'> | null,
  widgetConfig?: Partial<ChatWidgetConfig> | null
): SubscriptionPlan {
  const activeWidget =
    business?.chatWidgets?.find((widget) => widget.widgetKey === business.activeChatWidgetKey) ||
    business?.chatWidgets?.[0]

  return normalizeSubscriptionPlan(
    business?.chatWidgetConfig?.plan ||
      widgetConfig?.plan ||
      activeWidget?.config?.plan
  )
}

export function getPlanFeatureAvailability(
  plan: SubscriptionPlan,
  feature: PlanFeatureKey
): PlanFeatureAvailability {
  const normalizedPlan = normalizeSubscriptionPlan(plan)
  const requiredPlan = FEATURE_MIN_PLAN[feature]

  return {
    available: planMeetsMinimum(normalizedPlan, requiredPlan),
    feature,
    plan: normalizedPlan,
    requiredPlan,
  }
}

export function isPlanFeatureAvailable(plan: SubscriptionPlan, feature: PlanFeatureKey) {
  return getPlanFeatureAvailability(plan, feature).available
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
    return isPlanFeatureAvailable(plan, 'orbLauncher')
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

export function sanitizeChatWidgetConfigForPlan<T extends Partial<ChatWidgetConfig>>(
  config: T,
  plan: SubscriptionPlan
): T {
  const normalizedPlan = normalizeSubscriptionPlan(plan)

  return {
    ...config,
    plan: normalizedPlan,
    appearance: {
      ...(config.appearance || {}),
      glassLookEnabled: isPlanFeatureAvailable(normalizedPlan, 'glassLook')
        ? Boolean(config.appearance?.glassLookEnabled)
        : false,
    },
    bubbleStyle: config.bubbleStyle
      ? sanitizeBubbleStyleForPlan(config.bubbleStyle, normalizedPlan)
      : config.bubbleStyle,
  }
}
