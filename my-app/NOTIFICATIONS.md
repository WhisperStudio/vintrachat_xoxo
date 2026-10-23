# Notifications on the existing Vercel project

This implementation targets `vintrachat-xoxo` (team `vintrastudios-projects`), domain
`https://chat.vintrastudio.com`, repository `WhisperStudio/vintrachat_xoxo`, app root `my-app`.
The starting production commit was `791257323af5afb15a68134a6bc34cf038cbe90d`.

## What changes

- `POST /api/notifications` verifies Firebase ID tokens (including revocation and email verification).
  It provides device registration, unregistration, administrator announcement sending and history.
  Native apps can call it without an Origin header; browser origins are explicitly allowed.
- Widget support and chat routes save each accepted **support-chat visitor message** and its
  notification job in one Firestore transaction. Only the current server-accepted visitor message
  is queued; replayed browser history and AI/staff replies do not generate alerts.
- Next.js `after()` sends jobs through Expo after responding. There is no Firebase Functions,
  Cloud Scheduler, Vercel Cron, Workflow or additional paid service dependency.
- A transaction lease prevents concurrent workers from processing a job together. Persisted
  device attempts prevent resending accepted tickets on a normal retry. A crash between Expo
  acceptance and recording the result can still duplicate a notification.
- Every notification API call or new support message attempts pending work and receipt checks
  within a bounded 120-second budget. **There is no periodic scheduler:** if traffic stops after
  a transient failure, retries and receipt updates wait for the next relevant request. Provider
  receipts also expire; this is not a guarantee of immediate recovery or exactly-once delivery.
- Existing AI-only chat logs (`aiChatLogs`), task forms and feedback are outside this support-chat
  flow. App notification taps open `supportChats`. Direct client/console writes to Firestore do
  not trigger notifications. Any additional message writer must call the server helper.

## Activation is blocked by the current production Firestore rules

Read-only inspection on 23 October 2026 found a recursive `allow read, write: if true` rule.
Do not enable notifications under it: it exposes device tokens and jobs, and lets anyone forge
business ownership and staff memberships used by notification authorization.

`VINTRA_NOTIFICATIONS_ENABLED` defaults to off. While off, existing chat saving continues,
no notification data is created/sent, and the API returns an explicit unavailable response.

Before enabling, migrate and test database access for **both the mobile app and website**:

1. Deny all client access to `notificationDevices`, `notificationJobs` and their `attempts`,
   `notificationAnnouncements`, and `notificationReceipts`. Server Admin SDK access continues.
2. Protect `businesses.ownerId`, `businesses/{id}/users`, and invitation creation/acceptance from
   unauthorized changes. An authenticated-only wildcard is insufficient. Existing clients scan
   all businesses and accept invitations by writing membership directly, so changing the rules
   in isolation would break flows. Move discovery and invitation acceptance to authenticated
   server APIs or implement compatible, tested queries and constrained writes first.
3. Protect widget embed secrets and server rate-limit/auth records; review the website's existing
   account setup and password reset flows. Do not paste a blanket deny rule into production.
4. Verify anonymous access, cross-business access, ownership changes, forged invitations, visitor
   chat saving, staff replies, new account creation and legitimate invitation acceptance in the
   Firebase emulator before applying rules. The mock tests below are not rules-emulator tests.

No production rules, environment variables, billing settings or deployments were modified.

## Deployment once the access migration is verified

Reuse existing server-only `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
`FIREBASE_PRIVATE_KEY` configuration. Never place these values in the mobile app or in
`NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` variables. Use `EXPO_ACCESS_TOKEN` only if Expo push security
requires it. Set `VINTRA_NOTIFICATIONS_ENABLED=true` only after the rules migration passes.
Optional `NOTIFICATION_WEB_ORIGINS` is a comma-separated list of additional browser origins.

Deploy the website branch to the **existing** Vercel project with root directory `my-app`.
The routes use `maxDuration=180`; confirm Fluid Compute is enabled on that project.
Do not deploy the legacy mobile repo `functions/` codebase alongside this implementation.

The updated mobile app defaults to `https://chat.vintrastudio.com/api/notifications`.
`EXPO_PUBLIC_NOTIFICATION_API_URL` can override it at build time with a trusted HTTPS API.
Publish a new native/TestFlight build; the installed old build still calls Firebase Functions.
Users must open the new build and connect notifications once. APNs credentials must still
be configured for the existing Expo project and iOS bundle.

Expo push delivery has no fee. Vercel and Firestore usage still counts against the existing
plan quotas. No plan was upgraded and no guarantee of unlimited free usage is implied.
Vercel Hobby is intended for personal/non-commercial use; use a plan appropriate to the site.

## Validation

From `my-app`, run `node --test tests/notifications.test.mjs`, `npx tsc --noEmit`, and
`npm run build`. The tests use an isolated in-memory Firestore fake and mocked Expo responses;
no credentials or real device tokens are used. Validate actual background and terminated-app
push delivery, opt-out, sign-out, business access revocation and tap routing on a phone only
once the server is deployed and protected. A successful test build is not device delivery proof.
