# Firebase Google Sign-In Setup Guide

## ❌ Error: `auth/configuration-not-found`

This error means Google Sign-In is not enabled in your Firebase project.

---

## ✅ Complete Setup Steps

### Step 1: Enable Google Provider in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **vintrasolutions-f58a7**
3. Left sidebar → **Authentication**
4. Click **Sign-in method** tab
5. Click **Google** provider
6. Toggle **Enable** ON
7. Select **Project support email** from dropdown (auto-populated)
8. Click **Save**

**Screenshot location:**
```
Firebase Console
  → Authentication
    → Sign-in method
      → Google (click it)
        → Toggle Enable
        → Save
```

---

### Step 2: Add Authorized Domains

Still in **Authentication → Sign-in method** section:

1. Scroll down to **Authorized domains**
2. Click **Add domain**
3. Add these domains:

```
localhost
localhost:3000
127.0.0.1
127.0.0.1:3000
```

4. When you deploy, add your production domain too

---

### Step 3: Set OAuth Consent Screen (if needed)

If prompted, configure OAuth consent screen:

1. Go to **Authentication → Settings**
2. Scroll to **Authorized domain for redirects**
3. Make sure your development domain is listed

---

### Step 4: Test Locally

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/auth/signup

3. Click "Fortsett med Google"

4. If error still appears, check browser console for exact error code

---

## 🔍 Common Errors & Fixes

### `auth/configuration-not-found`
**Fix:** Enable Google provider in Firebase Console (Step 1 above)

### `auth/unauthorized-domain`
**Fix:** Add your domain to "Authorized domains" (Step 2 above)

### `auth/popup-blocked`
**Fix:** Browser is blocking popups. Disable popup blocker or use incognito mode

### `auth/invalid-api-key`
**Fix:** Check if `firebaseConfig` in `src/lib/firebase.ts` has correct `apiKey`

---

## 📋 Checklist

- [ ] Google Sign-In enabled in Firebase Console
- [ ] Authorized domains include `localhost`
- [ ] Firebase SDK v12.11.0 installed (`npm install firebase`)
- [ ] `src/lib/firebase.ts` has correct config
- [ ] `src/lib/auth.ts` has `signInWithGoogle()` function
- [ ] `src/components/auth-provider.tsx` wraps app in AuthProvider
- [ ] Login/Signup pages import `signInWithGoogle`

---

## 🚀 After Setup Works

Once Google Sign-In works:

1. **First signup** → Choose account type (Bedriftsadmin / Bruker)
2. **If Bedriftsadmin** → Enter business name → Creates business in Firestore
3. **If Bruker** → Waits for admin to send invite
4. **Redirect** → Dashboard with business info

---

## 📞 Troubleshooting

### Still getting error after enabling?

1. **Clear browser cache:**
   ```bash
   # Delete .next folder and rebuild
   rm -r .next
   npm run dev
   ```

2. **Check network tab:**
   - Open DevTools → Network tab
   - Try login again
   - Look for `identitytoolkit.googleapis.com` requests
   - Check response for error details

3. **Verify config:**
   ```typescript
   // src/lib/firebase.ts
   // Make sure firebaseConfig has:
   // - apiKey
   // - authDomain: "vintrasolutions-f58a7.firebaseapp.com"
   // All fields filled in
   ```

4. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Check console logs:**
   - Open browser DevTools
   - Check Console tab for detailed error messages

---

## 📚 Firebase Security Rules

After Google Sign-In works, publish security rules:

1. Go to **Firestore Database → Rules**
2. Copy content from `FIRESTORE_RULES.txt`
3. Paste in rules editor
4. Click **Publish**

---

## ✨ What's Next

Once working:
1. Test creating a business account
2. Test logging in with existing account
3. Test inviting users (admin dashboard)
4. Create dashboard to manage chat widget settings
