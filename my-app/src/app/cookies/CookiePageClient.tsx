'use client'

import { useVintraLanguage } from '@/lib/i18n'
import { siteConfig } from '@/lib/site-config'
import styles from '@/app/policy/page.module.css'

const lastUpdated = '1. juli 2026'

type CookieSection = {
  title: string
  body: string
  bullets?: string[]
}

type CookieContent = {
  eyebrow: string
  title: string
  lead: string
  metaUpdated: string
  metaOperator: string
  highlights: Array<{
    title: string
    body: string
  }>
  contactTitle: string
  contactText: string
  labels: {
    company: string
    email: string
    phone: string
    language: string
  }
  companyValue: string
  sections: CookieSection[]
}

const cookieContent: Record<'no' | 'en', CookieContent> = {
  no: {
    eyebrow: 'Cookies & lagring',
    title: 'Cookies og nettleserlagring',
    lead: 'Denne siden bruker ikke reklamecookies som standard. Vi kan bruke nettleserlagring som localStorage for å huske innstillinger, chatutkast og widget-tilstand når det er nødvendig for å bruke tjenesten.',
    metaUpdated: 'Sist oppdatert',
    metaOperator: 'Operatør',
    highlights: [
      {
        title: 'Lite og nødvendig lagring',
        body: 'Vi bruker kun lagring som er nødvendig for å gi en stabil og personlig opplevelse.',
      },
      {
        title: 'Ingen reklamecookies som standard',
        body: 'Denne løsningen er ikke bygget rundt reklame- eller sporingstjenester.',
      },
      {
        title: 'Du styrer lagringen',
        body: 'Du kan slette nettleserdata og tilbakekalle lagrede preferanser når du ønsker.',
      },
    ],
    contactTitle: 'Kontaktinformasjon',
    contactText: 'Hvis du har spørsmål om lagring, personvern eller hvordan vi behandler dine data, kan du kontakte oss direkte.',
    labels: {
      company: 'Selskap',
      email: 'E-post',
      phone: 'Telefon',
      language: 'Språk',
    },
    companyValue: 'Polyscope Secker (enkeltmannsforetak)',
    sections: [
      {
        title: '1. Hva som lagres i nettleseren',
        body: 'Vi kan bruke browser-lagring for å huske innstillinger, chatutkast og widget-status slik at tjenesten fungerer som forventet.',
        bullets: [
          'Valgte preferanser som språk og tema.',
          'Utkast og midlertidig chatinformasjon som hjelper deg å fortsette en samtale.',
          'Widget- og UI-tilstand som er nødvendig for en stabil opplevelse.',
        ],
      },
      {
        title: '2. Hvorfor dette brukes',
        body: 'Lagring i nettleseren brukes primært for funksjonalitet og brukeropplevelse.',
        bullets: [
          'For å huske innstillinger mellom besøk.',
          'For å bevare en del av samtalens kontekst i widgeten.',
          'For å redusere behovet for å gjenta samme handling flere ganger.',
        ],
      },
      {
        title: '3. Kategorier av lagring',
        body: 'Vi bruker hovedsakelig funksjonell lagring som er nødvendig for å få en stabil opplevelse. Vi bruker ikke reklame- eller analysecookies som standard.',
        bullets: [
          'Nødvendig eller funksjonell lagring: språk, tema, widget-tilstand og delvis chatkontekst.',
          'Analyse- og markedsføringscookies: ikke brukt som standard på dette nettstedet.',
          'Hvis du fjerner lagring, kan enkelte funksjoner bli mindre stabile eller glatte.',
        ],
      },
      {
        title: '4. Hvordan du kan administrere det',
        body: 'Du kan slette lagret innhold i nettleseren dine, og mange nettlesere lar deg blokkere eller begrense lagring for enkelte nettsteder.',
        bullets: [
          'Slett lagret data for dette nettstedet via nettleserinnstillinger.',
          'Merk at dette kan fjerne lagrede innstillinger eller chatutkast.',
          'Hvis du blokkerer funksjonell lagring, kan enkelte deler av tjenesten fungere dårligere.',
        ],
      },
      {
        title: '5. Kontakt',
        body: 'For spørsmål om cookies, nettleserlagring, personvern eller databehandling kan du kontakte oss direkte med e-post eller telefon.',
      },
    ],
  },
  en: {
    eyebrow: 'Cookies & browser storage',
    title: 'Cookies and browser storage',
    lead: 'This site does not use advertising cookies by default. We may use browser storage such as localStorage to remember settings, chat drafts, and widget state when that is necessary to operate the service.',
    metaUpdated: 'Last updated',
    metaOperator: 'Operator',
    highlights: [
      {
        title: 'Minimal and necessary storage',
        body: 'We only use storage that is needed to provide a stable and useful experience.',
      },
      {
        title: 'No advertising cookies by default',
        body: 'The setup is not built around advertising or tracking services.',
      },
      {
        title: 'You can manage it',
        body: 'You can clear browser data and remove saved preferences when you choose to do so.',
      },
    ],
    contactTitle: 'Contact information',
    contactText: 'If you have questions about storage, privacy, or how your data is handled, please contact us directly.',
    labels: {
      company: 'Company',
      email: 'Email',
      phone: 'Phone',
      language: 'Language',
    },
    companyValue: 'Polyscope Secker (sole proprietorship)',
    sections: [
      {
        title: '1. What is stored in the browser',
        body: 'We may use browser storage to remember settings, chat drafts, and widget state so the service works as expected.',
        bullets: [
          'Selected preferences such as language and theme.',
          'Drafts and temporary chat information that help you continue a conversation.',
          'Widget and UI state that is necessary for a stable experience.',
        ],
      },
      {
        title: '2. Why it is used',
        body: 'Browser storage is used primarily for functionality and user experience.',
        bullets: [
          'To remember settings between visits.',
          'To preserve part of the conversation context in the widget.',
          'To reduce the need to repeat the same action multiple times.',
        ],
      },
      {
        title: '3. Storage categories',
        body: 'We primarily use functional storage that is necessary for a stable experience. We do not use advertising or analytics cookies by default.',
        bullets: [
          'Necessary or functional storage: language, theme, widget state, and partial chat context.',
          'Analytics and marketing cookies: not used by default on this site.',
          'If you remove storage, some functions may become less stable or seamless.',
        ],
      },
      {
        title: '4. How you can manage it',
        body: 'You can clear stored data in your browser, and many browsers let you block or limit storage for individual sites.',
        bullets: [
          'Delete stored data for this site in your browser settings.',
          'Note that this can remove saved preferences or chat drafts.',
          'If you block functional storage, some parts of the service may work less effectively.',
        ],
      },
      {
        title: '5. Contact',
        body: 'For questions about cookies, browser storage, privacy, or data processing, please contact us directly by email or phone.',
      },
    ],
  },
} as const

