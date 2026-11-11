'use client'

import React from 'react'
import Header from '@/components/header'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { error, loading, refreshCurrentUser, firebaseUser, logout } = useAuth()
  const [logoutError, setLogoutError] = React.useState('')
  const protectedWorkspace = pathname === '/admin' || pathname.startsWith('/admin/')
    || pathname === '/landings/user' || pathname === '/landings/auth/websites'
  const isWidgetWorkspace = pathname === '/landings/auth/chatWidget' || pathname.startsWith('/widget/')
  return (
    <>
      {!isWidgetWorkspace && !['/admin', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email', '/auth/verify-email-sent'].includes(pathname) && <Header />}
      {protectedWorkspace && !loading && error ? (
        <main className="page narrow">
          <section className="infoCard">
            <h1>Kunne ikke åpne arbeidsområdet</h1>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => {
              if (firebaseUser) void refreshCurrentUser()
              else window.location.reload()
            }}>Prøv igjen</button>
            <p><Link href="/landings/main">Gå til hovedsiden</Link></p>
            {firebaseUser && <button type="button" onClick={() => void logout().catch(() => setLogoutError('Kunne ikke logge ut. Prøv igjen.'))}>Logg ut</button>}
            {logoutError && <p role="alert">{logoutError}</p>}
          </section>
        </main>
      ) : children}
      {isWidgetWorkspace ? (
        <style>{'[data-vintra-widget-key="GIN6CPbnBnbTOoEPU3wctBqr"] { display: none !important; pointer-events: none !important; }'}</style>
      ) : (
        <Script id="vintra-site-support" src="/widget/GIN6CPbnBnbTOoEPU3wctBqr.js" strategy="afterInteractive" />
      )}
    </>
  )
}
