# Stripe og abonnementer

Prissiden er `/priser`. Prisene og grensene ligger samlet i `src/lib/billing/catalog.mjs`.

Lokal oppdatering (ennå ikke publisert): prissiden følger appens lagrede språkvalg, med Norsk/English-knapper. Priser, forklaringer, FAQ, status og feilmeldinger er oversatt. Språket sendes til Stripe Checkout og kundeportalen. Ved språkbytte erstattes en åpen Checkout-økt slik at den får riktig språk.

Under «Ditt abonnement» får eier en egen «Si opp abonnement» / «Cancel subscription»-knapp. Den åpner [Stripes bekreftelse for oppsigelse](https://docs.stripe.com/customer-management/portal-deep-links); å åpne siden sier ikke opp abonnementet. Serveren velger abonnement fra den private betalingskontoen og verifiserer kunde/eier. Oppsigelse skjer ved periodeslutt med eksisterende portalkonfigurasjon. Allerede planlagt oppsigelse viser sluttdato og beholder tilgang ut perioden.

Kontrollert lokalt: språkbytte, lagret språk, årsbeløp og mobilvisning i nettleser; 32 emulator-/regeltester og typekontroll. Ekte Stripe-sandbox bekrefter engelsk Checkout, oppsigelseslenke uten umiddelbar oppsigelse, betalt testabonnement og nedgradering etter oppsigelse. Ingen live-abonnementer ble endret.


| Plan | Måned | År | Samtaler/dag | Meldinger/dag | Widgeter | Medlemmer inkl. eier |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Gratis | 0 kr | 0 kr | 20 | 100 | 1 | 1 |
| Pro | 299 kr | 2 990 kr | 500 | 2 500 | 3 | 5 |
| Enterprise | 999 kr | 9 990 kr | 2 000 | 10 000 | 10 | 20 |

Prisene er i NOK og opprettet med `tax_behavior: inclusive`. Eventuell avgiftsregistrering og regnskapsoppsett må samsvare med virksomhetens Stripe-konto. Automatisk Stripe Tax er ikke aktivert av oppsettskriptet.

## Aktivt i produksjon

Prissiden er publisert på https://chat.vintrastudio.com/priser og https://www.vintranordic.com/priser.

- Vercel-prosjekt: `vintrachat-xoxo`, team `vintrastudios-projects`.
- Aktiv produksjonsdeploy: `dpl_DxbZ3kgiBeJzSTusoXFSG31kf9q9`, publisert 8. november 2026 og promotert til begge domenene.
- Stripe live-konto: `acct_1T00euFOi3fYphOT`, ressurs `stripe-live-vintrastudio` (`ir_6WulzNLArLEIv5z7`), koblet **kun til Production**. Stripe har bekreftet at både betalinger og utbetalinger er aktivert.
- Sandbox: `Vintra-box` (`ir_i1AObcZehRLytXMh`), koblet til **Development og Preview**. Lokal `.env.local` bruker fortsatt testnøkkelen.
- Fire live-priser i NOK er opprettet og kontrollert mot tabellen ovenfor. Andre eksisterende Stripe-produkter/priser er beholdt.
- Kundeportal: `bpc_1UZLokFOi3fYphOT6BCceIv6`. Fakturaer, betalingsmåte, planbytte og oppsigelse ved periodeslutt er aktivert.
- Webhook: `we_1UZLolFOi3fYphOTWsUzAv9g`, URL `https://chat.vintrastudio.com/api/billing/webhook`, med de åtte betalings-/abonnementshendelsene i oppsettskriptet.
- `BILLING_APP_URL`, `STRIPE_PORTAL_CONFIGURATION_ID` og `STRIPE_WEBHOOK_SECRET` er satt i Production. Signeringshemmeligheten er lagret som Secret. Ingen hemmeligheter er versjonskontrollert.
- `firestore.rules` er kompilert og publisert til `vintrasolutions-f58a7`. Reglene og serveren håndhever gratisgrensene.
- `.vercelignore` i repositoriets rot utelukker miljøfiler, `.audit`, emulatorlogger og byggecache fra CLI-opplastinger.

Betalingsreturen og kundeportalen bruker samme verifiserte nettsted som kunden startet på (`chat.vintrastudio.com`, `vintranordic.com` eller `www.vintranordic.com`), slik at innloggingen beholdes. Andre verter bruker `BILLING_APP_URL`. Ved bytte av nettsted erstattes en åpen Checkout-økt med en ny som har riktig returadresse.

Den tidligere forhåndsvisningen er fortsatt tilgjengelig på https://vintrachat-xoxo-rfspg0kej-vintrastudios-projects.vercel.app/priser, men bruker testoppsett og er beskyttet av Vercel Authentication.

## Lokal kjøring

Vanlig `npm run dev` bruker `.env.local` og eksisterende Firebase-oppsett. Besøk `http://localhost:3000/priser`. Logg inn som bedriftseier for å kjøpe. Bare bekreftede, aktive eiere kan åpne Checkout eller kundeportalen.

Lokale variabler:

```dotenv
STRIPE_SECRET_KEY=
STRIPE_PORTAL_CONFIGURATION_ID=
STRIPE_WEBHOOK_SECRET=
BILLING_APP_URL=http://localhost:3000
```

Checkout bruker en Stripe-side. Ingen offentlig Stripe-nøkkel er nødvendig i nettleseren. Kjør `npm run setup:stripe` for å opprette/validere katalogen og konfigurere kundeportalen på kontoen som nøkkelen tilhører. Oppsettskriptet lagrer portal-ID i `.env.local`.

For lokale webhooks, bruk Stripe CLI med samme sandbox-konto:

```sh
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Lagre signeringshemmeligheten fra denne lytteren som `STRIPE_WEBHOOK_SECRET`, og start dev-serveren på nytt. Denne hemmeligheten er forskjellig fra signeringshemmeligheten til et publisert webhook-endepunkt. Betalingens returside verifiserer kjøpet server-side også uten lokal webhook-lytter, men senere betalings- og oppsigelseshendelser krever webhooks.

## Produksjon

1. Aktiver virksomhetens Stripe-konto. Importer live-kontoen fra https://vercel.com/marketplace/stripe via pilen ved **Install → Import Existing Stripe Account → Continue to Stripe → Done**, i teamet `vintrastudios-projects`. Koble live-ressursen til `vintrachat-xoxo` kun for Production, og behold sandboxen for Development/Preview. Ikke opprett en ny sandbox som erstatning for live-kontoen.
2. Sett `STRIPE_SECRET_KEY` og `BILLING_APP_URL` til live-nøkkel og den faktiske HTTPS-adressen. Sett aldri hemmeligheter i `NEXT_PUBLIC_*` eller i Git.
3. Kjør `npm run setup:stripe -- --live --webhook` i et sikkert miljø med disse variablene. Alternativt kan `--env-file .env.billing-production.local` brukes for et eksplisitt, ignorert miljøoppsett. Et eksplisitt miljøoppsett faller aldri tilbake til lokale testnøkler. Skriptet krever en live-nøkkel med `--live` og lagrer genererte live-innstillinger i `.env.billing-live.local`, slik at lokal sandbox-konfigurasjon beholdes. Skriptet oppretter live-priser, kundeportal og webhook. Live- og testobjekter har forskjellige ID-er.
4. Legg den resulterende `STRIPE_PORTAL_CONFIGURATION_ID` og `STRIPE_WEBHOOK_SECRET` i produksjonsprosjektets servervariabler. Webhook-URL: `https://DITT-DOMENE/api/billing/webhook`. Endepunktet må være offentlig tilgjengelig for Stripe, uten Vercel Deployment Protection.
5. Publiser appen og `firestore.rules` sammen. Reglene er nødvendige for å hindre omgåelse av widget- og abonnementsgrenser. Bruk riktig Firebase-prosjekt: `vintrasolutions-f58a7`.
6. Kontroller webhook-leveranser og gjennomfør en avtalt live-verifikasjon før betalingen annonseres. Et grønt lokalt testresultat er ikke en bekreftelse på produksjonsoppsett.

Appen nekter testnøkler på Vercel Production. Ingen produksjonsnøkler, kontoverifisering eller domenevalg gjettes av oppsettskriptet.

## Hvordan tilgangen håndheves

- `/api/billing` tilbyr status, Checkout, kundeportal, bekreftelse og oppdatering. Pris og beløp bestemmes på serveren.
- En transaksjonslås per bedrift og Stripe-idempotens forhindrer parallelle kjøp. Eksisterende abonnementer går til kundeportalen, og åpne betalingsøkter gjenbrukes.
- `/api/billing/webhook` kontrollerer signaturen på rå request-body. Hver relevant hendelse henter gjeldende abonnement direkte fra Stripe. Gamle eller gjentatte hendelser kan dermed ikke gjenopprette et avsluttet abonnement. Feil gir ikke 2xx, slik at Stripe prøver igjen.
- Betalt tilgang krever kjent pris, aktivt abonnement, betalt siste faktura og en gyldig periode. Oppsigelse ved periodeslutt beholder tilgangen frem til sluttdatoen. Ubetalte/utløpte abonnementer faller tilbake til Gratis.
- Kunde-ID-er, låser og betalingsøkter ligger i den private `billingAccounts`-samlingen. Bedriften har en skrivebeskyttet `billing`-status for visning og tilgangskontroll.
- `businesses/{id}/billingUsage/{YYYY-MM-DD}` reserverer samtaler og meldinger atomisk før behandling. Kvoten gjelder hele bedriften, nullstilles ved midnatt UTC og bruker ikke klientredigerbar analysehistorikk. En reservert forespørsel teller også dersom en ekstern AI-tjeneste senere feiler. Sesjoner er skilt per widget og dag; selvvalgte sesjons-ID-er omgår ikke grensen.
- Ekstra widgeter opprettes gjennom `/api/widgets`. Ved nedgradering er bare planens antall widgeter aktive. Den valgte hovedwidgeten prioriteres, deretter de eldste widgetene.
- Teammedlemmer utover betalt grense deaktiveres ved synkronisering, men slettes ikke. Eier beholdes. Medlemmer deaktivert av abonnementet kan reaktiveres ved oppgradering. Utløpt betalt periode sperrer også ekstra medlemmer i Firestore-reglene.
- Tidligere manuelt tildelte planer uten Stripe-abonnement beholdes. Vanlige brukere kan ikke tildele seg selv en plan. Når bedriften får et Stripe-abonnement, styrer Stripe tilgangen.
- Orb, glassutseende og egne grensesnittikoner filtreres i serverens offentlige widgetkonfigurasjon for Gratis.

## Verifikasjon

```sh
npm run typecheck
npm run build
npm run test:billing
npm run test:billing-http
RUN_STRIPE_SANDBOX_TEST=1 npm run test:stripe
```

Emulatortestene krever Java 21+. De nekter å kjøre mot produksjonsdata. Sandbox-testen krever en `sk_test_`-nøkkel og tester ekte Stripe Checkout, 299 NOK, gjenbruk av økt, kundeportal, betalt abonnement, oppsigelse og forsinkede hendelser. Den rydder opp sine testkunder og abonnementer etterpå. Den fullfører abonnementet med Stripes testbetalingsmetode via API; den simulerer ikke kortinntasting eller 3DS i en nettleser.

Siste lokale kontroll: 32 betaling-/Firestore-regeltester passerer, inkludert siste tillatte samtale/melding for alle tre planer, medlemsgrenser på 1/5/20 inkludert eier og reserverte invitasjoner, og riktig returadresse ved bytte av nettsted. Typekontroll består. Tidligere Vercel-bygg, auth-/varslings-/widgettester, HTTP-signaturtest og Stripe-sandbox-test bestod. Sandbox-testen dekker betalt testabonnement, oppsigelse og gamle webhook-hendelser.

Lokal rettelse etter dobbeltsjekk: eksisterende teammedlemmer på Gratis uten Stripe-abonnement nektes nå tilgang i både serverens tilgangskontroll og Firestore-reglene. Eier beholder tilgang. Denne rettelsen er ennå ikke publisert; app og Firestore-regler må publiseres sammen. Tidligere manuelt tildelte Pro-/Enterprise-planer er fortsatt støttet.

Produksjonskontroll 8. november 2026:

- Nettleser: innlogging → prisside → ekte Stripe Checkout for Pro med 299 NOK. Betalingsskjemaet og knappen «Betal og abonner» vises. Årsprisene vises riktig, ingen horisontal overløp på 390 px og ingen JavaScript-feil.
- API: eierkontroll, avvisning av uinnloggede/andre bedrifter, serverbestemt beløp, gjenbruk av betalingsøkt, kundeportal og manglende betalt tilgang før betaling er bekreftet.
- Sluttkontroll etter publisering: alle fire prisvalg opprettet ekte Checkout-økter med riktig NOK-beløp og betalingsintervall. Bytte mellom de to domenene ga riktig returadresse, avsluttet forrige åpne økt og gjenbrukte den nye ved gjentatt forespørsel. Prissiden svarte HTTP 200 og kundeportalen kunne åpnes fra begge domenene.
- Gratis: første widget kan opprettes, andre avvises. Direkte forsøk på å gi seg selv betalt tilgang avvises av de publiserte Firestore-reglene.
- Webhook: riktig signatur gir 200 og feil signatur gir 400. En faktisk live-hendelse fra Stripe (`customer.updated`, kun for kontrollkunden) ble levert til produksjon med HTTP 200 og `pending_webhooks: 0`. Webhooken ble deretter satt tilbake til de åtte abonnementshendelsene.
- Opprydding: kontrollkunden i Stripe, åpne kontrolløkter, kontrollbedriften og innloggingskontoen i Firebase er fjernet. Den midlertidige Vercel-tilgangen er tilbakekalt, og lokale midlertidige live-nøkler er slettet. Produksjonsvariablene og lokal sandbox er beholdt.

Ingen ekte kortbelastning er gjennomført. Betalt oppgradering, fornyelse, 3DS og oppsigelse etter et faktisk kortkjøp er derfor ikke bekreftet i live; abonnementsendringene er kontrollert i sandbox.

Referanser: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create), [webhooks](https://docs.stripe.com/webhooks), [kundeportal](https://docs.stripe.com/customer-management).
