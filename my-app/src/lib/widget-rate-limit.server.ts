import { adminDb } from '@/lib/firebase-admin'

export type WidgetRateLimitRule = {
  windowMs: number
  maxRequests: number
}

export type WidgetRateLimitResult =
  | {
      allowed: true
      remaining: number
    }
  | {
      allowed: false
      retryAfterSeconds: number
      limit: number
      captchaRequired?: boolean
    }

function normalizeKeyPart(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function enforceWidgetRateLimit(args: {
  businessId?: string
  widgetKey: string
  clientId: string
  sessionId?: string
  fingerprint?: string
  action: string
  rules: WidgetRateLimitRule[]
  captchaRules?: WidgetRateLimitRule[]
  captchaTokenValid?: boolean
}): Promise<WidgetRateLimitResult> {
  const businessId = normalizeKeyPart(args.businessId || '')
  const widgetKey = normalizeKeyPart(args.widgetKey)
  const clientId = normalizeKeyPart(args.clientId) || 'anonymous'
  const sessionId = normalizeKeyPart(args.sessionId || '')
  const fingerprint = normalizeKeyPart(args.fingerprint || '')
  const action = normalizeKeyPart(args.action)
  const rules = args.rules.filter((rule) => rule.windowMs > 0 && rule.maxRequests > 0)
  const captchaRules = (args.captchaRules || []).filter(
    (rule) => rule.windowMs > 0 && rule.maxRequests > 0
  )

  if (!widgetKey || !action || !rules.length) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY }
  }

  const now = Date.now()

  return adminDb.runTransaction(async (transaction) => {
    const sessionScope = normalizeKeyPart(
      [businessId, widgetKey, sessionId || 'no-session', fingerprint || 'no-fingerprint', clientId].join(':')
    )
    const ipScope = normalizeKeyPart([businessId, widgetKey, clientId].join(':'))

    const refs = rules.map((rule) => {
      const bucket = Math.floor(now / rule.windowMs)
      const id = `${action}:${sessionScope}:${rule.windowMs}:${bucket}`
      return {
        rule,
        bucket,
        windowStart: bucket * rule.windowMs,
        ref: adminDb.collection('widgetRateLimits').doc(id),
      }
    })

    const captchaRefs = captchaRules.map((rule) => {
      const bucket = Math.floor(now / rule.windowMs)
      const id = `${action}:captcha:${ipScope}:${rule.windowMs}:${bucket}`
      return {
        rule,
        bucket,
        windowStart: bucket * rule.windowMs,
        ref: adminDb.collection('widgetRateLimits').doc(id),
      }
    })

    const snaps = await Promise.all(refs.map(({ ref }) => transaction.get(ref)))
    const captchaSnaps = await Promise.all(captchaRefs.map(({ ref }) => transaction.get(ref)))

    for (let index = 0; index < snaps.length; index += 1) {
      const snap = snaps[index]
      const rule = refs[index].rule
      const count = Number(snap.get('count') || 0)

      if (count >= rule.maxRequests) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((refs[index].windowStart + rule.windowMs - now) / 1000)
        )

        return {
          allowed: false as const,
          retryAfterSeconds,
          limit: rule.maxRequests,
        }
      }
    }

    const captchaWouldTrigger =
      !args.captchaTokenValid &&
      captchaRefs.some((entry, index) => {
        const snap = captchaSnaps[index]
        const count = Number(snap.get('count') || 0)
        return count >= entry.rule.maxRequests
      })

    if (captchaWouldTrigger) {
      const trigger = captchaRefs.find((entry, index) => {
        const snap = captchaSnaps[index]
        const count = Number(snap.get('count') || 0)
        return count >= entry.rule.maxRequests
      })

      if (trigger) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((trigger.windowStart + trigger.rule.windowMs - now) / 1000)
        )

        return {
          allowed: false as const,
          retryAfterSeconds,
          limit: trigger.rule.maxRequests,
          captchaRequired: true,
        }
      }
    }

    refs.forEach(({ ref, rule, windowStart }) => {
      const previous = snaps.find((snap, index) => refs[index].ref.path === ref.path)
      const count = Number(previous?.get('count') || 0)

      transaction.set(
        ref,
        {
          count: count + 1,
          action,
          widgetKey,
          clientId,
          windowMs: rule.windowMs,
          windowStart,
          updatedAt: new Date(now),
          expiresAt: new Date(windowStart + rule.windowMs + 60_000),
        },
        { merge: true }
      )
    })

    captchaRefs.forEach(({ ref, rule, windowStart }) => {
      const previous = captchaSnaps.find((snap, index) => captchaRefs[index].ref.path === ref.path)
      const count = Number(previous?.get('count') || 0)

      transaction.set(
        ref,
        {
          count: count + 1,
          action: `${action}:captcha`,
          widgetKey,
          clientId: ipScope,
          windowMs: rule.windowMs,
          windowStart,
          updatedAt: new Date(now),
          expiresAt: new Date(windowStart + rule.windowMs + 60_000),
        },
        { merge: true }
      )
    })

    return {
      allowed: true as const,
      remaining: Math.max(0, rules[0].maxRequests - Number(snaps[0]?.get('count') || 0) - 1),
    }
  })
}
