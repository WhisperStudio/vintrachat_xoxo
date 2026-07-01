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
import MountainBackground from '@/svgs/MountainBackground'

const organizationId = `${siteConfig.url}/#organization`
const websiteId = `${siteConfig.url}/#website`
const emailHref = `mailto:${siteConfig.contact.email}`
const phoneHref = siteConfig.contact.phone ? `tel:${siteConfig.contact.phone.replace(/\s+/g, '')}` : ''
const siteHost = new URL(siteConfig.url).host
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
  const footerPolicyLabel = language === 'no' ? 'Personvern' : 'Privacy'
  const footerCookiesLabel = language === 'no' ? 'Cookies' : 'Cookies'
  const footerTermsLabel = language === 'no' ? 'Vilkår' : 'Terms'
  const footerLegalLine = language === 'no'
    ? 'Enkeltmannsforetak under Polyscope Secker.'
    : 'Sole proprietorship under Polyscope Secker.'
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
            <MountainBackground className={`heroMountain heroMountain--${heroSceneMode}`} />
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

    <div className="solutionsBasecamp">
      <Reveal delay={100}>
        <article className="basecampChoice basecampChoice--website">
          <div className="basecampVisual" aria-hidden="true">
            <div className="basecampSiteFrame">
              <span />
              <div />
              <i />
              <i />
            </div>
          </div>

          <div className="basecampCopy">
            <span className="basecampKicker"><GlobeIcon size={17} />{text.websiteCardTitle}</span>
            <h3>{text.websiteCardCta}</h3>
            <p>{text.websiteCardFeatures[1]}</p>
            <Link href="/landings/guest/websites" className="basecampAction">
              {text.websiteCardCta} <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </Reveal>

      <Reveal delay={180}>
        <article className="basecampChoice basecampChoice--chatbot">
          <div className="basecampVisual" aria-hidden="true">
            <div className="basecampChatFrame">
              <div>
                <span><BotIcon size={15} /></span>
                <strong>{text.chatTitle}</strong>
              </div>
              <i />
              <i />
            </div>
          </div>

          <div className="basecampCopy">
            <span className="basecampKicker"><BotIcon size={17} />{text.chatbotCardTitle}</span>
            <h3>{text.chatbotCardCta}</h3>
            <p>{text.chatbotCardFeatures[0]}</p>
            <Link href="/landings/auth/chatWidget" className="basecampAction basecampAction--chatbot">
              {text.chatbotCardCta} <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </Reveal>
    </div>
  </div>
          </div>
        </section>

        <div className={`mainFlow mainFlow--${heroSceneMode === 'night' ? 'night' : 'day'}`}>
          <section className="showcaseBand">
            <Reveal>
              <div className="page sectionHeader sectionHeader--light">
                <span className="sectionKicker">{text.websiteCardTitle}</span>
                <h2>{text.carouselTitle}</h2>
                <p>{text.carouselBody}</p>
              </div>
            </Reveal>
            <WebsiteCarousel language={language} />
          </section>

          <section id="chatbot" className="chatbotShowcaseSection">
            <div className="page">
              <Reveal>
                <div className="sectionHeader sectionHeader--light sectionHeader--left">
                  <span className="sectionKicker sectionKicker--green">{text.chatbotCardTitle} / {text.alwaysOn}</span>
                  <h2>{text.chatbotShowcaseTitle}</h2>
                  <p>{text.chatbotShowcaseBody}</p>
                </div>
              </Reveal>

              <div className="chatbotShowcaseLayout">
                <Reveal delay={0}>
                  <div className="chatbotContentPanel">
                    <div className="chatbotUseCaseGrid">
                      {text.useCases.map((label, index) => (
                        <div key={label} className="chatbotUseCaseCard">
                          <div className="chatbotUseCaseNumber">{String(index + 1).padStart(2, '0')}</div>
                          <div className="chatbotUseCaseLabel">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="chatbotFeatureBlock">
                      <div>
                        <h3>{text.chatbotFeatureTitle}</h3>
                        <p>{text.chatbotFeatureBody}</p>
                      </div>

                      <div className="chatbotFeatureList">
                        {text.chatbotFeatures.map((item) => (
                          <div key={item} className="chatbotFeatureItem">
                            <span className="featureCheck"><CheckIcon /></span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal delay={160}>
                  <div className="chatbotPreviewColumn">
                    <ChatbotShowcasePreview language={language} />
                  </div>
                </Reveal>
              </div>
            </div>
          </section>

          <section id="priser" className="pricingBand">
            <div className="page">
              <Reveal>
                <div className="sectionHeader sectionHeader--light">
                  <span className="sectionKicker">{text.pricingCta}</span>
                  <h2>{text.pricingTitle}</h2>
                  <p>{text.pricingBody}</p>
                </div>
              </Reveal>

              <div className="pricingGrid">
                {text.pricingCards.map(({ label, from, desc, color }) => (
                  <Reveal key={label} delay={100}>
                    <div className="pricingCard">
                      <div className="pricingCardTop">
                        <span>{label}</span>
                        <span className="pricingDot" style={{ background: color }} />
                      </div>
                      <div className="pricingPrice">
                        <span>{text.from}</span>
                        <strong>{from === '0' ? text.free : `${from} kr`}</strong>
                      </div>
                      <p>{desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={180}>
                <div className="bottomCtaPanel">
                  <div>
                    <span className="sectionKicker sectionKicker--green">{text.bottomTitle}</span>
                    <h2>{text.bottomBody}</h2>
                  </div>
                  <div className="bottomCtaActions">
                    <Link href="/landings/guest/websites" className="cta-primary cta-primary--light">
                      {text.bottomWebsiteCta} <ArrowRight />
                    </Link>
                    <Link href="/landings/auth/chatWidget" className="cta-secondary cta-secondary--dark">
                      {text.bottomChatbotCta}
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          <section id="contact" className="contactBand">
            <div className="page">
              <Reveal>
                <div className="contactPanel">
                  <div className="contactIntro">
                    <span className="sectionKicker">{text.contactEyebrow}</span>
                    <h2>{text.contactTitle}</h2>
                    <p>{text.contactBody}</p>
                  </div>

                  <div className="contactGrid">
                    <a href={emailHref} className="contactCard">
                      <span className="contactCardLabel">{text.email}</span>
                      <strong>{siteConfig.contact.email}</strong>
                      <p>{text.emailDescription}</p>
                    </a>
                    {phoneHref ? (
                      <a href={phoneHref} className="contactCard">
                        <span className="contactCardLabel contactCardLabel--green">{text.phone}</span>
                        <strong>{siteConfig.contact.phoneDisplay}</strong>
                        <p>{text.phoneDescription}</p>
                      </a>
                    ) : null}
                    <a href={siteConfig.url} className="contactCard">
                      <span className="contactCardLabel contactCardLabel--blue">{text.websiteCardTitle}</span>
                      <strong>{siteHost}</strong>
                      <p>{text.websiteDescription}</p>
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>
        </div>

        {/* -- FOOTER --------------------------------------- */}
        <footer style={{ borderTop: '1px solid #F0F0F0', padding: '32px 24px' }}>
          <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span style={{ fontWeight: 900, fontSize: 18 }}>vintra</span>
              <div style={{ color: '#777', fontSize: 13, marginTop: 6 }}>
                {footerLegalLine} <Link href="/policy" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{footerPolicyLabel}</Link>
                {' · '}
                <Link href="/cookies" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{footerCookiesLabel}</Link>
                {' · '}
                <Link href="/terms" style={{ color: '#3b82f6', textDecoration: 'underline' }}>{footerTermsLabel}</Link>
              </div>
            </div>
            <span style={{ color: '#999', fontSize: 13 }}>(c) {currentYear} Vintra. {text.footerRights}</span>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <a href={emailHref} style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{siteConfig.contact.email}</a>
              {phoneHref ? (
                <a href={phoneHref} style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{siteConfig.contact.phoneDisplay}</a>
              ) : null}
              <Link href="/policy" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{footerPolicyLabel}</Link>
              <Link href="/cookies" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{footerCookiesLabel}</Link>
              <Link href="/terms" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{footerTermsLabel}</Link>
              <a href="#contact" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>{text.contact}</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
