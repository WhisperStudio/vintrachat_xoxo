import * as cheerio from 'cheerio'
import type {
  AssistantBusinessProfile,
  AssistantConversationCard,
  AssistantKnowledgeBase,
} from '@/types/database'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type WebsiteScanQuality = {
  scanQualityScore: number
  contextCompletenessScore: number
  confidenceScore: number
  riskLevel: 'low' | 'medium' | 'high'
  reasons: string[]
}

export type WebsiteSetupTask = {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo'
  category: 'security' | 'content' | 'settings' | 'domain' | 'support' | 'design'
  reason: string
}

export type WebsiteReviewItem = {
  id: string
  field: string
  currentValue: string | string[] | boolean | null
  issue: string
  recommendation: string
  confidence: ConfidenceLevel
  severity: 'high' | 'medium' | 'low'
}

export type WebsiteSecurityRecommendation = {
  allowedDomains: string[]
  domainsForManualReview: string[]
  rejectedExternalDomains: string[]
  blockNativeAppsByDefault: boolean
  requireOriginOrReferer: boolean
  recommendSignedWidgetSessions: boolean
  notes: string[]
}

export type WebsitePreset =
  | 'local_service'
  | 'professional_services'
  | 'ecommerce'
  | 'saas_software'
  | 'information_site'
  | 'unknown'

export type WebsitePresetRecommendation = {
  preset: WebsitePreset
  reason: string
  confidence: number
}

export type WebsiteSetupRecommendation = {
  assistantSettings: {
    enableAiReplies: boolean
    strictContextOnly: boolean
    replyInUserLanguage: boolean
    faqSuggestionsEnabled: boolean
    humanSupportEnabled: boolean
    provider: 'gemini'
    model: string
    temperature: number
    maxAnswerLength: 'short' | 'medium' | 'long'
    toneOfVoice: string
    mainGoal: string
    fallbackBehavior: string
    startLanguage: string
  }
  widgetDefaults: {
    widgetName: string
    welcomeMessage: string
    placeholderText: string
    suggestedStarterQuestions: string[]
    buttonPosition: 'bottom-right' | 'bottom-left'
    colorTheme: string
    brandingVisibility: 'visible' | 'hidden'
    humanHandoffLabel: string
    conversationCardsEnabled: boolean
    conversationCardsLimit: number
    conversationCards: AssistantConversationCard[]
    cardSettings: {
      layout: 'grid' | 'list'
      style: 'chips' | 'modern' | 'minimal'
    }
  }
}

export type WebsiteKnowledgeBaseAutofill = Partial<AssistantKnowledgeBase> & {
  websiteUrls: string[]
  navigationLinks?: string[]
  pricingLines?: string[]
  bookingUrls?: string[]
  policyLines?: string[]
}

