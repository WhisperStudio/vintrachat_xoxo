// src/lib/website-context-scanner.ts

import * as cheerio from 'cheerio'
import type { AssistantBusinessProfile, AssistantKnowledgeBase } from '@/types/database'

export type WebsiteScanResult = {
  businessContext: string
  faqSuggestions: string[]
  autofill: WebsiteAutofillResult
  discoveredPages: {
    url: string
    title: string
    description: string
    textPreview: string
  }[]
  rawText: string
}

export type WebsiteAutofillResult = {
  businessProfile: Partial<AssistantBusinessProfile>
  knowledgeBase: Partial<AssistantKnowledgeBase> & { websiteUrls: string[] }
  missingFields: Partial<
    Record<
      | 'businessName'
      | 'industry'
      | 'shortDescription'
      | 'toneOfVoice'
      | 'language'
      | 'mainGoal'
      | 'fallbackContact'
      | 'websiteUrls'
      | 'openingHours'
      | 'contactInfo'
      | 'addresses',
      string
    >
  >
}

type ScanOptions = {
  maxPages?: number
  maxCharactersPerPage?: number
  timeoutMs?: number
}

type LoadedCheerio = ReturnType<typeof cheerio.load>
type CheerioInput = Parameters<LoadedCheerio>[0]

type LinkSource = 'navigation' | 'footer' | 'content'

type StructuredLink = {
  text: string
  url: string
  source: LinkSource
}

type ContactInfo = {
  emails: string[]
  phones: string[]
}

type ExtractedPage = {
  url: string
  title: string
  description: string
  ogTitle: string
  canonicalUrl: string
  headings: string[]
  text: string
  summaryText: string
  bodyLines: string[]
  footerLines: string[]
  relevantLines: string[]
  links: string[]
  structuredLinks: StructuredLink[]
  contactInfo: ContactInfo
  metaLines: string[]
  schemaLines: string[]
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  maxPages: 12,
  maxCharactersPerPage: 6000,
  timeoutMs: 10000,
}

const TEXT_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'li',
  'dt',
  'dd',
  'address',
  'figcaption',
  'blockquote',
  'summary',
  'button',
  'a',
].join(',')

const BUSINESS_KEYWORDS = [
  'about',
  'admin',
  'ai',
  'appointment',
  'apning',
  'assistant',
  'bestill',
  'book',
  'booking',
  'business',
  'chat',
  'chatbot',
  'clinic',
  'color',
  'contact',
  'cost',
  'dashboard',
  'design',
  'email',
  'footer',
  'free',
  'help',
  'header',
  'hour',
  'location',
  'opening',
  'phone',
  'price',
  'pricing',
  'pris',
  'product',
  'service',
  'support',
  'task',
  'tjeneste',
  'widget',
  'website',
]

const SERVICE_KEYWORDS = [
  'ai',
  'assistant',
  'chat',
  'chatbot',
  'design',
  'product',
  'service',
  'tjeneste',
  'website',
  'webside',
  'nettside',
]

const PRICE_KEYWORDS = [
  'cost',
  'free',
  'kr',
  'nok',
  'package',
  'plan',
  'price',
  'pricing',
  'pris',
  'vat',
]

const CONTACT_KEYWORDS = [
  'contact',
  'email',
  'phone',
  'support',
  'kontakt',
  'kundeservice',
]

const BOOKING_KEYWORDS = [
  'appointment',
  'bestill',
  'book',
  'booking',
  'calendar',
  'reserve',
]

const OPENING_HOURS_PATTERNS = [
  /\bopening\s+hours?\b.{0,120}\d{1,2}/i,
  /\bbusiness\s+hours?\b.{0,120}\d{1,2}/i,
  /\bapningstid.{0,120}\d{1,2}/i,
  /\bhours?:\s*\d/i,
  /\b(mon(day)?|tue(sday)?|wed(nesday)?|thu(rsday)?|fri(day)?|sat(urday)?|sun(day)?)\b.{0,80}\d{1,2}[:.]\d{2}/i,
  /\b(mandag|tirsdag|onsdag|torsdag|fredag|lordag|sondag)\b.{0,80}\d{1,2}[:.]\d{2}/i,
]

