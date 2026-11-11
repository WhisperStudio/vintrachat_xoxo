import { adminDb } from '@/lib/firebase-admin'

const PRESENCE_TTL_MS = 60_000

function timestampToMillis(value: unknown) {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (value instanceof Date) return value.getTime()
  return 0
}

export async function hasAvailableSupportAgent(businessId: string) {
  const [businessSnap, usersSnap] = await Promise.all([
    adminDb.collection('businesses').doc(businessId).get(),
    adminDb.collection('businesses').doc(businessId).collection('users').get(),
  ])
  if (!businessSnap.exists) return false

  const now = Date.now()
  const ownerId = String(businessSnap.data()?.ownerId || '')
  return usersSnap.docs.some((userDoc) => {
    const user = userDoc.data()
    const role = String(user.role || '').toLowerCase()
    const eligible = (userDoc.id === ownerId && user.status !== 'disabled') ||
      (user.status === 'active' && ['admin', 'manager', 'support'].includes(role))
    const presence = user.supportPresence
    return eligible && presence?.available === true && now - timestampToMillis(presence.lastSeenAt) <= PRESENCE_TTL_MS
  })
}
