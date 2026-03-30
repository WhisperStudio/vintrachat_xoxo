# Email/Password Authentication Setup Guide

## ✅ What's Been Done

1. **Fixed Firebase initialization** - Analytics only loads on client-side
2. **Created email/password auth system** with:
   - Sign-up with email verification
   - Sign-in with credential check
   - Forgot password flow
   - Password reset via email
3. **Integrated Resend** for email sending
4. **Updated Firestore types** to support email verification tokens
5. **Created auth pages**:
   - `/auth/signup` - Email/password signup
   - `/auth/login` - Email/password login
   - `/auth/verify-email` - Email verification (called from email link)
   - `/auth/verify-email-sent` - Confirmation page after signup
   - `/auth/forgot-password` - Request password reset
   - `/auth/reset-password` - Reset password with token

---

## 🔧 Setup Required

### Step 1: Set Up Firebase Admin SDK (For Password Reset)

Password reset requires Firebase Admin SDK to securely update passwords. Here's how to set it up:

1. Go to https://console.firebase.google.com → **Settings** (gear icon) → **Service Accounts**
2. Click **Generate New Private Key**
3. A JSON file will download - keep it safe!
4. Create file: `serviceAccountKey.json` in the `my-app/` directory (same level as `package.json`)
5. Paste the JSON content into that file
6. **IMPORTANT:** Add `serviceAccountKey.json` to `.gitignore` (never commit secrets!)
7. Install Firebase Admin SDK:
   ```
   npm install firebase-admin
   ```

### Step 2: Get Resend API Key

1. Go to https://resend.com
3. Sign up for free account
4. Create an API key
5. Copy it

### Step 3: Update .env.local

Edit `c:\Users\se2\Documents\VOTE\vintrachat_xoxo\my-app\.env.local`:

```
NEXT_PUBLIC_RESEND_API_KEY=re_YOUR_API_KEY_HERE
NEXT_PUBLIC_RESEND_FROM_EMAIL=noreply@vintrachat.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace `re_YOUR_API_KEY_HERE` with your actual Resend API key.

### Step 4: Update Gmail/Email Sender (Optional)

If you want to send from your own domain:
1. In Resend, verify your domain
2. Update `NEXT_PUBLIC_RESEND_FROM_EMAIL` to your custom email

For now, use Resend's default email or a test email.

### Step 5: Publish Firestore Security Rules

1. Go to https://console.firebase.google.com
2. Select project: **vintrasolutions-f58a7**
3. **Firestore Database** → **Rules**
4. Replace with rules from `FIRESTORE_RULES.txt`
5. Click **Publish**

### Step 6: Test

1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/auth/signup
3. Fill in form with test data:
   - Account type: Bedriftsadmin
   - Business name: Test Company
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Click "Opprett Konto"
5. You should see "Sjekk email for å verifisere kontoen"
6. Check your email inbox (from Resend)
7. Click verification link
8. You'll be redirected to login
9. Log in with email and password
10. You should be logged in!

---

## 📁 Authentication Flow

```
User Signs Up
├─ Validates input
├─ Creates Firebase Auth user
├─ Saves user to Firestore (emailVerified: false)
├─ Generates verification token
├─ Sends verification email via Resend
└─ Shows "Check your email" page

User Clicks Email Link
├─ Token is verified
├─ emailVerified set to true
└─ Token is cleared

User Logs In
├─ Validates email + password
├─ Checks emailVerified === true
└─ Updates lastLogin timestamp

User Forgets Password
├─ Requests reset
├─ Generates reset token
├─ Sends reset email
└─ User clicks link

