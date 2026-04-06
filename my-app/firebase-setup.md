# Firebase Service Account Setup

## 🚨 Build-feil løsning

Build-feilen skyldes manglende Firebase miljøvariabler. Du må legge til disse i `.env.local`:

```env
# Firebase Service Account (hent fra Firebase Console)
FIREBASE_PROJECT_ID=ditt-prosjekt-id
FIREBASE_PRIVATE_KEY_ID=din-private-key-id  
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nDIN_PRIVATE_KEY_HER\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=din-service-account@din-prosjekt.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=din-client-id

# Eksisterende variabler
RESEND_API_KEY=re_BTPTtUf7_LDUyBbXD5vtuJmbVxX1nehhp
RESEND_FROM_EMAIL=Your App <no-reply@vintrastudio.com>
NEXT_PUBLIC_APP_URL_LOCAL=http://localhost:3000
```

## 🔧 Hvordan hente Firebase credentials:

1. Gå til [Firebase Console](https://console.firebase.google.com/)
2. Velg ditt prosjekt
3. Gå til **Project Settings** (tannhjul-icon) → **Service accounts**
4. Klikk på **Generate new private key**
5. Velg **JSON** og last ned filen
6. Åpne JSON-filen og kopier verdiene:

```json
{
  "project_id": "ditt-prosjekt-id",
  "private_key_id": "din-private-key-id", 
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "din-service-account@...",
  "client_id": "din-client-id"
}
```

## 📝️ Oppdater .env.local:

Legg til verdiene over i din `.env.local` fil. Husk å:
- Bruke doble anførselstegn rundt private key
- Erstatte \n med \\n i private key
- Ikke commit .env.local til Git!

## ✅ Etter oppdatering:

1. Lagre `.env.local`
2. Kjør `npm run build` igjen
3. Deploy til Vercel med miljøvariabler i Vercel dashboard

## 🔒 For Vercel (produksjon):

I Vercel dashboard → Settings → Environment Variables, legg til:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY` 
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_CLIENT_ID`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (uten _LOCAL)
