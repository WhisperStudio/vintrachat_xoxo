import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { consumeServerRateLimit } from '@/lib/server-rate-limit'
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

function isBlockedHostname(hostname: string) {
  const host = String(hostname || '').trim().toLowerCase()
  if (!host) return true
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true
  if (host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true
  if (host === '169.254.169.254') return true
  if (/^10\./.test(host)) return true
  if (/^192\.168\./.test(host)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || ''
    const token = authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice(7).trim()
      : ''

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing authorization token.' },
        { status: 401 }
      )
    }

    const decoded = await adminAuth.verifyIdToken(token)
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

      if (isBlockedHostname(parsed.hostname)) {
        return NextResponse.json(
          { success: false, error: 'This URL host is not allowed for scanning.' },
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

    const rateLimit = await consumeServerRateLimit({
      scope: 'scan-website',
      key: `${decoded.uid}:${normalizedUrl}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many scan requests. Please try again later.' },
        { status: 429 }
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
