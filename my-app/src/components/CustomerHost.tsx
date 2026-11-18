'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import VintraHost from '@/svgs/VintraHost'
import { useVintraLanguage } from '@/lib/i18n'

export default function CustomerHost() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { language } = useVintraLanguage()
  const no = language === 'no'
  if (pathname === '/' || pathname === '/landings/main' || pathname.startsWith('/auth') || pathname.startsWith('/admin') || pathname.startsWith('/vintra-admin') || pathname.startsWith('/widget') || pathname.startsWith('/landings/auth') || pathname.startsWith('/landings/user')) return null
  const links = [
    { href: '/landings/guest/websites', label: no ? 'Jeg trenger en nettside' : 'I need a website' },
    { href: '/landings/auth/chatWidget', label: no ? 'Jeg vil lage en chatbot' : 'I want to create a chatbot' },
    { href: '/priser', label: no ? 'Hjelp meg å finne riktig plan' : 'Help me find the right plan' },
  ]
  return <aside className="customerHost" aria-label={no ? 'Vintra kundevert' : 'Vintra guide'} onKeyDown={event => { if (event.key === 'Escape') setOpen(false) }}>
    {open && <section id="vintra-host-guide" className="customerHostPanel" aria-labelledby="vintra-host-title">
      <button type="button" className="customerHostClose" onClick={() => setOpen(false)} aria-label={no ? 'Lukk veiviseren' : 'Close guide'}>×</button>
      <span className="customerHostEyebrow">VINTRA</span>
      <h2 id="vintra-host-title">{no ? 'Hva kan jeg hjelpe deg med?' : 'How can I help you?'}</h2>
      <p>{pathname === '/priser' ? (no ? 'Her kan du sammenligne planene. Velg hva du vil lage, så viser jeg deg videre.' : 'Compare plans here. Choose what you want to create and I will show you the way.') : (no ? 'Jeg hjelper deg å finne frem. Hva ønsker du å komme i gang med?' : 'Let me show you around. What would you like to get started with?')}</p>
      <nav>{links.filter(link => link.href !== pathname).map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<span aria-hidden="true">↗</span></Link>)}</nav>
    </section>}
    <button type="button" className="customerHostToggle" aria-label={no ? 'Vis meg rundt' : 'Show me around'} aria-expanded={open} aria-controls="vintra-host-guide" onClick={() => setOpen(value => !value)}><VintraHost/><span>{no ? 'Vis meg rundt' : 'Show me around'}</span></button>
  </aside>
}
