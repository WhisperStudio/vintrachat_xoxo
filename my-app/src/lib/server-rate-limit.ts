import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'

type RateLimitArgs = {
  scope: string
  key: string
  limit: number
  windowMs: number
}

type RateLimitResult =
  | {
      allowed: true
      remaining: number
      retryAfterSeconds: number
    }
  | {
      allowed: false
      remaining: 0
      retryAfterSeconds: number
    }

export async function consumeServerRateLimit(args: RateLimitArgs): Promise<RateLimitResult> {
  const limit = Math.max(1, Math.floor(args.limit))
  const windowMs = Math.max(1_000, Math.floor(args.windowMs))
  const now = Date.now()
  const bucketStart = Math.floor(now / windowMs) * windowMs
  const retryAfterSeconds = Math.max(1, Math.ceil((bucketStart + windowMs - now) / 1000))
  const safeKey = Buffer.from(`${args.scope}:${args.key}:${bucketStart}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  const ref = adminDb.collection('_rate_limits').doc(safeKey)

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const count = Number(snap.data()?.count || 0)

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds,
      }
    }

    transaction.set(
      ref,
      {
        scope: args.scope,
        key: args.key,
        count: count + 1,
        bucketStart,
        expiresAt: new Date(bucketStart + windowMs * 2),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return {
      allowed: true,
      remaining: Math.max(0, limit - count - 1),
      retryAfterSeconds,
    }
  })
}
