# Firebase Firestore Database Setup

## Oversikt

Systemet bruker Firebase Authentication (Google Sign-In) og Firestore for å lagre brukerdata og bedriftsinformasjon.

### Samlinger (Collections)

#### 1. `users`
Inneholder minimal brukerinformasjon - kun email og referanse til bedrift.

```
users/
├── {userId}/
│   ├── id: string (Firebase UID)
│   ├── email: string
│   ├── businessId: string (referanse til bedrift)
│   ├── role: 'admin' | 'user'
│   ├── displayName: string
│   ├── photoURL: string
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── lastLogin: Timestamp
```

#### 2. `business`
Inneholder bedriftsinformasjon og chat widget konfigurering.

```
business/
├── {businessId}/
│   ├── id: string
│   ├── businessName: string
│   ├── adminEmail: string
│   ├── users: [userId] (alle som har tilgang)
│   ├── chatWidgetKey: string (randomly generert - unik nøkkel for chat widget)
│   ├── chatWidgetConfig: {
│   │   ├── designLevel: 'standard' | 'premium' | 'elite'
│   │   ├── colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury'
│   │   ├── position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
│   │   ├── customBranding: { title, description, logo }
│   │   └── settings: { autoOpen, delayMs, ... }
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

#### 3. `invitations`
Inneholder invitasjoner for å legge til nye brukere til bedriften.

```
invitations/
├── {invitationId}/
│   ├── businessId: string
│   ├── businessName: string
│   ├── inviteEmail: string
│   ├── inviteRole: 'admin' | 'user'
│   ├── createdBy: string (userId som opprettet invitasjonen)
│   ├── createdAt: Timestamp
│   ├── expiresAt: Timestamp (30 dager)
│   ├── used: boolean
│   └── usedAt: Timestamp
```

---

## Autentisering Flow

### 1. Google Sign-In
```
Bruker klikker "Sign in with Google"
    ↓
Google popup åpner
    ↓
Bruker autentiserer
    ↓
Vi sjekker `users` collection
    ├─ HVIS bruker finnes → Hent bruker + bedrift info → Logg inn
    └─ HVIS bruker IKKE finnes → Gå til signup flow
```

### 2. Signup Flow

**Scenario A: Bruker oppstarter ny bedrift (bedriftsadmin)**
```
Bruker velger "Jeg oppretter bedrift"
    ↓
Bruker fylles inn bedriftsnavn
    ↓
Vi opprettter:
  1. Business dokument med:
     - businessName
     - adminEmail
     - users: [userId]
     - chatWidgetKey (randomly generert)
     - chatWidgetConfig (default)
  2. User dokument med:
     - role: 'admin'
     - businessId: (referanse til business)
    ↓
Bruker omdirigeres til dashboard
```

**Scenario B: Bruker blir invitert/er bruker**
```
Bruker velger "Jeg ble invitert / Jeg er bruker"
    ↓
Venter på invitasjon fra admin
    ↓
Admin opprettter invitation (via dashboard)
    ↓
Bruker mottar email med invitasjonslink
    ↓
Bruker klikker link og godtar invitasjon
    ↓
Vi opprettter:
  1. User dokument med:
     - role: 'user' eller 'admin' (avhengig av invitation.inviteRole)
     - businessId: invitation.businessId
  2. Vi legger brukeren til business.users array
  3. Vi markerer invitation som used
    ↓
Bruker omdirigeres til dashboard
```

---

## Roller og Tilganger

### Admin
- Kan se all bedriftsinformasjon
- Kan legge til/fjerne brukere (via invitasjoner)
- Kan gi brukere admin/user rettigheter
- Kan konfigurere chat widget design og innstillinger
- Kan se alle bruker i bedriften

### User
- Kan se bedriftsinformasjon
- Kan bruke chat widget
- Kan se sitt eget profil
- Kan IKKE administrere brukere

---

## Bruk av Auth Context

### I komponenter:

```typescript
import { useAuth } from '@/components/auth-context';

