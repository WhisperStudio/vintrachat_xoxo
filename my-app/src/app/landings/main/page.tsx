'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { FiArrowUpRight, FiGlobe, FiMail, FiPhone } from 'react-icons/fi'
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
const siteHost = new URL(siteConfig.publicUrl).host
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
    const progress = Math.min(Math.max(rawProgress, 0), 1) * Math.min(window.scrollY / 180, 1)

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

    <div className="solutionsIntroArc">
      <div className="mountainLayer" aria-hidden="true">
        {/* Bakre fjellkjede – myk og fjern */}
        <svg className="mountainSide mountainSide--left" viewBox="0 0 1000 440" preserveAspectRatio="none">
          <path
            className="mountainSideBase"
            d="M0 440 L0 300 L65 264 L108 279 L164 228 L207 247 L269 181 L314 213 L355 197 L408 235 L462 165 L507 205 L556 187 L608 236 L657 209 L708 244 L762 190 L815 230 L874 207 L931 253 L1000 222 L1000 440 Z"
          />
          <path
            className="mountainSideShade"
            d="M0 440 L0 353 L89 326 L158 344 L236 295 L299 321 L373 283 L432 310 L512 270 L576 315 L650 289 L728 327 L801 293 L881 329 L945 307 L1000 329 L1000 440 Z"
          />
        </svg>

        {/* Speilvendt fjellkjede på høyre side */}
        <svg className="mountainSide mountainSide--right" viewBox="0 0 1000 440" preserveAspectRatio="none">
          <path
            className="mountainSideBase"
            d="M0 440 L0 315 L61 280 L119 294 L176 244 L224 263 L283 205 L326 229 L385 171 L431 211 L484 187 L536 236 L588 194 L635 224 L695 176 L742 216 L798 193 L855 238 L918 207 L1000 259 L1000 440 Z"
          />
          <path
            className="mountainSideShade"
            d="M0 440 L0 360 L95 326 L164 346 L245 301 L313 327 L384 285 L451 316 L526 281 L603 318 L674 293 L745 331 L822 299 L895 330 L957 313 L1000 333 L1000 440 Z"
          />
        </svg>

        {/* Hovedfjellet */}
        <svg className="mountainCenter" viewBox="0 0 1000 700" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mountainSunlit" x1="0" y1="0" x2="1" y2="0.65">
              <stop offset="0%" stopColor="#e1edf1" />
              <stop offset="42%" stopColor="#c5d9e4" />
              <stop offset="100%" stopColor="#91adbf" />
            </linearGradient>
            <linearGradient id="mountainShadow" x1="0" y1="0" x2="1" y2="0.8">
              <stop offset="0%" stopColor="#819db1" />
              <stop offset="55%" stopColor="#6e899e" />
              <stop offset="100%" stopColor="#a5bdcb" />
            </linearGradient>
            <linearGradient id="snowLight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d6e5ec" />
            </linearGradient>
          </defs>

          <path className="mountainCenterBack" d="M65 700 L102 540 L175 480 L224 433 L278 389 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L749 365 L795 409 L846 454 L900 504 L936 568 L965 700 Z" />
          <path d="M65 700 L102 540 L175 480 L224 433 L278 389 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L510 112 L484 176 L468 228 L447 273 L420 326 L395 374 L366 420 L326 466 L284 510 L241 565 L195 610 L155 700 Z" fill="url(#mountainSunlit)" />
          <path d="M510 112 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L749 365 L795 409 L846 454 L900 504 L936 568 L965 700 L155 700 L195 610 L241 565 L284 510 L326 466 L366 420 L395 374 L420 326 L447 273 L468 228 L484 176 Z" fill="url(#mountainShadow)" opacity="0.85" />
          <path d="M505 18 L510 112 L484 176 L447 273 L468 228 L501 202 L523 151 L544 88 L523 43 Z" fill="url(#snowLight)" opacity="0.94" />
          <path d="M443 127 L471 75 L489 36 L505 18 L498 68 L477 101 L464 142 L443 174 L401 194 Z" fill="url(#snowLight)" opacity="0.96" />
          <path d="M358 281 L401 194 L443 174 L420 226 L395 252 L382 289 L347 326 L319 313 Z" fill="#a7c1d1" opacity="0.8" />
          <path d="M544 88 L568 119 L596 183 L631 230 L602 212 L579 178 L558 154 L535 123 Z" fill="#718ca1" opacity="0.72" />
          <path d="M468 228 L501 202 L484 250 L447 273 L420 326 L395 374 L366 420 L326 466 L350 424 L380 383 L399 339 L430 296 Z" fill="#718ca1" opacity="0.48" />
          <path d="M596 183 L631 230 L659 285 L706 319 L749 365 L711 350 L671 322 L643 284 L618 249 Z" fill="#d1e0e8" opacity="0.55" />
          <path className="mountainCenterFoot" d="M0 700 L0 638 L90 615 L153 627 L231 594 L298 616 L371 581 L437 604 L503 578 L570 608 L645 585 L716 614 L786 591 L855 619 L925 601 L1000 631 L1000 700 Z" />
        </svg>
      </div>
      <div className="solutionsIntro solutionsIntroArcContent" aria-hidden={solutionsProgress <= 0.16}>
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
    </div>

  </div>
  <section className="solutionsProducts" aria-label={language === 'no' ? 'Våre løsninger' : 'Our solutions'}>
    <div className="solutionsBasecamp solutionsBasecamp--refined">
      <Reveal delay={100}>
        <article className="basecampChoice basecampChoice--website">
          <div className="basecampVisual" aria-hidden="true">
            <div className="basecampSiteFrame">
              <span className="productPreviewAddress">vintra.studio / {language === 'no' ? 'din-bedrift' : 'your-business'}</span>
              <strong>{language === 'no' ? 'Bygget for å bli lagt merke til.' : 'Designed to stand out.'}</strong>
              <div className="productPreviewTiles"><span /><span /><span /></div>
              <small>{language === 'no' ? 'DESIGN SOM GIR ET GODT FØRSTEINNTRYKK' : 'DESIGN THAT MAKES A FIRST IMPRESSION'}</small>
            </div>
          </div>

          <div className="basecampCopy">
            <span className="basecampKicker"><GlobeIcon size={17} />{text.websiteCardTitle}</span>
            <h3>{language === 'no' ? 'Et bedre førsteinntrykk.' : 'A better first impression.'}</h3>
            <p>{language === 'no' ? 'En profesjonell nettside med gjennomtenkt design, tydelig innhold og plass til bedriften din.' : 'A professional website with thoughtful design, clear content and room for your business.'}</p>
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
              <p className="productPreviewBubble">{language === 'no' ? 'Hei! Hva kan jeg hjelpe deg med?' : 'Hi! How can I help you?'}</p>
              <p className="productPreviewBubble productPreviewBubble--user">{language === 'no' ? 'Hva tilbyr dere?' : 'What do you offer?'}</p>
              <p className="productPreviewBubble">{language === 'no' ? 'Jeg hjelper deg å finne informasjon om tjenestene våre.' : 'I can help you find information about our services.'}</p>
            </div>
          </div>

          <div className="basecampCopy">
            <span className="basecampKicker"><BotIcon size={17} />{text.chatbotCardTitle}</span>
            <h3>{language === 'no' ? 'Gode svar starter her.' : 'Good answers start here.'}</h3>
            <p>{language === 'no' ? 'En AI-assistent som svarer ut fra informasjonen din. Tilpass uttrykket og prøv den selv.' : 'An AI assistant that answers using your information. Make it your own and try it out.'}</p>
            <Link href="/landings/auth/chatWidget" className="basecampAction basecampAction--chatbot">
              {text.bottomChatbotCta} <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </Reveal>
    </div>
  </section>
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

          <section id="contact" className="contactBand" aria-labelledby="contact-title">
            <div className="page">
              <Reveal>
                <div className="contactPanel">
                  <div className="contactIntro">
                    <span className="sectionKicker">{text.contactEyebrow}</span>
                    <h2 id="contact-title">{text.contactTitle}</h2>
                    <p>{text.contactBody}</p>
                    <div className="contactSignature"><span>VINTRA NORDIC</span><span>{text.contactServices}</span></div>
                  </div>

                  <div className="contactGrid">
                    <a href={emailHref} className="contactCard contactCard--primary">
                      <span className="contactIcon"><FiMail aria-hidden="true" /></span>
                      <div className="contactCardCopy">
                        <span className="contactCardLabel">{text.email}</span>
                        <strong>{siteConfig.contact.email.split('@')[0]}@<wbr />{siteConfig.contact.email.split('@')[1]}</strong>
                        <p>{text.emailDescription}</p>
                      </div>
                      <FiArrowUpRight className="contactArrow" aria-hidden="true" />
                    </a>
                    {phoneHref ? (
                      <a href={phoneHref} className="contactCard">
                        <span className="contactIcon"><FiPhone aria-hidden="true" /></span>
                        <div className="contactCardCopy">
                          <span className="contactCardLabel">{text.phone}</span>
                          <strong>{siteConfig.contact.phoneDisplay}</strong>
                          <p>{text.phoneDescription}</p>
                        </div>
                        <FiArrowUpRight className="contactArrow" aria-hidden="true" />
                      </a>
                    ) : null}
                    <a href={siteConfig.publicUrl} className="contactCard">
                      <span className="contactIcon"><FiGlobe aria-hidden="true" /></span>
                      <div className="contactCardCopy">
                        <span className="contactCardLabel">{text.websiteCardTitle}</span>
                        <strong>{siteHost}</strong>
                        <p>{text.websiteDescription}</p>
                      </div>
                      <FiArrowUpRight className="contactArrow" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="contactDetails">
                    <span>{text.contactDetailsNote}</span>
                    <nav aria-label={text.contactLegalLabel}><Link href="/policy">{text.contactPrivacy}</Link><Link href="/terms">{text.contactTerms}</Link></nav>
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
