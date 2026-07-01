'use client'

import { useVintraLanguage } from '@/lib/i18n'
import { siteConfig } from '@/lib/site-config'
import styles from '@/app/policy/page.module.css'

const lastUpdated = '1. juli 2026'

type TermsSection = {
  title: string
  body: string
  bullets?: string[]
}

type TermsContent = {
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
  sections: TermsSection[]
}

const termsContent: Record<'no' | 'en', TermsContent> = {
  no: {
    eyebrow: 'Vilkår for bruk',
    title: 'Vilkår for bruk av Vintra-nettstedet og widgeten',
    lead: 'Disse vilkårene beskriver hvordan nettstedet, support- og chatløsningen og de tilhørende widgetene kan brukes. Vi oppdaterer innholdet etter behov, og den mest oppdaterte versjonen gjelder.',
    metaUpdated: 'Sist oppdatert',
    metaOperator: 'Operatør',
    highlights: [
      {
        title: 'Rett og ansvar',
        body: 'Du er ansvarlig for innholdet du sender inn eller konfigurerer i tjenesten.',
      },
      {
        title: 'Tjenesten kan endres',
        body: 'Funksjoner, grensesnitt og oppsett kan endres over tid etter behov og driftsmessige vurderinger.',
      },
      {
        title: 'Avtaler kan være relevante',
        body: 'For kundebasert drift eller tilpassede løsninger kan egne avtaler eller vilkår være gjeldende.',
      },
    ],
    contactTitle: 'Kontaktinformasjon',
    contactText: 'Hvis du vil bruke tjenesten med egne avtaler eller har spørsmål om bruken, kan du kontakte oss direkte.',
    labels: {
      company: 'Selskap',
      email: 'E-post',
      phone: 'Telefon',
      language: 'Språk',
    },
    companyValue: 'Vintra (drift under Polyscope Secker)',
    sections: [
      {
        title: '1. Om tjenesten',
        body: 'Tjenesten består av Vintra-nettstedet, administrasjon og de chatwidgetene som kan kobles til nettsteder eller andre flater.',
      },
      {
        title: '2. Innhold du legger inn',
        body: 'Du er ansvarlig for de opplysningene, dokumentene, tekstene og konfigurasjonene du legger inn eller gjør tilgjengelige i tjenesten.',
        bullets: [
          'Ikke del sensitive personopplysninger i chatten mer enn nødvendig.',
          'Vær oppmerksom på at innhold kan lagres som en del av driften og supportarbeidet.',
          'Bruk av tjenesten skal skje i samsvar med gjeldende lov og avtaler.',
        ],
      },
      {
        title: '3. Endringer og tilgjengelighet',
        body: 'Vi kan endre, avbryte eller tilpasse funksjoner og oppsett når det er nødvendig for drift, sikkerhet, support eller produktforbedring.',
      },
      {
        title: '4. Kontakt og støtte',
        body: 'For spørsmål om tjenesten, support eller spesifikke avtaler kan du kontakte oss på e-post eller telefon.',
      },
    ],
  },
  en: {
    eyebrow: 'Terms of use',
    title: 'Terms of use for the Vintra website and widget',
    lead: 'These terms describe how the website, support workflow, and related chat widgets may be used. We update the content as needed, and the latest version applies.',
    metaUpdated: 'Last updated',
    metaOperator: 'Operator',
    highlights: [
      {
        title: 'Rights and responsibilities',
        body: 'You are responsible for the content you submit or configure in the service.',
      },
      {
        title: 'The service may change',
        body: 'Features, interfaces, and setup may be adjusted over time based on operations and product needs.',
      },
      {
        title: 'Agreements may apply',
        body: 'For customer deployments or tailored solutions, separate agreements or terms may be relevant.',
      },
    ],
    contactTitle: 'Contact information',
    contactText: 'If you want to use the service under separate agreements or have questions about usage, please contact us directly.',
    labels: {
      company: 'Company',
      email: 'Email',
      phone: 'Phone',
      language: 'Language',
    },
    companyValue: 'Vintra (operated under Polyscope Secker)',
    sections: [
      {
        title: '1. About the service',
        body: 'The service includes the Vintra website, administration, and the chat widgets that can be connected to websites or other channels.',
      },
      {
        title: '2. Content you add',
        body: 'You are responsible for the information, documents, text, and configuration that you add or make available through the service.',
        bullets: [
          'Do not share sensitive personal information in chat more than necessary.',
          'Be aware that content may be stored as part of operations and support work.',
          'Use of the service should follow applicable law and agreements.',
        ],
      },
      {
        title: '3. Changes and availability',
        body: 'We may change, pause, or tailor features and setup when necessary for operations, security, support, or product improvement.',
      },
      {
        title: '4. Contact and support',
        body: 'For questions about the service, support, or specific agreements, please contact us by email or phone.',
      },
    ],
  },
} as const

export default function TermsPageClient() {
  const { language } = useVintraLanguage()
  const content = termsContent[language]
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
