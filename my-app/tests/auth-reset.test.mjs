import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';
import { signAuthRecord, validAuthRecord } from '../src/lib/auth-records.mjs';

const source = ts.transpileModule(readFileSync(new URL('../src/app/api/auth/reset-password/route.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText;
function endpoint({ email = 'alice@example.test', disabled = false } = {}) {
  let finish, updates = 0, revoked = 0;
  const blocked = new Promise(resolve => { finish = resolve; });
  const record = { email: 'alice@example.test', tokenHash: crypto.createHash('sha256').update('secret-token').digest('hex'), expiresAt: new Date(Date.now() + 60000) };
  let stored = { ...record, signature: signAuthRecord('server-key', 'reset', 'alice', record) };
  const ref = { delete: async () => { stored = null; } };
  const snap = () => ({ id: 'alice', ref, data: () => stored });
  let queue = Promise.resolve();
  const db = {
    collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({ empty: !stored, docs: stored ? [snap()] : [] }) }) }) }),
    runTransaction: fn => {
      const run = queue.then(() => fn({ get: async () => snap(), delete: () => { stored = null; } }));
      queue = run.catch(() => {});
      return run;
    },
  };
  const context = { exports: {}, console, Date, require: name => {
    if (name === 'node:crypto') return crypto;
    if (name === 'next/server') return { NextResponse: Response };
    if (name === '@/lib/auth-records.server') return { validRecord: (purpose, uid, data) => validAuthRecord('server-key', purpose, uid, data) };
    if (name === '@/lib/firebase-admin') return { adminDb: db, adminAuth: {
      getUser: async () => ({ email, disabled }),
      updateUser: async () => { updates++; await blocked; },
      revokeRefreshTokens: async () => { revoked++; },
    } };
    throw new Error(name);
  } };
  vm.runInNewContext(source, context);
  return {
    call: () => context.exports.POST(new Request('http://localhost/api/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ token: 'secret-token', newPassword: 'new-password' }),
    })),
    finish, updates: () => updates, revoked: () => revoked,
  };
}

test('password reset consumes its token before Auth completes, preventing parallel replay', async () => {
  const route = endpoint();
  const first = route.call();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(route.updates(), 1);
  const second = await route.call();
  assert.equal(second.status, 404);
  assert.equal(route.updates(), 1);
  route.finish();
  assert.equal((await first).status, 200);
  assert.equal(route.revoked(), 1);
});

test('old reset links cannot change a disabled account or an account with a changed email', async () => {
  for (const settings of [{ email: 'new@example.test' }, { disabled: true }]) {
    const route = endpoint(settings);
    assert.equal((await route.call()).status, 400);
    assert.equal(route.updates(), 0);
  }
});
