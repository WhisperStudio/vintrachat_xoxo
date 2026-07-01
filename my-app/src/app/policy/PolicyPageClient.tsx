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
    title: 'Policy for Vintra og Polyscope Secker',
    lead: 'Vintra drives som et enkeltmannsforetak under Polyscope Secker. Denne policyen beskriver hvordan vi samler inn, lagrer, bruker og beskytter data i tilknytning til nettsider, chatbot-løsninger, supporttjenester og AI-drevet kundedialog. For cookies og nettleserlagring finnes det også en egen oversikt.',
    metaUpdated: 'Sist oppdatert',
    metaOperator: 'Databehandler',
    highlights: [
      {
        title: 'Personvern først',
        body: 'Vi samler bare data som er nødvendig for drift, support og dialog.',
      },
      {
        title: 'Åpenhet rundt behandling',
        body: 'Roller, regioner, underleverandører og transfermekanismer beskrives i avtalen og DPA-en.',
      },
      {
        title: 'Sikker drift',
        body: 'Server-side lagring, tilgangskontroll og overvåkning beskytter informasjonen.',
      },
    ],
    contactTitle: 'Kontaktinformasjon',
    contactText: 'For innsyn, sletting, korrigering eller spørsmål om databehandling kan du kontakte oss direkte. For produksjonsløsninger kan vi også sende relevante avtaler, DPA og tjenestevilkår.',
    labels: {
      company: 'Selskap',
      email: 'E-post',
      phone: 'Telefon',
      language: 'Språk',
    },
    companyValue: 'Polyscope Secker (enkeltmannsforetak)',
    sections: [
      {
        title: '1. Roller og ansvar',
        body: 'For kundens chatbot-data fungerer Vintra som leverandør og behandlingsansvarlig på vegne av kunden når tjenesten brukes som en betrodd prosessør. Kunden er behandlingsansvarlig for egne personopplysninger som samles gjennom sin chatbot eller nettside, og Vintra bistår med drift, lagring og støtte i henhold til avtale.',
      },
      {
        title: '2. Hvilke data vi samler inn',
        body: 'Vi samler kun data som er nødvendig for å levere tjenesten og oppfylle avtalte forpliktelser.',
        bullets: [
          'Kontaktinformasjon og forretningsdata som navn, e-post, telefon og bedriftsinformasjon.',
          'Tekniske metadata som nettleser, enhet, IP-adresse og informasjon om brukermønstre.',
          'Widget- og chatkonfigurasjon som trengs for å tilpasse tjenesten til kunden.',
          'Dialogdata fra chat og support for oppfølging, historikk og kvalitetssikring.',
          'Lokal lagring, cookies og preferanser for funksjonell opplevelse.',
        ],
      },
      {
        title: '3. Hvordan data brukes',
        body: 'Data brukes for å levere og vedlikeholde tjenesten, gi support og forbedre drift og sikkerhet.',
        bullets: [
          'Drift av nettsider, chatbotter og tilhørende administrasjonsgrensesnitt.',
          'Supportdialog, feilretting og kundekommunikasjon.',
          'Intern analyse for å forstå og forbedre funksjonalitet og stabilitet.',
          'Sikkerhetsovervåkning og misbrukshåndtering.',
        ],
      },
      {
        title: '4. Dataplattform, regioner og underleverandører',
        body: 'Data lagres i sikre backend-systemer, og den konkrete lagringsregionen og infrastrukturen avhenger av valgt løsning, avtale og geografiske krav.',
        bullets: [
          'Forretningsdata og chathistorikk lagres i sikre sky- og databasemiljøer, blant annet i løsninger som Firebase/Firestore.',
          'Vi bruker pålitelige underleverandører for hosting, lagring, support og vedlikehold, og alle samarbeidspartnere er bundet av kontraktuelle krav om sikkerhet og konfidensialitet.',
          'AI-integrasjoner og modellvalg kan involvere tredjepartsleverandører, og den konkrete leverandøren avhenger av valgt konfigurasjon.',
          'Overføring av data utenfor EØS skjer kun når det er nødvendig, og da med passende juridiske og tekniske beskyttelsesmekanismer.',
        ],
      },
      {
        title: '5. Rettslig grunnlag og avtaler',
        body: 'Behandling skjer på et rettslig grunnlag som kontrakt, berettiget interesse eller samtykke, og den konkrete behandlingen er nærmere regulert i avtale, DPA og tjenestevilkår.',
        bullets: [
          'Tjenestedrift og support basert på avtale og nødvendig behandling.',
          'Sikkerhet, stabilitet og forretningsbeskyttelse basert på berettiget interesse.',
          'Kommunikasjon og administrasjon av tjenesten i henhold til kundeavtale, DPA og søknads-/oppstartsprosess.',
        ],
      },
      {
        title: '6. AI og chatbot-data',
        body: 'Chatbot og AI-tjenester brukes som støtteverktøy for kundedialog. Data lagres for å bevare kontekst og gi bedre oppfølging.',
        bullets: [
          'Chatthistorikk kan lagres for oppfølging og kvalitetssikring.',
          'AI-svar er veiledende og skal ikke erstatte juridisk eller medisinsk rådgivning.',
          'Kundedata i chat er underlagt samme konfidensialitetskrav som øvrige data.',
        ],
      },
      {
        title: '7. Tredjepartsleverandører',
        body: 'Vi samarbeider med pålitelige leverandører for hosting, support, lagring og AI-tilkoblinger. Data deles kun når det er nødvendig for å levere tjenesten.',
        bullets: [
          'Drift og lagring kan involvere plattformer som Firebase og relevante skytjenester.',
          'Support og kommunikasjon kan håndteres av e-post- og infrastrukturleverandører.',
          'AI-tjenester og integrasjoner kan benyttes som del av den valgte konfigurasjonen, med samme krav til sikkerhet og taushet.',
          'Informasjon deles aldri med uvedkommende og kun i samsvar med formål, avtale og relevante beskyttelsesmekanismer.',
        ],
      },
      {
        title: '8. Sikkerhet og tilgangskontroll',
        body: 'Vi beskytter data med tekniske og organisatoriske tiltak som begrenser tilgang og reduserer risiko.',
        bullets: [
          'Autentisering og rollebasert tilgang kontrollerer hvem som kan se og endre data.',
          'Sensitive nøkler og tokens lagres sikkert på servere og eksponeres ikke i frontend.',
          'Rate limiting og logging bidrar til å oppdage og forhindre misbruk.',
        ],
      },
      {
        title: '9. Lagringstid og sletting',
        body: 'Data lagres bare så lenge det er nødvendig for drift, support og avtaleforpliktelser.',
        bullets: [
          'Aktive driftsdata beholdes så lenge tjenesten er aktiv.',
          'Midlertidige nøkler og tekniske logger fjernes løpende.',
          'Kunder kan be om sletting av personopplysninger innenfor rammene av avtale og lov.',
        ],
      },
      {
        title: '10. Dine rettigheter',
        body: 'Du har rett til innsyn, retting, begrensning og sletting i henhold til gjeldende personvernlovgivning.',
        bullets: [
          'Du kan be om innsyn i hvilke data vi behandler om deg.',
          'Du kan be om korrigering av uriktige opplysninger.',
          'Du kan be om sletting der behandling ikke lenger er nødvendig eller ikke støttes av lov.',
          'Du kan klage til relevante tilsynsmyndigheter ved behov.',
        ],
      },
      {
        title: '11. Endringer i policy',
        body: 'Denne policyen kan oppdateres ved endringer i tjenesten, teknologi eller lovverk. Endringer publiseres på denne siden, og siste versjon gjelder.',
      },
      {
        title: '12. Avtaler og juridisk dokumentasjon',
        body: 'Dette dokumentet er et praktisk og kunderelevant personvern- og serviceoppslag for Vintra. For produksjonsbruk, avtalebasert drift og chatbot-løsninger brukes det sammen med databehandleravtale (DPA), tjenestevilkår og eventuelle sikkerhets- eller innholdsretningslinjer som den endelige dokumentasjonen.',
      },
    ],
  },
  en: {
    eyebrow: 'Privacy & policy',
    title: 'Policy for Vintra and Polyscope Secker',
    lead: 'Vintra is operated as a sole proprietorship under Polyscope Secker. This policy explains how we collect, store, use, and protect data in connection with websites, chatbot solutions, support services, and AI-powered customer dialogue. A separate cookie overview is also available.',
    metaUpdated: 'Last updated',
    metaOperator: 'Data processor',
    highlights: [
      {
        title: 'Privacy first',
        body: 'We only collect data that is necessary for operations, support, and conversation flow.',
      },
      {
        title: 'Transparent processing',
        body: 'Roles, regions, sub-processors, and transfer safeguards are explained in the agreement and DPA.',
      },
      {
        title: 'Secure operations',
        body: 'Server-side storage, access controls, and monitoring protect the information we process.',
      },
    ],
    contactTitle: 'Contact information',
    contactText: 'For requests about access, deletion, correction, or data processing, please contact us directly. For production deployments we can also provide the relevant agreements, DPA, and service terms.',
    labels: {
      company: 'Company',
      email: 'Email',
      phone: 'Phone',
      language: 'Language',
    },
    companyValue: 'Polyscope Secker (sole proprietorship)',
    sections: [
      {
        title: '1. Roles and responsibilities',
        body: 'For a customer chatbot deployment, Vintra acts as the service provider and processor on behalf of the customer when processing is carried out under contract. The customer remains the controller for the personal data it collects through its own chatbot or website, and Vintra supports operations, storage, and support under the agreement.',
      },
      {
        title: '2. What data we collect',
        body: 'We only collect data that is necessary to deliver the service and fulfill agreed obligations.',
        bullets: [
          'Contact and business information such as name, email, phone, and company details.',
          'Technical metadata such as browser, device, IP address, and usage patterns.',
          'Widget and chat configuration required to tailor the service to the customer.',
          'Chat and support dialogue data used for follow-up, history, and quality assurance.',
          'Local storage, cookies, and preferences used for functional experience.',
        ],
      },
      {
        title: '3. How data is used',
        body: 'Data is used to deliver and maintain the service, provide support, and improve reliability and security.',
        bullets: [
          'Operations of websites, chatbots, and related administration interfaces.',
          'Support conversations, troubleshooting, and customer communication.',
          'Internal analysis to improve functionality and stability.',
          'Security monitoring and misuse handling.',
        ],
      },
      {
        title: '4. Hosting region, sub-processors and transfers',
        body: 'Data is stored in secure backend systems, and the specific hosting region and infrastructure depend on the chosen solution, agreement, and geographic requirements.',
        bullets: [
          'Business data and chat history are stored in secure cloud and database environments, including solutions such as Firebase/Firestore.',
          'We use trusted sub-processors for hosting, storage, support, and maintenance, and all partners are bound by contractual requirements for security and confidentiality.',
          'AI integrations and model selection may involve third-party providers, and the specific provider depends on the selected configuration.',
          'Transfers of data outside the EEA occur only where necessary and are covered by appropriate legal and technical safeguards.',
        ],
      },
      {
        title: '5. Legal basis and agreements',
        body: 'Data processing is carried out on a legal basis such as contract, legitimate interest, or consent, and the detailed handling is set out in the agreement, DPA, and service terms.',
        bullets: [
          'Service delivery and support based on contract and necessary processing.',
          'Security, stability, and business protection based on legitimate interest.',
          'Communication and administration of the service in line with customer agreements, the DPA, and onboarding requirements.',
        ],
      },
      {
        title: '6. AI and chatbot data',
        body: 'Chatbots and AI services are used as support tools for customer dialogue. Data is stored to preserve context and improve follow-up.',
        bullets: [
          'Chat history may be stored for follow-up and quality assurance.',
          'AI responses are guidance only and should not replace legal or medical advice.',
          'Customer data processed in chat is subject to the same confidentiality requirements as other data.',
        ],
      },
      {
        title: '7. Third-party providers',
        body: 'We work with reliable providers for hosting, support, storage, and AI integrations. Data is shared only when necessary to deliver the service.',
        bullets: [
          'Operations and storage may involve platforms such as Firebase and relevant cloud services.',
          'Support and communication may be handled by email and infrastructure providers.',
          'AI services and integrations may be used as part of the selected configuration, with the same requirements for security and confidentiality.',
          'Information is never shared with unauthorized parties and only in line with purpose, agreement, and applicable safeguards.',
        ],
      },
      {
        title: '8. Security and access control',
        body: 'We protect data with technical and organizational measures that limit access and reduce risk.',
        bullets: [
          'Authentication and role-based access control determine who can view and modify data.',
          'Sensitive keys and tokens are stored securely on servers and not exposed in the frontend.',
          'Rate limiting and logging help detect and prevent misuse.',
        ],
      },
      {
        title: '9. Retention and deletion',
        body: 'Data is stored only as long as necessary for operations, support, and contractual obligations.',
        bullets: [
          'Active operational data is retained for as long as the service is active.',
          'Temporary keys and technical logs are removed on an ongoing basis.',
          'Customers may request deletion of personal data within the scope of agreement and law.',
        ],
      },
      {
        title: '10. Your rights',
        body: 'You have the right to access, correction, restriction, and deletion in accordance with applicable privacy laws.',
        bullets: [
          'You may request access to the data we process about you.',
          'You may request correction of inaccurate information.',
          'You may request deletion where processing is no longer necessary or not supported by law.',
          'You may file a complaint with relevant supervisory authorities if needed.',
        ],
      },
      {
        title: '11. Changes to this policy',
        body: 'This policy may be updated when the service, technology, or legal requirements change. Updates are published on this page and the latest version applies.',
      },
      {
        title: '12. Agreements and legal documentation',
        body: 'This document is a practical and customer-facing privacy and service overview for Vintra. For production use, contract-based deployment, and chatbot solutions, it should be read together with the data processing agreement (DPA), service terms, and any applicable security or content guidelines as the final documentation.',
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
