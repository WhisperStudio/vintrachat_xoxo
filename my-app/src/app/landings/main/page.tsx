'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { VintraLanguage as Language } from '@/lib/i18n'
import { useVintraLanguage } from '@/lib/i18n'
import { mainLandingCopy } from './i18n'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

// ─── Minimal inline SVG icons ───────────────────────────────────────────────

const GlobeIcon = ({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const BotIcon = ({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M9 13h.01M15 13h.01M8 8V6a4 4 0 0 1 8 0v2" />
    <path d="M12 3v2" />
  </svg>
)

const ArrowRight = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const CheckIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

// ─── Website mockup illustrations ───────────────────────────────────────────

const websites = [
  {
    label: 'Restaurant',
    color: '#E85D26',
    accent: '#FFF4EE',
    lines: ['Smakenes Hus', 'Moderne norsk mat', '★★★★★'],
    img: '🍽️',
  },
  {
    label: 'Portfolio',
    color: '#1A6BFF',
    accent: '#EEF4FF',
    lines: ['Ola Nordmann', 'Designer & Utvikler', 'Se arbeid →'],
    img: '🎨',
  },
  {
    label: 'Nettbutikk',
    color: '#0C9E6A',
    accent: '#EEFAF4',
    lines: ['NordicShop', 'Fri frakt over 499kr', 'Handl nå →'],
    img: '🛍️',
  },
  {
    label: 'Startup',
    color: '#7C3AED',
    accent: '#F5F0FF',
    lines: ['LaunchFast', 'Fra idé til produkt', 'Book demo →'],
    img: '🚀',
  },
  {
    label: 'Frisør / Spa',
    color: '#D4449A',
    accent: '#FDF0F8',
    lines: ['Studio Ella', 'Book din time', 'Bestill nå →'],
    img: '✂️',
  },
  {
    label: 'Bedrift',
    color: '#1E3A5F',
    accent: '#EFF3F8',
    lines: ['Nordvest AS', 'Pålitelig siden 1998', 'Kontakt oss →'],
    img: '🏢',
  },
]



const organizationId = `${siteConfig.url}/#organization`
const websiteId = `${siteConfig.url}/#website`
const emailHref = `mailto:${siteConfig.contact.email}`
const phoneHref = siteConfig.contact.phone ? `tel:${siteConfig.contact.phone.replace(/\s+/g, '')}` : ''
const contactStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteConfig.legalName,
      alternateName: siteConfig.alternateName,
      url: siteConfig.url,
      logo: absoluteUrl('/image/logo.png'),
      email: siteConfig.contact.email,
      ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: siteConfig.contact.contactType,
          email: siteConfig.contact.email,
          areaServed: siteConfig.contact.areaServed,
          availableLanguage: siteConfig.contact.availableLanguage,
          ...(siteConfig.contact.phone ? { telephone: siteConfig.contact.phone } : {}),
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: 'no',
      publisher: {
        '@id': organizationId,
      },
    },
  ],
}

