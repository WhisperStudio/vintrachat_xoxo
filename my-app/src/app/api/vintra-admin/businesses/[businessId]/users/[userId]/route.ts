import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireVintraAdmin, VintraAdminAuthError } from '@/lib/vintra-admin.server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; userId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId, userId } = await params
    const body = await req.json().catch(() => ({}))

    if (body.confirm !== true) {
      return NextResponse.json({ error: 'User removal requires confirmation' }, { status: 400 })
    }

    const userRef = adminDb.collection('businesses').doc(businessId).collection('users').doc(userId)
    const snap = await userRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await userRef.delete()

    await adminDb.collection('businesses').doc(businessId).update({
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin user delete error:', error)
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
  }
}
