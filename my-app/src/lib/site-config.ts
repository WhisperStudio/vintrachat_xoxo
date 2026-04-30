const DEFAULT_SITE_URL = 'https://chat.vintrastudio.com'
const DEFAULT_CONTACT_EMAIL = 'vintrastudio@gmail.com'
const DEFAULT_CONTACT_PHONE = '41761252'

function normalizeSiteUrl(value?: string | null) {
  const input = String(value || '').trim()

  if (!input) return DEFAULT_SITE_URL

  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`)
    return url.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

export const siteConfig = {
  name: 'Vintra',
  legalName: 'Vintra',
  alternateName: 'Vintra Studio',
  description:
    'Vintra is the official site for business websites and AI chatbots. See pricing, support, phone, and email in one place.',
  tagline: 'Websites and AI chatbots for businesses',
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_APP_URL),
  locale: 'nb_NO',
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL,
    phone: normalizePhone(process.env.NEXT_PUBLIC_CONTACT_PHONE || DEFAULT_CONTACT_PHONE),
    phoneDisplay: formatPhoneDisplay(process.env.NEXT_PUBLIC_CONTACT_PHONE || DEFAULT_CONTACT_PHONE),
    contactType: 'customer support',
    areaServed: 'NO',
    availableLanguage: ['Norwegian', 'English'],
  },
} as const

export function absoluteUrl(path = '/') {
  return new URL(path, siteConfig.url).toString()
}

function normalizePhone(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('47') && digits.length === 10) return `+${digits}`
  if (digits.length === 8) return `+47${digits}`

  return String(value || '').trim()
}

function formatPhoneDisplay(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')

  if (digits.length === 8) {
    return `+47 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)}`
  }

  if (digits.startsWith('47') && digits.length === 10) {
    return `+47 ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
  }

  return String(value || '').trim()
}