export type WebsiteAutofillResult = {
  businessProfile: Partial<AssistantBusinessProfile>
  knowledgeBase: WebsiteKnowledgeBaseAutofill
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

export type WebsiteScanResult = {
  businessContext: string
  faqSuggestions: string[]
  autofill: WebsiteAutofillResult
  discoveredPages: {
    url: string
    title: string
    description: string
    textPreview: string
    pageType: PageType
  }[]
  rawText: string
  setup: WebsiteSetupRecommendation
  quality: WebsiteScanQuality
  tasks: WebsiteSetupTask[]
  reviewItems: WebsiteReviewItem[]
  security: WebsiteSecurityRecommendation
  preset: WebsitePresetRecommendation
}

export type ScanOptions = {
  maxPages?: number
  maxCharactersPerPage?: number
  timeoutMs?: number
  includeRawText?: boolean
}

export type PageType =
  | 'home'
  | 'about'
  | 'services'
  | 'pricing'
  | 'contact'
  | 'booking'
  | 'faq'
  | 'support'
  | 'legal'
  | 'product'
  | 'unknown'

type LoadedCheerio = ReturnType<typeof cheerio.load>
type CheerioInput = Parameters<LoadedCheerio>[0]
type LinkSource = 'navigation' | 'footer' | 'content'
type EvidenceSource =
  | 'schema'
  | 'meta'
  | 'title'
  | 'heading'
  | 'footer'
  | 'contact_page'
  | 'body'
  | 'url'
  | 'link'
  | 'html_lang'

type StructuredLink = {
  text: string
  url: string
  source: LinkSource
}

type ContactInfo = {
  emails: string[]
  phones: string[]
}

type SchemaFacts = {
  names: string[]
  descriptions: string[]
  emails: string[]
  phones: string[]
  urls: string[]
  sameAs: string[]
  openingHours: string[]
  addresses: string[]
  languages: string[]
  prices: string[]
  types: string[]
}

type ExtractedPage = {
  url: string
  title: string
  description: string
  ogTitle: string
  canonicalUrl: string
  htmlLang: string
  pageType: PageType
  headings: string[]
  text: string
  summaryText: string
  bodyLines: string[]
  footerLines: string[]
  navigationLines: string[]
  legalLines: string[]
  relevantLines: string[]
  links: string[]
  structuredLinks: StructuredLink[]
  contactInfo: ContactInfo
  metaLines: string[]
  schemaLines: string[]
  schemaFacts: SchemaFacts
  pricingLines: string[]
  bookingUrls: string[]
  externalDomains: string[]
  sameSiteDomains: string[]
}

type ValueEvidence = {
  value: string
  source: EvidenceSource
  pageType: PageType
  pageUrl: string
  bonus?: number
}

type FieldAssessment<T> = {
  value: T
  score: number
  confidence: ConfidenceLevel
  reasons: string[]
}

const DEFAULT_OPTIONS: Required<ScanOptions> = {
  maxPages: 12,
  maxCharactersPerPage: 6000,
  timeoutMs: 10000,
  includeRawText: true,
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

const NOISE_PATTERNS = [
  /\bcookie\b/i,
  /\baccept all\b/i,
  /\bmanage consent\b/i,
  /\bloading\b/i,
  /\blaster\b/i,
  /\bsign in\b/i,
  /\blog ?in\b/i,
  /\bregister\b/i,
  /\bcreate account\b/i,
  /\bskip to content\b/i,
  /\bjavascript is disabled\b/i,
]

const GENERIC_TITLES = new Set([
  'home',
  'forside',
  'contact',
  'kontakt',
  'about',
  'om oss',
  'services',
  'tjenester',
  'faq',
  'support',
])

const BUSINESS_KEYWORDS = [
  'service',
  'tjeneste',
  'services',
  'product',
  'produkt',
  'pricing',
  'price',
  'pris',
  'support',
  'kontakt',
  'contact',
  'booking',
  'bestill',
  'appointment',
  'faq',
  'help',
]

const PAGE_TYPE_KEYWORDS: Array<{
  type: Exclude<PageType, 'unknown' | 'home'>
  keywords: string[]
}> = [
  { type: 'about', keywords: ['about', 'about-us', 'om-oss', 'om oss', 'company'] },
  { type: 'services', keywords: ['services', 'service', 'tjenester', 'tjeneste', 'solutions'] },
  { type: 'pricing', keywords: ['pricing', 'prices', 'priser', 'plan', 'plans'] },
  { type: 'contact', keywords: ['contact', 'kontakt', 'kundeservice', 'customer-service'] },
  { type: 'booking', keywords: ['booking', 'book', 'bestill', 'appointment', 'calendar', 'schedule'] },
  { type: 'faq', keywords: ['faq', 'questions', 'sporsmal', 'spørsmål', 'q-and-a'] },
  { type: 'support', keywords: ['support', 'help', 'kundeservice', 'help-center', 'docs'] },
  { type: 'legal', keywords: ['privacy', 'personvern', 'terms', 'vilkar', 'vilkår', 'legal'] },
  { type: 'product', keywords: ['product', 'products', 'features', 'plattform', 'software', 'app'] },
]

const CONTACT_KEYWORDS = ['contact', 'kontakt', 'email', 'phone', 'telefon', 'kundeservice']
const SERVICE_KEYWORDS = ['service', 'services', 'tjeneste', 'tjenester', 'product', 'products']
const PRICE_KEYWORDS = [
  'price',
  'pricing',
  'prices',
  'plan',
  'plans',
  'subscription',
  'monthly',
  'yearly',
  'kr',
  'nok',
  'usd',
  'eur',
  'package',
]
const BOOKING_KEYWORDS = ['book', 'booking', 'bestill', 'appointment', 'schedule', 'calendar', 'reserve']

const HIGH_TRUST_INDUSTRIES = ['Finance', 'Insurance', 'Legal', 'Healthcare', 'Public sector']

const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  schema: 0.5,
  meta: 0.36,
  title: 0.24,
  heading: 0.22,
  footer: 0.22,
  contact_page: 0.34,
  body: 0.16,
  url: 0.12,
  link: 0.18,
  html_lang: 0.56,
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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

function slugify(value: string) {
  return normalizeForSearch(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function uniqueStrings(items: string[], maxItems = 80) {
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

function isNoisyText(value: string) {
  const cleaned = cleanText(value)
  if (!cleaned) return true
  return NOISE_PATTERNS.some((pattern) => pattern.test(cleaned))
}

function stripWww(hostname: string) {
  return hostname.replace(/^www\./i, '')
}

function isSameWebsite(url: URL, rootUrl: URL) {
  return stripWww(url.hostname) === stripWww(rootUrl.hostname)
}

function normalizeStartUrl(inputUrl: string) {
  const trimmed = inputUrl.trim()

  if (!trimmed) {
    throw new Error('URL is required')
  }

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`

  const url = new URL(withProtocol)

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed')
  }

  url.hash = ''
  url.search = ''
  if (!url.pathname) {
    url.pathname = '/'
  }

  return url
}

function normalizeLanguage(value: string) {
  const lowered = normalizeForSearch(value)

  if (!lowered) return ''
  if (lowered.startsWith('no') || lowered.startsWith('nb') || lowered.startsWith('nn') || lowered.includes('norwegian') || lowered.includes('norsk')) return 'Norwegian'
  if (lowered.startsWith('en') || lowered.includes('english')) return 'English'
  if (lowered.startsWith('sv') || lowered.includes('swedish') || lowered.includes('svensk')) return 'Swedish'
  if (lowered.startsWith('da') || lowered.includes('danish') || lowered.includes('dansk')) return 'Danish'
  if (lowered.startsWith('es') || lowered.includes('spanish') || lowered.includes('espanol') || lowered.includes('spansk')) return 'Spanish'
  if (lowered.startsWith('de') || lowered.includes('german') || lowered.includes('deutsch') || lowered.includes('tysk')) return 'German'
  if (lowered.startsWith('fr') || lowered.includes('french') || lowered.includes('francais') || lowered.includes('fransk')) return 'French'
  if (lowered.startsWith('fi') || lowered.includes('finnish') || lowered.includes('suomi') || lowered.includes('finsk')) return 'Finnish'

  return value ? cleanText(value) : ''
}

function cleanTitleCandidate(value: string, rootUrl?: URL) {
  const cleaned = cleanText(value)
  if (!cleaned) return ''

  const parts = cleaned
    .split(/\s[\|\-–—]\s|[\|\-–—]/)
    .map((part) => cleanText(part))
    .filter(Boolean)

  const candidate =
    parts.find((part) => !GENERIC_TITLES.has(normalizeForSearch(part)) && !isNoisyText(part)) ||
    parts[0] ||
    cleaned

  if (GENERIC_TITLES.has(normalizeForSearch(candidate))) {
    return rootUrl ? stripWww(rootUrl.hostname) : ''
  }

  return candidate
}

function isLikelyGenericUi(value: string) {
  const lowered = normalizeForSearch(value)
  if (!lowered) return true
  if (lowered.length <= 2) return true
  if (GENERIC_TITLES.has(lowered)) return true
  if (isNoisyText(lowered)) return true
  return ['menu', 'search', 'read more', 'learn more', 'click here'].includes(lowered)
}

function safeUrlOrigin(rawUrl: string) {
  try {
    return new URL(rawUrl).origin
  } catch {
    return ''
  }
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

    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (!isSameWebsite(url, rootUrl)) return null

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
        'User-Agent': 'VintraWebsiteScanner/2.0',
        Accept: 'text/html,application/xhtml+xml,application/xml,text/xml',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Fetch failed with ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!/html|xml|text/i.test(contentType)) {
      throw new Error('Unsupported content type')
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

  const found = new Set<string>()

  for (const sitemapUrl of sitemapCandidates) {
    try {
      const xml = await fetchWithTimeout(sitemapUrl, timeoutMs)
      const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
        .map((match) => cleanText(match[1] || ''))
        .filter(Boolean)

      for (const match of matches) {
        try {
          const parsed = new URL(match)
          parsed.hash = ''
          parsed.search = ''
          if (isSameWebsite(parsed, rootUrl)) {
            found.add(parsed.toString())
          }
        } catch {
          continue
        }
      }
    } catch {
      continue
    }
  }

  return [...found]
}

function inferPageType(url: string, title: string, headings: string[]) {
  const parsed = new URL(url)
  const combined = normalizeForSearch([parsed.pathname, title, headings.join(' ')].join(' '))

  if (parsed.pathname === '/' || parsed.pathname === '') return 'home'

  for (const entry of PAGE_TYPE_KEYWORDS) {
    if (entry.keywords.some((keyword) => combined.includes(normalizeForSearch(keyword)))) {
      return entry.type
    }
  }

  return 'unknown'
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
    lines.filter((line) => line.length >= 3 && line.length <= 320 && !isNoisyText(line)),
    maxItems
  )
}

function extractStructuredLinks($: LoadedCheerio, currentUrl: string, rootUrl: URL) {
  const links: StructuredLink[] = []
  const internalLinks: string[] = []
  const externalDomains: string[] = []
  const sameSiteDomains: string[] = []

  $('a[href]').each((_, element) => {
    const rawHref = $('a[href]').eq(_).attr('href')?.trim() || $(element).attr('href')?.trim() || ''
    const text = getElementText($, element)
    const source: LinkSource = $(element).closest('header, nav').length
      ? 'navigation'
      : $(element).closest('footer').length
        ? 'footer'
        : 'content'

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return

    if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      links.push({ text, url: rawHref, source })
      return
    }

    try {
      const url = new URL(rawHref, currentUrl)
      url.hash = ''
      url.search = ''

      if (!['http:', 'https:'].includes(url.protocol)) return

      if (isSameWebsite(url, rootUrl)) {
        internalLinks.push(url.toString())
        sameSiteDomains.push(url.origin)
        if (text && text.length <= 90) {
          links.push({ text, url: url.toString(), source })
        }
      } else {
        externalDomains.push(url.origin)
      }
    } catch {
      return
    }
  })

  const seen = new Set<string>()
  const dedupedLinks = links.filter((link) => {
    const key = `${link.source}:${normalizeForSearch(link.text)}:${link.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    structuredLinks: dedupedLinks,
    internalLinks: uniqueStrings(internalLinks, 80),
    externalDomains: uniqueStrings(externalDomains, 40),
    sameSiteDomains: uniqueStrings(sameSiteDomains, 20),
  }
}

function extractContactInfo(text: string, structuredLinks: StructuredLink[]) {
  const emailMatches = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []
  const phoneMatches =
    text.match(/(?:\+|00)?\d(?:[\d\s().-]{6,}\d)/g)?.filter((entry) => entry.replace(/\D/g, '').length >= 8) ??
    []

  const linkEmails = structuredLinks
    .filter((link) => link.url.startsWith('mailto:'))
    .map((link) => link.url.replace(/^mailto:/i, '').split('?')[0] || '')

  const linkPhones = structuredLinks
    .filter((link) => link.url.startsWith('tel:'))
    .map((link) => link.url.replace(/^tel:/i, '').split('?')[0] || '')

  return {
    emails: uniqueStrings([...emailMatches, ...linkEmails], 12),
    phones: uniqueStrings([...phoneMatches, ...linkPhones], 12),
  }
}

function extractMetaLines($: LoadedCheerio) {
  const entries = [
    ['title', $('title').first().text()],
    ['og:title', $('meta[property="og:title"]').attr('content') ?? ''],
    ['og:site_name', $('meta[property="og:site_name"]').attr('content') ?? ''],
    ['og:description', $('meta[property="og:description"]').attr('content') ?? ''],
    ['description', $('meta[name="description"]').attr('content') ?? ''],
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
    24
  )
}

function createEmptySchemaFacts(): SchemaFacts {
  return {
    names: [],
    descriptions: [],
    emails: [],
    phones: [],
    urls: [],
    sameAs: [],
    openingHours: [],
    addresses: [],
    languages: [],
    prices: [],
    types: [],
  }
}

function extractJsonLdFacts($: LoadedCheerio) {
  const lines: string[] = []
  const facts = createEmptySchemaFacts()

  const pushFact = (target: keyof SchemaFacts, value: string | undefined | null) => {
    const cleaned = cleanText(value || '')
    if (!cleaned) return
    facts[target].push(cleaned)
  }

  const pushLine = (label: string, value: string | undefined | null) => {
    const cleaned = cleanText(value || '')
    if (!cleaned) return
    lines.push(`${label}: ${cleaned}`)
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
    const typeText = Array.isArray(typeValue)
      ? typeValue.filter((entry): entry is string => typeof entry === 'string').join(', ')
      : typeof typeValue === 'string'
        ? typeValue
        : ''

    pushFact('types', typeText)
    pushLine('Schema type', typeText)

    if (typeof data.name === 'string') {
      pushFact('names', data.name)
      pushLine('Schema name', data.name)
    }

    if (typeof data.description === 'string') {
      pushFact('descriptions', data.description)
      pushLine('Schema description', data.description)
    }

    if (typeof data.email === 'string') {
      pushFact('emails', data.email)
      pushLine('Schema email', data.email)
    }

    if (typeof data.telephone === 'string') {
      pushFact('phones', data.telephone)
      pushLine('Schema phone', data.telephone)
    }

    if (typeof data.url === 'string') {
      pushFact('urls', data.url)
      pushLine('Schema url', data.url)
    }

    if (typeof data.inLanguage === 'string') {
      pushFact('languages', data.inLanguage)
      pushLine('Schema language', data.inLanguage)
    }

    const openingHoursValue = data.openingHours
    if (typeof openingHoursValue === 'string') {
      pushFact('openingHours', openingHoursValue)
      pushLine('Schema opening hours', openingHoursValue)
    } else if (Array.isArray(openingHoursValue)) {
      openingHoursValue.forEach((entry) => {
        if (typeof entry === 'string') {
          pushFact('openingHours', entry)
          pushLine('Schema opening hours', entry)
        }
      })
    }

    const sameAsValue = data.sameAs
    if (typeof sameAsValue === 'string') {
      pushFact('sameAs', sameAsValue)
      pushLine('Schema sameAs', sameAsValue)
    } else if (Array.isArray(sameAsValue)) {
      sameAsValue.forEach((entry) => {
        if (typeof entry === 'string') {
          pushFact('sameAs', entry)
          pushLine('Schema sameAs', entry)
        }
      })
    }

    const offers = data.offers
    if (offers) {
      const offerValues = Array.isArray(offers) ? offers : [offers]
      offerValues.forEach((offer) => {
        if (!offer || typeof offer !== 'object') return
        const offerData = offer as Record<string, unknown>
        const parts = [
          typeof offerData.name === 'string' ? offerData.name : '',
          typeof offerData.price === 'string' || typeof offerData.price === 'number'
            ? String(offerData.price)
            : '',
          typeof offerData.priceCurrency === 'string' ? offerData.priceCurrency : '',
          typeof offerData.description === 'string' ? offerData.description : '',
        ].filter(Boolean)

        if (parts.length) {
          const priceLine = cleanText(parts.join(' '))
          pushFact('prices', priceLine)
          pushLine('Schema price', priceLine)
        }
      })
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
        const fullAddress = addressParts.join(', ')
        pushFact('addresses', fullAddress)
        pushLine('Schema address', fullAddress)
      }
    }

    if (data['@graph']) {
      visit(data['@graph'])
    }
  }

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text()
    if (!cleanText(raw)) return
    try {
      visit(JSON.parse(raw))
    } catch {
      return
    }
  })

  return {
    schemaLines: uniqueStrings(lines, 40),
    schemaFacts: {
      names: uniqueStrings(facts.names, 10),
      descriptions: uniqueStrings(facts.descriptions, 10),
      emails: uniqueStrings(facts.emails, 10),
      phones: uniqueStrings(facts.phones, 10),
      urls: uniqueStrings(facts.urls, 20),
      sameAs: uniqueStrings(facts.sameAs, 20),
      openingHours: uniqueStrings(facts.openingHours, 10),
      addresses: uniqueStrings(facts.addresses, 10),
      languages: uniqueStrings(facts.languages, 10),
      prices: uniqueStrings(facts.prices, 12),
      types: uniqueStrings(facts.types, 12),
    },
  }
}

function lineScore(line: string) {
  const lowered = normalizeForSearch(line)
  let score = 0

  for (const keyword of BUSINESS_KEYWORDS) {
    if (lowered.includes(keyword)) score += 1
  }

  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(line)) score += 3
  if (/(?:\+|00)?\d(?:[\d\s().-]{6,}\d)/.test(line)) score += 3
  if (/\b\d+(?:[.,]\d+)?\s*(kr|nok|usd|eur)\b/i.test(lowered)) score += 2
  if (/\b(mon|tue|wed|thu|fri|sat|sun|mandag|tirsdag|onsdag|torsdag|fredag|lordag|lørdag|sondag|søndag)\b/i.test(lowered)) score += 2
  if (/\b(opening hours|business hours|åpningstider|apningstider|hours)\b/i.test(lowered)) score += 2

  return score
}

function selectRelevantLines(lines: string[], maxItems = 35) {
  return uniqueStrings(lines, 140)
    .map((line) => ({ line, score: lineScore(line) }))
    .filter(({ line, score }) => score > 0 && !isNoisyText(line))
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItems)
    .map(({ line }) => line)
}

