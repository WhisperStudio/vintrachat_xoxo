import crypto from 'node:crypto'

type CaptchaPayload = {
  v: 1
  businessId: string
  widgetKey: string
  sessionId: string
  fingerprint: string
  clientIp: string
  answer: string
  exp: number
}

const CAPTCHA_TOKEN_TTL_SECONDS = 12 * 60 * 60

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

function normalizeTokenPart(value: string) {
  return String(value || '').trim().toLowerCase()
}

export function createWidgetCaptchaChallenge(args: {
  secret: string
  businessId: string
  widgetKey: string
  sessionId: string
  fingerprint: string
  clientIp: string
}) {
  const a = Math.floor(2 + Math.random() * 7)
  const b = Math.floor(2 + Math.random() * 7)
  const ops = ['+', '-'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  const answer = op === '+' ? String(a + b) : String(Math.max(1, Math.abs(a - b)))
  const question = `Please solve: ${a} ${op} ${b} = ?`
  const payload: CaptchaPayload = {
    v: 1,
    businessId: args.businessId,
    widgetKey: args.widgetKey,
    sessionId: normalizeTokenPart(args.sessionId),
    fingerprint: normalizeTokenPart(args.fingerprint),
    clientIp: normalizeTokenPart(args.clientIp),
    answer,
    exp: Math.floor(Date.now() / 1000) + CAPTCHA_TOKEN_TTL_SECONDS,
  }

  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(encodedPayload, args.secret)

  return {
    question,
    challengeToken: `${encodedPayload}.${signature}`,
    expiresInSeconds: CAPTCHA_TOKEN_TTL_SECONDS,
  }
}

export function verifyWidgetCaptchaChallenge(args: {
  secret: string
  challengeToken: string
  answer: string
  businessId: string
  widgetKey: string
  sessionId: string
  fingerprint: string
  clientIp: string
}) {
  const [encodedPayload, signature] = String(args.challengeToken || '').split('.')
  if (!encodedPayload || !signature) {
    return { valid: false as const, reason: 'Missing captcha challenge.' }
  }

  const expectedSignature = sign(encodedPayload, args.secret)
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false as const, reason: 'Invalid captcha challenge.' }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as CaptchaPayload
    const now = Math.floor(Date.now() / 1000)

    if (payload.v !== 1) {
      return { valid: false as const, reason: 'Invalid captcha challenge.' }
    }

    if (payload.businessId !== args.businessId || payload.widgetKey !== args.widgetKey) {
      return { valid: false as const, reason: 'Captcha challenge mismatch.' }
    }

    if (payload.sessionId !== normalizeTokenPart(args.sessionId)) {
      return { valid: false as const, reason: 'Captcha challenge session mismatch.' }
    }

    if (payload.fingerprint !== normalizeTokenPart(args.fingerprint)) {
      return { valid: false as const, reason: 'Captcha challenge fingerprint mismatch.' }
    }

    if (payload.clientIp !== normalizeTokenPart(args.clientIp)) {
      return { valid: false as const, reason: 'Captcha challenge network mismatch.' }
    }

    if (!Number.isFinite(payload.exp) || payload.exp < now) {
      return { valid: false as const, reason: 'Captcha challenge expired.' }
    }

    if (normalizeTokenPart(args.answer) !== payload.answer) {
      return { valid: false as const, reason: 'Wrong captcha answer.' }
    }

    const tokenPayload = {
      v: 1 as const,
      businessId: args.businessId,
      widgetKey: args.widgetKey,
      sessionId: normalizeTokenPart(args.sessionId),
      fingerprint: normalizeTokenPart(args.fingerprint),
      clientIp: normalizeTokenPart(args.clientIp),
      exp: now + CAPTCHA_TOKEN_TTL_SECONDS,
    }

    const encodedVerifiedPayload = base64UrlEncode(JSON.stringify(tokenPayload))
    const verifiedSignature = sign(encodedVerifiedPayload, args.secret)

    return {
      valid: true as const,
      captchaToken: `${encodedVerifiedPayload}.${verifiedSignature}`,
      expiresInSeconds: CAPTCHA_TOKEN_TTL_SECONDS,
    }
  } catch {
    return { valid: false as const, reason: 'Invalid captcha challenge.' }
  }
}

export function verifyWidgetCaptchaToken(args: {
  secret: string
  captchaToken: string
  businessId: string
  widgetKey: string
  sessionId: string
  fingerprint: string
  clientIp: string
}) {
  const [encodedPayload, signature] = String(args.captchaToken || '').split('.')
  if (!encodedPayload || !signature) {
    return { valid: false as const, reason: 'Missing captcha token.' }
  }

  const expectedSignature = sign(encodedPayload, args.secret)
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return { valid: false as const, reason: 'Invalid captcha token.' }
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as {
      v: 1
      businessId: string
      widgetKey: string
      sessionId: string
      fingerprint: string
      clientIp: string
      exp: number
    }

    const now = Math.floor(Date.now() / 1000)

    if (
      payload.v !== 1 ||
      payload.businessId !== args.businessId ||
      payload.widgetKey !== args.widgetKey ||
      payload.sessionId !== normalizeTokenPart(args.sessionId) ||
      payload.fingerprint !== normalizeTokenPart(args.fingerprint) ||
      payload.clientIp !== normalizeTokenPart(args.clientIp) ||
      !Number.isFinite(payload.exp) ||
      payload.exp < now
    ) {
      return { valid: false as const, reason: 'Invalid captcha token.' }
    }

    return { valid: true as const }
  } catch {
    return { valid: false as const, reason: 'Invalid captcha token.' }
  }
}
