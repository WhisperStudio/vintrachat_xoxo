import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import AppShell from '@/components/AppShell'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: '/image/logo.png',
    shortcut: '/image/logo.png',
    apple: '/image/logo.png',
  },
  title: {
    default: 'Vintra | Business websites, AI chatbots, pricing and support',
    template: '%s | Vintra',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  publisher: siteConfig.legalName,
  creator: siteConfig.legalName,
  category: 'technology',
  referrer: 'origin-when-cross-origin',
  keywords: [
    'Vintra',
    'Vintra Studio',
    'Vintra chatbot',
    'Vintra website',
    'Vintra pricing',
    'Vintra support',
    'websites for businesses',
    'AI chatbot',
  ],
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: 'Vintra | Business websites, AI chatbots, pricing and support',
    description: siteConfig.description,
    images: [
      {
        url: absoluteUrl('/opengraph-image'),
        width: 1200,
        height: 630,
        alt: 'Vintra website and AI chatbot preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vintra | Business websites, AI chatbots, pricing and support',
    description: siteConfig.description,
    images: [absoluteUrl('/opengraph-image')],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <script src="https://chat.vintrastudio.com/widget/GIN6CPbnBnbTOoEPU3wctBqr.js"></script>
      </body>
    </html>
  )
}
