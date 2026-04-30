import type { Metadata } from 'next'
import MainLanding from './landings/main/page'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Websites and AI chatbots for businesses',
  description: siteConfig.description,
  alternates: {
    canonical: '/',
  },
}

export default function Home() {
  return <MainLanding />
}
