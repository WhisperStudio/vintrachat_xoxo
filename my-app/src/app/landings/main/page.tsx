'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useVintraLanguage } from '@/lib/i18n'
import { mainLandingCopy } from './i18n'
import {
  MAIN_LANDING_THEME_EVENT,
  type MainLandingThemeMode,
  resolveMainLandingThemePreference,
} from '@/lib/main-landing-theme'
import { absoluteUrl, siteConfig } from '@/lib/site-config'

import './page.css'
import {
  ArrowRight,
  BotIcon,
  ChatbotShowcasePreview,
  ChatWidgetPreview,
  CheckIcon,
  GlobeIcon,
  Reveal,
  WebsiteCarousel,
  createHeroParticles,
} from './page-helpers'

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

export default function MainLanding() {
  const [heroMounted, setHeroMounted] = useState(false)
  const [heroSceneMode, setHeroSceneMode] = useState<MainLandingThemeMode>('night')
  const [nightStars] = useState(() => createHeroParticles(34, 'star'))
  const [solutionsProgress, setSolutionsProgress] = useState(0)
  const { language } = useVintraLanguage()
  const text = mainLandingCopy[language]
  const isNightTheme = heroSceneMode === 'night'
  const solutionsTitleColor = isNightTheme ? '#f8fafc' : '#24384c'
  const solutionsAccentColor = isNightTheme ? '#6366f1' : '#e58a3a'
  const solutionsCopyColor = isNightTheme ? 'rgba(226, 232, 240, 0.76)' : 'rgba(62, 88, 112, 0.82)'
  const solutionsStrongColor = isNightTheme ? '#ffffff' : '#1f3347'

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroMounted(true), 80)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = () => setHeroSceneMode(resolveMainLandingThemePreference())
    const syncThemeFromEvent = (event: Event) => {
      const customEvent = event as CustomEvent<MainLandingThemeMode>
      if (customEvent.detail === 'night' || customEvent.detail === 'day') {
        setHeroSceneMode(customEvent.detail)
        return
      }
      syncTheme()
    }
    const syncThemeFromStorage = (event: StorageEvent) => {
      if (event.key) {
        syncTheme()
      }
    }
    syncTheme()
    media.addEventListener?.('change', syncTheme)
    window.addEventListener(MAIN_LANDING_THEME_EVENT, syncThemeFromEvent as EventListener)
    window.addEventListener('storage', syncThemeFromStorage)
    return () => {
      media.removeEventListener?.('change', syncTheme)
      window.removeEventListener(MAIN_LANDING_THEME_EVENT, syncThemeFromEvent as EventListener)
      window.removeEventListener('storage', syncThemeFromStorage)
    }
  }, [])
  useEffect(() => {
  if (typeof window === 'undefined') return

  let frame = 0

  const updateProgress = () => {
    const section = document.getElementById('solutions')
    if (!section) return

    const rect = section.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    const start = viewportHeight * 0.75
    const end = -rect.height * 0.15

    const rawProgress = (start - rect.top) / (start - end)
    const progress = Math.min(Math.max(rawProgress, 0), 1)

    setSolutionsProgress(progress)
  }

  const onScroll = () => {
    window.cancelAnimationFrame(frame)
    frame = window.requestAnimationFrame(updateProgress)
  }

  updateProgress()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)

  return () => {
    window.cancelAnimationFrame(frame)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
}, [])

  const currentYear = new Date().getFullYear()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />

      <main lang={language} data-header-tone={heroSceneMode === 'night' ? 'light' : 'dark'}>
        {/* -- HERO ----------------------------------------- */}
        <section className={`heroShell heroShell--${heroSceneMode}`}>
          <div className="heroBackdrop" aria-hidden="true">
            {heroSceneMode === 'night' ? (
              <>
                {nightStars.map((star) => (
                  <span
                    key={star.id}
                    className="heroStar"
                    style={{
                      left: star.left,
                      top: star.top,
                      width: star.size,
                      height: star.size,
                      opacity: star.opacity,
                      animationDelay: star.delay,
                      ['--twinkle-duration' as '--twinkle-duration']: star.duration,
                    } as CSSProperties}
                  />
                ))}
                <span className="heroAuroraBand heroAuroraBand--one" />
                <span className="heroAuroraBand heroAuroraBand--two" />
                <span className="heroAuroraBand heroAuroraBand--three" />
              </>
            ) : (
              <></>
            )}
            <div className="heroSceneFade" />
          </div>
          <div className="page heroInner">
          <div className="hero-grid" style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
            {/* left text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 900, lineHeight: 1.05,
                letterSpacing: -1.5, marginBottom: 20,
                color: 'var(--hero-title)',
                opacity: heroMounted ? 1 : 0, transform: heroMounted ? 'none' : 'translateY(20px)',
                transition: 'all 0.6s ease 0.1s',
              }}>
                <span style={{ display: 'block' }}>{text.heroTitleStart}</span>
                {text.heroTitleMiddle}<br />
                <span style={{ color: 'var(--hero-accent)' }}>{text.heroTitleEnd}</span>
              </h1>

              <p style={{
                fontSize: 18, lineHeight: 1.7, color: 'var(--hero-copy)', marginBottom: 36, maxWidth: 440,
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
                  <div key={t} className="heroBenefit">
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
              <div className="heroVisualFrame" aria-hidden="true" />
              <div className="float-b" style={{ position: 'absolute', bottom: 20, left: 0, transform: 'scale(0.85)' }}>
                <ChatWidgetPreview language={language} />
              </div>
            </div>
          </div>
          </div>
          {/* -- PREMIER PRODUCT SELECTION ------------------------------------- */}
          <div
            id="solutions"
            className={`solutionsSection solutionsSection--${heroSceneMode === 'night' ? 'night' : 'day'}`}
            style={{
              ['--mountain-progress' as string]: solutionsProgress,
            } as CSSProperties}
          >

  <div className="page solutionsShell" style={{ position: 'relative', zIndex: 1, maxWidth: '4240px', margin: '0 auto'}}>

    <Reveal className="solutionsIntroArc">
      <div className="mountainLayer" aria-hidden="true">
        <svg className="mountainSide mountainSide--left" viewBox="0 0 800 400" preserveAspectRatio="none">
          <path
            className="mountainSideBase"
            d="M0,400 L0,260 L70,180 L140,230 L210,140 L290,210 L360,150 L430,240 L520,170 L600,260 L680,200 L800,280 L800,400 Z"
          />
          <path
            className="mountainSideShade"
            d="M0,400 L0,320 L120,260 L240,310 L380,250 L500,320 L620,270 L800,340 L800,400 Z"
          />
        </svg>
        <svg className="mountainSide mountainSide--right" viewBox="0 0 800 400" preserveAspectRatio="none">
          <path
            className="mountainSideBase"
            d="M0,400 L0,260 L70,180 L140,230 L210,140 L290,210 L360,150 L430,240 L520,170 L600,260 L680,200 L800,280 L800,400 Z"
          />
          <path
            className="mountainSideShade"
            d="M0,400 L0,320 L120,260 L240,310 L380,250 L500,320 L620,270 L800,340 L800,400 Z"
          />
        </svg>
        <svg className="mountainCenter" viewBox="0 0 600 500" preserveAspectRatio="none">
          <path className="mountainCenterBack" d="M0,500 L34,346 L132,390 L300,24 L468,390 L566,346 L600,500 Z" />
          <path className="mountainCenterFront" d="M0,500 L62,404 L182,312 L300,124 L418,312 L538,404 L600,500 Z" />
          <path className="mountainCenterFoot" d="M0,500 L600,500 L600,462 L502,432 L420,454 L300,420 L180,454 L98,432 L0,462 Z" />
        </svg>
      </div>
      <div className={`solutionsIntro solutionsIntroArcContent${solutionsProgress > 0.18 ? ' visible' : ''}`}>
        <h2 style={{ 
          fontSize: 'clamp(42px, 6vw, 72px)', 
          fontWeight: 900, 
          letterSpacing: '-0.05em', 
          color: solutionsTitleColor,
          lineHeight: 1.02,
          marginBottom: '22px',
          maxWidth: '12ch',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {text.productTitleStart} <br/> 
          {language === 'no' ? (
            <>
              <span style={{ color: solutionsAccentColor }}>Chatboten</span> {text.productTitleEnd}
            </>
          ) : (
            <>
              The <span style={{ color: solutionsAccentColor }}>chatbot</span> {text.productTitleEnd}
            </>
          )}
        </h2>
        <p style={{
          maxWidth: '760px',
          margin: '0 auto',
          color: solutionsCopyColor,
          fontSize: 'clamp(15px, 1.5vw, 18px)',
          lineHeight: 1.75,
        }}>
          {text.togetherLead} <span style={{ color: solutionsStrongColor, fontWeight: 700 }}>{text.togetherStrong}</span>
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

        {/* -- WEBSITE SHOWCASE CAROUSEL -------------------- */}
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

        {/* -- CHATBOT SHOWCASE ---------------------------- */}
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
                      { icon: '??', label: text.useCases[0], color: '#EEF4FF' },
                      { icon: '??', label: text.useCases[1], color: '#FFF4EE' },
                      { icon: '??', label: text.useCases[2], color: '#EEFAF4' },
                      { icon: '??', label: text.useCases[3], color: '#FDF0F8' },
                      { icon: '??', label: text.useCases[4], color: '#F5F0FF' },
                      { icon: '??', label: text.useCases[5], color: '#F5F5F5' },
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

        {/* -- PRICING TEASER ------------------------------- */}
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

        {/* -- BOTTOM CTA ----------------------------------- */}
        <section className="page" style={{ padding: '100px 24px', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 64, marginBottom: 24 }}>??</div>
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

        {/* -- FOOTER --------------------------------------- */}
        <footer style={{ borderTop: '1px solid #F0F0F0', padding: '32px 24px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 18 }}>vintra</span>
            <span style={{ color: '#999', fontSize: 13 }}>(c) {currentYear} Vintra. {text.footerRights}</span>
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



