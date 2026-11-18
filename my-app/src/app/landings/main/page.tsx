'use client'
import { useRef } from 'react'
import Link from 'next/link'
import { FiArrowUpRight, FiMail, FiPhone } from 'react-icons/fi'
import { useVintraLanguage } from '@/lib/i18n'
import { mainLandingCopy } from './i18n'
import { absoluteUrl, siteConfig } from '@/lib/site-config'
import VintraHost from '@/svgs/VintraHost'
import ProductStory from './ProductStory'
import { useLandingMotion } from './useLandingMotion'
import './story-contact.css'
import './product-story.css'
import './responsive-landing.css'

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
 const { language } = useVintraLanguage()
 const no = language === 'no'
 const text = mainLandingCopy[language]
 const landingRef = useRef<HTMLElement>(null)
 useLandingMotion(landingRef)
 return <>
 <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(contactStructuredData)}} />
 <div className="landingSurround" aria-hidden="true">
   <svg viewBox="0 0 2400 1600" preserveAspectRatio="none"><path className="landingSurroundFar" d="M0 480C110 430 170 260 290 330S510 570 680 490S1050 400 1280 520S1680 510 1880 340S2200 440 2400 280V1600H0Z"/><path className="landingSurroundNear" d="M0 1000C190 850 270 1060 460 870S780 940 1060 820S1490 960 1720 830S2110 1010 2400 780V1600H0Z"/><path className="landingSurroundFront" d="M0 1320C190 1170 340 1390 570 1240S1000 1340 1280 1200S1750 1330 1990 1200S2260 1300 2400 1160V1600H0Z"/></svg>
 </div>
 <main ref={landingRef} className="productLanding" lang={language}>
   <section className="storyHero" aria-labelledby="story-hero-title">
     <div className="storyHeroCopy">
     <h1 id="story-hero-title">{no ? 'Et godt førsteinntrykk.' : 'A great first impression.'}<br/><em>{no ? 'En enda bedre samtale.' : 'An even better conversation.'}</em></h1>
     <p>{no ? 'Vi bygger nettsiden som presenterer bedriften din, og AI-chatbotten som hjelper kundene videre. Samtaler og oppfølging samles i ett arbeidsområde.' : 'We build the website that introduces your business and the AI chatbot that helps customers take the next step. Conversations and follow-up come together in one workspace.'}</p>
     <div className="storyActions"><a className="primaryBtn" href="#solutions">{no ? 'La meg vise deg' : 'Let me show you'} <span aria-hidden="true">↓</span></a><Link className="secondaryBtn" href="/landings/auth/chatWidget">{no ? 'Lag din chatbot' : 'Create your chatbot'}</Link></div>
     </div>
     <div className="storyHeroHost"><div className="storyHostDust" aria-hidden="true">{Array.from({length:14},(_,i)=><i key={i} style={{left: (18 + (i * 37) % 66) + '%', top: (20 + (i * 19) % 58) + '%', '--dust-x': ((i % 2 ? 1 : -1) * (50 + i * 8)) + 'px', '--dust-y': (-40 - i * 10) + 'px'} as import('react').CSSProperties}/>)}</div><div className="storyOrbit storyOrbitOne"/><div className="storyOrbit storyOrbitTwo"/><div className="hostFloat"><VintraHost expression="happy"/></div><div className="storyHeroGreeting"><span className="storyStatus"/> {no ? 'Hei! Jeg er verten din. Skal vi ta en titt?' : 'Hi! I am your guide. Shall we take a look?'}</div></div>
   </section>
   <ProductStory language={language}/>
   <section className="storyBridge" id="priser"><span className="storyEyebrow">{no ? 'SAMME LØSNING. DITT UTTRYKK.' : 'ONE SOLUTION. YOUR IDENTITY.'}</span><h2>{no ? 'Bygget rundt bedriften din.' : 'Built around your business.'}</h2><p>{no ? 'Vi hjelper med nettsiden. Du gir chatbotten kunnskapen, fargene og tonen som passer kundene dine. Har du allerede en nettside, kan du bruke chatbotten der.' : 'We help with the website. You give your chatbot the knowledge, colors and tone that suit your customers. Already have a website? You can use the chatbot there.'}</p><div className="storyActions"><Link className="primaryBtn" href="/landings/auth/chatWidget">{no ? 'Design din egen chatbot' : 'Design your own chatbot'} ↗</Link><Link className="secondaryBtn" href="/landings/guest/websites">{no ? 'Prøv nettsidebyggeren' : 'Try the website builder'} ↗</Link></div></section>
           <section id="contact" className="contactBand" aria-labelledby="contact-title">
            <div className="page">

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
                    <div className="contactGetStarted">
                      <h3>{no ? 'Klar for å prøve selv?' : 'Ready to try it yourself?'}</h3>
                      <p>{no ? 'Opprett en bruker og finn uttrykket som passer bedriften din.' : 'Create an account and find the look that fits your business.'}</p>
                      <div className="contactAccountActions"><Link href="/auth/signup" className="primaryBtn">{no ? 'Opprett bruker' : 'Create account'} <FiArrowUpRight aria-hidden="true"/></Link><Link href="/auth/login" className="secondaryBtn">{no ? 'Logg inn' : 'Sign in'}</Link></div>
                      <div className="contactTryLinks"><Link href="/landings/auth/chatWidget">{no ? 'Design din egen chatbot' : 'Design your own chatbot'} <FiArrowUpRight aria-hidden="true"/></Link><Link href="/landings/guest/websites">{no ? 'Prøv nettsidebyggeren' : 'Try the website builder'} <FiArrowUpRight aria-hidden="true"/></Link></div>
                    </div>

                  </div>
                  <div className="contactDetails">
                    <span>{text.contactDetailsNote}</span>
                    <nav aria-label={text.contactLegalLabel}><Link href="/policy">{text.contactPrivacy}</Link><Link href="/terms">{text.contactTerms}</Link></nav>
                  </div>
                </div>

            </div>
          </section>
 <footer className="storyFooter">
   <svg className="storyFooterRidges" viewBox="0 0 1600 500" preserveAspectRatio="none" aria-hidden="true"><path className="footerRidgeBack" d="M0 270C180 220 300 245 470 195S760 155 945 205S1330 240 1600 180V500H0Z"/><path className="footerRidgeFront" d="M0 390C230 300 370 375 570 330S900 275 1090 330S1430 365 1600 310V500H0Z"/></svg>
   <div className="storyFooterTop"><Link href="/landings/main" className="storyFooterBrand" aria-label="Vintra Nordic"><img src="/image/logo.png" width="56" height="56" alt=""/><span className="storyFooterWordmark">VINTRA<small>NORDIC DIGITALSTUDIO</small></span></Link><p>{no ? 'Et tydelig sted å bli kjent. En enklere vei videre.' : 'A clear introduction. An easier next step.'}</p><a href="#story-hero-title" className="storyBackTop">{no ? 'Til toppen' : 'Back to top'} ↑</a></div>
   <div className="storyFooterGrid"><div><span className="storyEyebrow">{no ? 'LA OSS SNAKKE SAMMEN' : 'LET’S TALK'}</span><a href={emailHref} className="storyFooterContact"><span className="storyFooterContactIcon"><FiMail aria-hidden="true"/></span><span>{siteConfig.contact.email}</span></a>{phoneHref && <a href={phoneHref} className="storyFooterContact"><span className="storyFooterContactIcon"><FiPhone aria-hidden="true"/></span><span>{siteConfig.contact.phoneDisplay}</span></a>}</div><nav aria-label={no ? 'Kom i gang' : 'Get started'}><strong>{no ? 'Kom i gang' : 'Get started'}</strong><Link href="/auth/signup">{no ? 'Opprett bruker' : 'Create account'}</Link><Link href="/auth/login">{no ? 'Logg inn' : 'Sign in'}</Link><Link href="/landings/auth/chatWidget">{no ? 'Design din egen chatbot' : 'Design your own chatbot'}</Link><Link href="/landings/guest/websites">{no ? 'Prøv nettsidebyggeren' : 'Try the website builder'}</Link></nav><nav aria-label={no ? 'Informasjon' : 'Information'}><strong>{no ? 'Informasjon' : 'Information'}</strong><a href="#contact">{no ? 'Kontakt oss' : 'Contact us'}</a><Link href="/policy">{no ? 'Personvern' : 'Privacy'}</Link><Link href="/cookies">Cookies</Link><Link href="/terms">{no ? 'Vilkår' : 'Terms'}</Link></nav></div>
   <div className="storyFooterBottom"><span>© {new Date().getFullYear()} Vintra</span><span>{no ? 'Enkeltmannsforetak under Polyscope Secker.' : 'Sole proprietorship under Polyscope Secker.'}</span></div>
 </footer>

 </main></>
}
