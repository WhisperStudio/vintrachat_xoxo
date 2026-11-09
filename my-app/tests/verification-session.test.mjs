import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshVerificationSession } from '../src/lib/verification-session.mjs';

test('verification refreshes persisted auth, account metadata and token before allowing workspace navigation', async () => {
  const calls = [];
  const user = { uid: 'owner', emailVerified: false,
    reload: async () => { calls.push('reload'); user.emailVerified = true; },
    getIdTokenResult: async force => { assert.equal(force, true); calls.push('token'); return { claims: { email_verified: true } }; },
  };
  const auth = { currentUser: null, authStateReady: async () => { calls.push('ready'); auth.currentUser = user; } };
  assert.equal(await refreshVerificationSession(auth), true);
  assert.deepEqual(calls, ['ready', 'reload', 'token']);
});
test('signed-out, still unverified or switched accounts never enter the verified workspace', async () => {
  const auth = { currentUser: null, authStateReady: async () => {} };
  assert.equal(await refreshVerificationSession(auth), false);
  auth.currentUser = { uid: 'owner', emailVerified: false, reload: async () => {} };
  assert.equal(await refreshVerificationSession(auth), false);
  auth.currentUser.reload = async () => { auth.currentUser = { uid: 'other', emailVerified: true }; };
  assert.equal(await refreshVerificationSession(auth), false);
});
test('failed refresh and an unverified token cannot be treated as verified', async () => {
  const auth = { authStateReady: async () => {}, currentUser: {
    uid: 'owner', emailVerified: true, reload: async () => {},
    getIdTokenResult: async () => ({ claims: { email_verified: false } }),
  } };
  assert.equal(await refreshVerificationSession(auth), false);
  auth.currentUser.reload = async () => { throw new Error('network'); };
  await assert.rejects(refreshVerificationSession(auth), /network/);
});
