'use client'

import { useVintraLanguage } from '@/lib/i18n'
import { siteConfig } from '@/lib/site-config'
import styles from './page.module.css'

const lastUpdated = '1. juli 2026'

type PolicySection = {
  title: string
  body: string
  bullets?: string[]
}

type PolicyContent = {
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
  sections: PolicySection[]
}

const policyContent: Record<'no' | 'en', PolicyContent> = {
  no: {
    eyebrow: 'Personvern & policy',
    title: 'Personvern- og behandlingspolicy for Vintra',
    lead: 'Denne siden beskriver hvordan Vintra behandler personopplysninger i forbindelse med nettsider, widgeter, chat og support. Vi har utformet teksten slik at den er enkel å lese og basert på det som faktisk er verifiserbart i tjenesten.',
    metaUpdated: 'Sist oppdatert',
    metaOperator: 'Operatør',
    highlights: [
      {
        title: 'Personvern først',
        body: 'Vi samler bare informasjon som er nødvendig for drift, support og tjenestelevering.',
      },
      {
        title: 'Klart ansvar',
        body: 'For kundebasert bruk kan Vintra være behandlingsansvarlig for egen drift eller behandlingsansvarlig på vegne av kunden etter avtale.',
      },
      {
        title: 'Åpenhet rundt lagring',
        body: 'Lagring i browseren, chatoppsett og backend-løsninger beskrives her i korte trekk.',
      },
    ],
    contactTitle: 'Kontaktinformasjon',
    contactText: 'Hvis du vil ha innsyn, korrigering, sletting eller ønsker å stille spørsmål om behandling av data, kan du kontakte oss direkte.',
    labels: {
      company: 'Selskap',
      email: 'E-post',
      phone: 'Telefon',
      language: 'Språk',
    },
    companyValue: 'Polyscope Secker (enkeltmannsforetak)',
    sections: [
      {
        title: '1. Hvem vi er',
        body: 'Vintra drives som en nettside- og chatbot-tjeneste under Polyscope Secker. Tjenesten kan brukes til nettsider, widgeter, support og AI-drevet dialog.',
      },
      {
        title: '2. Roller og ansvar',
        body: 'For egen drift og support er Vintra ansvarlig for den behandlingen som skjer i forbindelse med vår egen nettside og våre interne arbeidsprosesser. For kundebasert widget- og chatbot-bruk kan Vintra være databehandler på vegne av kunden når behandlingen skjer etter avtale.',
        bullets: [
          'Kunden er normalt ansvarlig for personopplysninger som samles gjennom sin egen side eller løsning.',
          'Vintra bistår med drift, lagring og support i tråd med avtale og tilgjengelige funksjoner.',
          'Den konkrete roller og ansvar kan variere etter hvilken løsning som er satt opp.',
        ],
      },
      {
        title: '3. Hvilke opplysninger som kan behandles',
        body: 'Vi behandler bare opplysninger som er nødvendige for å levere tjenesten eller håndtere support og drift.',
        bullets: [
          'Kontaktinformasjon som navn, e-post og telefon når du bruker kontakt- eller supportfunksjoner.',
          'Tekniske data som nettleser, enhet, IP-adresse og logger som understøtter sikkerhet og drift.',
          'Chat-, widget- og supportdata når en samtale eller en konfigurasjon lagres i systemet.',
          'Preferanser og lagring i nettleseren for å huske språk, tema og andre nødvendige innstillinger.',
        ],
      },
      {
        title: '4. Formål og behandlingsgrunnlag',
        body: 'Opplysningene brukes for å drive tjenesten, tilby support, opprettholde sikkerhet og forbedre funksjonalitet. Den konkrete rettslige grunnen avhenger av bruken, men kan være avtale, nødvendig behandling for tjenestelevering, berettiget interesse eller samtykke der dette er relevant.',
        bullets: [
          'Drift av nettside, widget og administrasjon.',
          'Support, feilretting og kommunikasjon med brukere.',
          'Sikkerhet, overvåking og beskyttelse mot misbruk.',
        ],
      },
      {
        title: '5. Lagring, underleverandører og regioner',
        body: 'Vi bruker sikre backend-systemer for lagring og administrasjon. I dagens løsning er Firebase/Firestore og Firebase Authentication viktige deler av oppsettet, og AI-funksjoner kan bruke en valgt Gemini-integration.',
        bullets: [
          'Bakend-lagring og autentisering er koblet til de systemene som er valgt i den aktuelle konfigurasjonen.',
          'Underleverandører kan brukes for hosting, lagring, support og teknisk vedlikehold.',
          'Den konkrete regionen og leverandøren kan variere etter valgt løsning og avtale.',
        ],
      },
      {
        title: '6. AI og chat',
        body: 'Chat- og AI-funksjoner kan brukes til å støtte dialoger og support. Data kan lagres for å bevare kontekst og støtte oppfølging, men vi oppfordrer til å ikke dele sensitive opplysninger mer enn nødvendig.',
        bullets: [
          'Chatthistorikk kan lagres som en del av drift og support.',
          'AI-svar er veiledende og skal ikke erstatte juridisk, medisinsk eller annen profesjonell rådgivning.',
          'Sentrale sikkerhets- og personvernkrav gjelder for AI- og chatdata på samme måte som for annen behandling.',
        ],
      },
      {
        title: '7. Opbevaring og sletting',
        body: 'Vi beholder opplysninger bare så lenge de er nødvendige for tjenestelevering, support, sikkerhet og eventuelle lovpålagte krav. Når de ikke lenger er nødvendige, slettes eller anonymiseres de innenfor rimelig tid.',
        bullets: [
          'Aktiv drift og supportdata kan beholdes så lenge tjenesten er aktiv eller avtalen gjelder.',
          'Tekniske logger og midlertidige data slettes løpende.',
          'Du kan be om sletting eller korrigering innenfor det som er praktisk og lovlig.',
        ],
      },
      {
        title: '8. Dine rettigheter',
        body: 'Du har rett til innsyn, korrigering, begrensning og sletting i henhold til gjeldende lovgivning. Du kan også klage til relevante tilsynsmyndigheter hvis du mener behandlingen er feil.',
        bullets: [
          'Be om innsyn i data vi behandler om deg.',
          'Be om retting av uriktige opplysninger.',
          'Be om sletting der behandling ikke lenger er nødvendig.',
          'Stille spørsmål om hvordan vi bruker data i tjenesten.',
        ],
      },
      {
        title: '9. Endringer og kontakt',
        body: 'Denne policyen kan oppdateres når tjenesten, teknologien eller lovkravene endres. Vi publiserer oppdaterte versjoner på denne siden og kan gi mer detaljert informasjon ved behov.',
      },
    ],
  },
  en: {
    eyebrow: 'Privacy & policy',
    title: 'Privacy and processing policy for Vintra',
    lead: 'This page describes how Vintra handles personal data in connection with websites, widgets, chat, and support. The wording is written to be clear and grounded in what the product actually does.',
    metaUpdated: 'Last updated',
    metaOperator: 'Operator',
    highlights: [
      {
        title: 'Privacy first',
        body: 'We only collect information that is necessary for operations, support, and service delivery.',
      },
      {
        title: 'Clear roles',
        body: 'For customer-based usage, Vintra may act as a processor on behalf of the customer under contract.',
      },
      {
        title: 'Transparent storage',
        body: 'Browser storage, chat setup, and backend handling are described here in plain language.',
      },
    ],
    contactTitle: 'Contact information',
    contactText: 'If you want access, correction, deletion, or have questions about data processing, please contact us directly.',
    labels: {
      company: 'Company',
      email: 'Email',
      phone: 'Phone',
      language: 'Language',
    },
    companyValue: 'Polyscope Secker (sole proprietorship)',
    sections: [
      {
        title: '1. Who we are',
        body: 'Vintra is operated as a website and chatbot service under Polyscope Secker. The service may be used for websites, widgets, support, and AI-assisted dialogue.',
      },
      {
        title: '2. Roles and responsibilities',
        body: 'For our own site and support operations, Vintra is responsible for the processing carried out in connection with our own website and internal workflows. For customer-based widget and chatbot deployments, Vintra may act as a processor on behalf of the customer when the processing is carried out under contract.',
        bullets: [
          'The customer is usually responsible for personal data collected through its own site or solution.',
          'Vintra supports operations, storage, and support in line with the agreement and available functionality.',
          'The exact roles and responsibilities can vary by solution.',
        ],
      },
      {
        title: '3. What information may be processed',
        body: 'We process only information that is necessary to provide the service or handle support and operations.',
        bullets: [
          'Contact details such as name, email, and phone number when you use contact or support features.',
          'Technical data such as browser, device, IP address, and logs that support security and operations.',
          'Chat, widget, and support data when a conversation or configuration is stored in the system.',
          'Preferences and browser storage used to remember language, theme, and other necessary settings.',
        ],
      },
      {
        title: '4. Purposes and legal basis',
        body: 'The information is used to operate the service, provide support, maintain security, and improve functionality. The specific legal basis depends on the use case and may include contract, necessary processing for service delivery, legitimate interest, or consent where relevant.',
        bullets: [
          'Operation of the website, widget, and admin experience.',
          'Support, troubleshooting, and user communication.',
          'Security, monitoring, and protection against misuse.',
        ],
      },
      {
        title: '5. Storage, sub-processors, and regions',
        body: 'We use secure backend systems for storage and administration. In the current implementation, Firebase/Firestore and Firebase Authentication are important parts of the setup, and AI functionality may use a selected Gemini integration.',
        bullets: [
          'Backend storage and authentication are tied to the systems selected for the specific configuration.',
          'Sub-processors may be used for hosting, storage, support, and technical maintenance.',
          'The specific region and provider can vary by setup and agreement.',
        ],
      },
      {
        title: '6. AI and chat',
        body: 'Chat and AI features may be used to support dialogue and assistance. Data may be stored to preserve context and support follow-up, but we encourage you not to share sensitive information more than necessary.',
        bullets: [
          'Chat history may be stored as part of operations and support.',
          'AI responses are guidance only and should not replace legal, medical, or other professional advice.',
          'Core privacy and security requirements apply to AI and chat data the same way as to other processing.',
        ],
      },
      {
        title: '7. Retention and deletion',
        body: 'We retain information only as long as it is necessary for service delivery, support, security, and any legal requirements. When it is no longer needed, it is deleted or anonymized within a reasonable period.',
        bullets: [
          'Active operations and support data may be retained while the service or agreement is active.',
          'Temporary logs and technical data are removed on an ongoing basis.',
          'You can request deletion or correction where that is practical and lawful.',
        ],
      },
      {
        title: '8. Your rights',
        body: 'You have rights to access, correction, restriction, and deletion under applicable law. You may also file a complaint with relevant supervisory authorities if you believe the processing is incorrect.',
        bullets: [
          'Request access to the data we process about you.',
          'Request correction of inaccurate information.',
          'Request deletion where processing is no longer necessary.',
          'Ask questions about how we use your data.',
        ],
      },
      {
        title: '9. Changes and contact',
        body: 'This policy may be updated when the service, technology, or legal requirements change. We publish updated versions on this page and can provide more detailed information when needed.',
      },
    ],
  },
} as const

export default function PolicyPageClient() {
  const { language } = useVintraLanguage()
  const content = policyContent[language]
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