function isPricingLine(line: string) {
  const lowered = normalizeForSearch(line)
  const hasKeyword = PRICE_KEYWORDS.some((keyword) => lowered.includes(keyword))
  const hasCurrency = /\b\d+(?:[.,]\d+)?\s*(kr|nok|usd|eur)\b/i.test(line)
  const looksLikePlan = /\b(month|monthly|year|yearly|mnd|måned|per month|per year)\b/i.test(line)
  const irrelevant = /\b(postcode|phone|tel|org nr|vat|cookie)\b/i.test(lowered)
  return !irrelevant && (hasCurrency || (hasKeyword && /\d/.test(line)) || looksLikePlan)
}

function isBookingLink(value: string) {
  const lowered = normalizeForSearch(value)
  return BOOKING_KEYWORDS.some((keyword) => lowered.includes(keyword))
}

function extractUsefulPageData(html: string, url: string, rootUrl: URL, maxCharacters: number): ExtractedPage {
  const $ = cheerio.load(html)

  $('script:not([type="application/ld+json"]), style, noscript, svg, canvas, iframe').remove()
  $('[aria-hidden="true"]').remove()
  $('[class*="cookie"], [id*="cookie"], [class*="banner"], [id*="banner"]').remove()
  $('[class*="popup"], [id*="popup"], [class*="modal"], [id*="modal"]').remove()

  const rawTitle = cleanText($('title').first().text()) || cleanText($('h1').first().text()) || url
  const ogTitle = cleanText($('meta[property="og:title"]').attr('content') ?? '')
  const canonicalUrl = cleanText($('link[rel="canonical"]').attr('href') ?? '')
  const description =
    cleanText($('meta[name="description"]').attr('content') ?? '') ||
    cleanText($('meta[property="og:description"]').attr('content') ?? '')
  const htmlLang = cleanText($('html').attr('lang') ?? '')

  const headings = uniqueStrings(
    $('h1, h2, h3')
      .map((_, element) => getElementText($, element))
      .get()
      .filter(Boolean),
    20
  )

  const pageType = inferPageType(url, rawTitle, headings)
  const { structuredLinks, internalLinks, externalDomains, sameSiteDomains } = extractStructuredLinks($, url, rootUrl)
  const metaLines = extractMetaLines($)
  const { schemaLines, schemaFacts } = extractJsonLdFacts($)
  const bodyScope = $('main, article').length ? 'main, article' : 'body'
  const bodyLines = collectTextLines($, bodyScope, 120)
  const footerLines = collectTextLines($, 'footer', 40)
  const navigationLines = collectTextLines($, 'header, nav', 30)
  const legalLines = collectTextLines($, 'footer, body', 30).filter((line) =>
    /\b(privacy|personvern|terms|vilkar|vilkår|cookies?|refund|policy)\b/i.test(line)
  )

  const allLines = uniqueStrings(
    [
      rawTitle ? `Title: ${rawTitle}` : '',
      ogTitle ? `OG title: ${ogTitle}` : '',
      description ? `Description: ${description}` : '',
      canonicalUrl ? `Canonical: ${canonicalUrl}` : '',
      htmlLang ? `Language: ${htmlLang}` : '',
      ...headings,
      ...metaLines,
      ...schemaLines,
      ...navigationLines,
      ...bodyLines,
      ...footerLines,
    ].filter(Boolean),
    180
  )

  const relevantLines = selectRelevantLines(allLines, 35)
  const summaryLines = uniqueStrings(
    [description, ...headings.slice(0, 6), ...relevantLines.slice(0, 14), ...footerLines.slice(0, 6)].filter(Boolean),
    40
  )
  const summaryText = summaryLines.join('\n').slice(0, maxCharacters)
  const contactInfo = extractContactInfo(
    [
      rawTitle,
      ogTitle,
      description,
      bodyLines.join('\n'),
      footerLines.join('\n'),
      schemaLines.join('\n'),
      structuredLinks.map((link) => `${link.text} ${link.url}`).join('\n'),
    ].join('\n'),
    structuredLinks
  )

  const bookingUrls = uniqueStrings(
    [
      ...structuredLinks.filter((link) => isBookingLink(`${link.text} ${link.url}`)).map((link) => link.url),
      ...internalLinks.filter((entry) => isBookingLink(entry)),
      ...externalDomains.filter((entry) => isBookingLink(entry)),
    ],
    12
  )

  const pricingLines = uniqueStrings(
    [...schemaFacts.prices, ...bodyLines.filter(isPricingLine), ...relevantLines.filter(isPricingLine)],
    12
  )

  return {
    url,
    title: cleanTitleCandidate(rawTitle, rootUrl) || rawTitle,
    description,
    ogTitle,
    canonicalUrl,
    htmlLang,
    pageType,
    headings,
    text: summaryText,
    summaryText,
    bodyLines,
    footerLines,
    navigationLines,
    legalLines,
    relevantLines,
    links: internalLinks,
    structuredLinks,
    contactInfo,
    metaLines,
    schemaLines,
    schemaFacts,
    pricingLines,
    bookingUrls,
    externalDomains,
    sameSiteDomains,
  }
}

function scoreUrl(url: string, rootUrl: URL) {
  let score = 0
  const lowered = normalizeForSearch(url)

  if (url === rootUrl.toString() || url === rootUrl.origin + '/') score += 30

  for (const entry of PAGE_TYPE_KEYWORDS) {
    if (entry.keywords.some((keyword) => lowered.includes(normalizeForSearch(keyword)))) {
      score +=
        entry.type === 'contact' || entry.type === 'about' || entry.type === 'services'
          ? 15
          : entry.type === 'pricing' || entry.type === 'booking' || entry.type === 'faq'
            ? 12
            : 8
    }
  }

  if (/\b(login|auth|register|admin|account)\b/.test(lowered)) score -= 25
  if (/\b(cart|checkout)\b/.test(lowered)) score -= 8
  if (/\b(tag|category|archive)\b/.test(lowered)) score -= 12
  if (/\b(cookie|privacy|terms|personvern|vilkar|vilkår)\b/.test(lowered)) score -= 4
  if (/(\/$)/.test(url)) score += 1

  return score
}

function buildFallbackUrls(rootUrl: URL) {
  const paths = [
    '/',
    '/about',
    '/about-us',
    '/om',
    '/om-oss',
    '/contact',
    '/kontakt',
    '/kontakt-oss',
    '/services',
    '/service',
    '/tjenester',
    '/pricing',
    '/priser',
    '/support',
    '/kundeservice',
    '/faq',
    '/sporsmal',
    '/spørsmål',
    '/book',
    '/booking',
    '/bestill',
    '/appointment',
    '/hours',
    '/opening-hours',
    '/apningstider',
    '/åpningstider',
    '/help',
    '/docs',
    '/features',
    '/products',
    '/privacy',
    '/personvern',
    '/terms',
    '/vilkar',
  ]

  return uniqueStrings(paths.map((path) => new URL(path, rootUrl.origin).toString()), paths.length)
}

function buildSeedUrls(rootUrl: URL, sitemapUrls: string[]) {
  return uniqueStrings([rootUrl.toString(), ...sitemapUrls, ...buildFallbackUrls(rootUrl)], 80).sort(
    (left, right) => scoreUrl(right, rootUrl) - scoreUrl(left, rootUrl)
  )
}

function shouldKeepPage(page: ExtractedPage, rootUrl: URL) {
  if (page.url === rootUrl.toString()) return true
  if (page.pageType !== 'unknown') return true
  if (page.relevantLines.length >= 3) return true
  if (page.contactInfo.emails.length || page.contactInfo.phones.length) return true
  return page.summaryText.length >= 120
}

function formatBullets(items: string[], emptyMessage: string, maxItems = 8) {
  const visibleItems = uniqueStrings(items, maxItems)
  if (!visibleItems.length) return [`- ${emptyMessage}`]
  return visibleItems.map((item) => `- ${item}`)
}

function formatNavigationLinks(pages: ExtractedPage[]) {
  const links = uniqueStrings(
    pages
      .flatMap((page) => page.structuredLinks)
      .filter((link) => !link.url.startsWith('mailto:') && !link.url.startsWith('tel:'))
      .filter((link) => link.source !== 'content' || isBookingLink(`${link.text} ${link.url}`) || CONTACT_KEYWORDS.some((keyword) => normalizeForSearch(link.text).includes(keyword)))
      .map((link) => `${link.text || 'Link'}: ${link.url}`),
    14
  )

  return links
}

function selectLinesByKeywords(pages: ExtractedPage[], keywords: string[], maxItems = 8) {
  return uniqueStrings(
    pages
      .flatMap((page) => [...page.relevantLines, ...page.bodyLines, ...page.footerLines])
      .filter((line) => keywords.some((keyword) => normalizeForSearch(line).includes(keyword))),
    maxItems
  )
}

function buildOverviewLines(pages: ExtractedPage[]) {
  return uniqueStrings(
    pages.flatMap((page) => [page.description, ...page.headings.slice(0, 2), ...page.schemaFacts.descriptions.slice(0, 1)]).filter(Boolean),
    8
  )
}

