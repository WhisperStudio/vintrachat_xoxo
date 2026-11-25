import { siteConfig } from '@/lib/site-config'

/** Keep development email links in the browser session that created the account. */
export function authLinkOrigin(requestUrl: string) {
  if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
    const url = new URL(requestUrl)
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return url.origin
  }
  // Never use an arbitrary request Host/Origin in an authentication email.
  return siteConfig.url
}
