import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyActiveUserToken } from '@/lib/verified-auth.server'
import { accessRole } from '@/lib/access/service.mjs'
import { getEffectiveBusinessPlan, getPlanLimits, sanitizeChatWidgetConfigForPlan } from '@/lib/subscription'
import { mergeWidgetConfig } from '@/lib/widget.server'
import { BillingError } from '@/lib/billing/service.mjs'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1]
    if (!token) throw new BillingError(401, 'Logg inn først.')
    let actor
    try { actor = await verifyActiveUserToken(token) }
    catch { throw new BillingError(401, 'Logg inn på nytt.') }
    const body = await req.json()
    if (typeof body.businessId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.businessId)) throw new BillingError(400, 'Ugyldig bedrift.')
    const db = getAdminDb(), ref = db.doc(`businesses/${body.businessId}`), widgetKey = randomUUID()
    await db.runTransaction(async tx => {
      const business = await tx.get(ref)
      const member = await tx.get(ref.collection('users').doc(actor.uid))
      const widgets = await tx.get(ref.collection('chatWidgets'))
      const data = business.data()
      if (!actor.email_verified || !['owner', 'admin'].includes(accessRole(data, member.data(), actor.uid) || '')) throw new BillingError(403, 'Du har ikke tilgang.')
      const plan = getEffectiveBusinessPlan(data)
      const limit = getPlanLimits(plan).maxWidgets
      const legacyCount = data?.chatWidgetKey && !widgets.docs.some(w => w.id === data.chatWidgetKey) ? 1 : 0
      if (limit !== null && widgets.size + legacyCount >= limit) throw new BillingError(403, 'Widgetgrensen er nådd. Oppgrader abonnementet på prissiden.')
      const source = widgets.docs.find(w => w.id === body.templateWidgetKey)?.data() || widgets.docs[0]?.data()
      const name = String(body.name || `Widget ${widgets.size + legacyCount + 1}`).trim().slice(0, 100)
      const config = sanitizeChatWidgetConfigForPlan(mergeWidgetConfig(source?.config || data?.chatWidgetConfig, data?.name || 'Chat', plan), plan)
      config.billingCycle = data?.chatWidgetConfig?.billingCycle || 'monthly'
      config.customBranding = { ...config.customBranding, title: name }
      const assistantConfig = body.assistantConfigOverride || source?.assistantConfig || data?.chatAssistantConfig
      if (assistantConfig && (typeof assistantConfig !== 'object' || Array.isArray(assistantConfig))) throw new BillingError(400, 'Ugyldig assistentoppsett.')
      tx.create(ref.collection('chatWidgets').doc(widgetKey), {
        widgetKey, name, config: JSON.parse(JSON.stringify(config)),
        assistantConfig: { ...(assistantConfig || {}), setupCompleted: false },
        isDefault: false, createdAt: new Date(), updatedAt: new Date(),
      })
      // Serialize concurrent creates even when both collection queries start empty.
      tx.update(ref, { widgetRevision: Number(data?.widgetRevision || 0) + 1, updatedAt: new Date() })
    })
    return NextResponse.json({ success: true, widgetKey, message: 'Widget opprettet.' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof BillingError ? error.message : 'Kunne ikke opprette widget.' },
      { status: error instanceof BillingError ? error.status : 500 })
  }
}