function normalizeStartUrl(inputUrl: string) {
  const trimmed = inputUrl.trim()

  if (!trimmed) {
    throw new Error('URL is required')
  }

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`

  const url = new URL(withProtocol)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed')
  }

  url.pathname = '/'
  url.search = ''
  url.hash = ''

  return url
}

function isSameWebsite(url: URL, rootUrl: URL) {
  return url.hostname.replace(/^www\./, '') === rootUrl.hostname.replace(/^www\./, '')
}

function cleanText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

function normalizeForSearch(value: string) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function uniqueStrings(items: string[], maxItems = 60) {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const item of items) {
    const cleaned = cleanText(item)
    const key = normalizeForSearch(cleaned)

    if (!cleaned || seen.has(key)) continue

    seen.add(key)
    unique.push(cleaned)

    if (unique.length >= maxItems) break
  }

  return unique
}

function cleanUrl(rawHref: string, currentUrl: string, rootUrl: URL) {
  try {
    if (
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('#')
    ) {
      return null
    }

    const url = new URL(rawHref, currentUrl)

    url.hash = ''
    url.search = ''

    if (!isSameWebsite(url, rootUrl)) return null
    if (!['http:', 'https:'].includes(url.protocol)) return null

    return url.toString()
  } catch {
    return null
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VintraWebsiteScanner/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }

    return await response.text()
  } finally {
    clearTimeout(timeout)
  }
}

async function findSitemapUrls(rootUrl: URL, timeoutMs: number) {
  const sitemapCandidates = [
    new URL('/sitemap.xml', rootUrl.origin).toString(),
    new URL('/sitemap_index.xml', rootUrl.origin).toString(),
  ]

  const foundUrls = new Set<string>()

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const xml = await fetchWithTimeout(sitemapUrl, timeoutMs)

      const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
        .map((match) => match[1]?.trim())
        .filter(Boolean)

      for (const loc of matches) {
        try {
          const parsed = new URL(loc)

          if (isSameWebsite(parsed, rootUrl)) {
            parsed.hash = ''
            parsed.search = ''
            foundUrls.add(parsed.toString())
          }
        } catch {
          // ignore invalid sitemap URLs
        }
      }
    } catch {
      // ignore missing sitemap
    }
  }

  return [...foundUrls]
}

function getElementText($: LoadedCheerio, element: CheerioInput) {
  const text = $(element)
    .contents()
    .map((_, node) => $(node).text())
    .get()
    .join(' ')

  return cleanText(text)
}

function collectTextLines($: LoadedCheerio, selector: string, maxItems = 80) {
  const lines: string[] = []

  $(selector).each((_, scope) => {
    const scopeElement = $(scope)

    if (scopeElement.is(TEXT_SELECTOR)) {
      lines.push(getElementText($, scope))
    }

    scopeElement.find(TEXT_SELECTOR).each((__, element) => {
      lines.push(getElementText($, element))
    })
  })

  return uniqueStrings(
    lines.filter((line) => line.length >= 3 && line.length <= 320),
    maxItems
  )
}

function extractContactInfo(text: string, structuredLinks: StructuredLink[] = []): ContactInfo {
  const emailMatches = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []
  const phoneMatches = text.match(/(?:\+|00)\d[\d\s().-]{6,}\d/g) ?? []

  const linkEmails = structuredLinks
    .filter((link) => link.url.startsWith('mailto:'))
    .map((link) => link.url.replace(/^mailto:/i, '').split('?')[0] ?? '')

  const linkPhones = structuredLinks
    .filter((link) => link.url.startsWith('tel:'))
    .map((link) => link.url.replace(/^tel:/i, '').split('?')[0] ?? '')

  return {
    emails: uniqueStrings([...emailMatches, ...linkEmails], 10),
    phones: uniqueStrings([...phoneMatches, ...linkPhones], 10),
  }
}

function extractMetaLines($: LoadedCheerio) {
  const entries = [
    ['title', $('title').first().text()],
    ['og:title', $('meta[property="og:title"]').attr('content') ?? ''],
    ['og:site_name', $('meta[property="og:site_name"]').attr('content') ?? ''],
    ['og:description', $('meta[property="og:description"]').attr('content') ?? ''],
    ['description', $('meta[name="description"]').attr('content') ?? ''],
    ['keywords', $('meta[name="keywords"]').attr('content') ?? ''],
    ['author', $('meta[name="author"]').attr('content') ?? ''],
    ['twitter:title', $('meta[name="twitter:title"]').attr('content') ?? ''],
    ['twitter:description', $('meta[name="twitter:description"]').attr('content') ?? ''],
    ['canonical', $('link[rel="canonical"]').attr('href') ?? ''],
    ['language', $('html').attr('lang') ?? ''],
  ]

  return uniqueStrings(
    entries
      .map(([label, value]) => {
        const cleaned = cleanText(value)
        return cleaned ? `${label}: ${cleaned}` : ''
      })
      .filter(Boolean),
    20
  )
}

function extractJsonLdLines($: LoadedCheerio) {
  const lines: string[] = []

  const addLine = (label: string, value: string | undefined | null) => {
    const cleaned = cleanText(value ?? '')
    if (cleaned) lines.push(`${label}: ${cleaned}`)
  }

  const visit = (node: unknown) => {
    if (!node) return

    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }

    if (typeof node !== 'object') return

    const data = node as Record<string, unknown>
    const typeValue = data['@type']
    const typeText = Array.isArray(typeValue) ? typeValue.join(', ') : typeof typeValue === 'string' ? typeValue : ''

    addLine('Schema type', typeText)
    addLine('Schema name', typeof data.name === 'string' ? data.name : undefined)
    addLine('Schema description', typeof data.description === 'string' ? data.description : undefined)
    addLine('Schema email', typeof data.email === 'string' ? data.email : undefined)
    addLine('Schema phone', typeof data.telephone === 'string' ? data.telephone : undefined)
    addLine('Schema url', typeof data.url === 'string' ? data.url : undefined)
    addLine('Schema opening hours', typeof data.openingHours === 'string' ? data.openingHours : undefined)

    const sameAs = data.sameAs
    if (Array.isArray(sameAs)) {
      sameAs.forEach((entry) => {
        if (typeof entry === 'string') {
          addLine('Schema sameAs', entry)
        }
      })
    } else if (typeof sameAs === 'string') {
      addLine('Schema sameAs', sameAs)
    }

    const address = data.address
    if (address && typeof address === 'object') {
      const addressData = address as Record<string, unknown>
      const addressParts = [
        addressData.streetAddress,
        addressData.postalCode,
        addressData.addressLocality,
        addressData.addressRegion,
        addressData.addressCountry,
      ]
        .filter((part): part is string => typeof part === 'string' && cleanText(part).length > 0)
        .map((part) => cleanText(part))

      if (addressParts.length) {
        lines.push(`Schema address: ${addressParts.join(', ')}`)
      }
    }

    const graph = data['@graph']
    if (graph) visit(graph)
  }

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = cleanText($(element).text())
    if (!raw) return

    try {
      visit(JSON.parse(raw))
    } catch {
      // ignore invalid json-ld
    }
  })

  return uniqueStrings(lines, 30)
}

function extractStructuredLinks(
  $: LoadedCheerio,
  currentUrl: string,
  rootUrl: URL
): StructuredLink[] {
  const links: StructuredLink[] = []

  const addLink = (element: CheerioInput, source: LinkSource) => {
    const rawHref = $(element).attr('href')?.trim()
    const text = getElementText($, element)

    if (!rawHref || !text || text.length > 80) return
    if (rawHref.startsWith('javascript:') || rawHref.startsWith('#')) return

    const url =
      rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')
        ? rawHref
        : cleanUrl(rawHref, currentUrl, rootUrl)

    if (!url) return

    links.push({ text, url, source })
  }

  $('header a[href], nav a[href]').each((_, element) => addLink(element, 'navigation'))
  $('footer a[href]').each((_, element) => addLink(element, 'footer'))
  $('main a[href], article a[href], body a[href]').each((_, element) => {
    addLink(element, 'content')
  })

  const seen = new Set<string>()

  return links.filter((link) => {
    const key = `${link.source}:${normalizeForSearch(link.text)}:${link.url}`

    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function lineScore(line: string) {
  const lowered = normalizeForSearch(line)
  let score = 0

  for (const keyword of BUSINESS_KEYWORDS) {
    if (lowered.includes(keyword)) score += 1
  }

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(line)) score += 3
  if (/(?:\+|00)\d[\d\s().-]{6,}\d/.test(line)) score += 3
  if (/\b\d+[\s,.]*\d*\s*(kr|nok|usd|eur)\b/i.test(lowered)) score += 2
  if (OPENING_HOURS_PATTERNS.some((pattern) => pattern.test(lowered))) score += 3

  return score
}

function selectRelevantLines(lines: string[], maxItems = 30) {
  return uniqueStrings(lines, 120)
    .map((line) => ({ line, score: lineScore(line) }))
    .filter(({ line, score }) => {
      const lowered = normalizeForSearch(line)

      if (score <= 0) return false
      if (lowered === 'laster...' || lowered === 'loading...') return false
      if (lowered === 'write a message...' || lowered === 'copy reset') return false

      return true
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ line }) => line)
}

function selectLinesByKeywords(
  pages: ExtractedPage[],
  keywords: string[],
  maxItems = 8
) {
  const lines = pages.flatMap((page) => page.relevantLines)

  return uniqueStrings(
    lines.filter((line) => {
      const lowered = normalizeForSearch(line)

      return keywords.some((keyword) => lowered.includes(keyword))
    }),
    maxItems
  )
}

function formatBullets(items: string[], emptyMessage: string, maxItems = 8) {
  const visibleItems = uniqueStrings(items, maxItems)

  if (!visibleItems.length) return [`- ${emptyMessage}`]

  return visibleItems.map((item) => `- ${item}`)
}

function isImportantNavigationLink(link: StructuredLink) {
  const lowered = normalizeForSearch(`${link.text} ${link.url}`)

  return [
    'admin',
    'analytics',
    'book',
    'booking',
    'chat',
    'contact',
    'dashboard',
    'faq',
    'feedback',
    'help',
    'login',
    'price',
    'pricing',
    'pris',
    'service',
    'setting',
    'support',
    'task',
    'widget',
  ].some((keyword) => lowered.includes(keyword))
}

function formatNavigationLinks(pages: ExtractedPage[]) {
  const links = pages
    .flatMap((page) => page.structuredLinks)
    .filter((link) => link.source !== 'content' || isImportantNavigationLink(link))
    .filter((link) => link.source !== 'content' || link.text.length > 2)

  const formatted = links.map((link) => {
    const sourceLabel =
      link.source === 'navigation'
        ? 'header/navigation'
        : link.source === 'footer'
          ? 'footer'
          : 'page content'

    return `${link.text}: ${link.url} (${sourceLabel})`
  })

  return uniqueStrings(formatted, 14)
}

function extractUsefulPageData(
  html: string,
  url: string,
  rootUrl: URL,
  maxCharacters: number
): ExtractedPage {
  const $ = cheerio.load(html)

  $('script, style, noscript, svg, canvas, iframe').remove()
  $('[aria-hidden="true"]').remove()
  $('[class*="cookie"], [id*="cookie"], [class*="banner"], [id*="banner"]').remove()
  $('[class*="popup"], [id*="popup"], [class*="modal"], [id*="modal"]').remove()

  const title =
    cleanText($('title').first().text()) ||
    cleanText($('h1').first().text()) ||
    url

  const ogTitle = cleanText($('meta[property="og:title"]').attr('content') ?? '')
  const canonicalUrl = cleanText($('link[rel="canonical"]').attr('href') ?? '')

  const description =
    cleanText($('meta[name="description"]').attr('content') ?? '') ||
    cleanText($('meta[property="og:description"]').attr('content') ?? '')

  const headings = uniqueStrings(
    $('h1, h2, h3')
      .map((_, element) => getElementText($, element))
      .get()
      .filter(Boolean),
    20
  )

  const structuredLinks = extractStructuredLinks($, url, rootUrl)
  const metaLines = extractMetaLines($)
  const schemaLines = extractJsonLdLines($)
  const bodyScopes = $('main, article').length ? 'main, article' : 'body'
  const bodyLines = collectTextLines($, bodyScopes, 100)
  const footerLines = collectTextLines($, 'footer', 30)
  const navigationLines = collectTextLines($, 'header, nav', 30)
  const allLines = uniqueStrings(
    [
      title ? `Title: ${title}` : '',
      ogTitle ? `OG title: ${ogTitle}` : '',
      canonicalUrl ? `Canonical: ${canonicalUrl}` : '',
      description ? `Description: ${description}` : '',
      ...headings,
      ...metaLines,
      ...schemaLines,
      ...navigationLines,
      ...bodyLines,
      ...footerLines,
    ],
    140
  )
  const relevantLines = selectRelevantLines(allLines, 35)
  const summaryLines = uniqueStrings(
    [
      description,
      ...headings.slice(0, 8),
      ...relevantLines,
      ...footerLines.filter((line) => lineScore(line) > 0),
    ],
    45
  )
  const text = summaryLines.join('\n').slice(0, maxCharacters)
  const contactInfo = extractContactInfo(
    [...allLines, ...structuredLinks.map((link) => `${link.text} ${link.url}`)].join('\n'),
    structuredLinks
  )

  return {
    url,
    title,
    description,
    ogTitle,
    canonicalUrl,
    headings,
    text,
    summaryText: text,
    bodyLines,
    footerLines,
    relevantLines,
    links: structuredLinks.map((link) => link.url),
    structuredLinks,
    contactInfo,
    metaLines,
    schemaLines,
  }
}

function scoreUrl(url: string) {
  const lowered = url.toLowerCase()

  const importantWords = [
    'about',
    'om-oss',
    'services',
    'tjenester',
    'pricing',
    'prices',
    'priser',
    'contact',
    'kontakt',
    'faq',
    'help',
    'support',
    'products',
    'produkter',
    'booking',
    'widget',
    'chat',
  ]

  let score = 0

  for (const word of importantWords) {
    if (lowered.includes(word)) score += 5
  }

  if (lowered === new URL(url).origin + '/') score += 10

  return score
}

function buildFallbackUrls(rootUrl: URL) {
  const paths = [
    '/',
    '/kontakt',
    '/contact',
    '/om-oss',
    '/about',
    '/about-us',
    '/om',
    '/kundeservice',
    '/customer-service',
    '/support',
    '/help',
    '/service',
    '/tjenester',
    '/services',
    '/priser',
    '/pricing',
    '/faq',
    '/booking',
    '/bestill',
    '/book',
    '/vilkaar',
    '/terms',
    '/personvern',
    '/privacy',
    '/imprint',
    '/kontakt-oss',
    '/kontaktoss',
  ]

  return uniqueStrings(
    paths.map((path) => new URL(path, rootUrl.origin).toString()),
    paths.length
  )
}

function buildSeedUrls(rootUrl: URL, sitemapUrls: string[]) {
  const candidates = uniqueStrings(
    [
      rootUrl.toString(),
      ...sitemapUrls,
      ...buildFallbackUrls(rootUrl),
    ],
    60
  )

  return candidates.sort((a, b) => scoreUrl(b) - scoreUrl(a))
}

function shouldKeepPage(page: ExtractedPage, rootUrl: URL) {
  const parsed = new URL(page.url)
  const pathname = parsed.pathname.toLowerCase()
  const authLikePage = /\/(auth|login|signin|sign-in|register)(\/|$)/.test(pathname)

  if (page.url === rootUrl.toString()) return true

  if (authLikePage && page.bodyLines.length <= 2) {
    return false
  }

  if (page.summaryText.length >= 120) return true
  if (page.contactInfo.emails.length || page.contactInfo.phones.length) return true
  if (page.structuredLinks.some((link) => link.source !== 'content')) return true
  if (page.metaLines.length || page.schemaLines.length) return true

  return false
}

function buildOverviewLines(pages: ExtractedPage[]) {
  const homePage = pages[0]
  const candidates = uniqueStrings(
    [
      homePage?.description ?? '',
      homePage?.ogTitle ?? '',
      homePage?.canonicalUrl ?? '',
      ...(homePage?.headings ?? []),
      ...(homePage?.schemaLines ?? []),
      ...pages.flatMap((page) => page.relevantLines),
    ].filter((line) => line.length <= 220),
    6
  )

  return candidates.length ? candidates : ['The scan did not find a clear business description.']
}

function extractBusinessName(pages: ExtractedPage[], rootUrl: URL) {
  const candidates = uniqueStrings(
    [
      ...pages.flatMap((page) => [
        page.ogTitle,
        page.title,
        ...page.schemaLines,
        ...page.metaLines,
      ]),
      rootUrl.hostname.replace(/^www\./, ''),
    ],
    30
  )

  const filtered = candidates.filter((line) => {
    const lowered = normalizeForSearch(line)
    return !lowered.includes('cookie') && !lowered.includes('privacy') && !lowered.includes('policy')
  })

  return filtered[0] || ''
}

function extractSummary(pages: ExtractedPage[]) {
  const candidates = uniqueStrings(
    pages.flatMap((page) => [
      page.description,
      page.ogTitle,
      ...page.headings.slice(0, 4),
      ...page.relevantLines,
    ]),
    12
  )

  if (!candidates.length) return ''

  const first = candidates[0]
  const second = candidates[1]

  return second ? `${first} ${second}`.slice(0, 220) : first.slice(0, 220)
}

function scoreIndustryText(text: string, patterns: RegExp[]) {
  const lowered = normalizeForSearch(text)
  return patterns.reduce((score, pattern) => (pattern.test(lowered) ? score + 1 : score), 0)
}

function extractIndustry(pages: ExtractedPage[]) {
  const pageWeights = {
    title: 6,
    ogTitle: 6,
    description: 5,
    headings: 4,
    relevant: 3,
    footer: 2,
    schema: 4,
    meta: 2,
  }

  const industries: Array<{
    label: string
    positive: RegExp[]
    negative?: RegExp[]
  }> = [
    {
      label: 'Roadside assistance / vehicle recovery',
      positive: [
        /\bveihjelp\b/,
        /\bbilberging\b/,
        /\bredningstjeneste\b/,
        /\broadside assistance\b/,
        /\broadside\b/,
        /\bbilredning\b/,
        /\bbergingsbil\b/,
        /\bbilberger\b/,
        /\btauing\b/,
        /\bstarthjelp\b/,
        /\bdekkskift\b/,
        /\bpunktert\b/,
      ],
    },
    {
      label: 'Automotive repair / workshop',
      positive: [
        /\bbilverksted\b/,
        /\bverksted\b/,
        /\bcar repair\b/,
        /\bauto repair\b/,
        /\bserviceverksted\b/,
        /\bmekanisk\b/,
        /\bbilservice\b/,
        /\bdekk\b/,
        /\bworkshop\b/,
      ],
      negative: [/\bbank\b/, /\bpensjon\b/, /\bhealth\b/, /\blegal\b/],
    },
    {
      label: 'Transport / logistics',
      positive: [
        /\btransport\b/,
        /\blogistics\b/,
        /\bfrakt\b/,
        /\bshipping\b/,
        /\bdistribusjon\b/,
        /\bdistribution\b/,
        /\bwarehouse\b/,
        /\blager\b/,
        /\bfreight\b/,
        /\btrucking\b/,
        /\bgodstransport\b/,
        /\blevering\b/,
      ],
      negative: [/\bbank\b/, /\bpensjon\b/, /\blegal\b/, /\bhealth\b/],
    },
    {
      label: 'Bank / financial services',
      positive: [
        /\bbank\b/,
        /\bfinans\b/,
        /\bfinancial\b/,
        /\bfinance\b/,
        /\bpensjon\b/,
        /\bpension\b/,
        /\bforsikring\b/,
        /\binsurance\b/,
        /\bfond\b/,
        /\basset management\b/,
        /\bkapitalforvaltning\b/,
        /\bkreditt\b/,
        /\bl[åa]n\b/,
        /\bsparing\b/,
      ],
      negative: [/\bklinikk\b/, /\bclinic\b/, /\bhealth\b/, /\bmedical\b/],
    },
    {
      label: 'Pension fund / insurance',
      positive: [
        /\bpensjonsselskap\b/,
        /\bpensjon\b/,
        /\bpension\b/,
        /\bkundeeier\b/,
        /\bforsikring\b/,
        /\binsurance\b/,
        /\bkommunal\b/,
        /\bkapitalforvaltning\b/,
      ],
    },
    {
      label: 'Hair salon / barber',
      positive: [/\bfris[oø]r\b/, /\bhairdresser\b/, /\bhair salon\b/, /\bbarber\b/],
    },
    {
      label: 'Plumbing services',
      positive: [/\br[oø]rlegger\b/, /\bplumber\b/, /\bvvs\b/, /\bveihjelp\b/],
    },
    {
      label: 'Restaurant / café',
      positive: [/\brestaurant\b/, /\bcaf[eé]\b/, /\bcafe\b/, /\bbar\b/],
    },
    {
      label: 'Clinic / healthcare',
      positive: [/\bklinikk\b/, /\bclinic\b/, /\bhealth\b/, /\bmedical\b/, /\bhealthcare\b/],
      negative: [/\bpensjon\b/, /\bbank\b/, /\bfinans\b/],
    },
    {
      label: 'Retail / e-commerce',
      positive: [/\bnettbutikk\b/, /\be-commerce\b/, /\becommerce\b/, /\bcheckout\b/, /\bhandlekurv\b/, /\bcart\b/],
      negative: [/\bbank\b/, /\bpensjon\b/, /\binsurance\b/, /\bveihjelp\b/],
    },
    {
      label: 'Legal services',
      positive: [/\badvokat\b/, /\blawyer\b/, /\blegal\b/, /\bjuridisk\b/, /\bjuridical\b/, /\brettshjelp\b/],
    },
    {
      label: 'Consulting / professional services',
      positive: [/\br[åa]dgivning\b/, /\bconsulting\b/, /\baccounting\b/, /\bregnskap\b/],
    },
    {
      label: 'Real estate',
      positive: [/\beiendom\b/, /\breal estate\b/, /\bproperty\b/, /\bbolig\b/, /\bmegler\b/],
    },
    {
      label: 'Hospitality / travel',
      positive: [/\bhotell\b/, /\bhotel\b/, /\btravel\b/, /\breise\b/],
    },
    {
      label: 'Construction / building',
      positive: [/\bbygg\b/, /\bconstruction\b/, /\bentrepren[oø]r\b/],
    },
    {
      label: 'Design / digital studio',
      positive: [/\bdesign\b/, /\bweb\s?design\b/, /\bdigital\b/, /\bstudio\b/],
    },
    {
      label: 'Support / customer service',
      positive: [/\bsupport\b/, /\bcustomer service\b/, /\bkundeservice\b/, /\bhelpdesk\b/],
    },
  ]

  const candidatePages = pages.map((page) => ({
    title: page.title,
    ogTitle: page.ogTitle,
    description: page.description,
    summaryText: page.summaryText,
    headings: page.headings.join(' '),
    relevantLines: page.relevantLines.join(' '),
    footerLines: page.footerLines.join(' '),
    schemaLines: page.schemaLines.join(' '),
    metaLines: page.metaLines.join(' '),
  }))

  const scored = industries
    .map((industry) => {
      const score = candidatePages.reduce((total, page) => {
        const positiveScore =
          scoreIndustryText(page.title, industry.positive) * pageWeights.title +
          scoreIndustryText(page.ogTitle, industry.positive) * pageWeights.ogTitle +
          scoreIndustryText(page.description, industry.positive) * pageWeights.description +
          scoreIndustryText(page.headings, industry.positive) * pageWeights.headings +
          scoreIndustryText(page.relevantLines, industry.positive) * pageWeights.relevant +
          scoreIndustryText(page.footerLines, industry.positive) * pageWeights.footer +
          scoreIndustryText(page.schemaLines, industry.positive) * pageWeights.schema +
          scoreIndustryText(page.metaLines, industry.positive) * pageWeights.meta

        const negativeScore = industry.negative
          ? scoreIndustryText(page.title, industry.negative) * 4 +
            scoreIndustryText(page.ogTitle, industry.negative) * 4 +
            scoreIndustryText(page.description, industry.negative) * 3 +
            scoreIndustryText(page.headings, industry.negative) * 2 +
            scoreIndustryText(page.relevantLines, industry.negative) * 2 +
            scoreIndustryText(page.footerLines, industry.negative) +
            scoreIndustryText(page.schemaLines, industry.negative) * 2 +
            scoreIndustryText(page.metaLines, industry.negative)
          : 0

        return total + positiveScore - negativeScore
      }, 0)

      return { label: industry.label, score }
    })
    .sort((left, right) => right.score - left.score)

  const best = scored[0]

  if (!best || best.score < 3) {
    return ''
  }

  return best.label
}

function inferLanguage(pages: ExtractedPage[]) {
  const text = normalizeForSearch(
    pages
      .map((page) => `${page.title}\n${page.description}\n${page.summaryText}\n${page.metaLines.join('\n')}`)
      .join('\n')
  )

  if (/[æøå]|norsk|bokmal|nynorsk/.test(text)) return 'Norwegian'
  if (/svensk/.test(text)) return 'Swedish'
  if (/dansk/.test(text)) return 'Danish'
  if (/suomi|finsk/.test(text)) return 'Finnish'
  if (/deutsch|german|tysk/.test(text)) return 'German'
  if (/espanol|spanish|spansk/.test(text)) return 'Spanish'
  if (/francais|french|fransk/.test(text)) return 'French'

  return ''
}

function inferToneOfVoice(pages: ExtractedPage[]) {
  const text = normalizeForSearch(
    pages
      .map((page) => `${page.title}\n${page.description}\n${page.summaryText}`)
      .join('\n')
  )

  if (/(premium|luxury|elegant|eleganse|style|stylish)/.test(text)) return 'professional, premium'
  if (/(friendly|warm|kind|welcoming|vennlig|hyggelig)/.test(text)) return 'warm, helpful'
  if (/(sale|buy|bestill|book|contact us|call now|ring oss)/.test(text)) return 'professional, selling'
  if (/(playful|fun|creative|lekne|morsom)/.test(text)) return 'playful, creative'

  return ''
}

function inferMainGoal(pages: ExtractedPage[]) {
  const text = normalizeForSearch(
    pages
      .map((page) =>
        [
          page.title,
          page.ogTitle,
          page.description,
          page.summaryText,
          ...page.headings,
          ...page.relevantLines,
          ...page.footerLines,
          ...page.schemaLines,
        ].join('\n')
      )
      .join('\n')
  )

  const goals: Array<{
    label: string
    patterns: RegExp[]
    negative?: RegExp[]
    threshold?: number
  }> = [
    {
      label: 'collect bookings',
      patterns: [/\bbook\b/, /\bbooking\b/, /\bappointment\b/, /\btimebestilling\b/, /\bbestill time\b/, /\breserve\b/],
    },
    {
      label: 'answer questions',
      patterns: [/\bfaq\b/, /\bfrequently asked\b/, /\bquestions\b/, /\bsp[\u00f8o]rsm[\u00e5a]l\b/, /\bhelp center\b/, /\bguidance\b/],
      negative: [/\bbook\b/, /\bbooking\b/, /\blead\b/, /\bsell\b/],
    },
    {
      label: 'take the load off support',
      patterns: [/\bsupport\b/, /\bcustomer service\b/, /\bkundeservice\b/, /\bhelpdesk\b/, /\bcontact us\b/, /\bcall us\b/, /\bchat\b/],
      negative: [/\bshop\b/, /\bbuy\b/, /\bcheckout\b/],
    },
    {
      label: 'convert visitors into leads',
      patterns: [/\blead\b/, /\bcontact form\b/, /\bquote\b/, /\boffer\b/, /\benquiry\b/, /\bforesp[\u00f8o]rsel\b/, /\brequest a quote\b/],
    },
    {
      label: 'drive sales',
      patterns: [/\bshop\b/, /\bstore\b/, /\bbuy\b/, /\bcheckout\b/, /\bcart\b/, /\bprice\b/, /\bproduct\b/, /\bprodukt\b/],
      negative: [/\bpension\b/, /\bbank\b/, /\binsurance\b/],
    },
    {
      label: 'route visitors to the right page',
      patterns: [/\bcontact\b/, /\bcontact us\b/, /\bfind\b/, /\bservice\b/, /\btjenester\b/, /\bchoose\b/, /\bselect\b/, /\bmenu\b/, /\bnav\b/],
      negative: [/\bcheckout\b/, /\bbook\b/],
    },
    {
      label: 'showcase work',
      patterns: [/\bportfolio\b/, /\bgallery\b/, /\bshowcase\b/, /\bcase\b/, /\bproject\b/, /\bprosjekt\b/, /\breferanse\b/],
    },
    {
      label: 'inform visitors',
      patterns: [/\binformation\b/, /\binform\b/, /\babout us\b/, /\bom oss\b/, /\bnews\b/, /\bblog\b/, /\barticle\b/, /\bguide\b/],
    },
    {
      label: 'book consultations',
      patterns: [/\bconsultation\b/, /\bconsult\b/, /\bmeeting\b/, /\bm[\u00f8o]te\b/, /\bintro call\b/],
    },
  ]

  const scored = goals
    .map((goal) => {
      const positive = scoreIndustryText(text, goal.patterns)
      const negative = goal.negative ? scoreIndustryText(text, goal.negative) : 0
      const score = positive * 4 - negative * 2

      return { label: goal.label, score }
    })
    .sort((left, right) => right.score - left.score)

  const best = scored[0]
  if (!best || best.score < 2) return ''

  return best.label
}

function extractOpeningHours(pages: ExtractedPage[]) {
  const candidates = uniqueStrings(
    pages.flatMap((page) => [
      ...page.relevantLines,
      ...page.footerLines,
      ...page.metaLines,
      ...page.schemaLines,
    ]),
    80
  )
  const footerBlocks = uniqueStrings(
    pages.map((page) => page.footerLines.join(' ')).filter(Boolean),
    20
  )

  const openingKeywords = [
    'opening hours',
    'business hours',
    'opening hour',
    'hours',
    'åpningstid',
    'åpningstider',
    'åpningstida',
    'åpningstidene',
    'service hours',
    'services hours',
    'opening times',
  ]

  const timeRangePattern = /(?:^|[^0-9])(?:[01]?\d|2[0-3])[:.][0-5]\d\s*(?:-|–|to|til|–|—|\/)\s*(?:[01]?\d|2[0-3])[:.][0-5]\d(?:[^0-9]|$)/i
  const dayPattern = /\b(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|lordag|søndag|sondag|manday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i

  const validOpeningHourLine = (line: string) => {
    const lowered = normalizeForSearch(line)
    const hasKeyword = openingKeywords.some((keyword) => lowered.includes(keyword))
    const hasTimeRange = timeRangePattern.test(line)
    const hasDayContext = dayPattern.test(line)
    const hasMultipleTimes = (line.match(/\b(?:[01]?\d|2[0-3])[:.][0-5]\d\b/g) ?? []).length >= 2

    return (hasKeyword && (hasTimeRange || hasMultipleTimes)) || (hasDayContext && hasMultipleTimes)
  }

  const openingHourLine =
    candidates.find((line) => validOpeningHourLine(line)) ||
    footerBlocks.find((line) => validOpeningHourLine(line)) ||
    pages
      .flatMap((page) => [...page.footerLines, ...page.schemaLines])
      .find((line) => validOpeningHourLine(line)) ||
    ''

  return openingHourLine
}

function findAddressCandidate(lines: string[]) {
  const streetPattern = /\b(?:\d+[a-zA-Z]?\s+)?[a-zæøå0-9'’.\- ]+\s+(?:vei|gate|gata|road|street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|plass|square|park)\b/i
  const postalCityPattern = /\b\d{4}\s+[A-ZÆØÅ][a-zæøå\- ]{2,}\b/
  const explicitAddressPattern = /\b(?:address|adresse|location|lokasjon|visit us|besøk oss)\b/i

  const isAddressLike = (line: string) => {
    const hasStreet = streetPattern.test(line)
    const hasPostalCity = postalCityPattern.test(line)
    const hasExplicitAddress = explicitAddressPattern.test(line)

    return (hasStreet && hasPostalCity) || (hasExplicitAddress && (hasStreet || hasPostalCity))
  }

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index] || ''
    const nextOne = lines[index + 1] || ''
    const nextTwo = lines[index + 2] || ''
    const window = [current, nextOne, nextTwo].filter(Boolean).join(' ').trim()

    if (!window) continue

    if (isAddressLike(window)) {
      const addressMatch =
        window.match(/\b(?:[A-ZÆØÅ][a-zæøå0-9'’.\- ]+\s+(?:vei|gate|gata|road|street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|plass|square|park)[^,;\n]*)\s*,?\s*\d{4}\s+[A-ZÆØÅ][a-zæøå\- ]+/i) ||
        window.match(/\b\d+[a-zA-Z]?\s+[A-ZÆØÅ][a-zæøå0-9'’.\- ]+\s*,\s*\d{4}\s+[A-ZÆØÅ][a-zæøå\- ]+/i)

      if (addressMatch?.[0]) {
        return cleanText(addressMatch[0])
      }

      return cleanText(window)
    }
  }

  return ''
}

function extractAddresses(pages: ExtractedPage[]) {
  const candidates = uniqueStrings(
    pages.flatMap((page) => [
      ...page.relevantLines,
      ...page.metaLines,
      ...page.schemaLines,
      ...page.footerLines,
    ]),
    80
  )
  const footerBlocks = uniqueStrings(
    pages.map((page) => page.footerLines.join(' ')).filter(Boolean),
    20
  )

  const addressLine =
    findAddressCandidate(candidates) ||
    findAddressCandidate(footerBlocks) ||
    findAddressCandidate(
      pages.flatMap((page) => [
        ...page.footerLines,
        ...page.relevantLines,
        ...page.schemaLines,
      ])
    )

  return addressLine || ''
}

function collectWebsiteUrls(pages: ExtractedPage[], rootUrl: URL) {
  const urls = uniqueStrings(
    [
      rootUrl.toString(),
      ...pages.map((page) => page.url),
      ...pages.flatMap((page) => page.links),
      ...pages.flatMap((page) => [
        page.canonicalUrl,
        ...page.schemaLines
          .map((line) => line.match(/https?:\/\/[^\s,;]+/gi) ?? [])
          .flat(),
      ]),
    ].filter(Boolean),
    30
  )

  return urls
}

function buildAutofillResult(pages: ExtractedPage[], rootUrl: URL): WebsiteAutofillResult {
  const businessName = extractBusinessName(pages, rootUrl)
  const summary = extractSummary(pages)
  const industry = extractIndustry(pages)
  const language = inferLanguage(pages)
  const toneOfVoice = inferToneOfVoice(pages)
  const mainGoal = inferMainGoal(pages)
  const openingHours = extractOpeningHours(pages)
  const addresses = extractAddresses(pages)

  const emails = uniqueStrings(
    pages.flatMap((page) => [
      ...page.contactInfo.emails,
      ...(page.schemaLines.flatMap((line) => line.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? [])),
    ]),
    10
  )
  const phones = uniqueStrings(
    pages.flatMap((page) => [
      ...page.contactInfo.phones,
      ...(page.schemaLines.flatMap((line) => line.match(/(?:\+|00)\d[\d\s().-]{6,}\d/g) ?? [])),
    ]),
    10
  )

  const websiteUrls = collectWebsiteUrls(pages, rootUrl)
  const contactInfo = uniqueStrings([...emails, ...phones], 10).join(' • ')

  const businessProfile: Partial<AssistantBusinessProfile> = {
    businessName,
    industry,
    shortDescription: summary,
    toneOfVoice,
    language,
    multilingual: Boolean(language && language !== 'Norwegian'),
    mainGoal,
    fallbackContact: emails[0] || phones[0] || '',
  }

  const knowledgeBase: Partial<AssistantKnowledgeBase> & { websiteUrls: string[] } = {
    websiteUrls,
    uploadedDocuments: [],
    manualNotes: '',
    openingHours,
    contactInfo,
    addresses,
    keyFAQs: [],
  }

  const missingFields: WebsiteAutofillResult['missingFields'] = {
    businessName: businessName ? '' : 'No business name was found. Fill this in manually.',
    industry: industry ? '' : 'No industry was found. Fill this in manually.',
    shortDescription: summary ? '' : 'No short description was found. Fill this in manually.',
    toneOfVoice: toneOfVoice ? '' : 'No tone of voice was detected. Fill this in manually.',
    language: language ? '' : 'No language hint was found. Fill this in manually.',
    mainGoal: mainGoal ? '' : 'No clear main goal was detected. Fill this in manually.',
    fallbackContact:
      emails.length || phones.length
        ? ''
        : 'No email or phone number was found. Fill this in manually.',
    websiteUrls: websiteUrls.length ? '' : 'No matching website URLs were found. Fill this in manually.',
    openingHours: openingHours ? '' : 'No opening hours were found. Fill this in manually.',
    contactInfo: contactInfo ? '' : 'No contact information was found. Fill this in manually.',
    addresses: addresses ? '' : 'No address was found. Fill this in manually.',
  }

  return {
    businessProfile,
    knowledgeBase,
    missingFields,
  }
}

function buildBusinessContext(pages: ExtractedPage[], rootUrl: URL) {
  const overviewLines = buildOverviewLines(pages)
  const serviceLines = selectLinesByKeywords(pages, SERVICE_KEYWORDS, 10)
  const pricingLines = selectLinesByKeywords(pages, PRICE_KEYWORDS, 10)
  const contactLines = selectLinesByKeywords(pages, CONTACT_KEYWORDS, 8)
  const bookingLines = selectLinesByKeywords(pages, BOOKING_KEYWORDS, 6)
  const openingHourLines = uniqueStrings(
    pages
      .flatMap((page) => page.relevantLines)
      .filter((line) => OPENING_HOURS_PATTERNS.some((pattern) => pattern.test(line))),
    6
  )
  const emails = uniqueStrings(pages.flatMap((page) => page.contactInfo.emails), 8)
  const phones = uniqueStrings(pages.flatMap((page) => page.contactInfo.phones), 8)
  const navigationLinks = formatNavigationLinks(pages)
  const pageNotes = pages.map((page) => {
    const note = page.summaryText.split('\n').find(Boolean) ?? page.description ?? page.title

    return `${page.title}: ${note} (${page.url})`
  })

  return [
    'You are answering questions based on the following website information.',
    'Only use these facts when answering company-specific questions.',
    'If the answer is not found in this context, say that you are not sure and suggest contacting the company.',
    '',
    '## Business overview',
    `- Website scanned: ${rootUrl.origin}`,
    ...formatBullets(overviewLines, 'No clear overview was found.', 6),
    '',
    '## Key services, products, and offers',
    ...formatBullets(serviceLines, 'No specific services or products were found.', 10),
    '',
    '## Pricing and plans found',
    ...formatBullets(pricingLines, 'No pricing information was found.', 10),
    '',
    '## Contact and support',
    ...formatBullets(
      [
        ...emails.map((email) => `Email: ${email}`),
        ...phones.map((phone) => `Phone: ${phone}`),
        ...contactLines,
      ],
      'No contact information was found.',
      12
    ),
    '',
    '## Booking, appointments, and availability',
    ...formatBullets(
      [...bookingLines, ...openingHourLines],
      'No booking or opening-hours information was found.',
      10
    ),
    '',
    '## Website navigation visitors may ask about',
    ...formatBullets(
      navigationLinks,
      'No important header, footer, or navigation links were found.',
      14
    ),
    '',
    '## Useful page notes',
    ...formatBullets(pageNotes, 'No useful page notes were found.', 12),
  ].join('\n')
}

function generateFaqSuggestions(pages: ExtractedPage[]) {
  const rawText = pages.map((page) => page.summaryText).join('\n\n')
  const combinedText = normalizeForSearch(
    pages
      .map((page) => `${page.url}\n${page.title}\n${page.description}\n${page.summaryText}`)
      .join('\n\n')
  )

  const suggestions: string[] = []

  const addSuggestion = (suggestion: string) => {
    if (!suggestions.includes(suggestion)) {
      suggestions.push(suggestion)
    }
  }

  const hasContactInfo =
    pages.some((page) => page.contactInfo.emails.length || page.contactInfo.phones.length) ||
    CONTACT_KEYWORDS.some((keyword) => combinedText.includes(keyword))

  const hasPricingInfo = PRICE_KEYWORDS.some((keyword) => combinedText.includes(keyword))
  const hasServiceInfo = SERVICE_KEYWORDS.some((keyword) => combinedText.includes(keyword))
  const hasOpeningHoursInfo = pages.some((page) =>
    page.relevantLines.some((line) =>
      OPENING_HOURS_PATTERNS.some((pattern) => pattern.test(normalizeForSearch(line)))
    )
  )
  const hasBookingInfo = BOOKING_KEYWORDS.some((keyword) => combinedText.includes(keyword))
  const hasBookingAsChatbotFeature =
    combinedText.includes('chatbot') &&
    (combinedText.includes('book appointments') ||
      combinedText.includes('booking system') ||
      combinedText.includes('appointments and meetings'))
  const hasHumanSupportInfo =
    hasContactInfo ||
    combinedText.includes('support') ||
    combinedText.includes('customer service') ||
    combinedText.includes('kundeservice')

  if (hasPricingInfo) addSuggestion('What does it cost?')
  if (hasContactInfo) addSuggestion('How can I contact you?')
  if (hasServiceInfo) addSuggestion('What services do you offer?')
  if (hasOpeningHoursInfo) addSuggestion('What are your opening hours?')
  if (hasBookingInfo) {
    addSuggestion(
      hasBookingAsChatbotFeature
        ? 'Can the chatbot book appointments?'
        : 'How do I book an appointment?'
    )
  }
  if (hasHumanSupportInfo) addSuggestion('How can I contact human support?')

  return suggestions.slice(0, 5)
}

export async function scanWebsiteForAssistantContext(
  inputUrl: string,
  options: ScanOptions = {}
): Promise<WebsiteScanResult> {
  const finalOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const rootUrl = normalizeStartUrl(inputUrl)

  const queue: string[] = []
  const visited = new Set<string>()
  const pages: ExtractedPage[] = []

  const sitemapUrls = await findSitemapUrls(rootUrl, finalOptions.timeoutMs)

  queue.push(...buildSeedUrls(rootUrl, sitemapUrls).slice(0, finalOptions.maxPages))

  while (queue.length && pages.length < finalOptions.maxPages) {
    const currentUrl = queue.shift()

    if (!currentUrl || visited.has(currentUrl)) continue

    visited.add(currentUrl)

    try {
      const html = await fetchWithTimeout(currentUrl, finalOptions.timeoutMs)

      const pageData = extractUsefulPageData(
        html,
        currentUrl,
        rootUrl,
        finalOptions.maxCharactersPerPage
      )

      if (shouldKeepPage(pageData, rootUrl)) {
        pages.push(pageData)
      }

      for (const href of pageData.links) {
        const nextUrl = cleanUrl(href, currentUrl, rootUrl)

        if (!nextUrl) continue
        if (visited.has(nextUrl)) continue
        if (queue.includes(nextUrl)) continue

        queue.push(nextUrl)
      }

      queue.sort((a, b) => scoreUrl(b) - scoreUrl(a))
    } catch {
      // Skip pages that fail
    }
  }

  const rawText = pages.map((page) => page.summaryText).join('\n\n')
  const businessContext = buildBusinessContext(pages, rootUrl)
  const faqSuggestions = generateFaqSuggestions(pages)
  const autofill = buildAutofillResult(pages, rootUrl)

  return {
    businessContext,
    faqSuggestions,
    autofill,
    discoveredPages: pages.map((page) => ({
      url: page.url,
      title: page.title,
      description: page.description,
      textPreview: page.summaryText.slice(0, 300),
    })),
    rawText,
  }
}
