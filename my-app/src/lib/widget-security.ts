import type { NextRequest } from 'next/server'

function isWidgetDebugAllowed() {
  const envValue = String(process.env.VINTRA_WIDGET_DEBUG_MODE || '').trim().toLowerCase()
  return process.env.NODE_ENV !== 'production' || ['1', 'true', 'yes', 'on'].includes(envValue)
}

export function isWidgetDebugRequest(req: NextRequest) {
  if (!isWidgetDebugAllowed()) return false

  const headerFlag = String(req.headers.get('x-vintra-debug') || '').trim() === '1'
  const queryFlag = req.nextUrl.searchParams.get('debug') === '1'
  return headerFlag || queryFlag
}

function normalizeSingleDomain(raw: string) {
  let value = String(raw || '').trim().toLowerCase()
  if (!value) return ''

  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  value = value.split('/')[0] || value
  value = value.split('?')[0] || value
  value = value.split('#')[0] || value
  value = value.replace(/^www\./, '')
  value = value.replace(/\s+/g, '')

  const bracketedIpv6 = value.match(/^\[(.+)\](?::(\d+))?$/)
  if (bracketedIpv6) {
    const host = bracketedIpv6[1]
    const port = bracketedIpv6[2] || ''
    return port ? `[${host}]:${port}` : `[${host}]`
  }

  const hostPortMatch = value.match(/^([^:]+)(?::(\d+))?$/)
  if (hostPortMatch) {
    const host = hostPortMatch[1]
    const port = hostPortMatch[2] || ''
    return port ? `${host}:${port}` : host
  }

  return value
}

export function parseAllowedDomainsInput(value: string | string[] | undefined | null) {
  const items = Array.isArray(value) ? value : String(value || '').split(/[\n,]/g)

  return Array.from(
    new Set(
      items
        .map((item) => normalizeSingleDomain(item))
        .filter(Boolean)
    )
  )
}

export function normalizeAllowedDomainList(value: unknown) {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .map((item) => normalizeSingleDomain(String(item || '')))
        .filter(Boolean)
    )
  )
}

export function getRequestOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin) return origin

  const referer = req.headers.get('referer')
  if (referer) return referer

  return ''
}

export function getRequestHostname(req: NextRequest) {
  const origin = getRequestOrigin(req)
  if (!origin) return ''

  try {
    return new URL(origin).hostname.toLowerCase()
  } catch {
    return ''
  }
}

export function getRequestHostWithPort(req: NextRequest) {
  const origin = getRequestOrigin(req)
  if (!origin) return ''

  try {
    const url = new URL(origin)
    const hostname = url.hostname.toLowerCase()
    return url.port ? `${hostname}:${url.port}` : hostname
  } catch {
    return ''
  }
}

export function isSameOriginRequest(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin && origin === req.nextUrl.origin) {
    return true
  }

  const referer = req.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === req.nextUrl.origin
    } catch {
      return false
    }
  }

  return false
}

export function matchesAllowedDomain(hostname: string, allowedDomain: string) {
  const host = normalizeSingleDomain(hostname)
  const allowed = normalizeSingleDomain(allowedDomain)

  if (!host || !allowed) return false

  const hostParts = host.match(/^(.+?)(?::(\d+))?$/)
  const allowedParts = allowed.match(/^(.+?)(?::(\d+))?$/)

  if (!hostParts || !allowedParts) return false

  const hostName = hostParts[1]
  const hostPort = hostParts[2] || ''
  const allowedName = allowedParts[1]
  const allowedPort = allowedParts[2] || ''

  const namesMatch = hostName === allowedName || hostName.endsWith(`.${allowedName}`)
  if (!namesMatch) return false

  if (allowedPort) {
    return hostPort === allowedPort
  }

  return true
}

export function isRequestOriginAllowed(
  req: NextRequest,
  allowedDomains: unknown
) {
  if (isWidgetDebugRequest(req)) {
    return { allowed: true as const, debug: true as const }
  }

  const normalizedAllowedDomains = normalizeAllowedDomainList(allowedDomains)
  if (!normalizedAllowedDomains.length) {
    return {
      allowed: false as const,
      reason: 'This widget is restricted to approved domains.',
    }
  }

  const hostname = getRequestHostWithPort(req) || getRequestHostname(req)
  if (!hostname) {
    return {
      allowed: false as const,
      reason: 'This widget is restricted to approved domains.',
    }
  }

  const allowed = normalizedAllowedDomains.some((domain) => matchesAllowedDomain(hostname, domain))
  return allowed
    ? { allowed: true as const }
    : {
        allowed: false as const,
        reason: 'This widget is restricted to approved domains.',
      }
}

export function isWidgetOriginPermitted(req: NextRequest, allowedDomains: unknown) {
  if (isWidgetDebugRequest(req)) {
    return { allowed: true as const, internal: false as const, debug: true as const }
  }

  if (isSameOriginRequest(req)) {
    return { allowed: true as const, internal: true as const }
  }

  const originCheck = isRequestOriginAllowed(req, allowedDomains)
  if (!originCheck.allowed) {
    return originCheck
  }

  return { allowed: true as const, internal: false as const }
}

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  const ip = String(cfConnectingIp || realIp || forwardedFor?.split(',')[0] || '').trim()
  return ip || 'unknown'
}

export function countWords(text: string) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function truncateTextByWords(text: string, maxWords: number) {
  const words = String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words.slice(0, maxWords).join(' ')
}
