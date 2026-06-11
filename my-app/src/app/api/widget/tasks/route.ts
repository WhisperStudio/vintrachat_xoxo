import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase-admin'
import { getBusinessByWidgetKey } from '@/lib/widget.server'
import { authorizeWidgetRequest } from '@/lib/widget-embed-token.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, X-Vintra-Embed-Token, X-Vintra-Fingerprint, X-Vintra-App-Origin, X-Vintra-Debug',
    Vary: 'Origin',
  }
}

function toIsoDate(value: any) {
  if (typeof value?.toDate === 'function') return value.toDate().toISOString()
  return String(value || new Date().toISOString())
}

function mapTask(docId: string, task: any) {
  return {
    id: docId,
    title: String(task?.title || ''),
    description: String(task?.description || ''),
    status: String(task?.status || 'open'),
    priority: String(task?.priority || 'medium'),
    categoryName: String(task?.categoryName || 'General'),
    createdAt: toIsoDate(task?.createdAt),
    updatedAt: toIsoDate(task?.updatedAt),
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const widgetKey = req.nextUrl.searchParams.get('key')
    const sessionId = req.nextUrl.searchParams.get('sessionId')

    if (!widgetKey || !sessionId) {
      return NextResponse.json({ error: 'Missing widget key or sessionId' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)
    if (!business?.id) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const access = await authorizeWidgetRequest({ req, business })
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403, headers })
    }

    const tasksSnap = await adminDb
      .collection('businesses')
      .doc(business.id)
      .collection('supportTasks')
      .where('sessionId', '==', sessionId)
      .get()

    return NextResponse.json(
      {
        tasks: tasksSnap.docs
          .filter((doc) => String(doc.data()?.widgetKey || '') === widgetKey)
          .map((doc) => mapTask(doc.id, doc.data()))
          .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget tasks GET error:', error)
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500, headers })
  }
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))

  try {
    const body = await req.json()
    const widgetKey = String(body.widgetKey || '')
    const sessionId = String(body.sessionId || '')
    const title = String(body.title || '').trim()
    const description = String(body.description || '').trim()
    const visitorName = body.visitorName ? String(body.visitorName).trim() : ''

    if (!widgetKey || !sessionId || !title || !description) {
      return NextResponse.json({ error: 'Missing widget key, sessionId, title or description' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)
    if (!business?.id) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    const access = await authorizeWidgetRequest({ req, business })
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 403, headers })
    }

    const taskRef = adminDb.collection('businesses').doc(business.id).collection('supportTasks').doc()
    await taskRef.set({
      businessId: business.id,
      widgetKey,
      chatId: sessionId,
      sessionId,
      visitorName: visitorName || null,
      title,
      description,
      categoryId: 'general',
      categoryName: 'General',
      priority: 'medium',
      status: 'open',
      createdBy: 'widget',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    await adminDb.collection('businesses').doc(business.id).update({
      updatedAt: FieldValue.serverTimestamp(),
    })

    const createdTask = await taskRef.get()

    return NextResponse.json(
      {
        success: true,
        task: mapTask(createdTask.id, createdTask.data() || {}),
      },
      { headers }
    )
  } catch (error) {
    console.error('Widget tasks POST error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500, headers })
  }
}
