# Lokal utvikling

Kjør kommandoene fra `my-app/`.

```sh
# Forutsetter en eksisterende Firebase CLI-innlogging (npx firebase login).
npm run setup:local
npm run dev
```

`setup:local` bruker den eksisterende Firebase CLI-innloggingen til å sette opp
servertilgang til `vintrasolutions-f58a7`. Den oppretter ingen servicekontonøkler
og endrer ingen Firebase-data. Innloggingen må ha tilgang til prosjektet.

Konfigurasjonen lagres i `.env.development.local`, og legitimasjonen i
`.audit/local-admin-credentials.json`. Begge ignoreres av Git og får filmodus 0600.
Eksisterende miljøvariabler i filen overskrives ikke. Kjør oppsettet igjen etter
fornyet Firebase CLI-innlogging dersom legitimasjonen er tilbakekalt eller utløpt.

Dette kobler den lokale nettsiden til det **eksisterende Firebase-prosjektet**,
ikke en emulator. Lokal pushlevering er deaktivert. Serveren godtar denne lokale
legitimasjonen bare i utviklingsmodus utenfor Vercel. Produksjon bruker fortsatt
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` og `FIREBASE_PRIVATE_KEY`.

Manglende serverkonfigurasjon gir HTTP 503. Ugyldige eller tilbakekalte
brukertoken gir fortsatt HTTP 401. Innloggingssiden venter på bedriftstilgangen
før panelet åpnes og viser en feil med mulighet til å prøve igjen hvis kontoen
ikke kan hentes.

```sh
npm run test:auth
npm run test:notifications
npm run typecheck
npm run build
```

Lokal serverkonfigurasjon bruker Firebase Admin SDKs
[Application Default Credentials](https://firebase.google.com/docs/admin/setup#testing_with_gcloud_end_user_credentials).
Ingen serverlegitimasjon skal ha prefikset `NEXT_PUBLIC_`.