function collectValueEvidence(pages: ExtractedPage[], rootUrl: URL) {
  const businessNameEvidence: ValueEvidence[] = []
  const descriptionEvidence: ValueEvidence[] = []
  const languageEvidence: ValueEvidence[] = []
  const openingHoursEvidence: ValueEvidence[] = []
  const addressEvidence: ValueEvidence[] = []

  for (const page of pages) {
    page.schemaFacts.names.forEach((value) => {
      businessNameEvidence.push({ value, source: 'schema', pageType: page.pageType, pageUrl: page.url, bonus: 0.06 })
    })

    const metaSiteName = page.metaLines
      .find((line) => normalizeForSearch(line).startsWith('og:site_name:'))
      ?.split(':')
      .slice(1)
      .join(':')

    if (metaSiteName) {
      businessNameEvidence.push({ value: metaSiteName, source: 'meta', pageType: page.pageType, pageUrl: page.url })
    }

    if (page.ogTitle) {
      businessNameEvidence.push({ value: cleanTitleCandidate(page.ogTitle, rootUrl), source: 'meta', pageType: page.pageType, pageUrl: page.url })
    }

    if (page.title) {
      businessNameEvidence.push({ value: cleanTitleCandidate(page.title, rootUrl), source: 'title', pageType: page.pageType, pageUrl: page.url })
    }

    page.schemaFacts.descriptions.forEach((value) => {
      descriptionEvidence.push({ value, source: 'schema', pageType: page.pageType, pageUrl: page.url })
    })

    if (page.description) {
      descriptionEvidence.push({ value: page.description, source: 'meta', pageType: page.pageType, pageUrl: page.url })
    }

    page.headings.slice(0, 2).forEach((value) => {
      descriptionEvidence.push({ value, source: 'heading', pageType: page.pageType, pageUrl: page.url })
    })

    if (page.htmlLang) {
      languageEvidence.push({ value: normalizeLanguage(page.htmlLang), source: 'html_lang', pageType: page.pageType, pageUrl: page.url, bonus: 0.1 })
    }

    page.schemaFacts.languages.forEach((value) => {
      languageEvidence.push({ value: normalizeLanguage(value), source: 'schema', pageType: page.pageType, pageUrl: page.url })
    })

    page.schemaFacts.openingHours.forEach((value) => {
      openingHoursEvidence.push({ value, source: 'schema', pageType: page.pageType, pageUrl: page.url, bonus: 0.08 })
    });

    [...page.footerLines, ...page.relevantLines]
      .filter((line) => looksLikeOpeningHours(line))
      .forEach((value) => {
        openingHoursEvidence.push({
          value,
          source: page.pageType === 'contact' ? 'contact_page' : 'footer',
          pageType: page.pageType,
          pageUrl: page.url,
        })
      });

    page.schemaFacts.addresses.forEach((value) => {
      addressEvidence.push({ value, source: 'schema', pageType: page.pageType, pageUrl: page.url, bonus: 0.08 })
    });

    [...page.footerLines, ...page.relevantLines, ...page.bodyLines]
      .filter((line) => looksLikeAddress(line))
      .forEach((value) => {
        addressEvidence.push({
          value,
          source: page.pageType === 'contact' ? 'contact_page' : 'footer',
          pageType: page.pageType,
          pageUrl: page.url,
        })
      });
  }

  businessNameEvidence.push({
    value: stripWww(rootUrl.hostname),
    source: 'url',
    pageType: 'home',
    pageUrl: rootUrl.toString(),
  })

  return {
    businessNameEvidence,
    descriptionEvidence,
    languageEvidence,
    openingHoursEvidence,
    addressEvidence,
  }
}

function scoreSingleValue(evidence: ValueEvidence[], fallbackValue = ''): FieldAssessment<string> {
  const groups = new Map<string, ValueEvidence[]>()

  for (const entry of evidence) {
    const value = cleanText(entry.value)
    const normalized = normalizeForSearch(value)
    if (!value || !normalized) continue
    if (!groups.has(normalized)) groups.set(normalized, [])
    groups.get(normalized)?.push({ ...entry, value })
  }

  let best: FieldAssessment<string> = {
    value: fallbackValue,
    score: 0,
    confidence: 'low',
    reasons: fallbackValue ? ['Fallback value used.'] : ['No reliable value found.'],
  }

  for (const [, entries] of groups) {
    const sample = entries[0]
    const distinctPages = new Set(entries.map((entry) => entry.pageUrl)).size
    const sourceScore = Math.max(...entries.map((entry) => SOURCE_WEIGHTS[entry.source] || 0))
    const agreementBonus = Math.min(0.24, (distinctPages - 1) * 0.1)
    const pageTypeBonus = entries.some((entry) => entry.pageType === 'contact' || entry.pageType === 'about') ? 0.06 : 0
    const cleanBonus =
      !isLikelyGenericUi(sample.value) && sample.value.length >= 3 && sample.value.length <= 140 ? 0.12 : 0
    const noisePenalty = isNoisyText(sample.value) || isLikelyGenericUi(sample.value) ? 0.28 : 0
    const lengthPenalty = sample.value.length > 180 || sample.value.length < 3 ? 0.12 : 0
    const bonus = entries.reduce((sum, entry) => sum + (entry.bonus || 0), 0)
    const score = clampNumber(sourceScore + agreementBonus + pageTypeBonus + cleanBonus + bonus - noisePenalty - lengthPenalty, 0, 1)

    const reasons = [
      `${entries[0].source} evidence found.`,
      distinctPages > 1 ? `Confirmed across ${distinctPages} pages.` : 'Only seen on one page.',
      noisePenalty > 0 ? 'Value looks generic or noisy.' : 'Value looks clean.',
    ]

    if (score > best.score) {
      best = {
        value: sample.value,
        score,
        confidence: score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low',
        reasons,
      }
    }
  }

  return best
}

function scoreStringList(values: string[], reasons: string[], preferredHighCount = 2): FieldAssessment<string[]> {
  const cleaned = uniqueStrings(values, 20)
  if (!cleaned.length) {
    return {
      value: [],
      score: 0,
      confidence: 'low',
      reasons: ['No values found.', ...reasons],
    }
  }

  const noisyCount = cleaned.filter((value) => isNoisyText(value)).length
  const cleanCount = cleaned.length - noisyCount
  const score = clampNumber(
    0.2 + Math.min(0.45, cleanCount * 0.18) - noisyCount * 0.12 + (cleanCount >= preferredHighCount ? 0.18 : 0),
    0,
    1
  )

  return {
    value: cleaned,
    score,
    confidence: score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low',
    reasons,
  }
}

function looksLikeOpeningHours(line: string) {
  const lowered = normalizeForSearch(line)
  const hasKeyword = /\b(opening hours|business hours|åpningstider|apningstider|hours)\b/i.test(lowered)
  const hasDay = /\b(mon|tue|wed|thu|fri|sat|sun|mandag|tirsdag|onsdag|torsdag|fredag|lordag|lørdag|sondag|søndag)\b/i.test(lowered)
  const hasTime = /\b(?:[01]?\d|2[0-3])[:.][0-5]\d\b|\b\d{1,2}\s?(am|pm)\b/i.test(line)
  return (hasKeyword && hasTime) || (hasDay && hasTime)
}

