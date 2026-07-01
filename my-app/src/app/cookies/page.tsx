import type { Metadata } from 'next'
import CookiePageClient from './CookiePageClient'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Information about browser storage and cookies used on the Vintra site.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Cookies',
    description: 'Information about browser storage and cookies used on the Vintra site.',
    url: `${siteConfig.url}/cookies`,
  },
}

export default function CookiePage() {
  return <CookiePageClient />
}