function MiniSiteMockup({ site }: { site: typeof websites[0] }) {
  return (
    <div style={{
      width: 200,
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      flexShrink: 0,
      background: '#fff',
    }}>
      {/* browser chrome */}
      <div style={{ background: '#F5F5F5', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid #E8E8E8' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFBD2E', display: 'inline-block' }} />
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
        <div style={{ flex: 1, background: '#E0E0E0', borderRadius: 4, height: 12, marginLeft: 6, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
          <span style={{ fontSize: 8, color: '#888' }}>vintra.app/{site.label.toLowerCase()}</span>
        </div>
      </div>
      {/* hero */}
      <div style={{ background: site.color, padding: '20px 14px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{site.img}</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{site.lines[0]}</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{site.lines[1]}</div>
      </div>
      {/* body */}
      <div style={{ background: site.accent, padding: '10px 14px' }}>
        <div style={{ background: site.color, color: '#fff', borderRadius: 6, padding: '6px 10px', fontSize: 10, textAlign: 'center', fontWeight: 600 }}>
          {site.lines[2]}
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, width: i === 1 ? '100%' : '70%' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function DetailedSitePreview({ site, language }: { site: typeof websites[0]; language: Language }) {
  const preview = mainLandingCopy[language].preview
  const browserBar = (
    <div style={{ background: '#F5F5F5', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #E8E8E8' }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E', display: 'inline-block' }} />
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
      <div style={{ flex: 1, background: '#E0E0E0', borderRadius: 999, height: 16, marginLeft: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, color: '#777', fontWeight: 700 }}>vintra.app/{site.label.toLowerCase()}</span>
      </div>
    </div>
  )

  const heroBase = {
    background: `linear-gradient(135deg, ${site.color}, ${site.color}CC)`,
    padding: '18px 18px 20px',
  } as const

  let content: React.ReactNode = null

  if (site.label === 'Restaurant') {
    const text = preview.restaurant
    content = (
      <>
        <div style={heroBase}>
          <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 10 }}>{text.eyebrow}</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.05 }}>{text.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.84)', fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{text.body}</div>
        </div>
        <div style={{ padding: '14px 16px 16px', background: '#fff' }}>
          <div style={{ background: '#FFF8F2', borderRadius: 12, padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{text.special}</div>
              <div style={{ fontSize: 10, color: '#7A5A46', marginTop: 3 }}>{text.note}</div>
            </div>
            <div style={{ color: site.color, fontWeight: 900, fontSize: 12 }}>1 290 kr</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {text.stats.map((item) => (
              <div key={item} style={{ background: site.accent, borderRadius: 10, padding: '10px 6px', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>{item}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: site.color, color: '#fff', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.primary}</div>
            <div style={{ flex: 1, background: '#111', color: '#fff', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.secondary}</div>
          </div>
        </div>
      </>
    )
  } else if (site.label === 'Portfolio') {
    const text = preview.portfolio
    content = (
      <>
        <div style={heroBase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18 }}>✦</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>{text.eyebrow}</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Ola Nordmann Studio</div>
            </div>
          </div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 21, lineHeight: 1.05 }}>{text.title}</div>
        </div>
        <div style={{ padding: 16, background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 8, marginBottom: 12 }}>
            <div style={{ height: 82, borderRadius: 12, background: 'linear-gradient(135deg,#DDE8FF,#F5F7FF)' }} />
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ height: 37, borderRadius: 12, background: '#EEF4FF' }} />
              <div style={{ height: 37, borderRadius: 12, background: '#F3F4F6' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {text.chips.map((chip) => (
              <span key={chip} style={{ borderRadius: 999, background: '#F3F4F6', padding: '6px 10px', fontSize: 10, fontWeight: 700 }}>{chip}</span>
            ))}
          </div>
          <div style={{ background: site.color, color: '#fff', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.cta}</div>
        </div>
      </>
    )
  } else if (site.label === 'Nettbutikk') {
    const text = preview.shop
    content = (
      <>
        <div style={heroBase}>
          <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>{text.eyebrow}</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.05 }}>{text.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.84)', fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{text.body}</div>
        </div>
        <div style={{ padding: 16, background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
            {text.products.map(([title, price]) => (
              <div key={title} style={{ borderRadius: 12, background: '#F8FAF9', padding: 10 }}>
                <div style={{ height: 56, borderRadius: 10, background: '#EAF7F1', marginBottom: 8 }} />
                <div style={{ fontSize: 10, fontWeight: 800 }}>{title}</div>
                <div style={{ fontSize: 10, color: site.color, fontWeight: 900, marginTop: 3 }}>{price}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: site.accent, borderRadius: 12, padding: '10px 12px' }}>
            <span style={{ fontSize: 10, fontWeight: 800 }}>{text.shipping}</span>
            <span style={{ fontSize: 10, color: site.color, fontWeight: 900 }}>{text.badge}</span>
          </div>
        </div>
      </>
    )
  } else if (site.label === 'Startup') {
    const text = preview.startup
    content = (
      <>
        <div style={heroBase}>
          <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>{text.eyebrow}</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.05 }}>{text.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.84)', fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{text.body}</div>
        </div>
        <div style={{ padding: 16, background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {text.stats.map((item) => (
              <div key={item} style={{ background: '#F5F0FF', borderRadius: 12, padding: '12px 8px', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>{item}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {text.features.map((line) => (
              <div key={line} style={{ borderRadius: 10, border: '1px solid #EEE7FF', padding: '9px 10px', fontSize: 10, fontWeight: 700 }}>{line}</div>
            ))}
          </div>
          <div style={{ background: site.color, color: '#fff', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.cta}</div>
        </div>
      </>
    )
  } else if (site.label === 'Frisør / Spa') {
    const text = preview.salon
    content = (
      <>
        <div style={{ ...heroBase, background: `linear-gradient(135deg, ${site.color}, #F1A7CF)` }}>
          <div style={{ color: 'rgba(255,255,255,0.76)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>{text.eyebrow}</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.05 }}>{text.title}</div>
        </div>
        <div style={{ padding: 16, background: '#fff' }}>
          <div style={{ background: '#FDF4F9', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>{text.available}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['12:00', '13:30', '15:00', '17:15'].map((slot) => (
                <span key={slot} style={{ background: '#fff', borderRadius: 999, padding: '6px 9px', fontSize: 10, fontWeight: 700 }}>{slot}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {text.services.map((service) => (
              <div key={service} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, background: site.accent, padding: '10px 12px' }}>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{service}</span>
                <span style={{ fontSize: 10, color: site.color, fontWeight: 900 }}>{text.book}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  } else {
    const text = preview.business
    content = (
      <>
        <div style={{ ...heroBase, background: `linear-gradient(135deg, ${site.color}, #365B84)` }}>
          <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>{text.eyebrow}</div>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 22, lineHeight: 1.05 }}>{text.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.84)', fontSize: 11, lineHeight: 1.55, marginTop: 8 }}>{text.body}</div>
        </div>
        <div style={{ padding: 16, background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {text.stats.map((item) => (
              <div key={item} style={{ background: '#F2F5F8', borderRadius: 12, padding: '11px 8px', textAlign: 'center', fontSize: 10, fontWeight: 800 }}>{item}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {text.features.map((line) => (
              <div key={line} style={{ borderRadius: 10, border: '1px solid #E3EAF1', padding: '9px 10px', fontSize: 10, fontWeight: 700 }}>{line}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: site.color, color: '#fff', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.primary}</div>
            <div style={{ flex: 1, background: '#EFF3F8', color: '#1E3A5F', borderRadius: 10, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 800 }}>{text.secondary}</div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: 360,
      borderRadius: 20,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.18)',
      boxShadow: '0 26px 70px rgba(0,0,0,0.34)',
      background: '#fff',
      flexShrink: 0,
    }}>
      {browserBar}
      {content}
    </div>
  )
}

// ─── Chat widget preview ─────────────────────────────────────────────────────

function ChatWidgetPreview({ language }: { language: Language }) {
  const text = mainLandingCopy[language]
  const messages = text.heroChatMessages

  return (
    <div style={{
      width: '100%',
      maxWidth: 330,
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 28px 72px rgba(2,6,23,0.2)',
      border: '1px solid rgba(15,23,42,0.08)',
      background: '#fff',
    }}>
      <div style={{ minHeight: 74, background: 'linear-gradient(135deg,#5b3df5,#1d4ed8)', padding: '16px 17px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>✦</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 850, fontSize: 14, lineHeight: 1.15 }}>{text.chatTitle}</div>
          <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 11, marginTop: 3 }}>{text.chatSubtitle}</div>
        </div>
        <div style={{ marginLeft: 'auto', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', padding: '6px 10px', fontSize: 10, fontWeight: 800, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
          {text.online}
        </div>
        <div style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </div>
      </div>
      <div style={{ minHeight: 214, padding: '16px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(180deg,#fbfdff,#fff)' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: m.from === 'user' ? 'linear-gradient(135deg,#2352e8,#1d4ed8)' : '#F3F4F6',
              color: m.from === 'user' ? '#fff' : '#111',
              borderRadius: m.from === 'user' ? '16px 16px 6px 16px' : '16px 16px 16px 6px',
              padding: '10px 13px',
              fontSize: 12,
              maxWidth: m.from === 'user' ? '70%' : '80%',
              lineHeight: 1.5,
              boxShadow: m.from === 'user' ? '0 8px 18px rgba(29,78,216,0.18)' : 'none',
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '13px 14px 15px', display: 'flex', gap: 9, borderTop: '1px solid rgba(15,23,42,0.07)', background: 'rgba(255,255,255,0.98)' }}>
        <div style={{ flex: 1, minWidth: 0, height: 44, border: '1px solid rgba(15,23,42,0.11)', borderRadius: 999, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 15, boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.04)' }}>
          <span style={{ fontSize: 12, color: '#7b8494' }}>{text.writeMessage}</span>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#2352e8,#1d4ed8)', color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 12px 22px rgba(29,78,216,0.22)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// ─── Scroll reveal hook ──────────────────────────────────────────────────────

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Slide-in section wrapper ────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Auto showcase carousel ──────────────────────────────────────────────────

function WebsiteCarousel({ language }: { language: Language }) {
  const moveDurationMs = 1400
  const pauseDurationMs = 2600
  const visibleOffsets = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
  const miniCardStepPx = 222
  const [activeIndex, setActiveIndex] = useState(0)
  const [railBaseIndex, setRailBaseIndex] = useState(0)
  const [railProgress, setRailProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    if (isTransitioning) return

    const transitionTimer = window.setTimeout(() => {
      setIsTransitioning(true)
      setRailProgress(1)
    }, pauseDurationMs)

    return () => {
      window.clearTimeout(transitionTimer)
    }
  }, [activeIndex, isTransitioning])

  useEffect(() => {
    if (!isTransitioning) return

    const cleanupTimer = window.setTimeout(() => {
      setActiveIndex((current) => current + 1)
      setRailBaseIndex((current) => current + 1)
      setRailProgress(0)
      setIsTransitioning(false)
    }, moveDurationMs)

    return () => {
      window.clearTimeout(cleanupTimer)
    }
  }, [isTransitioning])

  const activeSite = websites[((activeIndex % websites.length) + websites.length) % websites.length]
  const incomingSite = websites[(((activeIndex + 1) % websites.length) + websites.length) % websites.length]

  const getMiniScale = (slot: number) => {
    const distance = Math.abs(slot)
    return Math.max(0.56, 0.98 - distance * 0.085)
  }

  const getMiniOpacity = (slot: number) => {
    const distance = Math.abs(slot)
    return Math.max(0.16, 0.92 - distance * 0.12)
  }

  const getMiniBlur = (slot: number) => {
    const distance = Math.abs(slot)
    return Math.min(distance * 0.18, 1.1)
  }

  return (
    <div style={{ overflow: 'hidden', position: 'relative', padding: '30px 0 40px', height: 620 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 42%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 160, background: 'linear-gradient(to right, #111, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 160, background: 'linear-gradient(to left, #111, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {visibleOffsets.map((offset) => {
          const virtualIndex = railBaseIndex + offset
          const site = websites[((virtualIndex % websites.length) + websites.length) % websites.length]
          const slot = offset - railProgress
          const depth = Math.abs(slot)
          const scale = getMiniScale(slot)
          const opacity = getMiniOpacity(slot)

          return (
            <div
              key={`${site.label}-${virtualIndex}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translateX(${slot * miniCardStepPx}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: `transform ${moveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${moveDurationMs}ms ease, filter ${moveDurationMs}ms ease`,
                opacity,
                filter: `blur(${getMiniBlur(slot)}px) saturate(${Math.max(0.72, 1 - depth * 0.05)})`,
                zIndex: 30 - Math.round(depth * 2),
                pointerEvents: 'none',
              }}
            >
              <MiniSiteMockup site={site} />
            </div>
          )
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          pointerEvents: 'none',
          width: 360,
          height: 520,
        }}
      >
        {isTransitioning ? (
          <div
            key={`outgoing-${activeIndex}`}
            style={{
              position: 'absolute',
              inset: 0,
              animation: isTransitioning ? `preview-out ${moveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` : 'none',
              transformOrigin: 'center center',
            }}
          >
            <DetailedSitePreview site={activeSite} language={language} />
          </div>
        ) : null}
        <div
          key={`active-${isTransitioning ? activeIndex + 1 : activeIndex}`}
          style={{
            position: 'absolute',
            inset: 0,
            animation: isTransitioning ? `preview-in ${moveDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards` : 'none',
            transformOrigin: 'center center',
          }}
        >
          <DetailedSitePreview site={isTransitioning ? incomingSite : activeSite} language={language} />
        </div>
      </div>
      <style>{`
        @keyframes preview-in {
          0% { opacity: 0; transform: translateY(34px) scale(0.975); filter: blur(6px); }
          55% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes preview-out {
          0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          100% { opacity: 0; transform: translateY(-18px) scale(1.01); filter: blur(4px); }
        }
      `}</style>
    </div>
  )
}

function ChatbotShowcasePreview({ language }: { language: Language }) {
  const text = mainLandingCopy[language]
  const messages = text.showcaseChatMessages

  return (
    <div className="chatbotPreviewShell">
      <div className="chatbotPreviewGlow" />
      <div className="chatbotScheduleCard">
        <div className="chatbotScheduleLabel">
          {text.today}
        </div>
        <div className="chatbotScheduleSlots">
          {['13:30', '15:00', '17:15'].map((slot) => (
            <div key={slot} className="chatbotScheduleSlot">
              {slot}
            </div>
          ))}
        </div>
      </div>

      <div className="chatbotWidgetMockup">
        <div className="chatbotWidgetHeader">
          <div className="chatbotWidgetAvatar">
            ✦
          </div>
          <div className="chatbotWidgetTitleGroup">
            <div className="chatbotWidgetTitle">{text.chatTitle}</div>
            <div className="chatbotWidgetSubtitle">{text.chatSubtitle}</div>
          </div>
          <div className="chatbotWidgetStatus">
            {text.online}
          </div>
          <button type="button" className="chatbotWidgetClose" aria-label={text.closePreview}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="chatbotWidgetBody">
          <div className="chatbotMessageList">
            {messages.map((message, index) => (
              <div key={index} className={`chatbotMessageRow ${message.from === 'user' ? 'isUser' : 'isBot'}`}>
                <div className={`chatbotMessageBubble ${message.from === 'user' ? 'isUser' : 'isBot'}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chatbotWidgetFooter">
          <div className="chatbotWidgetInput">{text.writeMessage}</div>
          <button type="button" className="chatbotWidgetSend" aria-label={text.sendPreview}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MainLanding() {
  const [heroMounted, setHeroMounted] = useState(false)
  const { language } = useVintraLanguage()
  const text = mainLandingCopy[language]

  useEffect(() => {
    setTimeout(() => setHeroMounted(true), 80)
  }, [])

  const currentYear = new Date().getFullYear()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      <style>{`
        :root { --bg: #FAFAFA; }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: var(--bg); font-family: -apple-system, 'Helvetica Neue', sans-serif; color: #111 }
        .page { max-width: 1100px; margin: 0 auto; padding: 0 24px }
        .solutionsSection {
          position: relative;
          overflow: hidden;
          padding: 0 0 110px;
          background: #0d1220;
          color: #fff;
          font-family: "Inter", system-ui, sans-serif;
        }
        .solutionsCurve {
          position: relative;
          width: min(1280px, calc(100vw - 48px));
          margin: 0 auto;
          border-radius: 45% 45% 0 0;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 34%),
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.14), transparent 30%),
            linear-gradient(180deg, #111827 0%, #0d1220 56%, #0c111d 100%);
          box-shadow: 0 -24px 60px rgba(15, 23, 42, 0.22);
          overflow: hidden;
        }
        .solutionsShell {
          position: relative;
          z-index: 1;
          padding: 118px 0 104px;
        }
        .solutionsGlow {
          position: absolute;
          top: -12%;
          right: -8%;
          width: 540px;
          height: 540px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(15, 17, 21, 0) 70%);
          z-index: 0;
          pointer-events: none;
        }
        .solutionsIntro {
          max-width: 920px;
          margin: 0 auto 76px;
        }
        .solutionsGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
          perspective: 1000px;
          align-items: stretch;
        }
        .solutionsCard {
          min-width: 0;
          border-radius: 32px !important;
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.24);
        }
        .solutionsFooter {
          max-width: fit-content;
          margin: 68px auto 0;
        }
        @keyframes float-slow {
          0%,100% { transform: translateY(0) rotate(-2deg) }
          50%      { transform: translateY(-12px) rotate(2deg) }
        }
        @keyframes float-mid {
          0%,100% { transform: translateY(0) rotate(1deg) }
          50%      { transform: translateY(-8px) rotate(-1deg) }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.4 }
          70%  { transform: scale(1.4); opacity: 0 }
          100% { transform: scale(1.4); opacity: 0 }
        }
        .float-b { animation: float-mid 5s ease-in-out infinite 1s }
        .cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #111; color: #fff; border: none; border-radius: 999px;
          padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          text-decoration: none;
        }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2) }
        .cta-secondary {
          display: inline-flex; align-items: center; gap: 8px;
          background: #fff; color: #111; border: 1.5px solid #E0E0E0; border-radius: 999px;
          padding: 13px 26px; font-size: 15px; font-weight: 600; cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .cta-secondary:hover { transform: translateY(-2px); border-color: #999 }
        .product-card {
          border-radius: 22px; padding: 32px 30px;
          border: 1px solid rgba(15,23,42,0.08);
          background: #fff;
          box-shadow: 0 12px 34px rgba(15,23,42,0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .product-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 40px rgba(15,23,42,0.1);
          border-color: rgba(15,23,42,0.14);
        }
        .product-decision-intro {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 42px;
        }
        .product-decision-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(15,23,42,0.08);
          background: rgba(255,255,255,0.82);
          color: #5b6472;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .product-decision-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 72px minmax(0, 1fr);
          align-items: stretch;
          border-radius: 34px;
          border: 1px solid rgba(15,23,42,0.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.98));
          box-shadow: 0 28px 80px rgba(15,23,42,0.08);
          overflow: hidden;
        }
        .product-choice-card {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding: 40px 38px;
          min-height: 100%;
        }
        .product-choice-card--website {
          background:
            radial-gradient(circle at top left, rgba(26,107,255,0.08), transparent 32%),
            rgba(255,255,255,0.92);
        }
        .product-choice-card--chatbot {
          background:
            radial-gradient(circle at top right, rgba(124,58,237,0.09), transparent 34%),
            rgba(255,255,255,0.92);
        }
        .product-choice-head {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .product-choice-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }
        .product-choice-icon--website {
          background: #eef4ff;
          color: #1a6bff;
        }
        .product-choice-icon--chatbot {
          background: #f5f0ff;
          color: #7c3aed;
        }
        .product-choice-head h3 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #0f172a;
        }
        .product-choice-subtitle {
          margin: 0;
          color: #5b6472;
          font-size: 16px;
          line-height: 1.7;
        }
        .product-choice-meta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15,23,42,0.04);
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          width: fit-content;
        }
        .product-choice-copy-block {
          display: grid;
          gap: 14px;
        }
        .product-choice-copy-block strong {
          font-size: 13px;
          color: #0f172a;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .product-choice-list {
          list-style: none;
          display: grid;
          gap: 12px;
          padding: 0;
          margin: 0;
        }
        .product-choice-list li {
          position: relative;
          padding-left: 18px;
          color: #334155;
          font-size: 16px;
          line-height: 1.6;
        }
        .product-choice-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.72em;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.9;
          transform: translateY(-50%);
        }
        .product-choice-card--website .product-choice-list li::before {
          color: #1a6bff;
          background: #1a6bff;
        }
        .product-choice-card--chatbot .product-choice-list li::before {
          color: #7c3aed;
          background: #7c3aed;
        }
        .product-choice-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: auto;
          width: 100%;
          min-height: 54px;
          padding: 0 20px;
          border-radius: 16px;
          text-decoration: none;
          font-size: 16px;
          font-weight: 800;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .product-choice-button:hover {
          transform: translateY(-2px);
        }
        .product-choice-button--website {
          background: #0f172a;
          color: #fff;
          box-shadow: 0 12px 26px rgba(15,23,42,0.18);
        }
        .product-choice-button--chatbot {
          background: #7c3aed;
          color: #fff;
          box-shadow: 0 12px 26px rgba(124,58,237,0.22);
        }
        .product-choice-divider {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .product-choice-divider::before {
          content: '';
          position: absolute;
          top: 30px;
          bottom: 30px;
          width: 1px;
          background: linear-gradient(180deg, rgba(148,163,184,0), rgba(148,163,184,0.34), rgba(148,163,184,0));
        }
        .product-choice-divider span {
          position: relative;
          z-index: 1;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #fff;
          border: 1px solid rgba(15,23,42,0.08);
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          box-shadow: 0 8px 20px rgba(15,23,42,0.08);
        }
        .product-decision-note {
          text-align: center;
          color: #64748b;
          font-size: 14px;
          margin-top: 18px;
        }
        .chatbotShowcaseSection {
          padding: 110px 24px;
          background: linear-gradient(180deg, #fcfbff 0%, #f4f7fb 100%);
        }
        .chatbotShowcaseLayout {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(340px, 0.98fr);
          gap: 36px;
          align-items: center;
        }
        .chatbotContentPanel {
          background: #fff;
          border-radius: 30px;
          border: 1px solid rgba(15,23,42,0.06);
          box-shadow: 0 26px 70px rgba(15,23,42,0.08);
          padding: 32px 30px;
        }
        .chatbotUseCaseGrid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }
        .chatbotUseCaseCard {
          border-radius: 18px;
          padding: 18px 12px;
          text-align: center;
          border: 1px solid rgba(15,23,42,0.05);
        }
        .chatbotFeatureList {
          display: grid;
          gap: 12px;
        }
        .chatbotFeatureItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid rgba(15,23,42,0.05);
          color: #334155;
          font-size: 15px;
          font-weight: 600;
        }
        .chatbotPreviewShell {
          position: relative;
          width: min(400px, 100%);
          max-width: 100%;
          isolation: isolate;
        }
        .chatbotPreviewGlow {
          position: absolute;
          right: -14px;
          top: 38px;
          width: 148px;
          height: 148px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,0.16), rgba(99,102,241,0));
          filter: blur(8px);
          pointer-events: none;
        }
        .chatbotScheduleCard {
          position: absolute;
          left: -26px;
          bottom: 28px;
          width: 132px;
          border-radius: 20px;
          background: #fff;
          box-shadow: 0 18px 40px rgba(15,23,42,0.14);
          border: 1px solid rgba(15,23,42,0.07);
          padding: 14px;
          z-index: 3;
        }
        .chatbotScheduleLabel {
          font-size: 11px;
          font-weight: 800;
          color: #6d28d9;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .chatbotScheduleSlots {
          display: grid;
          gap: 8px;
        }
        .chatbotScheduleSlot {
          background: #f4f1ff;
          border-radius: 11px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 800;
          color: #43326d;
        }
        .chatbotWidgetMockup {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(15,23,42,0.08);
          box-shadow: 0 28px 72px rgba(2,6,23,0.17);
          z-index: 2;
        }
        .chatbotWidgetHeader {
          background: linear-gradient(135deg,#5b3df5,#1d4ed8);
          min-height: 76px;
          padding: 17px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chatbotWidgetAvatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: rgba(255,255,255,0.16);
          display: grid;
          place-items: center;
          color: #fff;
          font-size: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
          flex: 0 0 auto;
        }
        .chatbotWidgetTitleGroup {
          min-width: 0;
        }
        .chatbotWidgetTitle {
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          line-height: 1.2;
        }
        .chatbotWidgetSubtitle {
          color: rgba(255,255,255,0.78);
          font-size: 11px;
          margin-top: 2px;
        }
        .chatbotWidgetStatus {
          margin-left: auto;
          background: rgba(255,255,255,0.16);
          color: #fff;
          border-radius: 999px;
          padding: 6px 11px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
        }
        .chatbotWidgetClose {
          width: 31px;
          height: 31px;
          border: none;
          border-radius: 999px;
          background: rgba(255,255,255,0.15);
          color: #fff;
          display: grid;
          place-items: center;
          padding: 0;
          flex: 0 0 auto;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.12),
            0 10px 24px rgba(15,23,42,0.12);
        }
        .chatbotWidgetClose svg {
          width: 15px;
          height: 15px;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .chatbotWidgetBody {
          min-height: 250px;
          padding: 18px 16px 20px;
          background: linear-gradient(180deg, #fbfdff 0%, #fff 100%);
        }
        .chatbotMessageList {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 212px;
        }
        .chatbotMessageRow {
          display: flex;
        }
        .chatbotMessageRow.isUser {
          justify-content: flex-end;
        }
        .chatbotMessageRow.isBot {
          justify-content: flex-start;
        }
        .chatbotMessageBubble {
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .chatbotMessageBubble.isUser {
          max-width: 68%;
          padding: 11px 14px;
          border-radius: 16px 16px 6px 16px;
          background: linear-gradient(135deg,#2352e8,#1d4ed8);
          color: #fff;
          box-shadow: 0 8px 18px rgba(29,78,216,0.2);
        }
        .chatbotMessageBubble.isBot {
          max-width: 78%;
          padding: 10px 12px;
          border-radius: 16px 16px 16px 6px;
          background: #f3f4f6;
          color: #111827;
        }
        .chatbotWidgetFooter {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px 16px;
          border-top: 1px solid rgba(15,23,42,0.07);
          background: rgba(255,255,255,0.98);
        }
        .chatbotWidgetInput {
          flex: 1;
          min-width: 0;
          min-height: 46px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid rgba(15,23,42,0.11);
          background: #fff;
          color: #7b8494;
          font-size: 13px;
          box-shadow: inset 0 1px 2px rgba(15,23,42,0.04);
        }
        .chatbotWidgetSend {
          width: 46px;
          height: 46px;
          border: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          padding: 0;
          background: linear-gradient(135deg,#2352e8,#1d4ed8);
          color: #fff;
          box-shadow: 0 12px 22px rgba(29,78,216,0.22);
        }
        .chatbotWidgetSend svg {
          width: 18px;
          height: 18px;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        @media (max-width: 700px) {
          .hero-grid { flex-direction: column !important }
          .solutionsSection {
            padding: 0 0 84px;
          }
          .solutionsCurve {
            width: calc(100vw - 20px);
            border-radius: 56px 56px 0 0;
          }
          .solutionsIntro {
            margin-bottom: 44px;
          }
          .solutionsGrid {
            grid-template-columns: 1fr !important;
            gap: 18px;
          }
          .solutionsCard {
            border-radius: 26px !important;
          }
          .solutionsFooter {
            margin-top: 42px;
          }
          .product-grid { grid-template-columns: 1fr !important }
          .use-case-grid { grid-template-columns: 1fr 1fr !important }
          .product-choice-card {
            padding: 28px 22px;
            gap: 22px;
          }
          .product-choice-head h3 {
            font-size: 24px;
          }
          .product-choice-subtitle,
          .product-choice-list li {
            font-size: 15px;
          }
        }
        @media (max-width: 900px) {
          .solutionsSection {
            padding: 0 0 92px;
          }
          .solutionsCurve {
            width: calc(100vw - 28px);
            border-radius: 34vw 34vw 0 0;
          }
          .solutionsGrid {
            gap: 22px;
          }
          .product-decision-shell {
            grid-template-columns: 1fr;
          }
          .product-choice-divider {
            min-height: 70px;
          }
          .product-choice-divider::before {
            top: 50%;
            left: 26px;
            right: 26px;
            bottom: auto;
            width: auto;
            height: 1px;
            background: linear-gradient(90deg, rgba(148,163,184,0), rgba(148,163,184,0.34), rgba(148,163,184,0));
          }
          .chatbotShowcaseSection {
            padding: 86px 20px;
          }
          .chatbotShowcaseLayout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .chatbotContentPanel {
            padding: 26px 22px;
          }
        }
        @media (max-width: 520px) {
          .chatbotShowcaseSection {
            padding: 76px 16px;
          }
          .chatbotUseCaseGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-bottom: 22px;
          }
          .chatbotUseCaseCard {
            border-radius: 14px;
            padding: 14px 8px;
          }
          .chatbotFeatureItem {
            align-items: flex-start;
            padding: 12px;
            font-size: 14px;
          }
          .chatbotPreviewShell {
            width: min(100%, 360px);
            padding-bottom: 34px;
          }
          .chatbotPreviewGlow {
            display: none;
          }
          .chatbotScheduleCard {
            left: 12px;
            bottom: 0;
            width: 118px;
            border-radius: 16px;
            padding: 10px;
          }
          .chatbotScheduleLabel {
            font-size: 10px;
            margin-bottom: 8px;
          }
          .chatbotScheduleSlot {
            border-radius: 9px;
            padding: 7px 8px;
            font-size: 11px;
          }
          .chatbotWidgetMockup {
            border-radius: 22px;
          }
          .chatbotWidgetHeader {
            padding: 16px;
            gap: 10px;
          }
          .chatbotWidgetAvatar {
            width: 36px;
            height: 36px;
            border-radius: 12px;
            font-size: 16px;
          }
          .chatbotWidgetStatus {
            padding: 5px 9px;
            font-size: 9px;
          }
          .chatbotWidgetBody {
            padding: 16px 14px 14px;
          }
          .chatbotMessageList {
            min-height: 190px;
            gap: 9px;
          }
          .chatbotMessageBubble.isUser,
          .chatbotMessageBubble.isBot {
            max-width: 82%;
            font-size: 11px;
          }
          .chatbotWidgetFooter {
            gap: 8px;
            padding: 12px 14px 14px;
          }
          .chatbotWidgetInput {
            min-height: 43px;
            padding: 0 13px;
            font-size: 12px;
          }
          .chatbotWidgetSend {
            width: 43px;
            height: 43px;
          }
        }
      `}</style>

      <main lang={language}>
        {/* ── HERO ───────────────────────────────────────── */}
        <section className="page" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div className="hero-grid" style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
            {/* left text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              

              <h1 style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 900, lineHeight: 1.05,
                letterSpacing: -1.5, marginBottom: 20,
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.1s',
              }}>
                <span style={{ display: 'block' }}>{text.heroTitleStart}</span>
                {text.heroTitleMiddle}<br />
                <span style={{ color: '#1A6BFF' }}>{text.heroTitleEnd}</span>
              </h1>

              <p style={{
                fontSize: 18, lineHeight: 1.7, color: '#555', marginBottom: 36, maxWidth: 440,
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.2s',
              }}>
                {text.heroBody}
              </p>

              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap',
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.3s',
              }}>
                <Link href="/landings/guest/websites" className="cta-primary">
                  {text.heroWebsiteCta} <ArrowRight />
                </Link>
                <Link href="/landings/auth/chatWidget" className="cta-secondary">
                  {text.heroChatbotCta}
                </Link>
              </div>

              <div style={{
                display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap',
                opacity: heroMounted ? 1 : 0, transition: 'all 0.7s ease 0.4s',
              }}>
                {text.heroBenefits.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#777' }}>
                    <CheckIcon /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* right visuals */}
            <div style={{
              flex: '0 0 auto', position: 'relative', height: 'clamp(300px, 55vw, 380px)', width: 'min(100%, 360px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateX(30px)',
              transition: 'all 0.8s ease 0.2s',
            }}>
              <div className="float-b" style={{ position: 'absolute', bottom: 20, left: 0, transform: 'scale(0.85)' }}>
                <ChatWidgetPreview language={language} />
              </div>
            </div>
          </div>
        </section>

{/* ── PREMIER PRODUCT SELECTION ───────────────────────────────────── */}
<section id="solutions" className="solutionsSection">
  <div className="solutionsCurve">
    <div className="solutionsGlow" />

    <div className="page solutionsShell" style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto', padding: '0 24px' }}>
    
    <Reveal>
      <div className="solutionsIntro" style={{ textAlign: 'center', marginBottom: '100px' }}>
        
        <h2 style={{ 
          fontSize: 'clamp(42px, 6vw, 72px)', 
          fontWeight: 900, 
          letterSpacing: '-0.05em', 
          color: '#F8FAFC',
          lineHeight: 1.02,
          marginBottom: '22px',
          maxWidth: '12ch',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {text.productTitleStart} <br/> 
          {language === 'no' ? (
            <>
              <span style={{ color: '#6366f1' }}>Chatboten</span> {text.productTitleEnd}
            </>
          ) : (
            <>
              The <span style={{ color: '#6366f1' }}>chatbot</span> {text.productTitleEnd}
            </>
          )}
        </h2>
        <p style={{
          maxWidth: '760px',
          margin: '0 auto',
          color: 'rgba(226, 232, 240, 0.76)',
          fontSize: 'clamp(15px, 1.5vw, 18px)',
          lineHeight: 1.75,
        }}>
          {text.togetherLead} <span style={{ color: '#fff', fontWeight: 700 }}>{text.togetherStrong}</span>
        </p>
      </div>
    </Reveal>

    <div className="solutionsGrid" style={{
      display: 'grid', 
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: '40px',
      perspective: '1000px'
    }}>
      
      {/* OPTION A: MANAGED WEBSITE SERVICE */}
      <Reveal delay={100}>
        <div className="product-card-group solutionsCard solutionsCard--website" style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.035) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          borderRadius: '40px',
          padding: '52px 44px',
          transition: 'all 0.5s cubic-bezier(0.2, 1, 0.3, 1)',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
        >
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '24px', 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #DCE7FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '34px',
            boxShadow: '0 20px 40px rgba(15,23,42,0.18)'
          }}>
            <GlobeIcon size={38} color="#000" />
          </div>

          <h3 style={{ color: '#F8FAFC', fontSize: 'clamp(26px, 2.2vw, 32px)', fontWeight: 800, lineHeight: 1.08, marginBottom: '16px' }}>{text.websiteCardTitle}</h3>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: '1.75', marginBottom: '30px' }}>
            {text.websiteCardBody}
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 38px 0', flexGrow: 1 }}>
            {text.websiteCardFeatures.map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d8e2ef', marginBottom: '14px', fontSize: '15px', lineHeight: 1.5 }}>
                <div style={{ color: '#6366f1' }}><CheckIcon size={18} /></div> {item}
              </li>
            ))}
          </ul>

          <Link href="/landings/guest/websites" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E8EEF9 100%)',
            color: '#0f172a',
            height: '70px',
            borderRadius: '20px',
            fontWeight: '800',
            fontSize: '18px',
            textDecoration: 'none',
            transition: '0.3s'
          }}>
            {text.websiteCardCta} <ArrowRight size={20} />
          </Link>
        </div>
      </Reveal>

      {/* OPTION B: AUTOMATED CHATBOT */}
      <Reveal delay={300}>
        <div className="solutionsCard solutionsCard--chatbot" style={{
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.17) 0%, rgba(12, 17, 29, 0.22) 100%)',
          border: '1px solid rgba(129, 140, 248, 0.24)',
          borderRadius: '40px',
          padding: '52px 44px',
          transition: 'all 0.5s cubic-bezier(0.2, 1, 0.3, 1)',
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(99, 102, 241, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }}
        >
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '24px', 
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '34px'
          }}>
            <BotIcon size={38} color="#fff" />
          </div>

          <h3 style={{ color: '#F8FAFC', fontSize: 'clamp(26px, 2.2vw, 32px)', fontWeight: 800, lineHeight: 1.08, marginBottom: '16px' }}>{text.chatbotCardTitle}</h3>
          <p style={{ color: '#cbd5e1', fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: '1.75', marginBottom: '30px' }}>
            {text.chatbotCardBody}
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 38px 0', flexGrow: 1 }}>
            {text.chatbotCardFeatures.map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#d8e2ef', marginBottom: '14px', fontSize: '15px', lineHeight: 1.5 }}>
                <div style={{ color: '#a855f7' }}><CheckIcon size={18} /></div> {item}
              </li>
            ))}
          </ul>

          <Link href="/landings/auth/chatWidget" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '12px',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            color: '#fff',
            height: '70px',
            borderRadius: '20px',
            fontWeight: '800',
            fontSize: '18px',
            textDecoration: 'none',
            transition: '0.3s'
          }}>
            {text.chatbotCardCta} <ArrowRight size={20} />
          </Link>
          
          <div style={{
            position: 'absolute',
            top: '30px',
            right: '30px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '6px 14px',
            borderRadius: '100px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#fff',
            textTransform: 'uppercase',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>{text.selfService}</div>
        </div>
      </Reveal>
    </div>

    <Reveal delay={500}>
      <div className="solutionsFooter" style={{
        marginTop: '68px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.04)',
        padding: '24px',
        borderRadius: '24px',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        maxWidth: 'fit-content',
        margin: '68px auto 0 auto'
      }}>
        <p style={{ margin: 0, color: '#cbd5e1', fontWeight: 500 }}>
          {text.togetherLead} <span style={{ color: '#fff' }}>{text.togetherStrong}</span>
        </p>
      </div>
    </Reveal>
  </div>
  </div>
</section>

        {/* ── WEBSITE SHOWCASE CAROUSEL ──────────────────── */}
        <section style={{ background: '#111', padding: '80px 0', overflow: 'hidden' }}>
          <Reveal>
            <div className="page">
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', color: '#fff', fontWeight: 900, textAlign: 'center', letterSpacing: -0.8, marginBottom: 8 }}>
                {text.carouselTitle}
              </h2>
              <p style={{ textAlign: 'center', color: '#e0e0e0', fontSize: 16, marginBottom: 48 }}>
                {text.carouselBody}
              </p>
            </div>
          </Reveal>
          <WebsiteCarousel language={language} />
        </section>

        {/* ── CHATBOT SHOWCASE ──────────────────────────── */}
        <section
          id="chatbot"
          className="chatbotShowcaseSection"
        >
          <div className="page">
            <Reveal>
              <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 58px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: '#EFE7FF',
                  color: '#6D28D9',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  marginBottom: 16,
                }}>
                  <span>{text.chatbotCardTitle}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
                  <span>{text.alwaysOn}</span>
                </div>
                <h2 style={{ fontSize: 'clamp(30px,4vw,46px)', fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>
                  {text.chatbotShowcaseTitle}
                </h2>
                <p style={{ color: '#5B6472', fontSize: 17, lineHeight: 1.8 }}>
                  {text.chatbotShowcaseBody}
                </p>
              </div>
            </Reveal>

            <div className="chatbotShowcaseLayout">
              <Reveal delay={0}>
                <div className="chatbotContentPanel">
                  <div className="chatbotUseCaseGrid">
                    {[
                      { icon: '🛒', label: text.useCases[0], color: '#EEF4FF' },
                      { icon: '🏨', label: text.useCases[1], color: '#FFF4EE' },
                      { icon: '🏥', label: text.useCases[2], color: '#EEFAF4' },
                      { icon: '✂️', label: text.useCases[3], color: '#FDF0F8' },
                      { icon: '🎓', label: text.useCases[4], color: '#F5F0FF' },
                      { icon: '🏢', label: text.useCases[5], color: '#F5F5F5' },
                    ].map(({ icon, label, color }) => (
                      <div
                        key={label}
                        className="chatbotUseCaseCard"
                        style={{
                          background: color,
                        }}
                      >
                        <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#1F2937' }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: 22 }}>
                    <div>
                      <h3 style={{ fontSize: 'clamp(26px,3vw,34px)', fontWeight: 900, letterSpacing: -0.7, marginBottom: 12 }}>
                        {text.chatbotFeatureTitle}
                      </h3>
                      <p style={{ color: '#5B6472', fontSize: 16, lineHeight: 1.8 }}>
                        {text.chatbotFeatureBody}
                      </p>
                    </div>

                    <div className="chatbotFeatureList">
                      {[
                        ...text.chatbotFeatures,
                      ].map((item) => (
                        <div
                          key={item}
                          className="chatbotFeatureItem"
                        >
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#7C3AED', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <CheckIcon />
                          </div>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={160}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <ChatbotShowcasePreview language={language} />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── PRICING TEASER ─────────────────────────────── */}
        <section id="priser" style={{ background: '#111', padding: '80px 24px' }}>
          <div className="page">
            <Reveal>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', color: '#fff', letterSpacing: -0.8, marginBottom: 16 }}>
                {text.pricingTitle}
              </h2>
              <p style={{ textAlign: 'center', color: '#999', fontSize: 16, marginBottom: 56, maxWidth: 480, margin: '0 auto 56px' }}>
                {text.pricingBody}
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
              {[
                ...text.pricingCards,
              ].map(({ label, from, desc, color }) => (
                <Reveal key={label} delay={100}>
                  <div style={{
                    background: '#1A1A1A', borderRadius: 20, padding: '28px 24px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>{text.from}</span>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{from === '0' ? text.free : `${from} kr`}</span>
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{desc}</div>
                    <div style={{ height: 3, borderRadius: 2, background: color }} />
                  </div>
                </Reveal>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/landings/guest/websites" className="cta-primary" style={{ background: '#fff', color: '#111' }}>
                {text.pricingCta} <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        <section className="page" style={{ padding: '100px 24px', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 64, marginBottom: 24 }}>👋</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>
              {text.bottomTitle}
            </h2>
            <p style={{ color: '#666', fontSize: 17, marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
              {text.bottomBody}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/landings/guest/websites" className="cta-primary">
                {text.bottomWebsiteCta} <ArrowRight />
              </Link>
              <Link href="/landings/auth/chatWidget" className="cta-secondary">
                {text.bottomChatbotCta}
              </Link>
            </div>
          </Reveal>
        </section>

        <section id="contact" style={{ background: '#F7F8FA', borderTop: '1px solid #ECEEF2', borderBottom: '1px solid #ECEEF2' }}>
          <div className="page" style={{ padding: '72px 24px' }}>
            <Reveal>
              <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 999, background: '#E8F0FF', color: '#1A6BFF', fontSize: 12, fontWeight: 800, letterSpacing: 0.5, marginBottom: 18 }}>
                  {text.contactEyebrow}
                </div>
                <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: -0.9, marginBottom: 14 }}>
                  {text.contactTitle}
                </h2>
                <p style={{ color: '#5B6472', fontSize: 17, lineHeight: 1.8, marginBottom: 34 }}>
                  {text.contactBody}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left' }}>
                  <a
                    href={emailHref}
                    style={{ background: '#fff', borderRadius: 18, padding: '22px 20px', textDecoration: 'none', color: '#111', border: '1px solid #E6EAF0', boxShadow: '0 12px 28px rgba(15,23,42,0.06)' }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1A6BFF', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{text.email}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{siteConfig.contact.email}</div>
                    <div style={{ color: '#5B6472', fontSize: 14, lineHeight: 1.6 }}>{text.emailDescription}</div>
                  </a>
                  {phoneHref ? (
                    <a
                      href={phoneHref}
                      style={{ background: '#fff', borderRadius: 18, padding: '22px 20px', textDecoration: 'none', color: '#111', border: '1px solid #E6EAF0', boxShadow: '0 12px 28px rgba(15,23,42,0.06)' }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0C9E6A', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{text.phone}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{siteConfig.contact.phoneDisplay}</div>
                      <div style={{ color: '#5B6472', fontSize: 14, lineHeight: 1.6 }}>{text.phoneDescription}</div>
                    </a>
                  ) : null}
                  <a
                    href={siteConfig.url}
                    style={{ background: '#fff', borderRadius: 18, padding: '22px 20px', textDecoration: 'none', color: '#111', border: '1px solid #E6EAF0', boxShadow: '0 12px 28px rgba(15,23,42,0.06)' }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{text.websiteCardTitle}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>chat.vintrastudio.com</div>
                    <div style={{ color: '#5B6472', fontSize: 14, lineHeight: 1.6 }}>{text.websiteDescription}</div>
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid #F0F0F0', padding: '32px 24px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 18 }}>vintra</span>
            <span style={{ color: '#999', fontSize: 13 }}>© {currentYear} Vintra. {text.footerRights}</span>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <a href={emailHref} style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{siteConfig.contact.email}</a>
              {phoneHref ? (
                <a href={phoneHref} style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{siteConfig.contact.phoneDisplay}</a>
              ) : null}
              <a href="#contact" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{text.contact}</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

