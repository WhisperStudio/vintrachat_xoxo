import { NextRequest, NextResponse } from 'next/server'
import { scanWebsiteForAssistantContext } from '@/lib/website-context-scanner'

const DEFAULTS = {
  maxPages: 12,
  maxCharactersPerPage: 6000,
  timeoutMs: 10000,
  includeRawText: true,
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, Math.round(parsed)))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const url = typeof body?.url === 'string' ? body.url.trim() : ''
    const config = body?.config && typeof body.config === 'object' ? body.config : {}

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Missing website URL.' },
        { status: 400 }
      )
    }

    let normalizedUrl = ''

    try {
      const withProtocol =
        url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
      const parsed = new URL(withProtocol)

      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json(
          { success: false, error: 'Only HTTP and HTTPS URLs are supported.' },
          { status: 400 }
        )
      }

      normalizedUrl = parsed.toString()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid website URL.' },
        { status: 400 }
      )
    }

    const result = await scanWebsiteForAssistantContext(normalizedUrl, {
      maxPages: clampNumber(config.maxPages, 1, 30, DEFAULTS.maxPages),
      maxCharactersPerPage: clampNumber(
        config.maxCharactersPerPage,
        500,
        12000,
        DEFAULTS.maxCharactersPerPage
      ),
      timeoutMs: clampNumber(config.timeoutMs, 2000, 20000, DEFAULTS.timeoutMs),
      includeRawText:
        typeof config.includeRawText === 'boolean'
          ? config.includeRawText
          : DEFAULTS.includeRawText,
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    console.error('Website scan failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Website scan failed. Please try again.',
      },
      { status: 500 }
    )
  }
}
