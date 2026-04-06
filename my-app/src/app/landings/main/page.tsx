'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { WebsiteShowcaseModal } from './website-showcases'

// ─── Minimal inline SVG icons ───────────────────────────────────────────────

const GlobeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const BotIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="8" width="18" height="12" rx="3" />
    <path d="M9 13h.01M15 13h.01M8 8V6a4 4 0 0 1 8 0v2" />
    <path d="M12 3v2" />
  </svg>
)

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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

// ─── Chat widget preview ─────────────────────────────────────────────────────

function ChatWidgetPreview() {
  const messages = [
    { from: 'bot', text: 'Hi! How can I help you today? 👋' },
    { from: 'user', text: 'What are your opening hours?' },
    { from: 'bot', text: 'We are open Monday-Friday 9am-6pm, and Saturday 10am-4pm.' },
  ]
  return (
    <div style={{
      width: 280,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      border: '1px solid rgba(0,0,0,0.08)',
      background: '#fff',
    }}>
      <div style={{ background: 'linear-gradient(135deg,#1A6BFF,#7C3AED)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Vintra-bot</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>Online now</div>
        </div>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#4EE880' }} />
      </div>
      <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              background: m.from === 'user' ? '#1A6BFF' : '#F3F4F6',
              color: m.from === 'user' ? '#fff' : '#111',
              borderRadius: m.from === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '8px 12px',
              fontSize: 12,
              maxWidth: '80%',
              lineHeight: 1.4,
            }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 10px 10px', display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, height: 34, border: '1px solid #E0E0E0', borderRadius: 20, background: '#F9F9F9', display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
          <span style={{ fontSize: 11, color: '#999' }}>Type a message...</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1A6BFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" fill="none" /></svg>
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

// ─── Infinite carousel ───────────────────────────────────────────────────────

function WebsiteCarousel({ setSelectedLabel }: { setSelectedLabel: (label: string) => void }) {
  const doubled = [...websites, ...websites]
  return (
    <div style={{ overflow: 'hidden', position: 'relative', padding: '20px 0' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, var(--bg), transparent)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, var(--bg), transparent)', zIndex: 1, pointerEvents: 'none' }} />
      <style>{`
        @keyframes scroll-left {
          from { transform: translateX(0) }
          to   { transform: translateX(-50%) }
        }
        .carousel-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: scroll-left 30s linear infinite;
        }
        .carousel-track:hover { animation-play-state: paused }
      `}</style>
      <div className="carousel-track">
        {doubled.map((site, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedLabel(site.label)}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <MiniSiteMockup site={site} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pricing badge ───────────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color,
      color: '#fff',
      borderRadius: 20,
      padding: '3px 12px',
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.3,
    }}>{children}</span>
  )
}

// ─── Feature row ─────────────────────────────────────────────────────────────

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  )
}

export default function MainLanding() {
  const [heroMounted, setHeroMounted] = useState(false)
  const [selectedSite, setSelectedSite] = useState<typeof websites[0] | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  useEffect(() => { setTimeout(() => setHeroMounted(true), 80) }, [])

  const handleSiteClick = (site: typeof websites[0]) => {
    setSelectedSite(site)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedSite(null)
  }

  return (
    <>
      <style>{`
        :root { --bg: #FAFAFA; }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { background: var(--bg); font-family: -apple-system, 'Helvetica Neue', sans-serif; color: #111 }
        .page { max-width: 1100px; margin: 0 auto; padding: 0 24px }
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
        .float-a { animation: float-slow 6s ease-in-out infinite }
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
          border-radius: 24px; padding: 40px 36px;
          border: 1px solid rgba(0,0,0,0.07);
          background: #fff;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 24px 64px rgba(0,0,0,0.12) }
        @media (max-width: 700px) {
          .hero-grid { flex-direction: column !important }
          .product-grid { grid-template-columns: 1fr !important }
          .use-case-grid { grid-template-columns: 1fr 1fr !important }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid #F0F0F0', background: '#fff', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div className="page" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 32 }}>
          <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>vintra</span>
          <nav style={{ display: 'flex', gap: 28, marginLeft: 'auto' }}>
            <a href="#websites" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Websites</a>
            <a href="#chatbot" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Chatbot</a>
            <a href="#pricing" style={{ fontSize: 14, color: '#555', textDecoration: 'none' }}>Pricing</a>
          </nav>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: '#111', textDecoration: 'none', border: '1.5px solid #E0E0E0', borderRadius: 999, padding: '6px 16px' }}>Log in</Link>
        </div>
      </header>

      <main>
        {/* ── HERO ───────────────────────────────────────── */}
        <section className="page" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <div className="hero-grid" style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
            {/* left text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#EEF4FF', borderRadius: 999, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, color: '#1A6BFF', marginBottom: 24,
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(10px)',
                transition: 'all 0.5s ease',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1A6BFF', display: 'inline-block' }} />
                No account needed to try
              </div>

              <h1 style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 900, lineHeight: 1.05,
                letterSpacing: -1.5, marginBottom: 20,
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.1s',
              }}>
                Your website.<br />
                Your chatbot.<br />
                <span style={{ color: '#1A6BFF' }}>Your way.</span>
              </h1>

              <p style={{
                fontSize: 18, lineHeight: 1.7, color: '#555', marginBottom: 36, maxWidth: 440,
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.2s',
              }}>
                Start free. No registration. See the result before you decide.
              </p>

              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap',
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.3s',
              }}>
                <Link href="/landings/guest/websites" className="cta-primary">
                  Try website builder <ArrowRight />
                </Link>
                <Link href="/landings/guest/chatWidget" className="cta-secondary">
                  Test chatbot for free
                </Link>
              </div>

              <div style={{
                display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap',
                opacity: heroMounted ? 1 : 0, transition: 'all 0.7s ease 0.4s',
              }}>
                {['No credit card', 'No account', 'Instant prices'].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#777' }}>
                    <CheckIcon /> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* right visuals */}
            <div style={{
              flex: '0 0 auto', position: 'relative', height: 380, width: 320,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateX(30px)',
              transition: 'all 0.8s ease 0.2s',
            }}>
              <div className="float-a" style={{ position: 'absolute', top: 20, right: 0 }}>
                <MiniSiteMockup site={websites[1]} />
              </div>
              <div className="float-b" style={{ position: 'absolute', bottom: 20, left: 0, transform: 'scale(0.85)' }}>
                <ChatWidgetPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── PRODUCTS ───────────────────────────────────── */}
        <section id="websites" style={{ 
          paddingBottom: 100, 
          background: 'linear-gradient(to bottom, #F0F0F0 0%, #FAFAFA 100%)',
          borderRadius: '50% 50% 0 0',
          margin: 0,
          padding: '100px 0 100px 0',
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'
        }}>
          <div className="page" style={{ position: 'relative', zIndex: 1 }}>
            <Reveal>
              <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, textAlign: 'center', letterSpacing: -1, marginBottom: 16 }}>
                Two products. Endless possibilities.
              </h2>
              <p style={{ textAlign: 'center', color: '#666', fontSize: 17, marginBottom: 56, maxWidth: 500, margin: '0 auto 56px' }}>
                Start free. No registration. See the result before you decide.
              </p>
            </Reveal>

            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Website card */}
              <Reveal delay={0}>
                <div className="product-card" style={{ borderTop: '4px solid #1A6BFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#EEF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A6BFF' }}>
                      <GlobeIcon />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 22, fontWeight: 900 }}>Website</h3>
                      <span style={{ fontSize: 13, color: '#888' }}>Customized for you</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
                    Draw up your dream website with our visual builder. Choose from dozens of design elements, see approximate prices in real time, and customize everything — from colors to features.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {[
                      ['🎨', 'Visual designer', 'Drag-and-drop, no code'],
                      ['💰', 'Price estimate', 'See what it costs along the way'],
                      ['📱', 'Mobile optimized', 'Looks great on all screens'],
                      ['🔧', 'Customization', 'We build what you dream of'],
                    ].map(([icon, title, desc]) => (
                      <FeatureRow key={title} icon={icon} title={title} desc={desc} />
                    ))}
                  </div>
                  <Link href="/landings/guest/websites" className="cta-primary" style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                    Design your website <ArrowRight />
                  </Link>
                </div>
              </Reveal>

              {/* Chatbot card */}
              <Reveal delay={120}>
                <div className="product-card" style={{ borderTop: '4px solid #7C3AED' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F5F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
                      <BotIcon />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 22, fontWeight: 900 }}>AI Chatbot</h3>
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        <Badge color="#0C9E6A">Free to start</Badge>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 28 }}>
                    Design your own chatbot and see it in action — completely free. Customize appearance, personality, and responses. Embed on your website with one line of code.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                    {[
                      ['✨', 'Customize everything', 'Colors, name, avatar and tone'],
                      ['🆓', 'Free from start', 'Try all features without card'],
                      ['⚡', 'Live preview', 'See changes instantly'],
                      ['🔌', 'Easy integration', 'One line of code to your website'],
                    ].map(([icon, title, desc]) => (
                      <FeatureRow key={title} icon={icon} title={title} desc={desc} />
                    ))}
                  </div>
                  <Link href="/landings/guest/chatWidget" className="cta-primary" style={{ display: 'flex', width: '100%', justifyContent: 'center', background: '#7C3AED' }}>
                    Design your chatbot <ArrowRight />
                  </Link>
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
                Websites for all industries
              </h2>
              <p style={{ textAlign: 'center', color: '#e0e0e0', fontSize: 16, marginBottom: 48 }}>
                Hover to pause — see what's possible
              </p>
            </div>
          </Reveal>
          <WebsiteCarousel setSelectedLabel={setSelectedLabel} />
        </section>

        {/* ── USE CASES ──────────────────────────────────── */}
        <section id="chatbot" className="page" style={{ padding: '100px 24px' }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', letterSpacing: -0.8, marginBottom: 56 }}>
              The chatbot that never sleeps
            </h2>
          </Reveal>

          <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>
            <Reveal delay={0} className="">
              <div style={{ flex: 1, minWidth: 280 }}>
                <div className="use-case-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  {[
                    { icon: '🛒', label: 'E-commerce', color: '#EEF4FF' },
                    { icon: '🏨', label: 'Hotel', color: '#FFF4EE' },
                    { icon: '🏥', label: 'Clinic', color: '#EEFAF4' },
                    { icon: '✂️', label: 'Salon', color: '#FDF0F8' },
                    { icon: '🎓', label: 'Course', color: '#F5F0FF' },
                    { icon: '🏢', label: 'Business', color: '#F5F5F5' },
                  ].map(({ icon, label, color }) => (
                    <div key={label} style={{
                      background: color, borderRadius: 16,
                      padding: '20px 12px', textAlign: 'center',
                      border: '1px solid rgba(0,0,0,0.06)',
                      transition: 'transform 0.2s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h3 style={{ fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 16 }}>
                  Answer questions.<br />Book appointments. Sell more.
                </h3>
                <p style={{ color: '#555', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
                  Our AI chatbot learns about your business and answers your customers 24/7. You set the rules — we take care of the rest.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    'Answer common questions automatically',
                    'Book appointments and meetings directly in chat',
                    'Direct traffic to the right page or person',
                    'Integrate with existing tools',
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#444' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckIcon />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={300}>
              <ChatWidgetPreview />
            </Reveal>
          </div>
        </section>

        {/* ── PRICING TEASER ─────────────────────────────── */}
        <section id="priser" style={{ background: '#111', padding: '80px 24px' }}>
          <div className="page">
            <Reveal>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,40px)', fontWeight: 900, textAlign: 'center', color: '#fff', letterSpacing: -0.8, marginBottom: 16 }}>
                Transparent prices. No surprises.
              </h2>
              <p style={{ textAlign: 'center', color: '#999', fontSize: 16, marginBottom: 56, maxWidth: 480, margin: '0 auto 56px' }}>
                Use our free calculator and see exactly what your solution costs — before you decide.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
              {[
                { label: 'Simple website', from: '2 990', desc: 'Personal / CV / Portfolio', color: '#1A6BFF' },
                { label: 'Business website', from: '6 490', desc: 'Professional profile + contact form', color: '#0C9E6A' },
                { label: 'Chatbot', from: '0', desc: 'Free to start — scale as needed', color: '#7C3AED' },
              ].map(({ label, from, desc, color }) => (
                <Reveal key={label} delay={100}>
                  <div style={{
                    background: '#1A1A1A', borderRadius: 20, padding: '28px 24px',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>from</span>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{from === '0' ? 'Free' : `${from} kr`}</span>
                    </div>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{desc}</div>
                    <div style={{ height: 3, borderRadius: 2, background: color }} />
                  </div>
                </Reveal>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link href="/landings/guest/websites" className="cta-primary" style={{ background: '#fff', color: '#111' }}>
                Calculate your price now <ArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        <section className="page" style={{ padding: '100px 24px', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 64, marginBottom: 24 }}>👋</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>
              Ready to try?
            </h2>
            <p style={{ color: '#666', fontSize: 17, marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
              Start today — completely free, no card, no account. See what we can create for you.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/landings/guest/websites" className="cta-primary">
                Design website <ArrowRight />
              </Link>
              <Link href="/landings/guest/chatWidget" className="cta-secondary">
                Test chatbot
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid #F0F0F0', padding: '32px 24px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 18 }}>vintra</span>
            <span style={{ color: '#999', fontSize: 13 }}>© 2024 Vintra. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Privacy</a>
              <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Terms</a>
              <a href="#" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>Contact</a>
            </div>
          </div>
        </footer>

        {/* ── WEBSITE SHOWCASE MODAL ─────────────────────────────── */}
        {selectedLabel && (
          <WebsiteShowcaseModal 
            label={selectedLabel} 
            onClose={() => setSelectedLabel(null)} 
          />
        )}
      </main>
    </>
  )
}