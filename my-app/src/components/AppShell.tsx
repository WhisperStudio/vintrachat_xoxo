'use client'

import React from 'react'
import Header from '@/components/header'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWidgetWorkspace = pathname === '/landings/auth/chatWidget' || pathname.startsWith('/widget/')
  return (
    <>
      {!isWidgetWorkspace && !['/admin', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password'].includes(pathname) && <Header />}
      {children}
      {isWidgetWorkspace ? (
        <style>{'[data-vintra-widget-key="GIN6CPbnBnbTOoEPU3wctBqr"] { display: none !important; pointer-events: none !important; }'}</style>
      ) : (
        <Script id="vintra-site-support" src="/widget/GIN6CPbnBnbTOoEPU3wctBqr.js" strategy="afterInteractive" />
      )}
    </>
  )
}
