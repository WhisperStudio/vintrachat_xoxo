import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { verifyActiveUserToken } from '@/lib/verified-auth.server'

const PRESENCE_TTL_MS = 60_000

function presenceIsActive(value: any) {
  const lastSeenAt = typeof value?.lastSeenAt?.toMillis === 'function' ? value.lastSeenAt.toMillis() : 0
  return value?.available === true && Date.now() - lastSeenAt <= PRESENCE_TTL_MS
}

async function getStaffContext(req: NextRequest, businessId: string) {
  const authorization = req.headers.get('authorization') || ''
  const token = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : ''
  if (!token || !businessId) return null

  let decoded: Awaited<ReturnType<typeof verifyActiveUserToken>>
  try {
    decoded = await verifyActiveUserToken(token)
  } catch {
    return null
  }
  const businessRef = adminDb.collection('businesses').doc(businessId)
  const [businessSnap, userSnap] = await Promise.all([
    businessRef.get(),
    businessRef.collection('users').doc(decoded.uid).get(),
  ])
  if (!businessSnap.exists) return null

  const business = businessSnap.data() || {}
  const user = userSnap.data() || {}
  const owner = business.ownerId === decoded.uid && (!userSnap.exists || user.status !== 'disabled')
  const staff = userSnap.exists && user.status === 'active' && ['admin', 'manager', 'support'].includes(String(user.role || '').toLowerCase())
  if (!owner && !staff) return null
  return { businessRef, userRef: businessRef.collection('users').doc(decoded.uid), user }
}

export async function GET(req: NextRequest) {
  try {
    const businessId = String(req.nextUrl.searchParams.get('businessId') || '').trim()
    const context = await getStaffContext(req, businessId)
    if (!context) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ available: presenceIsActive(context.user.supportPresence) })
  } catch (error) {
    console.error('Support presence GET error:', error)
    return NextResponse.json({ error: 'Failed to load support availability' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const businessId = String(body.businessId || '').trim()
    const available = Boolean(body.available)
    const context = await getStaffContext(req, businessId)
    if (!context) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await context.userRef.set({
      supportPresence: {
        available,
        lastSeenAt: FieldValue.serverTimestamp(),
      },
    }, { merge: true })
    return NextResponse.json({ success: true, available })
  } catch (error) {
    console.error('Support presence POST error:', error)
    return NextResponse.json({ error: 'Failed to update support availability' }, { status: 500 })
  }
}
