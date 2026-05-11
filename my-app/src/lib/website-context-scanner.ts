// src/lib/website-context-scanner.ts

import * as cheerio from 'cheerio'

export type WebsiteScanResult = {
  businessContext: string
  faqSuggestions: string[]
  discoveredPages: {
    url: string
    title: string
    description: string
    textPreview: string
  }[]
  rawText: string
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
  headings: string[]
  text: string
  summaryText: string
  bodyLines: string[]
  relevantLines: string[]
  links: string[]
  structuredLinks: StructuredLink[]
  contactInfo: ContactInfo
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
  const bodyScopes = $('main, article').length ? 'main, article' : 'body'
  const bodyLines = collectTextLines($, bodyScopes, 100)
  const footerLines = collectTextLines($, 'footer', 30)
  const navigationLines = collectTextLines($, 'header, nav', 30)
  const allLines = uniqueStrings(
    [
      title ? `Title: ${title}` : '',
      description ? `Description: ${description}` : '',
      ...headings,
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
    headings,
    text,
    summaryText: text,
    bodyLines,
    relevantLines,
    links: structuredLinks.map((link) => link.url),
    structuredLinks,
    contactInfo,
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

function shouldKeepPage(page: ExtractedPage) {
  const parsed = new URL(page.url)
  const pathname = parsed.pathname.toLowerCase()
  const authLikePage = /\/(auth|login|signin|sign-in|register)(\/|$)/.test(pathname)

  if (authLikePage && page.bodyLines.length <= 2) {
    return false
  }

  if (page.summaryText.length >= 120) return true
  if (page.contactInfo.emails.length || page.contactInfo.phones.length) return true
  if (page.structuredLinks.some((link) => link.source !== 'content')) return true

  return false
}

function buildOverviewLines(pages: ExtractedPage[]) {
  const homePage = pages[0]
  const candidates = uniqueStrings(
    [
      homePage?.description ?? '',
      ...(homePage?.headings ?? []),
      ...pages.flatMap((page) => page.relevantLines),
    ].filter((line) => line.length <= 220),
    6
  )

  return candidates.length ? candidates : ['The scan did not find a clear business description.']
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

  if (sitemapUrls.length) {
    queue.push(
      ...sitemapUrls
        .sort((a, b) => scoreUrl(b) - scoreUrl(a))
        .slice(0, finalOptions.maxPages)
    )
  } else {
    queue.push(rootUrl.toString())
  }

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

      if (shouldKeepPage(pageData)) {
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

  return {
    businessContext,
    faqSuggestions,
    discoveredPages: pages.map((page) => ({
      url: page.url,
      title: page.title,
      description: page.description,
      textPreview: page.summaryText.slice(0, 300),
    })),
    rawText,
  }
}
