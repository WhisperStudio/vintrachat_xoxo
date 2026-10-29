'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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

function ScrollHint({ language }: { language: 'no' | 'en' }) {
  const hintRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const update = () => {
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY
      if (hintRef.current) hintRef.current.dataset.visible = String(remaining > 80)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
  return (
    <div ref={hintRef} className="landingScrollHint" role="img" aria-label={language === 'no' ? 'Scroll videre nedover' : 'Scroll down to explore'}>
      <span /><span /><span />
    </div>
  )
}

function DroidArm() {
  return (
    <svg className="droidArm" viewBox="0 0 100 110" aria-hidden="true">
      <path className="droidArmCable" d="M86 91 Q48 98 36 60" />
      <path className="droidArmLink" d="M83 86 53 76 37 52" />
      <path className="droidArmPiston" d="M79 80 56 65" />
      <circle className="droidArmJoint" cx="83" cy="86" r="11" />
      <circle className="droidArmJoint" cx="51" cy="73" r="9" />
      <circle className="droidArmBolt" cx="51" cy="73" r="3" />
      <path className="droidArmPalm" d="M24 38 Q24 32 30 32 H48 Q54 32 54 38 V51 Q54 57 48 57 H30 Q24 57 24 51Z" />
      <path className="droidArmClaw" d="M28 37 18 25 18 11 25 8 29 21 36 29 M49 37 59 25 59 11 52 8 48 21 41 29" />
      <path className="droidArmGrip" d="m20 18 7-2m25 0 7 2M31 43h16M31 48h16" />
      <circle className="droidArmBolt" cx="39" cy="35" r="3" />
    </svg>
  )
}

function DroidDetails() {
  return (
    <g className="droidDetails">
      <path className="droidBrow" d="M58 63q10-5 19-2m26 0q9-3 18 2" />
      <path className="droidCheeks" d="m51 96 7 2m66 0 7-2" />
      <path className="droidVents" d="M77 143h5m6 0h5m6 0h5" />
      <path className="droidBadge" d="m86 126 5 7 5-7" />
      <circle className="droidShellBolt" cx="35" cy="118" r="2" />
      <circle className="droidShellBolt" cx="145" cy="118" r="2" />
    </g>
  )
}

// Small/touch screens and reduced-motion users get the same content without
// the fixed, scroll-driven morph or its continuous layout work.
function useSimplifiedMotion() {
  const [simplified, setSimplified] = useState(true)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px), (pointer: coarse), (prefers-reduced-motion: reduce)')
    const sync = () => setSimplified(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return simplified
}

function ScrollDroid() {
  const droidRef = useRef<HTMLDivElement>(null)
  const simplified = useSimplifiedMotion()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  useEffect(() => { setAnchor(document.getElementById('hero-droid-space')) }, [])

  useEffect(() => {
    const element = droidRef.current
    if (!element || simplified) return

    const section = document.getElementById('solutions')
    const stage = document.getElementById('droid-morph-showcase')
    const stickyElement = stage?.querySelector<HTMLElement>('.droidMorphSticky')
    const browser = stage?.querySelector<HTMLElement>('.nordicBrowser')
    const cover = element.querySelector<HTMLElement>('.droidMorphCover')

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let lastTime = performance.now()
    let scrollPosition = window.scrollY
    let scrollVelocity = 0
    let chatPhase: 'idle' | 'press' | 'transition' = 'idle'
    let phaseStarted = 0
    let chatOpen = false
    let chatTarget = false
    let chatReveal = 0
    let viewerProgress = 0.70
    let viewerVelocity = 0
    const resetScroll = () => {
      scrollPosition = window.scrollY
      scrollVelocity = 0
      lastTime = performance.now()
    }
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1)
    const smooth = (value: number) => value * value * (3 - 2 * value)
    const animate = (time: number) => {
      frame = 0
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scrollTop = window.scrollY
      const dt = Math.min(Math.max((time - lastTime) / 1000, 0), 0.064)
      lastTime = time
      if (reducedMotion) {
        scrollPosition = scrollTop
        scrollVelocity = 0
      } else {
        // Exact critically damped spring: gentle acceleration and braking without overshoot.
        // Smooth scroll distance once so every part of the morph stays synchronized.
        const frequency = 9
        const displacement = scrollPosition - scrollTop
        const momentum = scrollVelocity + frequency * displacement
        const decay = Math.exp(-frequency * dt)
        scrollPosition = scrollTop + (displacement + momentum * dt) * decay
        scrollVelocity = (scrollVelocity - frequency * momentum * dt) * decay
      }
      const progress = clamp(scrollPosition / Math.max((section?.offsetTop ?? vh) + vh * 0.72, vh))
      const compact = vw < 700
      const baseX = vw * ((compact ? 0.76 : 0.79) - (compact ? 0.48 : 0.53) * Math.sin(progress * Math.PI))
      const baseY = vh * (0.3 + progress * 0.34 - Math.sin(progress * Math.PI * 2) * 0.055)
      const rect = stage?.getBoundingClientRect()
      // Read geometry before writing styles to avoid forcing a second layout.
      const sticky = stickyElement?.getBoundingClientRect()
      const size = element.offsetWidth
      const browserWidth = browser?.offsetWidth || size
      const browserHeight = browser?.offsetHeight || size
      const stageTop = rect ? rect.top + scrollTop - scrollPosition : 0
      const morph = rect ? clamp((vh * 0.82 - stageTop) / Math.max(rect.height - vh * 0.72, vh)) : 0
      // A single scroll timeline also initializes correctly after scroll restoration.
      stage?.style.setProperty('--morph-progress', String(morph))
      // Scroll requests a change; a full click always plays before opening OR closing.
      // Finish each sequence before handling a reversal, avoiding half-clicks and flicker.
      const wantsChat = chatOpen
        ? morph >= 0.925
        : morph >= 0.955 && (reducedMotion || viewerProgress >= 0.95)
      let press = 0
      if (reducedMotion) {
        chatOpen = wantsChat
        chatReveal = wantsChat ? 1 : 0
        chatPhase = 'idle'
      } else {
        if (chatPhase === 'idle' && wantsChat !== chatOpen) {
          chatTarget = wantsChat
          chatPhase = 'press'
          phaseStarted = time
        }
        if (chatPhase === 'press') {
          const clickProgress = clamp((time - phaseStarted) / 520)
          press = Math.sin(clickProgress * Math.PI)
          if (clickProgress === 1) {
            chatPhase = 'transition'
            phaseStarted = time
          }
        }
        if (chatPhase === 'transition') {
          const revealProgress = clamp((time - phaseStarted) / 460)
          chatReveal = chatTarget ? smooth(revealProgress) : 1 - smooth(revealProgress)
          if (revealProgress === 1) {
            chatOpen = chatTarget
            chatPhase = 'idle'
          }
        }
      }
      const holdBubble = chatPhase !== 'idle' || chatOpen
      // Keep the droid at the launcher while the click/close sequence plays.
      // Then rewind its own continuous timeline from that same point, never from
      // the scroll position it would otherwise have reached while hidden.
      if (reducedMotion) {
        viewerProgress = Math.max(0.70, morph)
        viewerVelocity = 0
      } else if (holdBubble) {
        viewerVelocity = 0
      } else {
        const target = Math.max(0.70, morph)
        const displacement = viewerProgress - target
        const momentum = viewerVelocity + 11 * displacement
        const decay = Math.exp(-11 * dt)
        const next = target + (displacement + momentum * dt) * decay
        const step = Math.max(-0.24 * dt, Math.min(0.24 * dt, next - viewerProgress))
        viewerProgress = Math.max(0.70, Math.min(1, viewerProgress + step))
        viewerVelocity = Math.max(-0.24, Math.min(0.24, (viewerVelocity - 11 * momentum * dt) * decay))
      }
      const pop = clamp((viewerProgress - 0.72) / 0.045)
      const popScale = reducedMotion ? 1 : 1 + 2.70158 * (pop - 1) ** 3 + 1.70158 * (pop - 1) ** 2
      const droidTravel = smooth(clamp((viewerProgress - 0.80) / 0.085))
      stage?.style.setProperty('--droid-pop', String(smooth(clamp(pop * 2))))
      stage?.style.setProperty('--droid-pop-scale', String(popScale))
      stage?.style.setProperty('--droid-travel', String(droidTravel))
      stage?.style.setProperty('--droid-arc', `${Math.sin(droidTravel * Math.PI) * 22}%`)
      stage?.style.setProperty('--bubble-reveal', String(holdBubble ? 1 : smooth(clamp((viewerProgress - 0.885) / 0.03))))
      stage?.style.setProperty('--bubble-press', String(press))
      stage?.style.setProperty('--chat-reveal', String(chatReveal))
      const centerX = sticky ? sticky.left + sticky.width / 2 : vw / 2
      const centerY = sticky ? sticky.top + sticky.height / 2 : vh / 2
      const path = smooth(clamp(morph / 0.43))
      const inv = 1 - path
      // Join the existing path continuously, then arrive at the viewer's actual center.
      const x = inv ** 3 * baseX + 3 * inv ** 2 * path * vw * 0.155 + 3 * inv * path ** 2 * vw * 0.3 + path ** 3 * centerX
      const y = inv ** 3 * baseY + 3 * inv ** 2 * path * vh * 0.48 + 3 * inv * path ** 2 * vh * 0.79 + path ** 3 * centerY
      const whiten = clamp((morph - 0.27) / 0.09)
      const expand = smooth(clamp((morph - 0.43) / 0.22))
      const spin = reducedMotion ? 0 : smooth(clamp((morph - 0.22) / 0.43)) * 1080
      const width = size + (browserWidth - size) * expand
      const height = size + (browserHeight - size) * expand
      const radius = size / 2 * (1 - expand) + 34 * expand
      const contentReveal = smooth(clamp((morph - 0.44) / 0.14))
      if (browser) {
        // Reveal the real viewer inside the same spinning silhouette as the white cover.
        browser.style.transform = `rotate(${spin}deg) scale(${width / browserWidth}, ${height / browserHeight})`
        browser.style.borderRadius = `${radius * browserWidth / width}px / ${radius * browserHeight / height}px`
      }
      if (cover) {
        cover.style.width = `${width}px`
        cover.style.height = `${height}px`
        cover.style.borderRadius = `${radius}px`
        cover.style.opacity = String(whiten * (1 - contentReveal))
      }
      element.style.setProperty('--droid-whiten', String(whiten))
      element.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%, -50%) rotate(' + spin + 'deg)'
      element.style.opacity = String(1 - clamp((morph - 0.65) / 0.06))
      element.style.visibility = morph >= 0.71 ? 'hidden' : 'visible'
      element.dataset.scrolled = scrollTop > 12 ? 'true' : 'false'

      const settling = Math.abs(scrollPosition - scrollTop) > 0.1 || Math.abs(scrollVelocity) > 0.1
        || (!holdBubble && Math.abs(viewerProgress - Math.max(0.70, morph)) > 0.0001)
        || chatPhase !== 'idle'
      if (settling && !document.hidden) frame = window.requestAnimationFrame(animate)
    }

    const wake = () => {
      if (!frame && !document.hidden) {
        lastTime = performance.now()
        frame = window.requestAnimationFrame(animate)
      }
    }
    const restore = () => { resetScroll(); wake() }
    const visibility = () => {
      if (document.hidden) { window.cancelAnimationFrame(frame); frame = 0 }
      else restore()
    }
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('resize', wake)
    window.addEventListener('pageshow', restore)
    document.addEventListener('visibilitychange', visibility)
    wake()
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', wake)
      window.removeEventListener('pageshow', restore)
      document.removeEventListener('visibilitychange', visibility)
      element.removeAttribute('style')
      browser?.removeAttribute('style')
      cover?.removeAttribute('style')
    }
  }, [simplified])

  const droid = (
    <div ref={droidRef} className="scrollDroid" aria-hidden="true">
      <div className="scrollDroidFloat">
        <div className="droidAntenna"><span /></div>
        <div className="droidHand">
          <DroidArm />
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
          <DroidDetails />
        </svg>
      </div>
      <div className="droidMorphCover" />
    </div>
  )
  return simplified && anchor ? createPortal(droid, anchor) : droid
}

