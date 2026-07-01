import type { Metadata } from 'next'
import PolicyPageClient from './PolicyPageClient'

export const metadata: Metadata = {
  title: 'Policy',
  description: 'Guidelines for use of Vintra websites, AI chat solutions, support, and data processing.',
  alternates: {
    canonical: '/policy',
  },
}

export default function PolicyPage() {
  return <PolicyPageClient />
}