User Resets Password
├─ Token is verified
├─ Password updated in Firebase Auth
└─ Token is cleared
```

---

## 🗄️ Database Schema (Firestore)

### Users Collection

```
users/
├── {userId}/
│   ├── id: string
│   ├── email: string
│   ├── businessId: string
│   ├── role: 'admin' | 'user'
│   ├── displayName: string
│   ├── photoURL: string
│   ├── emailVerified: boolean ← NEW
│   ├── emailVerificationToken: string ← NEW
│   ├── emailVerificationTokenExpiry: timestamp ← NEW
│   ├── passwordResetToken: string ← NEW
│   ├── passwordResetTokenExpiry: timestamp ← NEW
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── lastLogin: timestamp
```

### Business Collection

```
business/
├── {businessId}/
│   ├── id: string
│   ├── businessName: string
│   ├── adminEmail: string
│   ├── users: [userId]
│   ├── chatWidgetKey: string
│   ├── chatWidgetConfig: {...}
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

---

## 🔐 Password Hashing

Passwords are hashed by Firebase Auth automatically. We use:
- Firebase Authentication: Handles password hashing with bcrypt
- No need to manually hash passwords

Firebase stores hashed passwords securely and never returns them.

---

## 📧 Email Templates

### Verification Email
- Subject: "Verifiser din email - VOTE"
- Contains: Verification link valid for 24 hours
- Action: User clicks to verify

### Password Reset Email
- Subject: "Nullstill passord - VOTE"
- Contains: Reset link valid for 1 hour
- Action: User clicks to reset password

---

## ✨ Key Features

✅ **Email Verification** - Users must verify email before login
✅ **Secure Passwords** - Hashed by Firebase Auth
✅ **Forgot Password** - Users can reset forgotten passwords
✅ **Token Expiry** - Verification tokens expire after 24 hours
✅ **Reset Tokens Expire** - Password reset tokens expire after 1 hour
✅ **Business Accounts** - Users can create business on signup
✅ **Email Persistence** - Login persists across browser sessions

---

## 🐛 Troubleshooting

### "No email sent" error
**Fix:** Check `NEXT_PUBLIC_RESEND_API_KEY` in `.env.local`

### "Email already in use"
**Fix:** This is Firebase's built-in error. User must use a different email.

### Token expired error  
**Fix:** Verification token expires after 24 hours. User must sign up again.

### "User not verified" on login
**Fix:** User must click verification email first before logging in.

### "Reset token expired"
**Fix:** Password reset token expires after 1 hour. Request new reset link.

---

## 📚 File Structure

```
src/
├── lib/
│   ├── firebase.ts          ← Firebase init (analytics client-only)
│   ├── email-auth.ts        ← All auth functions (NEW)
│   └── auth.ts              ← Old Google auth (can delete)
├── types/
│   └── database.ts          ← Updated with email fields
├── components/
│   ├── auth-provider.tsx    ← Updated to use email-auth
│   └── auth-provider.tsx.bak ← Old version (can delete)
└── app/auth/
    ├── login/
    │   └── page.tsx         ← Updated for email/password
    ├── signup/
    │   └── page.tsx         ← Updated for email/password (NEW)
    ├── verify-email/
    │   └── page.tsx         ← Email verification (NEW)
    ├── verify-email-sent/
    │   └── page.tsx         ← Confirmation page (NEW)
    ├── forgot-password/
    │   └── page.tsx         ← Password reset request (NEW)
    └── reset-password/
        └── page.tsx         ← Password reset form (NEW)

.env.local                   ← Resend API key (NEW)
```

---

## 🚀 Next Steps After Setup

Once working:

1. **Test all flows:**
   - Sign up with email
   - Verify email
   - Log in
   - Log out
   - Forgot password
   - Reset password

2. **Create dashboard pages:**
   - User profile
   - Business settings
   - Chat widget configuration
   - User management (for admins)

3. **Add more features:**
   - Update profile
   - Change password (for logged-in users)
   - Two-factor authentication
   - Social login integration

---

## 💡 Security Notes

- Passwords are hashed by Firebase (bcrypt)
- Verification tokens expire after 24 hours
- Reset tokens expire after 1 hour
- Tokens are random and cryptographically secure
- Firestore security rules protect data
- Never returns passwords in API responses

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Resend dashboard for email delivery
3. Check Firestore for user document with tokens
4. Verify `.env.local` has correct API key
5. Check Firebase Rules are published
