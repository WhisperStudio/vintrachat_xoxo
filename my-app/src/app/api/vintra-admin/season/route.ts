import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { requireVintraAdmin, VintraAdminAuthError } from '@/lib/vintra-admin.server'
import { normalizeSiteSeason } from '@/lib/seasonal-theme'

const siteSettings = () => adminDb.collection('platformSettings').doc('site')

export async function GET() {
  try {
    const snapshot = await siteSettings().get()
    return NextResponse.json({ season: normalizeSiteSeason(snapshot.data()?.season) }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    console.error('Vintra site season GET error:', error)
    return NextResponse.json({ error: 'Failed to load site season' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireVintraAdmin(req)
    const body = await req.json()
    const season = normalizeSiteSeason(body?.season)
    if (season !== body?.season) {
      return NextResponse.json({ error: 'Invalid season' }, { status: 400 })
    }

    await siteSettings().set({ season, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ season })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Vintra site season PUT error:', error)
    return NextResponse.json({ error: 'Failed to save site season' }, { status: 500 })
  }
}