function DroidMorphShowcase({ language }: { language: 'no' | 'en' }) {

  return (
    <div id="droid-morph-showcase" className="droidMorphStage">
      <div className="droidMorphSticky">
      <aside className="morphSideCopy morphSideCopy--left">
        <small>{language === 'no' ? 'DESIGN SOM VIRKER' : 'DESIGN THAT WORKS'}</small>
        <h3>{language === 'no' ? 'En tydelig nettside, bygget rundt bedriften din.' : 'A clear website, built around your business.'}</h3>
        <p>{language === 'no' ? 'Vi bygger en rask, mobilvennlig nettside som viser hvem dere er og hva dere tilbyr. Design, tekst og struktur tilpasses bedriften, slik at kundene enkelt finner frem og tar kontakt.' : 'We build a fast, mobile-friendly website that shows who you are and what you offer. Design, copy and structure are tailored to your business, making it easy for customers to find what they need and get in touch.'}</p>
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
            <defs>
              <radialGradient id="siteDroidShellGradient" cx="32%" cy="24%" r="78%">
                <stop offset="0%" stopColor="#e8f7ff" />
                <stop offset="42%" stopColor="#7cc7f3" />
                <stop offset="100%" stopColor="#1859d1" />
              </radialGradient>
              <linearGradient id="siteDroidVisorGradient" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#07152f" /><stop offset="100%" stopColor="#123b70" />
              </linearGradient>
            </defs>
            <circle className="siteDroidShell" cx="90" cy="88" r="73" />
            <path className="siteDroidPanel" d="M30 71 C54 44 126 40 151 70 L153 102 C126 119 52 119 27 101 Z" />
            <path className="siteDroidGlass" d="M38 68 C61 50 121 49 143 68 L145 99 C121 112 60 112 35 98 Z" />
            <g className="siteDroidEyes"><ellipse cx="70" cy="83" rx="8" ry="15" /><ellipse cx="112" cy="83" rx="8" ry="15" /></g>
            <path className="siteDroidSmile" d="M75 101 Q91 112 108 101" />
            <path className="siteDroidGlint" d="M43 41 Q62 21 84 20" />
            <path className="siteDroidSeam" d="M22 111 Q90 140 158 109" />
            <DroidDetails />
          </svg>
        </div>
        <div className="siteChatBubble" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20 11.5Z" /></svg>
          <svg className="siteChatClickRays" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M50 6v12M19 19l9 9M6 50h12M81 19l-9 9M19 81l9-9" /></svg>
        </div>
        <div className="siteChat">
          <div className="siteChatHead"><img src="/image/logo.png" alt="" /><div><strong>VintraChat</strong><small>{language === 'no' ? 'Vi er her for å hjelpe deg!' : 'We are here to help you!'}</small></div><span className="siteChatClose" aria-hidden="true">×</span></div>
          <div className="siteChatWelcome">
            <span className="siteChatWelcomeIcon" aria-hidden="true"><BotIcon /></span>
            <strong>{language === 'no' ? 'Hei! 👋' : 'Hi! 👋'}</strong>
            <p>{language === 'no' ? 'Hva kan jeg hjelpe deg med?' : 'How can I help you?'}</p>
            <div className="siteChatOptions">
              <div><span>◎</span><strong>{language === 'no' ? 'Kom i gang' : 'Get started'}</strong><i>›</i></div>
              <div><span>◈</span><strong>{language === 'no' ? 'Produkter og tjenester' : 'Products and services'}</strong><i>›</i></div>
              <div><span>♧</span><strong>{language === 'no' ? 'Kundeservice' : 'Customer support'}</strong><i>›</i></div>
            </div>
          </div>
          <div className="siteChatComposer"><span>{language === 'no' ? 'Skriv en melding…' : 'Write a message…'}</span><span className="siteChatSend" aria-hidden="true">➤</span></div>
        </div>
      </div>
      <aside className="morphSideCopy morphSideCopy--right">
        <small>{language === 'no' ? 'HJELP HELE DØGNET' : 'HELP AROUND THE CLOCK'}</small>
        <h3>{language === 'no' ? 'En chatbot som kjenner virksomheten din.' : 'A chatbot that knows your business.'}</h3>
        <p>{language === 'no' ? 'Gi kundene hjelp også utenfor åpningstid. Chatbotten kan svare på vanlige spørsmål, forklare tjenester og guide besøkende til riktig produkt eller kontaktperson. Det gir raskere svar og færre gjentakende henvendelser.' : 'Help customers outside business hours, too. Your chatbot can answer common questions, explain services and guide visitors to the right product or contact person. That means faster answers and fewer repetitive enquiries.'}</p>
      </aside>
      </div>
    </div>
  )
}

