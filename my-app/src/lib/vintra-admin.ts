const DEFAULT_VINTRA_ADMIN_DOMAINS = ['vintrachat.com', 'vintra.no', 'vintra.app']
const DEFAULT_VINTRA_ADMIN_EMAILS = ['vintrastudio@gmail.com']

function parseList(value?: string | null) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function normalizeEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase()
}

export function getVintraAdminEmails() {
  const configuredEmails = parseList(process.env.VINTRA_ADMIN_EMAILS)
  return configuredEmails.length > 0 ? configuredEmails : DEFAULT_VINTRA_ADMIN_EMAILS
}

export function getVintraAdminDomains() {
  const configuredDomains = parseList(process.env.VINTRA_ADMIN_DOMAINS)
  return configuredDomains.length > 0 ? configuredDomains : DEFAULT_VINTRA_ADMIN_DOMAINS
}

export function isVintraAdminEmail(email?: string | null) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !normalizedEmail.includes('@')) return false

  const allowedEmails = getVintraAdminEmails()
  if (allowedEmails.includes(normalizedEmail)) return true

  const domain = normalizedEmail.split('@').at(-1) || ''
  return getVintraAdminDomains().includes(domain)
}

export function getVintraAdminRedirectPath(email?: string | null) {
  return isVintraAdminEmail(email) ? '/vintra-admin' : '/admin'
}
