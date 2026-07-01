'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { VintraLanguage as Language } from '@/lib/i18n'
import { mainLandingCopy } from './i18n'
// --- Minimal inline SVG icons -----------------------------------------------
export const GlobeIcon = ({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
export const BotIcon = ({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M9 13h.01M15 13h.01M8 8V6a4 4 0 0 1 8 0v2" />
    <path d="M12 3v2" />
  </svg>
)
export const ArrowRight = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)
export const CheckIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)
// --- Website mockup illustrations -------------------------------------------
const websites = [
  {
    label: 'Restaurant',
    color: '#E85D26',
    accent: '#FFF4EE',
    lines: ['Smakenes Hus', 'Moderne norsk mat', 'Topprangert'],
    img: 'R',
  },
  {
    label: 'Portfolio',
    color: '#1A6BFF',
    accent: '#EEF4FF',
    lines: ['North Studio', 'Brand & web design', 'Se arbeid ->'],
    img: 'P',
  },
  {
    label: 'Nettbutikk',
    color: '#0C9E6A',
    accent: '#EEFAF4',
    lines: ['Nordic Retail', 'Fri frakt over 499kr', 'Handl na ->'],
    img: 'S',
  },
  {
    label: 'Startup',
    color: '#7C3AED',
    accent: '#F5F0FF',
    lines: ['Growth Labs', 'Fra ide til første salg', 'Book demo ->'],
    img: 'A',
  },
  {
    label: 'Frisor / Spa',
    color: '#D4449A',
    accent: '#FDF0F8',
    lines: ['Bloom Studio', 'Book din time', 'Bestill na ->'],
    img: 'F',
  },
  {
    label: 'Bedrift',
    color: '#1E3A5F',
    accent: '#EFF3F8',
    lines: ['Nordvest AS', 'Palitelig siden 1998', 'Kontakt oss ->'],
    img: 'B',
  },
]
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
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18 }}>?</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 10, fontWeight: 800, letterSpacing: 1.4, textTransform: 'uppercase' }}>{text.eyebrow}</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>North Studio</div>
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
  } else if (site.label === 'Frisï¿½r / Spa') {
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

// --- Chat widget preview -----------------------------------------------------

export function ChatWidgetPreview({ language }: { language: Language }) {
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
        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.18)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>?</div>
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

// --- Scroll reveal hook ------------------------------------------------------

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

// --- Slide-in section wrapper ------------------------------------------------

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// --- Auto showcase carousel --------------------------------------------------

export function WebsiteCarousel({ language }: { language: Language }) {
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
    </div>
  )
}

export function ChatbotShowcasePreview({ language }: { language: Language }) {
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
            ?
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

export function createHeroParticles(count: number, variant: 'star' | 'mote') {
  const nextRandom = (seed: number) => {
    const value = Math.sin(seed * 9301 + 49297) * 233280
    return value - Math.floor(value)
  }
  const fixed = (value: number, precision = 4) => Number(value.toFixed(precision))
  const percent = (value: number) => `${fixed(value, 6)}%`
  const pixels = (value: number) => `${fixed(value, 4)}px`
  const seconds = (value: number) => `${fixed(value, 6)}s`

  return Array.from({ length: count }, (_, index) => ({
    id: `${variant}-${index}`,
    left: percent(nextRandom(index + 1) * 100),
    top: percent(nextRandom(index + 101) * 78),
    size: pixels(variant === 'star' ? 1 + nextRandom(index + 201) * 3.4 : 18 + nextRandom(index + 201) * 42),
    delay: seconds(nextRandom(index + 301) * 8),
    duration: seconds(3.4 + nextRandom(index + 401) * 5.6),
    opacity: fixed(variant === 'star' ? 0.35 + nextRandom(index + 501) * 0.65 : 0.18 + nextRandom(index + 501) * 0.34, 6),
  }))
}
