import test from 'node:test';
import assert from 'node:assert/strict';
import { signAuthRecord, validAuthRecord } from '../src/lib/auth-records.mjs';
const data = { email: 'test@example.com', tokenHash: 'test', expiresAt: new Date('2030-01-01'), accountType: 'business', businessName: 'Test' };
test('legacy/forged verification and reset records cannot authorize server account actions', () => {
  const signed = { ...data, signature: signAuthRecord('test-secret', 'verify', 'uid', data) };
  assert.equal(validAuthRecord('test-secret', 'verify', 'uid', signed), true);
  assert.equal(validAuthRecord('test-secret', 'verify', 'uid', data), false);
  for (const change of [{ email: 'other@example.com' }, { tokenHash: 'forged' }, { expiresAt: new Date('2031-01-01') }, { accountType: 'user' }, { businessName: 'Forged' }])
    assert.equal(validAuthRecord('test-secret', 'verify', 'uid', { ...signed, ...change }), false);
  assert.equal(validAuthRecord('test-secret', 'reset', 'uid', signed), false);
  assert.equal(validAuthRecord('test-secret', 'verify', 'other', signed), false);
  assert.equal(validAuthRecord('other-secret', 'verify', 'uid', signed), false);
});

test('server checks revocation and current Firebase email/account/administrator state', async () => {
  const { verifyActiveToken } = await import('../src/lib/verified-auth.mjs');
  let current = { email: 'user@example.com', emailVerified: true, disabled: false, customClaims: { superAdmin: true } };
  const auth = {
    verifyIdToken: async (token, checkRevoked) => {
      assert.equal(checkRevoked, true);
      if (token === 'revoked') throw new Error('revoked');
      return { uid: 'user', email_verified: true, superAdmin: true };
    },
    getUser: async () => current,
  };
  assert.equal((await verifyActiveToken(auth, 'valid')).superAdmin, true);
  current = { ...current, customClaims: {} };
  assert.equal((await verifyActiveToken(auth, 'valid')).superAdmin, false);
  current = { ...current, emailVerified: false };
  assert.equal((await verifyActiveToken(auth, 'valid')).email_verified, false);
  current = { ...current, disabled: true };
  await assert.rejects(verifyActiveToken(auth, 'valid'));
  await assert.rejects(verifyActiveToken(auth, 'revoked'));
});
