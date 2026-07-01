import { Metadata } from 'next'
import TermsPageClient from './TermsPageClient'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'Information about the usage terms for the Vintra website and widget.',
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
}

export default function TermsPage() {
  return <TermsPageClient />
}