function looksLikeAddress(line: string) {
  const streetPattern = /\b[a-zæøå0-9'’.\- ]+\s(?:vei|gate|gata|plass|road|street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr)\b/i
  const postalCityPattern = /\b\d{4}\s+[A-ZÆØÅ][a-zæøå\- ]{2,}\b/
  const addressWord = /\b(address|adresse|visit us|besøk oss|location|lokasjon)\b/i
  return (streetPattern.test(line) && postalCityPattern.test(line)) || (addressWord.test(line) && (streetPattern.test(line) || postalCityPattern.test(line)))
}

function detectLanguageFromText(pages: ExtractedPage[]) {
  const text = normalizeForSearch(
    pages
      .map((page) => [page.title, page.description, page.summaryText, ...page.bodyLines.slice(0, 20)].join(' '))
      .join(' ')
  )

  if (/[æøå]|velkommen|kontakt oss|åpningstid|tjenester/.test(text)) return 'Norwegian'
  if (/\bhello\b|\bcontact us\b|\bopening hours\b|\bservices\b/.test(text)) return 'English'
  if (/\bsvensk\b|\böppettider\b/.test(text)) return 'Swedish'
  if (/\bdansk\b|\båbningstider\b/.test(text)) return 'Danish'
  if (/\bespanol\b|\bhorario\b/.test(text)) return 'Spanish'
  return ''
}

function extractIndustryAssessment(pages: ExtractedPage[]): FieldAssessment<string> {
  const industries: Array<{
    label: string
    positive: string[]
    negative?: string[]
  }> = [
    {
      label: 'Finance',
      positive: ['bank', 'finance', 'financial', 'investment', 'loan', 'mortgage'],
      negative: ['restaurant', 'salon', 'repair'],
    },
    {
      label: 'Insurance',
      positive: ['insurance', 'claim', 'policy', 'coverage'],
    },
    {
      label: 'Legal',
      positive: ['law', 'legal', 'attorney', 'advokat', 'compliance'],
    },
    {
      label: 'Healthcare',
      positive: ['clinic', 'doctor', 'health', 'helse', 'medical', 'patient'],
    },
    {
      label: 'Public sector',
      positive: ['kommune', 'municipality', 'public service', 'government'],
    },
    {
      label: 'Ecommerce',
      positive: ['shop', 'store', 'cart', 'checkout', 'product', 'shipping'],
    },
    {
      label: 'SaaS',
      positive: ['software', 'platform', 'dashboard', 'api', 'subscription', 'app'],
    },
    {
      label: 'Professional services',
      positive: ['consulting', 'advisor', 'legal', 'real estate', 'accounting', 'finance', 'property'],
    },
    {
      label: 'Local services',
      positive: ['salon', 'plumber', 'clinic', 'restaurant', 'repair', 'booking', 'appointment', 'workshop'],
    },
  ]

  const text = normalizeForSearch(
    pages
      .map((page) =>
        [
          page.title,
          page.description,
          page.ogTitle,
          ...page.headings,
          ...page.relevantLines,
          ...page.footerLines,
          ...page.schemaFacts.types,
        ].join(' ')
      )
      .join(' ')
  )

  const scored = industries
    .map((industry) => {
      const positive = industry.positive.reduce((sum, keyword) => sum + (text.includes(normalizeForSearch(keyword)) ? 1 : 0), 0)
      const negative = (industry.negative || []).reduce((sum, keyword) => sum + (text.includes(normalizeForSearch(keyword)) ? 1 : 0), 0)
      return { label: industry.label, score: positive - negative }
    })
    .sort((left, right) => right.score - left.score)

  const best = scored[0]
  const second = scored[1]

  if (!best || best.score <= 0) {
    return {
      value: '',
      score: 0.18,
      confidence: 'low' as ConfidenceLevel,
      reasons: ['Industry signals were weak.'],
    }
  }

  const score = clampNumber(0.28 + best.score * 0.11 + Math.max(0, best.score - (second?.score || 0)) * 0.06, 0, 1)

  return {
    value: best.label,
    score,
    confidence: score >= 0.75 ? 'high' : score >= 0.45 ? 'medium' : 'low',
    reasons: [
      `Top industry match: ${best.label}.`,
      second ? `Next closest industry: ${second.label}.` : 'No strong competing industry.',
    ],
  }
}

function inferToneOfVoice(pages: ExtractedPage[], industry: string, preset: WebsitePresetRecommendation) {
  const text = normalizeForSearch(
    pages
      .map((page) => `${page.title}\n${page.description}\n${page.summaryText}`)
      .join('\n')
  )

  if (/(friendly|warm|vennlig|hyggelig|welcome)/.test(text)) return 'warm, helpful'
  if (/(premium|exclusive|luxury|professional)/.test(text)) return 'professional, polished'
  if (/(creative|design|studio|fun|playful)/.test(text)) return 'creative, approachable'
  if (HIGH_TRUST_INDUSTRIES.includes(industry) || preset.preset === 'professional_services') {
    return 'professional, calm, precise'
  }
  if (preset.preset === 'local_service') {
    return 'friendly, reassuring, direct'
  }
  if (preset.preset === 'saas_software') {
    return 'clear, modern, product-focused'
  }
  return 'professional, warm, helpful'
}

function inferMainGoal(pages: ExtractedPage[], preset: WebsitePresetRecommendation) {
  const text = normalizeForSearch(
    pages
      .map((page) =>
        [page.title, page.description, page.summaryText, ...page.headings, ...page.relevantLines].join(' ')
      )
      .join(' ')
  )

  const goals = [
    { label: 'collect bookings', patterns: ['book', 'booking', 'appointment', 'bestill', 'reserve'] },
    { label: 'drive sales', patterns: ['shop', 'buy', 'cart', 'checkout', 'product'] },
    { label: 'take the load off support', patterns: ['support', 'help', 'kundeservice', 'faq', 'questions'] },
    { label: 'convert visitors into leads', patterns: ['contact us', 'quote', 'offer', 'enquiry', 'consultation'] },
    { label: 'route visitors to the right page', patterns: ['services', 'contact', 'find', 'navigation'] },
    { label: 'inform visitors', patterns: ['about', 'blog', 'guide', 'news', 'information'] },
  ]

  const scored = goals
    .map((goal) => ({
      label: goal.label,
      score: goal.patterns.reduce((sum, pattern) => sum + (text.includes(normalizeForSearch(pattern)) ? 1 : 0), 0),
    }))
    .sort((left, right) => right.score - left.score)

  if (scored[0] && scored[0].score > 0) {
    return scored[0].label
  }

  switch (preset.preset) {
    case 'local_service':
      return 'collect bookings'
    case 'professional_services':
      return 'convert visitors into leads'
    case 'ecommerce':
      return 'drive sales'
    case 'saas_software':
      return 'take the load off support'
    case 'information_site':
      return 'inform visitors'
    default:
      return 'answer questions'
  }
}

function collectWebsiteUrls(pages: ExtractedPage[], rootUrl: URL) {
  return uniqueStrings(
    [
      rootUrl.toString(),
      ...pages.map((page) => page.url),
      ...pages.map((page) => page.canonicalUrl),
      ...pages.flatMap((page) => page.links),
      ...pages.flatMap((page) => page.schemaFacts.urls),
    ].filter(Boolean),
    40
  )
}

function buildSecurityRecommendation(rootUrl: URL, pages: ExtractedPage[]): WebsiteSecurityRecommendation {
  const allowedDomains = new Set<string>()
  const manualReview = new Set<string>()
  const rejectedExternalDomains = new Set<string>()
  const notes: string[] = []

  const addOrigin = (rawUrl: string) => {
    const origin = safeUrlOrigin(rawUrl)
    if (!origin) return
    const host = new URL(origin).hostname

    if (/localhost|vercel\.app|netlify\.app|webflow\.io|\bdev\b|\btest\b|\bstaging\b|\bpreview\b/i.test(host)) {
      manualReview.add(origin)
      return
    }

    if (stripWww(host) === stripWww(rootUrl.hostname)) {
      allowedDomains.add(origin)
    } else {
      rejectedExternalDomains.add(origin)
    }
  }

  addOrigin(rootUrl.origin)

  const alternateHost = rootUrl.hostname.startsWith('www.')
    ? rootUrl.origin.replace(`://${rootUrl.hostname}`, `://${stripWww(rootUrl.hostname)}`)
    : rootUrl.origin.replace('://', '://www.')
  addOrigin(alternateHost)

  pages.forEach((page) => {
    addOrigin(page.url)
    addOrigin(page.canonicalUrl)
    page.sameSiteDomains.forEach(addOrigin)
    page.schemaFacts.urls.forEach(addOrigin)
    page.schemaFacts.sameAs.forEach(addOrigin)
    page.externalDomains.forEach(addOrigin)
  })

  const rejected = [...rejectedExternalDomains].filter((origin) =>
    /(facebook|instagram|youtube|linkedin|tiktok|google|stripe|vipps|klarna|paypal|calendly|booking|timma)/i.test(origin)
  )

  if (manualReview.size) {
    notes.push('Preview, staging, localhost, or builder domains were discovered and should be confirmed manually.')
  }
  if (rejected.length) {
    notes.push('External social, payment, maps, or booking domains were excluded from allowed widget domains.')
  }

  return {
    allowedDomains: uniqueStrings([...allowedDomains], 20),
    domainsForManualReview: uniqueStrings([...manualReview], 12),
    rejectedExternalDomains: uniqueStrings(rejected, 20),
    blockNativeAppsByDefault: true,
    requireOriginOrReferer: true,
    recommendSignedWidgetSessions: true,
    notes: uniqueStrings(notes, 8),
  }
}

function inferPreset(pages: ExtractedPage[], autofill: WebsiteAutofillResult): WebsitePresetRecommendation {
  const text = normalizeForSearch(
    pages
      .map((page) =>
        [page.url, page.title, page.description, page.summaryText, ...page.headings, ...page.relevantLines].join(' ')
      )
      .join(' ')
  )

  const scores: Record<WebsitePreset, number> = {
    local_service: 0,
    professional_services: 0,
    ecommerce: 0,
    saas_software: 0,
    information_site: 0,
    unknown: 0,
  }

  if (/\b(book|booking|appointment|bestill|salon|clinic|repair|restaurant|workshop)\b/.test(text)) {
    scores.local_service += 5
  }
  if (/\b(consulting|advisor|real estate|legal|accounting|finance|insurance|b2b)\b/.test(text)) {
    scores.professional_services += 5
  }
  if (/\b(shop|store|cart|checkout|shipping|product)\b/.test(text)) {
    scores.ecommerce += 5
  }
  if (/\b(software|platform|dashboard|api|subscription|docs|features|app|ai tool)\b/.test(text)) {
    scores.saas_software += 5
  }
  if (/\b(blog|portfolio|gallery|news|guide|information)\b/.test(text)) {
    scores.information_site += 4
  }

  scores.local_service += pages.filter((page) => page.pageType === 'booking' || page.pageType === 'contact').length
  scores.professional_services += autofill.businessProfile.industry === 'Professional services' ? 3 : 0
  scores.ecommerce += pages.filter((page) => page.pageType === 'pricing' || page.pageType === 'product').length
  scores.saas_software += pages.filter((page) => page.pageType === 'support' || page.pageType === 'product').length
  scores.information_site += pages.filter((page) => page.pageType === 'about').length

  const ranked = (Object.entries(scores) as Array<[WebsitePreset, number]>).sort((left, right) => right[1] - left[1])
  const [preset, score] = ranked[0]
  const nextScore = ranked[1]?.[1] ?? 0

  if (score <= 0) {
    return {
      preset: 'unknown',
      reason: 'The scan did not provide enough clear product or service signals.',
      confidence: 0.24,
    }
  }

  return {
    preset,
    reason: `Matched ${preset.replace(/_/g, ' ')} signals from page types, keywords, and website structure.`,
    confidence: clampNumber(0.35 + score * 0.08 + Math.max(0, score - nextScore) * 0.05, 0, 1),
  }
}

function buildAssistantSettings(
  pages: ExtractedPage[],
  autofill: WebsiteAutofillResult,
  preset: WebsitePresetRecommendation,
  quality: WebsiteScanQuality,
  faqSuggestions: string[]
): WebsiteSetupRecommendation['assistantSettings'] {
  const industry = autofill.businessProfile.industry || ''
  const strictContextOnly =
    HIGH_TRUST_INDUSTRIES.includes(industry) || preset.preset === 'unknown' || quality.riskLevel !== 'low'

  const humanSupportEnabled = Boolean(
    autofill.businessProfile.fallbackContact ||
      (autofill.knowledgeBase.contactInfo || '').trim() ||
      pages.some((page) => page.pageType === 'contact')
  )

  const temperature =
    HIGH_TRUST_INDUSTRIES.includes(industry) || preset.preset === 'unknown'
      ? 0.2
      : preset.preset === 'saas_software'
        ? 0.35
        : 0.28

  const fallbackContact = autofill.businessProfile.fallbackContact || 'the company contact page'

  return {
    enableAiReplies: quality.scanQualityScore >= 40,
    strictContextOnly,
    replyInUserLanguage: true,
    faqSuggestionsEnabled: faqSuggestions.length > 0,
    humanSupportEnabled,
    provider: 'gemini',
    model: 'gemini-2.5-flash-lite',
    temperature,
    maxAnswerLength: 'medium',
    toneOfVoice:
      autofill.businessProfile.toneOfVoice ||
      inferToneOfVoice(pages, industry, preset),
    mainGoal: autofill.businessProfile.mainGoal || inferMainGoal(pages, preset),
    fallbackBehavior: `If the website context does not clearly answer the question, say you are not sure and direct the user to ${fallbackContact}.`,
    startLanguage: autofill.businessProfile.language || 'English',
  }
}

function buildSuggestedQuestions(language: string, preset: WebsitePreset, faqSuggestions: string[]) {
  const normalizedLanguage = normalizeLanguage(language) || 'English'
  if (faqSuggestions.length >= 3) {
    return faqSuggestions.slice(0, 4)
  }

  if (normalizedLanguage === 'Norwegian') {
    switch (preset) {
      case 'local_service':
        return ['Hva tilbyr dere?', 'Hvordan bestiller jeg?', 'Hva er åpningstidene?', 'Hvordan kontakter jeg dere?']
      case 'professional_services':
        return ['Hva kan dere hjelpe med?', 'Hvordan kommer jeg i kontakt?', 'Tilbyr dere møte eller konsultasjon?', 'Hvilke tjenester tilbyr dere?']
      case 'ecommerce':
        return ['Hvilke produkter tilbyr dere?', 'Hva koster det?', 'Hvordan fungerer levering?', 'Hvordan kontakter jeg support?']
      case 'saas_software':
        return ['Hva gjør produktet?', 'Hva koster det?', 'Har dere dokumentasjon?', 'Hvordan kontakter jeg support?']
      default:
        return ['Hva kan dere hjelpe med?', 'Hvor finner jeg mer informasjon?', 'Hvordan kontakter jeg dere?']
    }
  }

  switch (preset) {
    case 'local_service':
      return ['What services do you offer?', 'How do I book?', 'What are your opening hours?', 'How can I contact you?']
    case 'professional_services':
      return ['How can you help me?', 'How do I contact your team?', 'Do you offer consultations?', 'What services do you provide?']
    case 'ecommerce':
      return ['What do you sell?', 'What does it cost?', 'How does shipping work?', 'How can I contact support?']
    case 'saas_software':
      return ['What does the product do?', 'What are your pricing plans?', 'Do you have documentation?', 'How can I contact support?']
    default:
      return ['How can you help me?', 'Where can I find more information?', 'How do I contact you?']
  }
}

function buildConversationCards(
  businessName: string,
  language: string,
  preset: WebsitePreset,
  suggestedQuestions: string[]
): AssistantConversationCard[] {
  const isNorwegian = normalizeLanguage(language) === 'Norwegian'
  const fallbackTitle = businessName ? `${businessName} Assistant` : isNorwegian ? 'Hjelp' : 'Help'
  const questionOne = suggestedQuestions[0] || (isNorwegian ? 'Hva kan dere hjelpe med?' : 'How can you help?')
  const questionTwo = suggestedQuestions[1] || (isNorwegian ? 'Hvordan kontakter jeg dere?' : 'How do I contact you?')
  const questionThree = suggestedQuestions[2] || (isNorwegian ? 'Hva koster det?' : 'What does it cost?')

  const presets = {
    local_service: isNorwegian
      ? [
          {
            title: 'Bestill eller kontakt',
            description: 'Hjelp besøkende med å komme raskt videre.',
            options: [
              { label: 'Bestilling', prompt: questionOne, description: 'Passer når noen vil booke eller bestille.' },
              { label: 'Kontakt', prompt: questionTwo, description: 'Passer når noen trenger menneskelig hjelp.' },
            ],
          },
          {
            title: 'Praktisk info',
            description: 'Svar på åpningstider, priser og beliggenhet.',
            options: [
              { label: 'Åpningstider', prompt: suggestedQuestions[2] || 'Hva er åpningstidene?', description: 'Vis når dere er tilgjengelige.' },
              { label: 'Priser', prompt: questionThree, description: 'Vis prisinformasjon når det finnes.' },
            ],
          },
        ]
      : [
          {
            title: 'Book or contact',
            description: 'Help visitors move forward quickly.',
            options: [
              { label: 'Booking', prompt: questionOne, description: 'Use when someone wants to book or reserve.' },
              { label: 'Contact', prompt: questionTwo, description: 'Use when someone needs human help.' },
            ],
          },
          {
            title: 'Practical info',
            description: 'Answer hours, prices, and location questions.',
            options: [
              { label: 'Opening hours', prompt: suggestedQuestions[2] || 'What are your opening hours?', description: 'Show availability.' },
              { label: 'Prices', prompt: questionThree, description: 'Show pricing information when available.' },
            ],
          },
        ],
    professional_services: isNorwegian
      ? [
          {
            title: 'Tjenester',
            description: 'Forklar hva virksomheten tilbyr.',
            options: [
              { label: 'Tjenester', prompt: questionOne, description: 'Gir oversikt over tilbudet.' },
              { label: 'Kontakt', prompt: questionTwo, description: 'Sender videre til kontaktpunkt.' },
            ],
          },
          {
            title: 'Neste steg',
            description: 'Led besøkende til konsultasjon eller forespørsel.',
            options: [
              { label: 'Konsultasjon', prompt: suggestedQuestions[2] || 'Tilbyr dere konsultasjon?', description: 'Fanger opp leads.' },
              { label: 'Priser', prompt: questionThree, description: 'Avklarer pris ved behov.' },
            ],
          },
        ]
      : [
          {
            title: 'Services',
            description: 'Explain what the business offers.',
            options: [
              { label: 'Services', prompt: questionOne, description: 'Summarize the offer.' },
              { label: 'Contact', prompt: questionTwo, description: 'Route to the right contact channel.' },
            ],
          },
          {
            title: 'Next steps',
            description: 'Guide visitors to consultation or enquiry.',
            options: [
              { label: 'Consultation', prompt: suggestedQuestions[2] || 'Do you offer consultations?', description: 'Capture lead intent.' },
              { label: 'Pricing', prompt: questionThree, description: 'Clarify pricing expectations.' },
            ],
          },
        ],
    ecommerce: isNorwegian
      ? [
          {
            title: 'Produkter',
            description: 'Hjelp brukeren å finne riktig produkt.',
            options: [
              { label: 'Produkter', prompt: questionOne, description: 'Vis produktkategorier eller utvalg.' },
              { label: 'Priser', prompt: questionTwo, description: 'Svar på pris eller plan.' },
            ],
          },
          {
            title: 'Kundeservice',
            description: 'Hjelp med levering og kontakt.',
            options: [
              { label: 'Levering', prompt: suggestedQuestions[2] || 'Hvordan fungerer levering?', description: 'Svarer på praktiske spørsmål.' },
              { label: 'Support', prompt: suggestedQuestions[3] || 'Hvordan kontakter jeg support?', description: 'Ruter til støtte.' },
            ],
          },
        ]
      : [
          {
            title: 'Products',
            description: 'Help visitors find the right product.',
            options: [
              { label: 'Products', prompt: questionOne, description: 'Show product categories or highlights.' },
              { label: 'Pricing', prompt: questionTwo, description: 'Answer price questions.' },
            ],
          },
          {
            title: 'Support',
            description: 'Help with shipping and contact.',
            options: [
              { label: 'Shipping', prompt: suggestedQuestions[2] || 'How does shipping work?', description: 'Covers delivery questions.' },
              { label: 'Contact', prompt: suggestedQuestions[3] || 'How can I contact support?', description: 'Routes to human help.' },
            ],
          },
        ],
    saas_software: isNorwegian
      ? [
          {
            title: 'Produkt',
            description: 'Forklar hva løsningen gjør.',
            options: [
              { label: 'Funksjoner', prompt: questionOne, description: 'Vis hovedfunksjoner.' },
              { label: 'Priser', prompt: questionTwo, description: 'Vis pris eller abonnement.' },
            ],
          },
          {
            title: 'Hjelp',
            description: 'Vis support og dokumentasjon.',
            options: [
              { label: 'Dokumentasjon', prompt: suggestedQuestions[2] || 'Har dere dokumentasjon?', description: 'Ruter til docs eller hjelp.' },
              { label: 'Support', prompt: suggestedQuestions[3] || 'Hvordan kontakter jeg support?', description: 'Ruter til menneskelig hjelp.' },
            ],
          },
        ]
      : [
          {
            title: 'Product',
            description: 'Explain what the solution does.',
            options: [
              { label: 'Features', prompt: questionOne, description: 'Show key features.' },
              { label: 'Pricing', prompt: questionTwo, description: 'Show pricing or plans.' },
            ],
          },
          {
            title: 'Help',
            description: 'Guide visitors to docs or support.',
            options: [
              { label: 'Documentation', prompt: suggestedQuestions[2] || 'Do you have documentation?', description: 'Route to help resources.' },
              { label: 'Support', prompt: suggestedQuestions[3] || 'How can I contact support?', description: 'Route to human help.' },
            ],
          },
        ],
    information_site: isNorwegian
      ? [
          {
            title: 'Utforsk',
            description: 'Hjelp besøkende med å finne riktig informasjon.',
            options: [
              { label: 'Om', prompt: questionOne, description: 'Vis generell informasjon.' },
              { label: 'Kontakt', prompt: questionTwo, description: 'Vis kontaktpunkt.' },
            ],
          },
        ]
      : [
          {
            title: 'Explore',
            description: 'Help visitors find the right information.',
            options: [
              { label: 'About', prompt: questionOne, description: 'Show general information.' },
              { label: 'Contact', prompt: questionTwo, description: 'Show contact details.' },
            ],
          },
        ],
    unknown: isNorwegian
      ? [
          {
            title: fallbackTitle,
            description: 'Start med vanlige spørsmål.',
            options: [
              { label: 'Hva tilbyr dere?', prompt: questionOne, description: 'Et trygt startpunkt.' },
              { label: 'Kontakt', prompt: questionTwo, description: 'Brukes når svar mangler.' },
            ],
          },
        ]
      : [
          {
            title: fallbackTitle,
            description: 'Start with common visitor questions.',
            options: [
              { label: 'What do you offer?', prompt: questionOne, description: 'A safe starting point.' },
              { label: 'Contact', prompt: questionTwo, description: 'Use when the answer is unclear.' },
            ],
          },
        ],
  }

  return presets[preset].map((card, index) => ({
    id: `${slugify(card.title || fallbackTitle)}-${index + 1}`,
    title: card.title,
    description: card.description,
    options: card.options,
  }))
}

function buildWidgetDefaults(
  pages: ExtractedPage[],
  autofill: WebsiteAutofillResult,
  preset: WebsitePresetRecommendation,
  faqSuggestions: string[]
): WebsiteSetupRecommendation['widgetDefaults'] {
  const language = normalizeLanguage(autofill.businessProfile.language || '') || 'English'
  const isNorwegian = language === 'Norwegian'
  const businessName = autofill.businessProfile.businessName || ''
  const suggestedStarterQuestions = buildSuggestedQuestions(language, preset.preset, faqSuggestions)
  const conversationCards = buildConversationCards(businessName, language, preset.preset, suggestedStarterQuestions)

  const colorTheme =
    preset.preset === 'professional_services'
      ? 'professional-blue'
      : preset.preset === 'local_service'
        ? 'friendly-green'
        : preset.preset === 'saas_software'
          ? 'modern-purple'
          : 'neutral'

  return {
    widgetName: businessName ? `${businessName} Assistant` : isNorwegian ? 'Nettsideassistent' : 'Website Assistant',
    welcomeMessage: isNorwegian ? 'Hei! Hvordan kan jeg hjelpe deg?' : 'Hi! How can I help you?',
    placeholderText: isNorwegian ? 'Skriv en melding...' : 'Write a message...',
    suggestedStarterQuestions,
    buttonPosition: 'bottom-right',
    colorTheme,
    brandingVisibility: 'visible',
    humanHandoffLabel: isNorwegian ? 'Snakk med et menneske' : 'Talk to a human',
    conversationCardsEnabled: conversationCards.length > 0,
    conversationCardsLimit: Math.min(4, Math.max(1, conversationCards.length)),
    conversationCards,
    cardSettings: {
      layout: conversationCards.length > 1 ? 'grid' : 'list',
      style: preset.preset === 'professional_services' ? 'minimal' : preset.preset === 'unknown' ? 'chips' : 'modern',
    },
  }
}

function buildBusinessContext(
  pages: ExtractedPage[],
  rootUrl: URL,
  autofill: WebsiteAutofillResult,
  security: WebsiteSecurityRecommendation
) {
  const overviewLines = buildOverviewLines(pages)
  const serviceLines = selectLinesByKeywords(pages, SERVICE_KEYWORDS, 10)
  const pricingLines = uniqueStrings(pages.flatMap((page) => page.pricingLines), 10)
  const bookingLines = uniqueStrings(
    [
      ...selectLinesByKeywords(pages, BOOKING_KEYWORDS, 8),
      ...pages.flatMap((page) => page.bookingUrls),
    ],
    10
  )
  const contactLines = uniqueStrings(
    [
      ...pages.flatMap((page) => page.contactInfo.emails.map((value) => `Email: ${value}`)),
      ...pages.flatMap((page) => page.contactInfo.phones.map((value) => `Phone: ${value}`)),
      ...selectLinesByKeywords(pages, CONTACT_KEYWORDS, 8),
    ],
    12
  )
  const openingHourLines = uniqueStrings(
    [
      autofill.knowledgeBase.openingHours || '',
      ...pages.flatMap((page) => page.schemaFacts.openingHours),
      ...pages.flatMap((page) => page.relevantLines.filter(looksLikeOpeningHours)),
    ].filter(Boolean),
    8
  )
  const policyLines = uniqueStrings(
    pages.flatMap((page) => page.legalLines),
    8
  )
  const navigationLinks = formatNavigationLinks(pages)
  const locationLines = uniqueStrings(
    [autofill.knowledgeBase.addresses || '', ...pages.flatMap((page) => page.schemaFacts.addresses)].filter(Boolean),
    8
  )

  return [
    'You are answering questions using scanned website information.',
    'Use only facts that are clearly supported by this context.',
    'If a detail is missing, uncertain, or conflicting, say you are not sure.',
    '',
    '## Business overview',
    `- Website scanned: ${rootUrl.origin}`,
    ...formatBullets(overviewLines, 'No clear overview was found.', 6),
    '',
    '## Services/products',
    ...formatBullets(serviceLines, 'No clear services or products were found.', 10),
    '',
    '## Pricing/plans',
    ...formatBullets(pricingLines, 'No clear pricing information was found.', 10),
    '',
    '## Booking/appointments',
    ...formatBullets(bookingLines, 'No clear booking flow was found.', 10),
    '',
    '## Opening hours',
    ...formatBullets(openingHourLines, 'No opening hours were confirmed.', 8),
    '',
    '## Contact/support',
    ...formatBullets(contactLines, 'No clear contact or support details were found.', 12),
    '',
    '## Locations',
    ...formatBullets(locationLines, 'No confirmed address or location was found.', 8),
    '',
    '## Policies/terms',
    ...formatBullets(policyLines, 'No important policy or legal notes were found.', 8),
    '',
    '## Important navigation links',
    ...formatBullets(navigationLinks, 'No important navigation links were extracted.', 12),
    '',
    '## What the assistant should not claim',
    '- Do not invent prices, guarantees, delivery times, legal advice, medical advice, or booking availability.',
    '- Do not assume details about services, staff, or policies unless they appear in the scanned context.',
    security.rejectedExternalDomains.length
      ? `- Do not treat external domains as approved widget domains: ${security.rejectedExternalDomains.join(', ')}.`
      : '- Do not treat external domains or social links as approved widget domains.',
    '',
    '## Fallback instruction',
    `- If the answer is not clearly supported here, say you are not sure and direct the visitor to ${autofill.businessProfile.fallbackContact || 'the company contact page'}.`,
  ].join('\n')
}

function generateFaqSuggestions(pages: ExtractedPage[], autofill: WebsiteAutofillResult, preset: WebsitePresetRecommendation) {
  const suggestions = new Set<string>()
  const language = normalizeLanguage(autofill.businessProfile.language || '') || 'English'
  const isNorwegian = language === 'Norwegian'
  const hasContact = Boolean(autofill.businessProfile.fallbackContact || autofill.knowledgeBase.contactInfo)
  const hasHours = Boolean(autofill.knowledgeBase.openingHours)
  const hasPricing = Boolean(autofill.knowledgeBase.pricingLines?.length)
  const hasBooking = Boolean(autofill.knowledgeBase.bookingUrls?.length)

  const add = (value: string) => suggestions.add(value)

  if (isNorwegian) {
    add('Hva tilbyr dere?')
    if (hasContact) add('Hvordan kontakter jeg dere?')
    if (hasHours) add('Hva er åpningstidene?')
    if (hasPricing) add('Hva koster det?')
    if (hasBooking) add('Hvordan bestiller jeg?')
    if (preset.preset === 'saas_software') add('Har dere dokumentasjon eller support?')
  } else {
    add('What services do you offer?')
    if (hasContact) add('How can I contact you?')
    if (hasHours) add('What are your opening hours?')
    if (hasPricing) add('What does it cost?')
    if (hasBooking) add('How do I book an appointment?')
    if (preset.preset === 'saas_software') add('Do you have documentation or support?')
  }

  if (!hasContact && isNorwegian) add('Hvordan kommer jeg i kontakt med dere?')
  if (!hasContact && !isNorwegian) add('How do I reach your team?')

  return [...suggestions].slice(0, 5)
}

function buildReviewItems(args: {
  businessName: FieldAssessment<string>
  industry: FieldAssessment<string>
  language: FieldAssessment<string>
  description: FieldAssessment<string>
  openingHours: FieldAssessment<string>
  contact: FieldAssessment<string[]>
  address: FieldAssessment<string>
  pricing: FieldAssessment<string[]>
  booking: FieldAssessment<string[]>
  allowedDomains: FieldAssessment<string[]>
  quality: WebsiteScanQuality
  security: WebsiteSecurityRecommendation
  pages: ExtractedPage[]
}) {
  const items: WebsiteReviewItem[] = []

  const push = (field: string, currentValue: string | string[] | boolean | null, issue: string, recommendation: string, confidence: ConfidenceLevel, severity: 'high' | 'medium' | 'low') => {
    items.push({
      id: `${field}-${items.length + 1}`,
      field,
      currentValue,
      issue,
      recommendation,
      confidence,
      severity,
    })
  }

  if (args.businessName.confidence === 'low') {
    push('businessName', args.businessName.value || null, 'Business name is low confidence.', 'Confirm the business name before using it in the assistant or widget title.', args.businessName.confidence, 'high')
  }
  if (!args.industry.value || args.industry.confidence === 'low') {
    push('industry', args.industry.value || null, 'Industry is unclear.', 'Select the correct industry manually so strict context mode and tone are configured correctly.', args.industry.confidence, 'high')
  }
  if (!args.contact.value.length) {
    push('fallbackContact', null, 'No clear email or phone number was found.', 'Add a fallback contact method for human handoff.', 'low', 'high')
  }
  if (!args.openingHours.value) {
    push('openingHours', null, 'Opening hours are missing or unclear.', 'Add confirmed opening hours if visitors may ask when you are available.', args.openingHours.confidence, 'medium')
  }
  if (!args.pricing.value.length && args.pages.some((page) => page.pageType === 'pricing')) {
    push('pricing', [], 'A pricing page exists but clear prices were not extracted.', 'Review the pricing page and add confirmed pricing lines manually if needed.', args.pricing.confidence, 'medium')
  }
  if (!args.booking.value.length && args.pages.some((page) => page.pageType === 'booking')) {
    push('booking', [], 'Booking intent was detected but no clear booking URL was confirmed.', 'Add the final booking URL manually.', args.booking.confidence, 'medium')
  }
  if (!args.address.value) {
    push('address', null, 'No clear address was found.', 'Add the business address if location matters for visitors.', args.address.confidence, 'low')
  }
  if (args.quality.scanQualityScore < 45) {
    push('scanQuality', null, 'Overall scan quality is weak.', 'Upload extra FAQ, service, or policy documents before relying on the assistant.', 'low', 'high')
  }
  if (args.security.rejectedExternalDomains.length) {
    push('externalDomains', args.security.rejectedExternalDomains, 'External domains were found during scanning.', 'Confirm that only first-party live domains are placed in allowed domains.', 'medium', 'medium')
  }
  if (args.security.domainsForManualReview.length) {
    push('domainsForManualReview', args.security.domainsForManualReview, 'Preview or staging domains were found.', 'Remove preview domains from production widget settings unless explicitly needed.', 'medium', 'high')
  }
  if (args.language.confidence === 'low') {
    push('language', args.language.value || null, 'Language signals were conflicting or weak.', 'Confirm the default language and whether replies should mirror the user language.', args.language.confidence, 'medium')
  }
  if (args.pages.some((page) => /\b(login|admin|auth|account)\b/i.test(page.url))) {
    push('discoveredPages', args.pages.filter((page) => /\b(login|admin|auth|account)\b/i.test(page.url)).map((page) => page.url), 'Login or admin-like pages were discovered.', 'Check that low-value or protected pages are not prioritized in the business context.', 'medium', 'low')
  }

  return items
}

function buildSetupTasks(args: {
  autofill: WebsiteAutofillResult
  quality: WebsiteScanQuality
  reviewItems: WebsiteReviewItem[]
  security: WebsiteSecurityRecommendation
  preset: WebsitePresetRecommendation
  assistantSettings: WebsiteSetupRecommendation['assistantSettings']
  pricingAssessment: FieldAssessment<string[]>
  bookingAssessment: FieldAssessment<string[]>
  pages: ExtractedPage[]
}) {
  const tasks: WebsiteSetupTask[] = []

  const push = (
    title: string,
    description: string,
    priority: WebsiteSetupTask['priority'],
    category: WebsiteSetupTask['category'],
    reason: string
  ) => {
    tasks.push({
      id: `${slugify(title)}-${tasks.length + 1}`,
      title,
      description,
      priority,
      status: 'todo',
      category,
      reason,
    })
  }

  push(
    'Confirm allowed domains',
    'Review the detected production domains and remove any domains that should not be allowed to load the widget.',
    'high',
    'security',
    'Widget embedding should be restricted to trusted live domains.'
  )

  push(
    'Test widget on live website',
    'Open the widget on the live site and verify greeting, starter questions, language, and human handoff behavior.',
    'high',
    'settings',
    'The scan produces recommendations, but the final setup still needs a live verification pass.'
  )

  push(
    'Review business description',
    'Confirm that the short business description is accurate and not too generic before saving the assistant profile.',
    'medium',
    'content',
    'Scanned descriptions may still need human cleanup.'
  )

  push(
    'Review chatbot tone',
    'Confirm that the inferred tone fits the brand and customer expectations.',
    'medium',
    'design',
    'Tone affects trust and conversion.'
  )

  if (!args.autofill.businessProfile.fallbackContact) {
    push(
      'Add fallback contact',
      'Add an email address, phone number, or clear contact page for human handoff.',
      'high',
      'support',
      'The assistant should have a safe fallback when the context is incomplete.'
    )
  }

  if (!args.autofill.knowledgeBase.openingHours) {
    push(
      'Add opening hours',
      'Add confirmed opening hours if customers are likely to ask when you are available.',
      'medium',
      'content',
      'Opening hours were not confidently extracted.'
    )
  }

  if (!args.pricingAssessment.value.length && args.pages.some((page) => page.pageType === 'pricing')) {
    push(
      'Add pricing details',
      'Review the pricing page and add clean pricing lines manually if the assistant should answer price questions.',
      'medium',
      'content',
      'A pricing page exists, but no clear structured price lines were captured.'
    )
  }

  if (!args.bookingAssessment.value.length && args.pages.some((page) => page.pageType === 'booking')) {
    push(
      'Add booking link',
      'Add the final booking URL and a short instruction for how visitors should book.',
      'medium',
      'settings',
      'Booking intent was detected, but the booking flow was not clearly captured.'
    )
  }

  if (args.quality.scanQualityScore < 50) {
    push(
      'Upload FAQ or service documents',
      'Add curated FAQs, service descriptions, or policy documents to strengthen the assistant context.',
      'high',
      'content',
      'The scan quality is not strong enough to rely only on website extraction.'
    )
  }

  if (args.assistantSettings.strictContextOnly) {
    push(
      'Review strict context mode',
      'Confirm that strict context mode should remain enabled for this business type.',
      'medium',
      'settings',
      'High-trust or uncertain scans should usually avoid speculative answers.'
    )
  }

  if (args.security.domainsForManualReview.length || args.security.rejectedExternalDomains.length) {
    push(
      'Review external and preview domains',
      'Make sure preview, staging, social, payment, and booking domains are not accidentally saved as production widget domains.',
      'high',
      'domain',
      'Unsafe domains were discovered during scanning.'
    )
  }

  if (args.preset.preset === 'local_service' && !args.autofill.knowledgeBase.addresses) {
    push(
      'Add location details',
      'Add the business location or service area so the assistant can answer local visitor questions.',
      'medium',
      'content',
      'Local service visitors often ask where the business is located.'
    )
  }

  return tasks
}

function buildAutofillResult(pages: ExtractedPage[], rootUrl: URL, security: WebsiteSecurityRecommendation) {
  const evidence = collectValueEvidence(pages, rootUrl)
  const businessName = scoreSingleValue(evidence.businessNameEvidence, stripWww(rootUrl.hostname))
  const description = scoreSingleValue(evidence.descriptionEvidence)
  const language = scoreSingleValue(
    [
      ...evidence.languageEvidence,
      ...(detectLanguageFromText(pages)
        ? [
            {
              value: detectLanguageFromText(pages),
              source: 'body' as const,
              pageType: 'home' as const,
              pageUrl: rootUrl.toString(),
              bonus: 0.04,
            },
          ]
        : []),
    ],
    ''
  )
  const industry = extractIndustryAssessment(pages)
  const openingHours = scoreSingleValue(evidence.openingHoursEvidence)
  const address = scoreSingleValue(evidence.addressEvidence)

  const emails = uniqueStrings(
    pages.flatMap((page) => [...page.contactInfo.emails, ...page.schemaFacts.emails]),
    10
  )
  const phones = uniqueStrings(
    pages.flatMap((page) => [...page.contactInfo.phones, ...page.schemaFacts.phones]),
    10
  )
  const contact = scoreStringList([...emails, ...phones], ['Contact info came from mailto/tel, visible text, and schema.'], 2)
  const pricing = scoreStringList(
    pages.flatMap((page) => page.pricingLines),
    ['Pricing confidence is based on explicit currency, plan, and pricing lines.'],
    2
  )
  const booking = scoreStringList(
    pages.flatMap((page) => page.bookingUrls),
    ['Booking confidence is based on booking-related links and page intent.'],
    1
  )
  const allowedDomains = scoreStringList(
    security.allowedDomains,
    ['Allowed domains are limited to same-site origins and canonical same-site domains.'],
    1
  )

  const businessProfile: Partial<AssistantBusinessProfile> = {
    businessName: businessName.confidence === 'low' ? '' : businessName.value,
    industry: industry.confidence === 'low' ? '' : industry.value,
    shortDescription: description.confidence === 'low' ? '' : description.value,
    toneOfVoice: inferToneOfVoice(pages, industry.value, { preset: 'unknown', reason: '', confidence: 0 }),
    language: language.confidence === 'low' ? '' : normalizeLanguage(language.value),
    multilingual: Boolean(language.value && normalizeLanguage(language.value) !== 'Norwegian'),
    mainGoal: '',
    fallbackContact: contact.value[0] || '',
  }

  const knowledgeBase: WebsiteKnowledgeBaseAutofill = {
    websiteUrls: collectWebsiteUrls(pages, rootUrl),
    uploadedDocuments: [],
    manualNotes: '',
    openingHours: openingHours.confidence === 'low' ? '' : openingHours.value,
    contactInfo: contact.value.join(' • '),
    addresses: address.confidence === 'low' ? '' : address.value,
    keyFAQs: [],
    navigationLinks: formatNavigationLinks(pages),
    pricingLines: pricing.value,
    bookingUrls: booking.value,
    policyLines: uniqueStrings(pages.flatMap((page) => page.legalLines), 10),
  }

  const preset = inferPreset(pages, { businessProfile, knowledgeBase, missingFields: {} })
  businessProfile.toneOfVoice = inferToneOfVoice(pages, industry.value, preset)
  businessProfile.mainGoal = inferMainGoal(pages, preset)

  const missingFields: WebsiteAutofillResult['missingFields'] = {
    businessName: businessProfile.businessName ? '' : 'Business name was uncertain. Confirm it manually.',
    industry: businessProfile.industry ? '' : 'Industry was unclear. Select the correct industry manually.',
    shortDescription: businessProfile.shortDescription ? '' : 'Short description was weak or noisy. Rewrite it manually.',
    toneOfVoice: businessProfile.toneOfVoice ? '' : 'Tone of voice was not inferred clearly.',
    language: businessProfile.language ? '' : 'Language detection was uncertain. Confirm the default language manually.',
    mainGoal: businessProfile.mainGoal ? '' : 'Main goal was unclear. Choose a primary assistant goal manually.',
    fallbackContact: businessProfile.fallbackContact ? '' : 'No clear fallback contact was found. Add one manually.',
    websiteUrls: knowledgeBase.websiteUrls.length ? '' : 'No safe same-site URLs were collected.',
    openingHours: knowledgeBase.openingHours ? '' : 'Opening hours were not clearly found.',
    contactInfo: knowledgeBase.contactInfo ? '' : 'No contact info was clearly found.',
    addresses: knowledgeBase.addresses ? '' : 'Address was not clearly found.',
  }

  return {
    autofill: {
      businessProfile,
      knowledgeBase,
      missingFields,
    },
    assessments: {
      businessName,
      description,
      language,
      industry,
      openingHours,
      address,
      contact,
      pricing,
      booking,
      allowedDomains,
    },
    preset,
  }
}

function buildQuality(args: {
  assessments: {
    businessName: FieldAssessment<string>
    description: FieldAssessment<string>
    language: FieldAssessment<string>
    industry: FieldAssessment<string>
    openingHours: FieldAssessment<string>
    address: FieldAssessment<string>
    contact: FieldAssessment<string[]>
    pricing: FieldAssessment<string[]>
    booking: FieldAssessment<string[]>
    allowedDomains: FieldAssessment<string[]>
  }
  pages: ExtractedPage[]
  security: WebsiteSecurityRecommendation
}) {
  const importantScores = [
    args.assessments.businessName.score,
    args.assessments.description.score,
    args.assessments.language.score,
    args.assessments.industry.score,
    args.assessments.contact.score,
    args.assessments.allowedDomains.score,
  ]

  const completenessChecks = [
    args.assessments.businessName.value ? 1 : 0,
    args.assessments.description.value ? 1 : 0,
    args.assessments.language.value ? 1 : 0,
    args.assessments.industry.value ? 1 : 0,
    args.assessments.contact.value.length ? 1 : 0,
    args.pages.some((page) => page.pageType === 'services' || page.pageType === 'product') ? 1 : 0,
    args.pages.some((page) => page.pageType === 'contact') ? 1 : 0,
    args.assessments.allowedDomains.value.length ? 1 : 0,
  ]

  const confidenceScore = Math.round((importantScores.reduce((sum, score) => sum + score, 0) / importantScores.length) * 100)
  const contextCompletenessScore = Math.round((completenessChecks.reduce((sum, value) => sum + value, 0) / completenessChecks.length) * 100)
  const pageCoverageScore = Math.min(100, args.pages.length * 10)
  const scanQualityScore = Math.round(confidenceScore * 0.45 + contextCompletenessScore * 0.4 + pageCoverageScore * 0.15)

  const reasons: string[] = []
  if (args.assessments.businessName.confidence === 'low') reasons.push('Business name confidence is low.')
  if (args.assessments.industry.confidence === 'low') reasons.push('Industry confidence is low.')
  if (!args.assessments.contact.value.length) reasons.push('No clear fallback contact was found.')
  if (args.security.domainsForManualReview.length) reasons.push('Preview or staging domains require manual review.')
  if (args.pages.length < 3) reasons.push('Only a small number of useful pages were scanned.')
  if (args.assessments.pricing.confidence === 'low' && args.pages.some((page) => page.pageType === 'pricing')) reasons.push('Pricing page exists but pricing extraction is weak.')

  const riskLevel: WebsiteScanQuality['riskLevel'] =
    scanQualityScore >= 75 && !args.security.domainsForManualReview.length
      ? 'low'
      : scanQualityScore >= 50
        ? 'medium'
        : 'high'

  return {
    scanQualityScore,
    contextCompletenessScore,
    confidenceScore,
    riskLevel,
    reasons: uniqueStrings(reasons, 8),
  }
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
  queue.push(...buildSeedUrls(rootUrl, sitemapUrls).slice(0, finalOptions.maxPages * 2))

  while (queue.length && pages.length < finalOptions.maxPages) {
    const currentUrl = queue.shift()
    if (!currentUrl || visited.has(currentUrl)) continue
    visited.add(currentUrl)

    try {
      const html = await fetchWithTimeout(currentUrl, finalOptions.timeoutMs)
      const pageData = extractUsefulPageData(html, currentUrl, rootUrl, finalOptions.maxCharactersPerPage)

      if (shouldKeepPage(pageData, rootUrl)) {
        pages.push(pageData)
      }

      for (const href of pageData.links) {
        const nextUrl = cleanUrl(href, currentUrl, rootUrl)
        if (!nextUrl || visited.has(nextUrl) || queue.includes(nextUrl)) continue
        queue.push(nextUrl)
      }

      queue.sort((left, right) => scoreUrl(right, rootUrl) - scoreUrl(left, rootUrl))
    } catch {
      continue
    }
  }

  if (!pages.length) {
    throw new Error('No readable pages could be scanned from this website.')
  }

  const security = buildSecurityRecommendation(rootUrl, pages)
  const { autofill, assessments, preset } = buildAutofillResult(pages, rootUrl, security)
  const faqSuggestions = generateFaqSuggestions(pages, autofill, preset)
  const quality = buildQuality({ assessments, pages, security })
  const assistantSettings = buildAssistantSettings(pages, autofill, preset, quality, faqSuggestions)
  const widgetDefaults = buildWidgetDefaults(pages, autofill, preset, faqSuggestions)
  const setup: WebsiteSetupRecommendation = {
    assistantSettings,
    widgetDefaults,
  }
  const businessContext = buildBusinessContext(pages, rootUrl, autofill, security)
  const reviewItems = buildReviewItems({
    ...assessments,
    quality,
    security,
    pages,
  })
  const tasks = buildSetupTasks({
    autofill,
    quality,
    reviewItems,
    security,
    preset,
    assistantSettings,
    pricingAssessment: assessments.pricing,
    bookingAssessment: assessments.booking,
    pages,
  })
  const rawText = finalOptions.includeRawText ? pages.map((page) => page.summaryText).join('\n\n') : ''

  return {
    businessContext,
    faqSuggestions,
    autofill,
    discoveredPages: pages.map((page) => ({
      url: page.url,
      title: page.title,
      description: page.description,
      textPreview: page.summaryText.slice(0, 300),
      pageType: page.pageType,
    })),
    rawText,
    setup,
    quality,
    tasks,
    reviewItems,
    security,
    preset,
  }
}
