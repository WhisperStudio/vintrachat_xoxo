# Innlogging på localhost

Nettleseren og serveren bruker samme Firebase-prosjekt, `vintrasolutions-f58a7`.
Firebase Auth logger inn brukeren. Serveren verifiserer ID-tokenet og kontrollerer
bedriftsmedlemskapet. Dette er to deler av samme innlogging.

Firebase Admin-legitimasjon må finnes lokalt for at serveren skal kunne kontrollere
kontoen. Firebase-konfigurasjonen i nettleseren erstatter ikke denne.

Kjør fra `my-app`:

```powershell
npx firebase login
npm run setup:local
npm run dev
```

CLI-kontoen må ha tilgang til Firebase-prosjektet. Start en allerede kjørende
utviklingsserver på nytt etter `setup:local`. Scriptet lagrer legitimasjonen i
gitignorerte filer og endrer ikke Firebase-data eller produksjonskonfigurasjon.

Alternativt kan `.env.development.local` angi `FIREBASE_PROJECT_ID` og
`GOOGLE_APPLICATION_CREDENTIALS` med absolutt filsti til eksisterende, godkjent
ADC-/servicekonto-legitimasjon. Legg aldri private nøkler i `NEXT_PUBLIC_*`,
kildefiler eller Git.

Ved ADC-oppsett trenger verifiserings- og passordlenker også en lokal
`AUTH_RECORD_SIGNING_KEY` (32 tilfeldige byte) og `NEXT_PUBLIC_APP_URL` med riktig
localhost-port. `setup:local` oppretter disse; URL-en hentes fra
`NEXT_PUBLIC_APP_URL_LOCAL` hvis den finnes, ellers `http://localhost:3000`.
Den separate signeringsnøkkelen brukes kun i lokal utvikling uten servicekontonøkkel.

Ved feil vises en feilmelding med «Prøv igjen». En serverfeil skal ikke behandles
som en gjestesession eller gi automatisk tilgang. En verifisert bruker uten
bedriftsmedlemskap sendes til invitasjonssiden. En bruker med medlemskap sendes
til `/admin` etter innlogging. Serverens kontroll av token, tilbakekalling,
verifisert e-post og medlemskap gjelder også på localhost.
