# Miljøvariabel Setup Guide

## 📋 Struktur for miljøvariabler

### 1. `.env.local` (lokal utvikling)
```env
# Resend API
RESEND_API_KEY=re_BTPTtUf7_LDUyBbXD5vtuJmbVxX1nehhp

# Email settings
RESEND_FROM_EMAIL=Your App <no-reply@vintrastudio.com>

# App URL (lokal utvikling)
NEXT_PUBLIC_APP_URL_LOCAL=http://localhost:3000
```

### 2. Vercel Environment Variables (produksjon)
I Vercel dashboard → Settings → Environment Variables, legg til:
```
RESEND_API_KEY=re_BTPTtUf7_LDUyBbXD5vtuJmbVxX1nehhp
NEXT_PUBLIC_APP_URL=https://din-domene.com
RESEND_FROM_EMAIL=Your App <no-reply@vintrastudio.com>
```

## 🔧 Kode-eksempel for å bruke riktig URL

```typescript
// Hent riktig URL basert på miljø
const getAppUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side - bruk current origin
    return window.location.origin
  }
  
  // Server-side - sjekk miljøvariabler
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_APP_URL_LOCAL || 'http://localhost:3000'
  }
  
  return process.env.NEXT_PUBLIC_APP_URL || 'https://din-domene.com'
}

// Bruk i koden
const appUrl = getAppUrl()
```

## 📝️ Oppdateringer i koden

### 1. I API-routes eller server-side kode:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const appUrl = process.env.NODE_ENV === 'development' 
  ? process.env.NEXT_PUBLIC_APP_URL_LOCAL 
  : process.env.NEXT_PUBLIC_APP_URL

// Bruk appUrl i email templates
```

### 2. I client-side komponenter:
```typescript
// Bruk NEXT_PUBLIC_ variabler direkte
const baseUrl = process.env.NEXT_PUBLIC_APP_URL_LOCAL || 
                process.env.NEXT_PUBLIC_APP_URL || 
                'http://localhost:3000'
```

## ✅ Viktige punkter

1. **NEXT_PUBLIC_** prefix gjør variabelen tilgjengelig client-side
2. **Lokal URL** skal ha `_LOCAL` suffiks
3. **Produksjons URL** skal ikke ha `_LOCAL` suffiks
4. **Vercel** vil automatisk bruke `NEXT_PUBLIC_APP_URL` i produksjon

## 🚀 Deploy til Vercel

1. Push koden til GitHub
2. I Vercel dashboard, koble til repository
3. Sett miljøvariabler i Vercel Settings
4. Deploy - Vercel vil automatisk bruke produksjonsvariablene
