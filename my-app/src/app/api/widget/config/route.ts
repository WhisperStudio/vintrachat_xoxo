import { NextRequest, NextResponse } from 'next/server'
import { getBusinessByWidgetKey } from '@/lib/widget.server'

export async function GET(req: NextRequest) {
  try {
    const widgetKey = req.nextUrl.searchParams.get('key')

    if (!widgetKey) {
      return NextResponse.json({ error: 'Missing widget key' }, { status: 400 })
    }

    const business = await getBusinessByWidgetKey(widgetKey)

    if (!business?.chatWidgetConfig) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    return NextResponse.json({
      businessName: business.name,
      widgetKey: business.chatWidgetKey,
      widgetConfig: business.chatWidgetConfig,
      assistantEnabled: business.chatAssistantConfig?.enabled ?? true,
    })
  } catch (error) {
    console.error('Widget config error:', error)
    const details =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : undefined

    return NextResponse.json(
      { error: 'Failed to load widget config', details },
      { status: 500 }
    )
  }
}
