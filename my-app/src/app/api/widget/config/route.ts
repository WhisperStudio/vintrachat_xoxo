import { NextRequest, NextResponse } from 'next/server'
import { getBusinessByWidgetKey } from '@/lib/widget.server'

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function GET(req: NextRequest) {
  try {
    const widgetKey = req.nextUrl.searchParams.get('key')
    const headers = corsHeaders(req.headers.get('origin'))

    if (!widgetKey) {
      return NextResponse.json({ error: 'Missing widget key' }, { status: 400, headers })
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers })
    }

    return NextResponse.json({
      businessName: business.name,
      widgetKey: business.chatWidgetKey,
      widgetConfig: business.chatWidgetConfig,
      assistantEnabled: business.chatAssistantConfig?.enabled ?? true,
    }, { headers })
  } catch (error) {
    console.error('Widget config error:', error)
    const headers = corsHeaders(req.headers.get('origin'))
    const details =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : undefined

    return NextResponse.json(
      { error: 'Failed to load widget config', details },
      { status: 500, headers }
    )
  }
}