export default function MainLanding() {
  const [heroMounted, setHeroMounted] = useState(false)
  const [heroSceneMode, setHeroSceneMode] = useState<MainLandingThemeMode>('night')
  const [nightStars] = useState(() => createHeroParticles(86, 'star'))
  const simplifiedMotion = useSimplifiedMotion()
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
    frame = 0
    const section = document.getElementById('solutions')
    if (!section) return

    const rect = section.getBoundingClientRect()
    const viewportHeight = window.innerHeight

    const start = viewportHeight * 0.75
    const end = -rect.height * 0.15

    const rawProgress = (start - rect.top) / (start - end)
    const progress = Math.min(Math.max(rawProgress, 0), 1) * Math.min(window.scrollY / 180, 1)

    section.style.setProperty('--mountain-progress', String(simplifiedMotion ? 1 : progress))
  }

  const onScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(updateProgress)
  }

  updateProgress()
  if (!simplifiedMotion) window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)

  return () => {
    window.cancelAnimationFrame(frame)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
}, [simplifiedMotion])

  const currentYear = new Date().getFullYear()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />

      <main lang={language} data-header-tone={heroSceneMode === 'night' ? 'light' : 'dark'}>
        <ScrollDroid />
        <ScrollHint language={language} />
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
                      width: `${Number.parseFloat(star.size) * 0.48}px`,
                      height: `${Number.parseFloat(star.size) * 0.48}px`,
                      ['--star-opacity' as '--star-opacity']: star.opacity,
                      animationDelay: `-${star.delay}`,
                      ['--twinkle-duration' as '--twinkle-duration']: star.duration,
                    } as CSSProperties}
                  />
                ))}
                <svg className="heroAurora" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                  <defs>
                    <linearGradient id="hero-aurora-green" x1="0" y1="0" x2="0.1" y2="1">
                      <stop stopColor="#50dfc0" stopOpacity="0" />
                      <stop offset="0.5" stopColor="#36bda5" stopOpacity="0.03" />
                      <stop offset="0.86" stopColor="#52e4ac" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#9af5c6" stopOpacity="0.55" />
                    </linearGradient>
                    <linearGradient id="hero-aurora-blue" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#8578d4" stopOpacity="0" />
                      <stop offset="0.65" stopColor="#68a3d9" stopOpacity="0.05" />
                      <stop offset="1" stopColor="#57cdbf" stopOpacity="0.28" />
                    </linearGradient>
                    <linearGradient id="hero-aurora-fade">
                      <stop stopColor="white" stopOpacity="0" />
                      <stop offset="0.18" stopColor="white" />
                      <stop offset="0.8" stopColor="white" />
                      <stop offset="1" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <mask id="hero-aurora-mask"><rect width="1440" height="640" fill="url(#hero-aurora-fade)" /></mask>
                  </defs>
                  <g mask="url(#hero-aurora-mask)">
                    <path className="heroAuroraRibbon heroAuroraRibbon--back" fill="url(#hero-aurora-blue)" d="M-100 30 C220 -100 330 30 600 -30 S1090 -40 1540 40 L1540 245 C1220 130 1110 160 905 240 S550 360 365 255 S90 155 -100 260Z" />
                    <path className="heroAuroraRibbon heroAuroraRibbon--main" fill="url(#hero-aurora-green)" d="M-100 -80 C180 -40 400 -100 640 -40 S1100 -80 1540 -30 L1540 230 C1260 90 1120 210 970 310 S735 350 580 225 S270 280 -100 370Z" />
                    <path className="heroAuroraRibbon heroAuroraRibbon--front" fill="url(#hero-aurora-green)" d="M100 -80 C400 -20 720 -60 1000 -50 L1540 -20 L1540 300 C1230 190 1160 370 960 365 S740 220 550 290 S260 410 100 350Z" />
                  </g>
                </svg>
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
            <div id="hero-droid-space" className="heroDroidSpace" style={{
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
          >

  <div className="page solutionsShell" style={{ position: 'relative', zIndex: 1, maxWidth: '4240px', margin: '0 auto'}}>

    <div className="solutionsIntroArc">
      <div className="mountainLayer" aria-hidden="true">
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
      <div className="solutionsIntro solutionsIntroArcContent">
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
