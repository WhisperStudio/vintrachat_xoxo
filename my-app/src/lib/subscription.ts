import { PLANS, effectivePlan } from '@/lib/billing/catalog.mjs'
import type { BubbleIconChoice, Business, ChatAnalytics, ChatWidgetConfig } from '@/types/database'
import { getAnalyticsDayKey } from '@/lib/chat-analytics'

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
  maxDailyMessages: number
  maxTeamMembers: number | null
  maxWidgets: number | null
  orbAvailable: boolean
  extendedDesignOptions: boolean
}

const PLAN_LIMITS = Object.fromEntries(Object.entries(PLANS).map(([key, plan]) => [key, {
  maxDailyConversations: plan.conversations,
  maxDailyMessages: plan.messages,
  maxTeamMembers: plan.members,
  maxWidgets: plan.widgets,
  orbAvailable: key !== 'free',
  extendedDesignOptions: key !== 'free',
}])) as Record<SubscriptionPlan, PlanLimits>

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
  business?: Pick<Business, 'chatWidgetConfig' | 'chatWidgets' | 'activeChatWidgetKey' | 'billing'> | null,
  widgetConfig?: Partial<ChatWidgetConfig> | null
): SubscriptionPlan {
  return normalizeSubscriptionPlan(effectivePlan(business))
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
  return getAnalyticsDayKey(date)
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
    widgetIcons: normalizedPlan === 'free' ? undefined : config.widgetIcons,
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
