import type { Metadata } from 'next'
import styles from './page.module.css'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Policy',
  description: 'Retningslinjer for bruk av Vintra sine nettsteder, AI-chatløsninger, support og databehandling.',
  alternates: {
    canonical: '/policy',
  },
}

const lastUpdated = '19. juni 2026'

export default function PolicyPage() {
  return (
    <main className={styles.page} data-header-tone="dark">
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <span className={styles.eyebrow}>Vintra Policy</span>
            <h1>Klare rammer for trygg bruk av Vintra.</h1>
            <p className={styles.lead}>
              Denne siden beskriver hvordan {siteConfig.name} håndterer personvern, sikkerhet, AI-bruk,
              support og ansvarlig bruk av plattformen. Innholdet er laget som et solid utgangspunkt for en
              bedrift som leverer nettsider, chatbotter og digital kundedialog.
            </p>
            <div className={styles.meta}>
              <div className={styles.metaItem}>Sist oppdatert: {lastUpdated}</div>
              <div className={styles.metaItem}>Område: Nettsider, widgeter, AI-chat og support</div>
            </div>
          </div>

          <aside className={styles.asideCard}>
            <h2>Kontakt</h2>
            <p>
              Hvis noen kunder, partnere eller tilsyn ønsker innsyn, retting eller sikkerhetsdialog, skal de
              ha ett tydelig kontaktpunkt.
            </p>
            <div className={styles.contactList}>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>E-post</span>
                <span className={styles.contactValue}>{siteConfig.contact.email}</span>
              </div>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Telefon</span>
                <span className={styles.contactValue}>{siteConfig.contact.phoneDisplay}</span>
              </div>
              <div className={styles.contactRow}>
                <span className={styles.contactLabel}>Språk</span>
                <span className={styles.contactValue}>{siteConfig.contact.availableLanguage.join(', ')}</span>
              </div>
            </div>
          </aside>
        </section>

        <section className={styles.grid}>
          <article className={styles.section}>
            <h2>1. Personvern og dataminimering</h2>
            <p>
              Vi skal bare samle inn informasjon som er nødvendig for å levere nettsiden, chatbotten,
              supporttjenester og relevante forbedringer av tjenesten.
            </p>
            <ul>
              <li>Personopplysninger skal begrenses til det som trengs for innlogging, support og levering.</li>
              <li>Bedriftsdata, kundedialoger og widget-oppsett skal ikke deles med uvedkommende.</li>
              <li>Data som ikke lenger trengs, skal slettes eller anonymiseres innen rimelig tid.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>2. Sikkerhet og tilgangskontroll</h2>
            <p>
              Tilgang til administrative funksjoner skal beskyttes med autentisering, rollebaserte rettigheter
              og minst mulig eksponering av interne konfigurasjoner.
            </p>
            <ul>
              <li>Kun verifiserte brukere skal få utføre sensitive handlinger.</li>
              <li>Tokens og hemmeligheter skal lagres sikkert og aldri eksponeres unødvendig til klienten.</li>
              <li>Feil, misbruk og mistenkelig trafikk skal kunne begrenses med rate limiting og logging.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>3. Ansvarlig bruk av AI</h2>
            <p>
              AI-assistenten skal brukes som støtteverktøy for kundedialog, ikke som en kilde til juridiske,
              medisinske eller finansielle garantier.
            </p>
            <ul>
              <li>AI-en skal være tydelig når den er usikker.</li>
              <li>AI-en skal ikke finne opp priser, åpningstider, vilkår eller løfter som ikke er bekreftet.</li>
              <li>Forespørsler som krever menneskelig vurdering skal kunne eskaleres til support.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>4. Innhold, kundedata og konfidensialitet</h2>
            <p>
              Informasjon kunder legger inn i widgeter, skjemaer eller supportdialoger skal behandles som
              forretningssensitiv når innholdet tilsier det.
            </p>
            <ul>
              <li>Interne instrukser, bedriftskontekst og opplastede kunnskapsdokumenter skal ikke publiseres åpent.</li>
              <li>Kundedialoger skal bare være tilgjengelige for autoriserte teammedlemmer.</li>
              <li>Eksport og deling av data skal skje kontrollert og med tydelig formål.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>5. Akseptabel bruk</h2>
            <p>
              Tjenesten skal ikke brukes til spam, phishing, trakassering, ulovlig innhold eller forsøk på å
              omgå sikkerhetsmekanismer.
            </p>
            <ul>
              <li>Automatisert misbruk av e-post, widgeter eller supportflyter er ikke tillatt.</li>
              <li>Brukere skal ikke forsøke å hente ut andres data eller interne konfigurasjoner.</li>
              <li>Ved alvorlig misbruk kan tilgang begrenses eller stenges.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>6. Support og responshåndtering</h2>
            <p>
              Når kunder ber om hjelp, skal saker håndteres på en forutsigbar måte med tydelig ansvar og så
              lite friksjon som mulig.
            </p>
            <ul>
              <li>AI-chat kan brukes til første svar, sortering og innsamling av relevant kontekst.</li>
              <li>Menneskelig oppfølging skal brukes ved sensitive, komplekse eller feilutsatte saker.</li>
              <li>Supporthistorikk kan brukes for å forbedre service, sikkerhet og kvalitet.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>7. Lagringstid og sletting</h2>
            <p>
              Vi skal ikke beholde data lenger enn nødvendig for drift, dokumentasjon, sikkerhet og avtalte
              tjenesteleveranser.
            </p>
            <ul>
              <li>Midlertidige tokens og verifiseringsdata skal ha kort levetid.</li>
              <li>Utgåtte eller irrelevante ventedata skal ryddes opp fortløpende.</li>
              <li>Kunder skal kunne be om sletting eller innsyn der lov og avtalegrunnlag tilsier det.</li>
            </ul>
          </article>

          <article className={styles.section}>
            <h2>8. Endringer i policy</h2>
            <p>
              Denne policyen kan oppdateres når tjenesten, lovkrav eller sikkerhetsbehov endrer seg. Vesentlige
              endringer bør kommuniseres tydelig til berørte kunder og brukere.
            </p>
          </article>

          <article className={styles.section}>
            <h2>9. Juridisk merknad</h2>
            <p>
              Dette er en praktisk policy-side laget for å passe {siteConfig.name} sin tjenesteprofil. Den bør
              kvalitetssikres juridisk før den brukes som endelig avtale- eller personverndokumentasjon.
            </p>
          </article>
        </section>

        <div className={styles.footerNote}>
          <p>
            Anbefalt neste steg: bruk denne siden som offentlig policy-utkast, og lag deretter egne sider for
            <strong> personvernerklæring</strong>, <strong>vilkår</strong> og eventuelt <strong>databehandleravtale</strong>
            hvis dere skal onboarde flere bedriftskunder i større skala.
          </p>
        </div>
      </div>
    </main>
  )
}
