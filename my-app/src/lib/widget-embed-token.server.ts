import crypto from 'node:crypto'
import { adminDb } from '@/lib/firebase-admin'
import { getRequestOrigin, isRequestOriginAllowed, isSameOriginRequest, isWidgetDebugRequest } from '@/lib/widget-security'

const TOKEN_VERSION = 'v1'

export type WidgetEmbedTokenPayload = {
  v: typeof TOKEN_VERSION
  businessId: string
  widgetKey: string
  origin: string
  exp: number
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function sign(value: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

export async function getOrCreateWidgetEmbedSecret(businessId: string) {
  const ref = adminDb.collection('businesses').doc(businessId)
  const snap = await ref.get()
  const data = snap.data() || {}

  if (typeof data.chatWidgetEmbedSecret === 'string' && data.chatWidgetEmbedSecret.trim()) {
    return data.chatWidgetEmbedSecret.trim()
  }

  const secret = crypto.randomBytes(32).toString('hex')
  await ref.set(
    {
      chatWidgetEmbedSecret: secret,
      updatedAt: new Date(),
    },
    { merge: true }
  )

  return secret
}

export function createWidgetEmbedToken(args: {
  businessId: string
  widgetKey: string
  origin: string
  secret: string
  expiresInSeconds?: number
}) {
  const requestedExpires = Number(args.expiresInSeconds)
  const expiresInSeconds = Math.max(
    300,
    Number.isFinite(requestedExpires) && requestedExpires > 0 ? requestedExpires : 12 * 60 * 60
  )
  const payload: WidgetEmbedTokenPayload = {
    v: TOKEN_VERSION,
    businessId: args.businessId,
    widgetKey: args.widgetKey,
    origin: args.origin,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload, args.secret)
  return `${encodedPayload}.${signature}`
}

export function verifyWidgetEmbedToken(args: {
  token: string
  businessId: string
  widgetKey: string
  origin: string
  secret: string
}) {
  const [encodedPayload, signature] = String(args.token || '').split('.')
  if (!encodedPayload || !signature) {
    return { valid: false as const, reason: 'Missing embed token.' }
  }

  const expectedSignature = sign(encodedPayload, args.secret)
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false as const, reason: 'Invalid embed token.' }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as WidgetEmbedTokenPayload
    const now = Math.floor(Date.now() / 1000)

    if (payload.v !== TOKEN_VERSION) {
      return { valid: false as const, reason: 'Invalid embed token version.' }
    }

    if (payload.businessId !== args.businessId || payload.widgetKey !== args.widgetKey) {
      return { valid: false as const, reason: 'Embed token mismatch.' }
    }

    if (payload.origin !== args.origin) {
      return { valid: false as const, reason: 'Embed token origin mismatch.' }
    }

    if (!Number.isFinite(payload.exp) || payload.exp < now) {
      return { valid: false as const, reason: 'Embed token expired.' }
    }

    return { valid: true as const, payload }
  } catch {
    return { valid: false as const, reason: 'Invalid embed token.' }
  }
}

export async function authorizeWidgetRequest(args: {
  req: import('next/server').NextRequest
  business: {
    id: string
    chatWidgetKey: string
    chatWidgetConfig?: {
      allowedDomains: unknown
    }
  }
}) {
  if (isWidgetDebugRequest(args.req)) {
    return { allowed: true as const, internal: false as const, debug: true as const }
  }

  if (isSameOriginRequest(args.req)) {
    return { allowed: true as const, internal: true as const }
  }

  const originCheck = isRequestOriginAllowed(args.req, args.business.chatWidgetConfig?.allowedDomains)
  if (!originCheck.allowed) {
    return { allowed: false as const, reason: originCheck.reason }
  }

  const token = args.req.headers.get('x-vintra-embed-token')
  if (!token) {
    return {
      allowed: false as const,
      reason: 'Missing embed token.',
    }
  }

  const secret = await getOrCreateWidgetEmbedSecret(args.business.id)
  const requestOrigin = getRequestOrigin(args.req)
  const verification = verifyWidgetEmbedToken({
    token,
    businessId: args.business.id,
    widgetKey: args.business.chatWidgetKey,
    origin: requestOrigin,
    secret,
  })

  return verification.valid
    ? { allowed: true as const, internal: false as const }
    : { allowed: false as const, reason: verification.reason }
}
