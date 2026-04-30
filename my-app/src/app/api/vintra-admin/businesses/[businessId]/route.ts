import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { requireVintraAdmin, VintraAdminAuthError } from '@/lib/vintra-admin.server'

function toIso(value: any) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId } = await params
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const snap = await businessRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const data = snap.data() || {}
    const [usersSnap, chatsSnap] = await Promise.all([
      businessRef.collection('users').get(),
      businessRef.collection('supportChats').orderBy('updatedAt', 'desc').limit(10).get(),
    ])

    return NextResponse.json({
      business: {
        id: snap.id,
        name: String(data.name || ''),
        email: String(data.email || ''),
        ownerId: String(data.ownerId || ''),
        widgetKey: String(data.chatWidgetKey || ''),
        widgetConfig: data.chatWidgetConfig || null,
        assistantConfig: data.chatAssistantConfig || null,
        analytics: data.chatAnalytics || null,
        categories: Array.isArray(data.supportTaskCategories) ? data.supportTaskCategories : [],
        updatedAt: toIso(data.updatedAt),
        createdAt: toIso(data.createdAt),
      },
      users: usersSnap.docs.map((docSnap) => {
        const user = docSnap.data()
        return {
          id: docSnap.id,
          email: String(user.email || ''),
          displayName: user.displayName || null,
          role: user.role || 'user',
          status: user.status || 'active',
          createdAt: toIso(user.createdAt),
          updatedAt: toIso(user.updatedAt),
          lastLogin: toIso(user.lastLogin),
        }
      }),
      chats: chatsSnap.docs.map((docSnap) => {
        const chat = docSnap.data()
        return {
          id: docSnap.id,
          sessionId: String(chat.sessionId || docSnap.id),
          status: String(chat.status || 'needs-human'),
          preview: String(chat.preview || ''),
          visitorName: chat.visitorName || null,
          countryCode: chat.countryCode || null,
          updatedAt: toIso(chat.updatedAt),
          createdAt: toIso(chat.createdAt),
        }
      }),
    })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin business GET error:', error)
    return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId } = await params
    const body = await req.json()
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const snap = await businessRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (typeof body.name === 'string') updates.name = body.name.trim()
    if (typeof body.email === 'string') updates.email = body.email.trim().toLowerCase()
    if (typeof body.plan === 'string') {
      if (body.confirmPlanChange !== true) {
        return NextResponse.json(
          { error: 'Plan changes require confirmation' },
          { status: 400 }
        )
      }

      updates['chatWidgetConfig.plan'] = body.plan.trim()
    }
    if (body.assistantConfig) {
      const assistant = body.assistantConfig
      if (typeof assistant.enabled === 'boolean') {
        updates['chatAssistantConfig.enabled'] = assistant.enabled
      }
      if (typeof assistant.model === 'string') {
        updates['chatAssistantConfig.model'] = assistant.model.trim()
      }
      if (typeof assistant.systemPrompt === 'string') {
        updates['chatAssistantConfig.systemPrompt'] = assistant.systemPrompt
      }
      if (typeof assistant.businessContext === 'string') {
        updates['chatAssistantConfig.businessContext'] = assistant.businessContext
      }
      if (typeof assistant.restrictions === 'string') {
        updates['chatAssistantConfig.restrictions'] = assistant.restrictions
      }
      if (Array.isArray(assistant.supportTriggerKeywords)) {
        updates['chatAssistantConfig.supportTriggerKeywords'] = assistant.supportTriggerKeywords
          .map((value: string) => String(value).trim())
          .filter(Boolean)
      }
      if (typeof assistant.handoffMessage === 'string') {
        updates['chatAssistantConfig.handoffMessage'] = assistant.handoffMessage
      }
      if (typeof assistant.faqSuggestionsEnabled === 'boolean') {
        updates['chatAssistantConfig.faqSuggestionsEnabled'] = assistant.faqSuggestionsEnabled
      }
      if (Array.isArray(assistant.faqSuggestions)) {
        updates['chatAssistantConfig.faqSuggestions'] = assistant.faqSuggestions
          .map((value: string) => String(value).trim())
          .filter(Boolean)
      }
      if (typeof assistant.replyInUserLanguage === 'boolean') {
        updates['chatAssistantConfig.replyInUserLanguage'] = assistant.replyInUserLanguage
      }
      if (typeof assistant.responseStyle === 'string') {
        updates['chatAssistantConfig.responseStyle'] = assistant.responseStyle
      }
      if (typeof assistant.extraInstructions === 'string') {
        updates['chatAssistantConfig.extraInstructions'] = assistant.extraInstructions
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    updates.updatedAt = new Date()
    await businessRef.update(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin business PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    await requireVintraAdmin(req)
    const { businessId } = await params
    const body = await req.json().catch(() => ({}))

    if (body.confirm !== true) {
      return NextResponse.json({ error: 'Business deletion requires confirmation' }, { status: 400 })
    }

    const businessRef = adminDb.collection('businesses').doc(businessId)
    const snap = await businessRef.get()

    if (!snap.exists) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const usersSnap = await businessRef.collection('users').get()
    const chatsSnap = await businessRef.collection('supportChats').get()
    const tasksSnap = await businessRef.collection('supportTasks').get()

    const batch = adminDb.batch()
    usersSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    chatsSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    tasksSnap.docs.forEach((docSnap) => batch.delete(docSnap.ref))
    batch.delete(businessRef)

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof VintraAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Vintra admin business DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 })
  }
}
