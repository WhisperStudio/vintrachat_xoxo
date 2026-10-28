'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
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

function ScrollDroid() {
  const droidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = droidRef.current
    if (!element) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let lastTime = performance.now()
    let x = window.innerWidth * 0.78
    let y = window.innerHeight * 0.32
    let velocityX = 0
    let velocityY = 0
    let morphVisual = 0

    const animate = (time: number) => {
      const section = document.getElementById('solutions')
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const scrollTop = window.scrollY
      const sectionTop = section?.offsetTop ?? viewportHeight
      const travel = Math.max(sectionTop + viewportHeight * 0.72, viewportHeight)
      const progress = Math.min(Math.max(scrollTop / travel, 0), 1)
      const arc = Math.sin(progress * Math.PI)
      const compact = viewportWidth < 700
      let targetX = viewportWidth * ((compact ? 0.76 : 0.79) - (compact ? 0.48 : 0.53) * arc)
      let targetY = viewportHeight * (0.3 + progress * 0.34 - Math.sin(progress * Math.PI * 2) * 0.055)
      const morphStage = document.getElementById('droid-morph-showcase')
      const morphRect = morphStage?.getBoundingClientRect()
      const morphDistance = morphRect ? Math.max(morphRect.height - viewportHeight * 0.72, viewportHeight) : viewportHeight
      const calculatedMorphProgress = morphRect
        ? Math.min(Math.max((viewportHeight * 0.82 - morphRect.top) / morphDistance, 0), 1)
        : 0
      const sharedMorphProgress = morphStage
        ? Number.parseFloat(morphStage.dataset.morphProgress ?? morphStage.style.getPropertyValue('--morph-progress'))
        : Number.NaN
      const morphProgress = Number.isFinite(sharedMorphProgress) ? sharedMorphProgress : calculatedMorphProgress
      const pathRaw = Math.min(Math.max(morphProgress / 0.43, 0), 1)
      const pathProgress = pathRaw * pathRaw * (3 - 2 * pathRaw)
      morphVisual = reducedMotion ? morphProgress : morphVisual + (morphProgress - morphVisual) * 0.14
      const morphArrival = Math.min(Math.max((pathProgress - 0.46) / 0.54, 0), 1)

      if (pathProgress > 0) {
        if (pathProgress < 0.62) {
          const u = pathProgress / 0.62
          const inv = 1 - u
          targetX = viewportWidth * (
            inv * inv * inv * 0.16
            + 3 * inv * inv * u * 0.155
            + 3 * inv * u * u * 0.19
            + u * u * u * 0.3
          )
          targetY = viewportHeight * (
            inv * inv * inv * 0.18
            + 3 * inv * inv * u * 0.48
            + 3 * inv * u * u * 0.73
            + u * u * u * 0.79
          )
        } else if (pathProgress < 0.82) {
          const u = (pathProgress - 0.62) / 0.2
          const angle = u * Math.PI * 2
          targetX = viewportWidth * (0.32 + u * 0.06 + Math.sin(angle) * 0.055)
          targetY = viewportHeight * (0.8 + Math.sin(angle - Math.PI / 2) * 0.045)
        } else {
          const u = (pathProgress - 0.82) / 0.18
          const eased = u * u * (3 - 2 * u)
          targetX = viewportWidth * (0.38 + eased * 0.12)
          targetY = viewportHeight * (0.8 - eased * 0.12)
        }
      }

      if (reducedMotion) {
        x = targetX
        y = targetY
      } else {
        const dt = Math.min((time - lastTime) / 1000, 0.032)
        const stiffness = 42
        const damping = 8.4
        velocityX += ((targetX - x) * stiffness - velocityX * damping) * dt
        velocityY += ((targetY - y) * stiffness - velocityY * damping) * dt
        x += velocityX * dt
        y += velocityY * dt
      }

      if (pathProgress > 0.9) {
        const centerLock = Math.min((pathProgress - 0.9) * 2.2, 0.18)
        x += (viewportWidth * 0.5 - x) * centerLock
        y += (viewportHeight * 0.68 - y) * centerLock
      }

      const tilt = Math.max(-9, Math.min(9, velocityX * 0.025))
      const morphSpin = morphArrival * 720
      const morphScale = 1
      const sectionBottom = section?.getBoundingClientRect().bottom ?? viewportHeight
      const morphFade = Math.min(Math.max((morphVisual - 0.56) / 0.07, 0), 1)
      element.style.setProperty('--droid-morph-progress', String(morphVisual))
      element.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${tilt + morphSpin}deg) scale(${morphScale})`
      element.style.opacity = sectionBottom < viewportHeight * -0.15 ? '0' : String(1 - morphFade)
      element.style.visibility = morphVisual >= 0.65 ? 'hidden' : 'visible'
      element.dataset.scrolled = scrollTop > 90 ? 'true' : 'false'
      lastTime = time
      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div ref={droidRef} className="scrollDroid" aria-hidden="true">
      <div className="scrollDroidFloat">
        <div className="droidAntenna"><span /></div>
        <div className="droidHand">
          <span className="droidPalm" />
          <span className="droidFinger droidFinger--one" />
          <span className="droidFinger droidFinger--two" />
          <span className="droidFinger droidFinger--three" />
        </div>
        <svg className="droidOrb" viewBox="0 0 180 180">
          <defs>
            <radialGradient id="droidShell" cx="32%" cy="24%" r="78%">
              <stop offset="0%" stopColor="#e8f7ff" />
              <stop offset="42%" stopColor="#7cc7f3" />
              <stop offset="100%" stopColor="#1859d1" />
            </radialGradient>
            <linearGradient id="droidVisor" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#07152f" />
              <stop offset="100%" stopColor="#123b70" />
            </linearGradient>
          </defs>
          <circle className="droidShadowRing" cx="90" cy="93" r="76" />
          <circle className="droidShell" cx="90" cy="88" r="73" fill="url(#droidShell)" />
          <path className="droidShellPanel" d="M30 71 C54 44 126 40 151 70 L153 102 C126 119 52 119 27 101 Z" />
          <path className="droidVisor" d="M38 68 C61 50 121 49 143 68 L145 99 C121 112 60 112 35 98 Z" fill="url(#droidVisor)" />
          <g className="droidEyes">
            <ellipse cx="70" cy="83" rx="8" ry="15" />
            <ellipse cx="112" cy="83" rx="8" ry="15" />
          </g>
          <path className="droidSmile" d="M75 101 Q91 112 108 101" />
          <path className="droidGlint" d="M43 41 Q62 21 84 20" />
          <path className="droidSeam" d="M22 111 Q90 140 158 109" />
          <circle className="droidSideLight" cx="152" cy="111" r="7" />
        </svg>
      </div>
      <div className="droidMorphCover" />
    </div>
  )
}

function DroidMorphShowcase({ language }: { language: 'no' | 'en' }) {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let lastTime = performance.now()
    let progress = 0
    let velocity = 0

    const animate = (time: number) => {
      const rect = stage.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const distance = Math.max(rect.height - viewportHeight * 0.72, viewportHeight)
      const target = Math.min(Math.max((viewportHeight * 0.82 - rect.top) / distance, 0), 1)
      const dt = Math.min((time - lastTime) / 1000, 0.032)
      if (reducedMotion) {
        progress = target
      } else {
        velocity += ((target - progress) * 30 - velocity * 8.5) * dt
        progress += velocity * dt
      }
      stage.style.setProperty('--morph-progress', String(Math.min(Math.max(progress, 0), 1)))
      stage.dataset.morphProgress = String(Math.min(Math.max(progress, 0), 1))
      lastTime = time
      frame = window.requestAnimationFrame(animate)
    }
    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div id="droid-morph-showcase" ref={stageRef} className="droidMorphStage">
      <div className="droidMorphSticky">
      <aside className="morphSideCopy morphSideCopy--left">
        <small>{language === 'no' ? 'DESIGN SOM VIRKER' : 'DESIGN THAT WORKS'}</small>
        <h3>{language === 'no' ? 'En tydelig nettside, bygget rundt bedriften din.' : 'A clear website, built around your business.'}</h3>
        <p>{language === 'no' ? 'Vi samler struktur, tekst og visuelt uttrykk i én profesjonell løsning.' : 'We unite structure, copy and visual identity in one professional solution.'}</p>
      </aside>
      <div className="nordicBrowser">
        <div className="nordicBrowserBar">
          <div className="nordicTraffic"><i /><i /><i /></div>
          <span>vintra-nordic.no</span>
          <div className="nordicBrowserMenu">•••</div>
        </div>
        <div className="nordicSite">
          <nav className="nordicNav">
            <strong><span>V</span> VINTRA NORDIC</strong>
            <div><span>{language === 'no' ? 'Tjenester' : 'Services'}</span><span>{language === 'no' ? 'Om oss' : 'About'}</span><button>{language === 'no' ? 'Kontakt' : 'Contact'}</button></div>
          </nav>
          <div className="nordicHero">
            <div className="nordicHeroCopy">
              <small>{language === 'no' ? 'NORDISK DESIGN · SMARTE LØSNINGER' : 'NORDIC DESIGN · SMART SOLUTIONS'}</small>
              <h3>{language === 'no' ? 'Vi bygger digitale opplevelser som varer.' : 'We build digital experiences that last.'}</h3>
              <p>{language === 'no' ? 'Strategi, design og teknologi samlet i én tydelig digital løsning.' : 'Strategy, design and technology united in one clear digital solution.'}</p>
              <button>{language === 'no' ? 'Utforsk arbeidet vårt' : 'Explore our work'} <span>→</span></button>
            </div>
            <div className="nordicHeroArt" aria-hidden="true">
              <span className="nordicSun" />
              <span className="nordicPeak nordicPeak--back" />
              <span className="nordicPeak nordicPeak--front" />
            </div>
          </div>
          <div className="nordicStats">
            <span><strong>48</strong>{language === 'no' ? 'prosjekter' : 'projects'}</span>
            <span><strong>12</strong>{language === 'no' ? 'bransjer' : 'industries'}</span>
            <span><strong>4.9</strong>{language === 'no' ? 'kundescore' : 'client score'}</span>
          </div>
        </div>

        <div className="siteDroid" aria-hidden="true">
          <span className="siteDroidAntenna"><i /></span>
          <svg viewBox="0 0 180 180">
            <circle className="siteDroidShell" cx="90" cy="88" r="73" />
            <path className="siteDroidPanel" d="M30 71 C54 44 126 40 151 70 L153 102 C126 119 52 119 27 101 Z" />
            <path className="siteDroidGlass" d="M38 68 C61 50 121 49 143 68 L145 99 C121 112 60 112 35 98 Z" />
            <g className="siteDroidEyes"><ellipse cx="70" cy="83" rx="8" ry="15" /><ellipse cx="112" cy="83" rx="8" ry="15" /></g>
            <path className="siteDroidSmile" d="M75 101 Q91 112 108 101" />
            <path className="siteDroidGlint" d="M43 41 Q62 21 84 20" />
            <path className="siteDroidSeam" d="M22 111 Q90 140 158 109" />
            <circle className="siteDroidLight" cx="152" cy="111" r="7" />
          </svg>
        </div>
        <div className="siteChatBubble" aria-hidden="true"><span /><span /><span /></div>
        <div className="siteChat">
          <div className="siteChatHead"><span className="siteChatAvatar">••</span><strong>Vintra-assistenten</strong><i /></div>
          <div className="siteChatMessages">
            <p>{language === 'no' ? 'Hei! Hva kan jeg hjelpe deg med?' : 'Hi! How can I help you?'}</p>
            <p className="siteChatReply">{language === 'no' ? 'Jeg vil vite mer om tjenestene.' : 'I want to learn about your services.'}</p>
            <p>{language === 'no' ? 'Klart! Jeg kan vise deg riktig løsning.' : 'Of course! I can show you the right solution.'}</p>
          </div>
          <div className="siteChatInput">{language === 'no' ? 'Skriv en melding…' : 'Write a message…'}<span>➤</span></div>
        </div>
      </div>
      <aside className="morphSideCopy morphSideCopy--right">
        <small>{language === 'no' ? 'HJELP HELE DØGNET' : 'HELP AROUND THE CLOCK'}</small>
        <h3>{language === 'no' ? 'En chatbot som kjenner virksomheten din.' : 'A chatbot that knows your business.'}</h3>
        <p>{language === 'no' ? 'Den finner svar, guider besøkende og gjør nettsiden mer nyttig.' : 'It finds answers, guides visitors and makes your website more useful.'}</p>
      </aside>
      </div>
    </div>
  )
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
  const solutionsAccentColor = isNightTheme ? '#9ca3ff' : '#e58a3a'
  const solutionsCopyColor = isNightTheme ? 'rgba(248, 250, 252, 0.9)' : 'rgba(62, 88, 112, 0.82)'
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
        <ScrollDroid />
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
            className="mountainSideFar"
            d="M0 440 L0 326 C72 298 124 291 177 304 C238 267 291 258 346 275 C405 229 462 218 518 246 C568 202 625 196 678 230 C734 211 785 220 836 254 C892 243 944 261 1000 292 L1000 440 Z"
          />
          <path
            className="mountainSideBase"
            d="M0 440 L0 357 C71 338 121 335 173 348 C229 319 275 311 322 327 C371 287 420 278 467 302 C518 267 567 260 616 289 C666 273 711 282 754 313 C806 293 852 300 897 329 C936 318 968 321 1000 334 L1000 440 Z"
          />
          <path
            className="mountainSideShade"
            d="M0 440 L0 382 C83 363 129 352 190 367 C253 330 306 318 365 339 C423 306 478 297 535 329 C594 300 652 313 707 345 C770 322 826 327 882 357 C928 343 965 348 1000 361 L1000 440 Z"
          />
          <path className="mountainSideFacet mountainSideFacet--light" d="M194 281 L312 238 L362 266 L329 285 L287 326 L245 294 Z" />
          <path className="mountainSideFacet mountainSideFacet--dark" d="M420 246 L541 221 L596 258 L558 278 L515 326 L478 282 Z" />
          <path className="mountainSideFacet mountainSideFacet--light" d="M651 247 L772 257 L710 289 L674 330 L626 304 Z" />
          <path className="mountainSideContour" d="M73 317 L132 326 L194 281 L245 294 L312 238 L362 266 L420 246 L478 282 L541 221 L596 258 L651 247 L710 289 L772 257 L829 282 L891 248 L946 278" />
          <path className="mountainSideContour mountainSideContour--inner" d="M194 281 L229 317 L287 326 L312 238 M420 246 L458 311 L515 326 L541 221 M651 247 L674 330 L710 289 M772 257 L801 323 L829 282" />
          <path className="mountainSideContour mountainSideContour--terrain" d="M18 377 C112 354 171 371 245 348 C320 325 374 350 447 327 C525 302 582 335 654 318 C735 298 796 337 872 316 C921 303 960 312 992 325" />
          <path className="mountainSideContour mountainSideContour--terrain" d="M42 405 C139 384 211 400 282 379 C356 357 421 382 493 361 C568 339 636 370 711 350 C785 331 855 368 956 345" />
          <g className="mountainMini">
            <path className="mountainMiniBase" d="M0 440 L72 420 L144 382 L205 330 L257 255 L302 170 L341 96 L374 42 L405 89 L442 156 L486 218 L535 276 L594 326 L660 368 L735 401 L820 421 L910 430 L1000 440 Z" />
            <path className="mountainMiniLight" d="M72 420 L144 382 L205 330 L257 255 L302 170 L341 96 L374 42 L359 126 L327 190 L298 264 L260 326 L214 374 L162 408 Z" />
            <path className="mountainMiniShade" d="M374 42 L405 89 L442 156 L486 218 L535 276 L594 326 L660 368 L735 401 L820 421 L1000 440 L162 440 L214 374 L260 326 L298 264 L327 190 L359 126 Z" />
            <path className="mountainMiniSnow" d="M302 170 L341 96 L374 42 L405 89 L422 122 L394 108 L378 146 L359 126 L339 178 L327 190 Z" />
            <path className="mountainMiniSnow mountainMiniSnow--soft" d="M257 255 L302 170 L327 190 L300 222 L284 270 Z" />
            <path className="mountainMiniRidge" d="M374 42 L359 126 L327 190 L298 264 L260 326 L214 374" />
            <path className="mountainMiniRidge mountainMiniRidge--fine" d="M405 89 L394 159 L423 214 L442 156 M486 218 L444 255 L467 313 M535 276 L506 332 L557 361 M302 170 L284 229 L257 255" />
          </g>
        </svg>

        {/* Speilvendt fjellkjede på høyre side */}
        <svg className="mountainSide mountainSide--right" viewBox="0 0 1000 440" preserveAspectRatio="none">
          <path
            className="mountainSideFar"
            d="M0 440 L0 331 C71 305 124 297 177 310 C237 274 290 265 345 282 C405 237 461 225 518 253 C568 210 624 204 678 237 C733 218 785 228 836 261 C892 250 944 268 1000 298 L1000 440 Z"
          />
          <path
            className="mountainSideBase"
            d="M0 440 L0 361 C70 342 121 340 173 353 C228 325 275 317 322 333 C370 294 419 285 467 308 C517 274 566 267 616 296 C665 280 710 289 754 320 C805 300 851 307 897 336 C935 325 968 328 1000 341 L1000 440 Z"
          />
          <path
            className="mountainSideShade"
            d="M0 440 L0 384 C81 366 129 356 190 371 C252 336 306 324 364 344 C422 312 477 303 535 334 C593 306 651 319 708 350 C769 328 826 333 882 362 C929 349 967 354 1000 366 L1000 440 Z"
          />
          <path className="mountainSideFacet mountainSideFacet--light" d="M188 289 L307 246 L359 273 L325 294 L285 333 L241 301 Z" />
          <path className="mountainSideFacet mountainSideFacet--dark" d="M417 254 L538 230 L594 266 L555 286 L512 334 L475 289 Z" />
          <path className="mountainSideFacet mountainSideFacet--light" d="M650 255 L771 265 L709 296 L673 336 L625 312 Z" />
          <path className="mountainSideContour" d="M68 321 L127 331 L188 289 L241 301 L307 246 L359 273 L417 254 L475 289 L538 230 L594 266 L650 255 L709 296 L771 265 L831 290 L892 257 L948 286" />
          <path className="mountainSideContour mountainSideContour--inner" d="M188 289 L226 323 L285 333 L307 246 M417 254 L455 316 L512 334 L538 230 M650 255 L673 336 L709 296 M771 265 L802 329 L831 290" />
          <path className="mountainSideContour mountainSideContour--terrain" d="M18 381 C111 359 171 376 244 353 C319 331 374 356 447 333 C524 309 581 341 654 324 C734 305 796 343 872 322 C921 309 960 318 992 331" />
          <path className="mountainSideContour mountainSideContour--terrain" d="M42 408 C138 389 210 405 282 384 C355 363 420 388 493 367 C567 345 635 376 710 356 C784 337 854 374 956 351" />
          <g className="mountainMini">
            <path className="mountainMiniBase" d="M0 440 L66 424 L132 391 L190 343 L240 277 L286 202 L329 112 L368 51 L398 96 L435 164 L477 225 L526 281 L584 330 L650 371 L725 402 L808 421 L900 431 L1000 440 Z" />
            <path className="mountainMiniLight" d="M66 424 L132 391 L190 343 L240 277 L286 202 L329 112 L368 51 L351 134 L321 202 L291 270 L255 329 L210 380 L158 412 Z" />
            <path className="mountainMiniShade" d="M368 51 L398 96 L435 164 L477 225 L526 281 L584 330 L650 371 L725 402 L808 421 L1000 440 L158 440 L210 380 L255 329 L291 270 L321 202 L351 134 Z" />
            <path className="mountainMiniSnow" d="M286 202 L329 112 L368 51 L398 96 L416 130 L388 115 L373 151 L351 134 L333 187 L321 202 Z" />
            <path className="mountainMiniSnow mountainMiniSnow--soft" d="M240 277 L286 202 L321 202 L293 239 L273 285 Z" />
            <path className="mountainMiniRidge" d="M368 51 L351 134 L321 202 L291 270 L255 329 L210 380" />
            <path className="mountainMiniRidge mountainMiniRidge--fine" d="M398 96 L388 166 L417 219 L435 164 M477 225 L438 263 L462 318 M526 281 L498 336 L549 365 M286 202 L270 252 L240 277" />
          </g>
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

          <path className="mountainCenterBack" d="M0 700 L38 625 L82 570 L141 520 L191 474 L240 430 L286 383 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L755 369 L808 419 L861 468 L915 520 L962 585 L1000 700 Z" />
          <path d="M0 700 L38 625 L82 570 L141 520 L191 474 L240 430 L286 383 L319 313 L358 281 L401 194 L443 127 L471 75 L489 36 L505 18 L510 112 L484 176 L468 228 L447 273 L420 326 L395 374 L366 420 L326 466 L284 510 L241 565 L195 610 L142 654 L92 680 L56 700 Z" fill="url(#mountainSunlit)" />
          <path d="M505 92 L523 43 L544 88 L568 119 L596 183 L631 230 L659 285 L706 319 L755 369 L808 419 L861 468 L915 520 L962 585 L1000 700 L183 700 L232 654 L279 623 L326 556 L371 492 L409 427 L444 359 L472 291 L492 220 L510 151 Z" fill="url(#mountainShadow)" opacity="0.78" />
          <path d="M505 18 L510 112 L484 176 L447 273 L468 228 L501 202 L523 151 L544 88 L523 43 Z" fill="url(#snowLight)" opacity="0.94" />
          <path d="M443 127 L471 75 L489 36 L505 18 L498 68 L477 101 L464 142 L443 174 L401 194 Z" fill="url(#snowLight)" opacity="0.96" />
          <path d="M358 281 L401 194 L443 174 L420 226 L395 252 L382 289 L347 326 L319 313 Z" fill="#a7c1d1" opacity="0.8" />
          <path d="M544 88 L568 119 L596 183 L631 230 L602 212 L579 178 L558 154 L535 123 Z" fill="#718ca1" opacity="0.58" />
          <path d="M468 228 L501 202 L484 250 L458 286 L438 337 L411 389 L379 440 L344 486 L365 435 L394 386 L416 335 L442 285 Z" fill="#718ca1" opacity="0.34" />
          <path d="M596 183 L631 230 L659 285 L706 319 L749 365 L711 350 L671 322 L643 284 L618 249 Z" fill="#d1e0e8" opacity="0.55" />
          <path className="mountainCenterFoot" d="M0 700 L0 641 C72 620 129 626 190 637 C251 606 309 603 366 622 C425 593 484 589 542 614 C602 595 659 603 716 627 C775 608 830 614 881 638 C929 625 966 630 1000 644 L1000 700 Z" />
          <path className="mountainFootContour" d="M18 657 C91 638 147 648 205 657 C266 627 321 628 377 645 C435 617 491 615 548 639 C607 621 663 629 719 651 C777 634 830 640 882 659 C927 648 964 651 989 660" />
          <path className="mountainFootContour mountainFootContour--lower" d="M30 680 C108 662 171 674 235 680 C298 652 358 659 417 673 C478 649 537 653 596 674 C657 657 717 667 776 680 C842 663 910 675 976 670" />
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
          width: '100%',
          maxWidth: '13.5ch',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center',
          textWrap: 'balance'
        }}>
          <span className="mountainCopyStep mountainCopyStep--one">
            {language === 'no' ? 'Fra første idé.' : 'From first idea.'}
          </span>
          <span className="mountainCopyStep mountainCopyStep--two" style={{ color: solutionsAccentColor }}>
            {language === 'no' ? 'Til ferdig løsning.' : 'To finished solution.'}
          </span>
        </h2>
        <p className="mountainCopyStep mountainCopyStep--three" style={{
          maxWidth: '760px',
          margin: '0 auto',
          color: solutionsCopyColor,
          fontSize: 'clamp(15px, 1.5vw, 18px)',
          lineHeight: 1.75,
        }}>
          {language === 'no' ? 'Nettside, chatbot og støtte — ' : 'Website, chatbot and support — '}
          <span style={{ color: solutionsStrongColor, fontWeight: 700 }}>
            {language === 'no' ? 'samlet rundt bedriften din.' : 'built around your business.'}
          </span>
        </p>
      </div>
    </div>

  </div>
  <section className="solutionsProducts" aria-label={language === 'no' ? 'Våre løsninger' : 'Our solutions'}>
    <DroidMorphShowcase language={language} />
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
