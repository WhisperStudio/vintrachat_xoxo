# Vintra notifications and access migration

## Current release state (25 October 2026)

Published and verified:
- Website commit `96d216787199ae34ea143c5bfea8b5fd2fe879c7` is on `main` and live at
  `https://chat.vintrastudio.com`. Production deployment
  `dpl_48KDvP43L8HLLfWEucJ4mTuZNBKp` is READY.
- Tested Firestore rules were published at `2026-10-23T12:22:19.958705Z`.
  Published content matches `firestore.rules`, SHA-256
  `8fcd32513ab6571bcfd98d7a440b7ff8af364e6e8c2a6dd8c97f9f9a6646840f`.
- Production API checks passed: anonymous requests 401; unverified test account 403;
  verified test account 200 with an empty business list; disabled account 401;
  direct protected Firestore reads 403. The temporary Auth account was deleted.
  This verifies server credentials and isolation, not an existing user's full mobile flow.
- iOS **1.0.0 (9)** built successfully from mobile commit `dfb7f8d`:
  [EAS build](https://expo.dev/accounts/vintrastudio/projects/VintraApp/builds/51348747-04a0-4741-b781-f86a788c77ec).
  [TestFlight submission](https://expo.dev/accounts/vintrastudio/projects/VintraApp/submissions/584830fc-f2bd-4182-a2d6-464fd7fb966f)
  finished successfully on 25 October. App Store Connect app ID is `6776323865`.
  Apple processing and availability on the user's phone have not been independently verified.
- Notification delivery remains disabled by the checked-in release gate; a signed
  notification request returned 503 as intended. No announcement or phone push was sent.

Remaining before push activation: review existing business ownership/memberships below,
resolve unverified/missing owner accounts, explicitly set the environment flag to false
until that review passes, and test the new build on consenting phones. No billing or
subscription changes were made.

### Migration history and remaining access review

Website: `/Users/martinsecker/Documents/vintrachat_xoxo`, branch
`codex/secure-vercel-notifications`, Next.js root `my-app/`.
Mobile: `/Users/martinsecker/Documents/VSCode/VintraAPP/VintraApp`.
The original notification patch (base `791257323af5afb15a68134a6bc34cf038cbe90d`)
was applied and compared byte-for-byte with the sibling implementation before changes.
The sibling checkout and original integration patch were not overwritten.
Commit `752c3df` was an intermediate change; the published `96d2167` includes the completed fixes.

Production checks before publication:
- `POST https://chat.vintrastudio.com/api/access` previously returned **404**. This caused the
  mobile “Account access is not activated yet” error. A preview branch does not update
  the production custom domain.
- Initially, active Firestore rules allowed all reads/writes (release from 27 March).
  A subsequent check found rules published at `2026-10-23T10:35:31.510900Z` matching
  the obsolete `FIRESTORE_RULES.txt`: `business`, top-level `users`, and `invitations`.
  Those rules block the actual `businesses/{id}/...` schema and permit self-assigned
  top-level roles. **Use `firestore.rules` from this release instead.**
- The access inventory found 6 businesses and 8 memberships: 3 owners have unverified
  Firebase Auth emails, and 1 owner account is missing. No membership lacks status.
  Full identities are in gitignored `.audit/access.json` (mode 0600), not this document.
- Vercel MCP project lookup succeeded for `vintrachat-xoxo`, team
  `vintrastudios-projects`, project ID `prj_MxVgYXGLkWevB21hg7eGmSJqFFLr`.
  Environment metadata access returned 403; CLI fallback could not access that scope.
  Production environment values and the notification flag have **not** been verified
  or changed. This migration release also has a checked-in `accessReviewComplete=false` gate in
  `src/lib/notifications/release.mjs`; no environment value can enable delivery yet.

The website and rules are now published as recorded above. Existing ownership data
has not been approved or silently repaired.

## What ships

- `POST /api/notifications`: `registerNotificationDevice`, `unregisterNotificationDevice`,
  `notificationCenter`, `queueAnnouncement`. Requests use Firebase ID-token Bearer auth
  and `{ action, data }`; responses use `{ data }` or `{ error: { code, message } }`.
- `POST /api/access`: server-side business discovery and invitation listing, creation,
  acceptance, decline/revocation and member role changes. Both clients use it.
  The access endpoint is independent of the notification enable flag.
- Server verification checks revoked tokens, current account disablement and both token
  and current Auth email verification. Administrator announcements require the exact
  verified account `vintrastudio@gmail.com` or a current server-issued `superAdmin` claim.
  Business admin/support roles do not grant global announcement permission. Existing
  Vintra administration endpoints now enforce the same narrow global admin policy.
- Membership and invitation writes, ownership, and notification collections (including
  all descendants) are denied to clients. Team mutations occur in server transactions.
  Invitation acceptance requires a matching verified email, or a Firebase-authenticated
  phone claim for phone-only invitations. A typed phone number is not proof. Expired,
  revoked and already-used invites do not restore disabled memberships or elevate an
  existing member. The inviting owner/admin must still be active; quotas include owner.
- Business owners can access their business without a membership document; an explicitly
  disabled owner membership blocks access. Other members require `status: active`.
  Staff can read chats and append staff/system replies, but cannot insert customer
  messages directly. Widget customer messages use the server routes.
- A new accepted customer message and its notification job are saved in one Firestore
  transaction, and concurrent saves merge message history. Historical visitor messages,
  AI replies, staff replies and typing updates do not enqueue alerts. While disabled,
  messages are still transactionally saved but notification jobs are not created.
- Expo tokens are per device, not per account. Opt-out/unregister, token reassignment,
  duplicate job/attempt protection, leases, retries and invalid-token handling remain.
  Unregister is allowed while notifications are disabled and never starts delivery.
  Every send rechecks current device preferences, active business access (including
  announcements to all businesses), Auth verification/disablement and session revocation.
- Email verification now sets Firebase Auth `emailVerified`. Server-signed verification
  and reset records reject records forged under the old open rules. Old unsigned links
  must be reissued. Reset revokes refresh tokens. Signup creates business/member/widget
  atomically, using a deterministic business ID to avoid duplicate concurrent creation.
- Embed signing secrets now live in server-only `_widgetSecrets`; exposed legacy business
  secrets are never reused. Existing widget sessions may need a reload after publication.

## Local validation

Completed locally: 12 emulator tests, 18 notification/authentication tests, 4 mobile
transport tests, TypeScript in both projects and the website production build passed.
The built Next.js server also returned the expected 401 JSON for unsigned POSTs to both
APIs, 403 JSON for untrusted origins and 204 for allowed preflights. These HTTP checks
performed no database writes and no Expo requests. Phone delivery remains unverified.

Requires Node 24 and Java 21 (Firestore emulator). No real Expo requests are used in tests.
From `my-app/`:

```sh
npm ci
npm run test:notifications
npm run test:rules
npm run typecheck
npm run build
```

`test:rules` runs against **demo-vintra-notifications** on `127.0.0.1:8089`.
It tests direct unauthenticated/unverified/foreign access, protected descendants, self-role
and ownership attacks, legitimate staff replies/configuration, invitation acceptance and
concurrent capacity enforcement, API envelopes, and atomic message/job rollback.

Mobile validation:

```sh
cd /Users/martinsecker/Documents/VSCode/VintraAPP/VintraApp
npx tsc --noEmit
node --test tests/notification-api.test.mjs
```

## Release and activation checklist (notifications remain off)

The website, rules and TestFlight upload steps below are complete. Retain this sequence
for follow-up releases; ownership review, real-user acceptance and push activation remain open.

1. Review `.audit/access.json` with the business owner. Old public rules cannot prove that
   existing owner IDs, memberships or pending invitations are legitimate. Resolve unknown
   roles/owners through a trusted administrator; never automatically mark an email verified.
   Resend email verification for the 3 affected owners. Investigate the missing owner account.
   Reissue untrusted pending invitations from an active admin. Repeat the read-only inventory:
   `node scripts/audit-access.mjs --project vintrasolutions-f58a7 --firebase-cli`
   (or omit `--firebase-cli` with an existing service-account/ADC credential).
2. In the **existing** Vercel project's production environment, explicitly set
   `VINTRA_NOTIFICATIONS_ENABLED=false`. Keep previews off too. Verify existing server-only
   `FIREBASE_PROJECT_ID=vintrasolutions-f58a7`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
   Existing auth email flows also need `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and the existing
   public site URL `NEXT_PUBLIC_APP_URL=https://chat.vintrastudio.com`. No new paid service is required.
3. Commit and publish the completed website branch to production on `vintrachat-xoxo`, app
   root `my-app`. Verify both `/api/access` and `/api/notifications` exist on the custom domain.
   An unsigned access POST should return HTTP 401 JSON, not HTML/404. Signed unverified
   accounts should get 403; a verified legitimate user should receive their own businesses.
4. Publish the tested rules from `my-app/`, explicitly selecting only rules:
   `npx firebase deploy --only firestore:rules --project vintrasolutions-f58a7`
   Coordinate steps 3–4 in the same release window: the currently published obsolete rules
   block normal business reads. Do not restore public writes, deploy mobile `functions/`,
   deploy billing configuration, or publish `FIRESTORE_RULES.txt`.
5. Verify production login, business selection, invitation acceptance, staff reply and
   anonymous denial. Publish a **new TestFlight/native build** from the updated mobile tree.
   Old builds use Firebase Functions and old discovery/invitation logic; they are incompatible.
6. Only after access inventory and production authorization checks pass, consider setting
   `VINTRA_NOTIFICATIONS_ENABLED=true` and redeploying. This activation needs a separate decision and a reviewed change to
   `accessReviewComplete` in `src/lib/notifications/release.mjs` before redeployment.
   Test only a consented device/support message first; no bulk announcement is needed.

Additional environment settings:
- `EXPO_ACCESS_TOKEN`: server-only, only if Expo enhanced push security is already enabled.
- `NOTIFICATION_WEB_ORIGINS`: optional comma-separated additional trusted browser origins.
- `EXPO_PUBLIC_NOTIFICATION_API_URL`: optional mobile build override; default
  `https://chat.vintrastudio.com/api/notifications`.
- `EXPO_PUBLIC_ACCESS_API_URL`: optional mobile build override; default
  `https://chat.vintrastudio.com/api/access`.
- Existing Expo project ID/APNs credentials must be configured for the iOS build.
  No Firebase Admin key or Expo server access token belongs in `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`,
  a mobile bundle, a committed environment file or a patch.
- Notification routes use `maxDuration=180`; confirm the existing Vercel project supports
  this duration (Fluid Compute). Do not change a plan to satisfy it without a separate decision.

Mobile changes in this release: `src/lib/access-api.ts`, `src/lib/admin-chat.ts`,
`src/lib/notification-api.ts`, and `src/app/index.tsx`. The previously implemented push
registration, opt-out, sign-out and tap routing remain. API failures now show a connection
error and a retry button, rather than asserting the account has no access.

## Delivery limits and phone acceptance

New notification API requests and accepted customer messages drive bounded `after()` work.
There is **no periodic job**, Cron, Cloud Scheduler or Firebase Functions. If traffic stops,
retryable jobs and receipt checks wait. Work budgets, quotas, retry exhaustion, provider
receipt expiry and crashes can cause delay, loss or duplication. A crash after Expo accepts
but before the result is recorded can duplicate delivery; exactly-once delivery is not claimed.
An Expo ticket is acceptance by Expo; a successful receipt is provider acceptance, **not proof
that a phone displayed a notification**. See the [Expo delivery documentation](https://docs.expo.dev/push-notifications/sending-notifications/).

Actual background/terminated-app phone delivery is unverified. After the coordinated release,
check two phones, opt-out on one, logout, revoked membership, tap routing to the correct business,
and invalid-token handling. Document each result separately from local mock/emulator tests.

Firebase stays on its current plan; no Blaze upgrade or new paid service is part of this release.
Vercel/Firestore requests and reads still count against existing quotas. Business discovery scans
server-side and may need a server-maintained membership index at larger scale.
