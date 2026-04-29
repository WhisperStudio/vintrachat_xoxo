import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireVintraAdmin, VintraAdminAuthError } from '@/lib/vintra-admin.server'

function toIso(value: any) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId } = await params
    const body = await req.json()
    const name = String(body.name || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const businessRef = adminDb.collection('businesses').doc(businessId)
    const snap = await businessRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const current = Array.isArray(snap.data()?.supportTaskCategories)
      ? snap.data()?.supportTaskCategories
      : []

    const nextCategories = [
      ...current,
      {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        name,
        default: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    await businessRef.update({
      supportTaskCategories: nextCategories,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      categories: nextCategories.map((category) => ({
        ...category,
        createdAt: toIso(category.createdAt),
        updatedAt: toIso(category.updatedAt),
      })),
    })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin category create error:', error)
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId } = await params
    const body = await req.json()
    const categoryId = String(body.categoryId || '').trim()

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    if (body.confirm !== true) {
      return NextResponse.json({ error: 'Category removal requires confirmation' }, { status: 400 })
    }

    const businessRef = adminDb.collection('businesses').doc(businessId)
    const snap = await businessRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const current = Array.isArray(snap.data()?.supportTaskCategories)
      ? snap.data()?.supportTaskCategories
      : []

    const nextCategories = current.filter((category: any) => String(category.id || '') !== categoryId)

    await businessRef.update({
      supportTaskCategories: nextCategories,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin category delete error:', error)
    return NextResponse.json({ error: 'Failed to remove category' }, { status: 500 })
  }
}