export function MyComponent() {
  const { firebaseUser, dbUser, business, loading, error } = useAuth();

  if (loading) return <div>Laster...</div>;
  if (error) return <div>Feil: {error}</div>;

  if (!dbUser) {
    return <div>Logg inn først</div>;
  }

  return (
    <div>
      <h1>Hei {dbUser.displayName}</h1>
      <p>Bedrift: {business?.businessName}</p>
      <p>Din rolle: {dbUser.role}</p>
    </div>
  );
}
```

---

## Chat Widget Nøssl (API Key)

Hver bedrift får en unik, randomly generert `chatWidgetKey` når bedriften opprettes.

### Hvordan bruke:
1. Bedrift logger inn i dashboard
2. Kopierer `chatWidgetKey` fra settings
3. Bruker nøkkelen for å embedde chat widget på deres website: `<ChatWidget apiKey="WIDGET_KEY" />`

### Config for widget:
```typescript
// Dashboard kan endring:
- designLevel: 'standard' | 'premium' | 'elite'
- colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury'
- position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
- customBranding: { title, description, logo }
- settings: { autoOpen, delayMs, ... }
```

Widget ser disse endringene automatisk når bedriften oppdaterer config.

---

## Sikkerhetsregler (Firestore Rules)

Se `FIRESTORE_RULES.txt` for detaljerte regler.

**Hovedpunkter:**
- Bruker kan bare lese/skrive sin egen brukerdata
- Admin kan lese alle brukere i sin bedrift
- Bruker som tilhører bedrift kan lese bedrift-dokumentet
- Admin kan oppdatere bedriftsinformasjon
- Admin kan invitere nye brukere

---

## Implementering på Firebase Console

1. Gå til https://console.firebase.google.com
2. Velg prosjekt: **vintrasolutions-f58a7**
3. Gå til **Firestore Database**
4. Klikk **Rules** (ikke Start in locked mode)
5. Kopier innholdet fra `FIRESTORE_RULES.txt`
6. Klikk **Publish**

**OBS:** Rules må være publisert før systemet kan fungere!

---

## Filer og Imports

### Importere Auth Funksjoner:
```typescript
import { 
  signInWithGoogle,
  signUpNewUser,
  signOut,
  getBusinessInfo,
  updateChatWidgetConfig
} from '@/lib/auth';

import {
  createInvitation,
  acceptInvitation,
  getBusinessInvitations
} from '@/lib/invitations';
```

### Bruke Auth Context:
```typescript
import { useAuth } from '@/components/auth-context';
```

### Typer:
```typescript
import { User, Business, UserRole, Invitation } from '@/types/database';
```

---

## Eksempel: Opprett Bedrift Signup

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpNewUser } from '@/lib/auth';
import { User as FirebaseUser } from 'firebase/auth';

export function SignupForm({ firebaseUser }: { firebaseUser: FirebaseUser }) {
  const [businessName, setBusinessName] = useState('');
  const [isBusinessAdmin, setIsBusinessAdmin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signUpNewUser(
      firebaseUser,
      isBusinessAdmin,
      businessName,
      firebaseUser.displayName || undefined
    );

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
    } else {
      alert(result.message);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSignup}>
      <div>
        <label>
          <input
            type="radio"
            checked={isBusinessAdmin}
            onChange={() => setIsBusinessAdmin(true)}
          />
          Jeg oppstarter bedrift
        </label>
        <label>
          <input
            type="radio"
            checked={!isBusinessAdmin}
            onChange={() => setIsBusinessAdmin(false)}
          />
          Jeg er bruker / ventar på invite
        </label>
      </div>

      {isBusinessAdmin && (
        <div>
          <label htmlFor="businessName">Bedriftsnavn</label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Oppretter...' : 'Neste'}
      </button>
    </form>
  );
}
```

---

## Tips & Beste Praksis

1. **Always use the AuthContext** - Ikke hent brukerdata direkte i komponenter, bruk `useAuth()`
2. **Check roles before rendering** - Sjekk `dbUser.role` før du viser admin-funksjoner
3. **Error handling** - Alltid håndter feil fra database-kall
4. **Chat Widget Key** - Vær nøye med denne - den skal være secret for bedriften
5. **Timestamps** - Bruk alltid `serverTimestamp()` for konsistens

---

## Neste Steg

1. ✅ Opprett Collections i Firestore (manuelt eller via Firebase CLI)
2. ✅ Publiser Security Rules fra `FIRESTORE_RULES.txt`
3. ✅ Implementer Google OAuth i Firebase Console
4. ✅ Test signup flow i dev environment
5. ✅ Lag invite email template
6. ✅ Lag dashboard for admin-funksjoner
