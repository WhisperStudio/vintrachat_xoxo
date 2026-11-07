# Stripe og abonnementer

Prissiden er `/priser`. Prisene og grensene ligger samlet i `src/lib/billing/catalog.mjs`.

| Plan | Måned | År | Samtaler/dag | Meldinger/dag | Widgeter | Medlemmer inkl. eier |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Gratis | 0 kr | 0 kr | 20 | 100 | 1 | 1 |
| Pro | 299 kr | 2 990 kr | 500 | 2 500 | 3 | 5 |
| Enterprise | 999 kr | 9 990 kr | 2 000 | 10 000 | 10 | 20 |

Prisene er i NOK og opprettet med `tax_behavior: inclusive`. Eventuell avgiftsregistrering og regnskapsoppsett må samsvare med virksomhetens Stripe-konto. Automatisk Stripe Tax er ikke aktivert av oppsettskriptet.

## Klargjort og testet

- Stripe-sandbox `Vintra-box` er koblet til `vintrachat-xoxo` i Vercel-teamet `vintrastudios-projects`.
- Fire gjentakende Stripe-priser og kundeportal er opprettet på denne sandbox-kontoen. Ingen ekte betaling er tatt.
- Testnøkler er hentet til ignorerte lokale miljøfiler. Ingen hemmeligheter er versjonskontrollert.
- Vercel CLI er nå logget inn på riktig konto og har bekreftet tilgang til prosjektet. Vercel-utvidelsen gir fortsatt 403 for miljøvariabler; CLI fungerer.
- `STRIPE_PORTAL_CONFIGURATION_ID` er satt for Development og Preview i Vercel. De tilkoblede Stripe-nøklene er testnøkler; live-nøkler, produksjonswebhook og produksjonsutrulling gjenstår.
- Den lokale Stripe-konfigurasjonen bruker nå `Vintra-box`. Den tidligere testsandboxen `stripe-coral-tree`/`vintrachat-billing-sandbox` er separat og brukes ikke av dette prosjektet. Ikke gjenbruk portal-ID eller webhook-hemmelighet på tvers av kontoer eller test/live.
- Firebase CLI har bekreftet tilgang til `vintrasolutions-f58a7`. Databasereglene skal publiseres sammen med appen; de er ennå ikke publisert.
- `.vercelignore` i repositoriets rot utelukker lokale miljøfiler, `.audit`, emulatorlogger og byggecache fra CLI-opplastinger. Dette er kontrollert med `vercel deploy --dry`.

Sandboxen administreres under Stripe-integrasjonen i Vercel-teamet `vintrastudios-projects`, ressurs `Vintra-box`. Overtakelse av sandboxen og aktivering av ekte betaling må fullføres av kontoeieren i Stripe.

Kontroll etter at kontoeieren meldte om live-aktivering: Vercel Production bruker fortsatt `sk_test_`, alle fire prisene har `livemode: false`, og kontoen som appen er koblet til er fortsatt sandbox. `STRIPE_WEBHOOK_SECRET`, `STRIPE_PORTAL_CONFIGURATION_ID` og `BILLING_APP_URL` mangler i Production. `/priser` gir foreløpig 404 på begge produksjonsdomenene. Dette sier ikke noe om aktiveringen av kontoeierens separate live-konto; den må importeres og kobles til appen.

## Publisert forhåndsvisning

Prisside: https://vintrachat-xoxo-rfspg0kej-vintrastudios-projects.vercel.app/priser

Deployment `dpl_JAm3X3A7AHschjhakt6sJpmMSJVi` er READY i Preview, med Vercel Authentication. Bygget bestod på Vercel. Nettleserkontrollen bekreftet de tre planene, 299/999 kr, ingen JavaScript-feil og ingen horisontal overløp på 390 px. Checkout uten innlogging gir 401.

Dette er en forhåndsvisning av appen. Produksjonsdomenene er ikke flyttet. Ekstern betalingsretur og webhooks er ikke konfigurert for denne beskyttede forhåndsvisningen; full betalingsflyt er foreløpig verifisert med Stripe-sandbox og isolert lokal Firestore-emulator. `BILLING_APP_URL`, riktig live-nøkkel og webhook må settes før produksjon.

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

Siste kontroll: 22 betaling-/Firestore-regeltester passerer, i tillegg til bygg/typekontroll, de eksisterende auth-/varslings-/widgettestene, ekte Stripe-sandbox-test og HTTP-signaturtest. Stripe-sandbox-testen er også kjørt på den nye `Vintra-box`-kontoen: Checkout, kundeportal, betalt testabonnement, oppsigelse og gamle webhook-hendelser bestod. Testkundene og abonnementene ble ryddet opp.

Nettleseren er kontrollert på desktop og 390 px mobilbredde: priskort, årsvalg, ingen horisontal overløp, ingen JavaScript-feil og 401 for Checkout uten innlogging. Innlogget nettleserflyt, 3DS, faktiske webhook-leveranser fra Stripe til produksjon og live-betaling gjenstår til riktig konto og produksjonstilgang er tilgjengelig.

Referanser: [Stripe Checkout](https://docs.stripe.com/api/checkout/sessions/create), [webhooks](https://docs.stripe.com/webhooks), [kundeportal](https://docs.stripe.com/customer-management).