export default function CookiePageClient() {
  const { language } = useVintraLanguage()
  const content = cookieContent[language]
  const availableLanguages = siteConfig.contact.availableLanguage.join(', ')

  return (
    <main className={styles.page} data-header-tone="dark" lang={language}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <span className={styles.eyebrow}>{content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p className={styles.lead}>{content.lead}</p>
            <div className={styles.meta}>
              <div className={styles.metaItem}>{content.metaUpdated}: {lastUpdated}</div>
              <div className={styles.metaItem}>{content.metaOperator}: Polyscope Secker</div>
            </div>

            <div className={styles.heroHighlights}>
              {content.highlights.map((item) => (
                <div key={item.title} className={styles.highlightCard}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className={styles.asideCard}>
            <h2>{content.contactTitle}</h2>
            <p>{content.contactText}</p>
            <div className={styles.contactList}>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>{content.labels.company}</span>
                <span className={styles.contactValue}>{content.companyValue}</span>
              </div>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>{content.labels.email}</span>
                <span className={styles.contactValue}>{siteConfig.contact.email}</span>
              </div>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>{content.labels.phone}</span>
                <span className={styles.contactValue}>{siteConfig.contact.phoneDisplay}</span>
              </div>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>{content.labels.language}</span>
                <span className={styles.contactValue}>{availableLanguages}</span>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.grid}>
          {content.sections.map((section) => (
            <article key={section.title} className={styles.section}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
