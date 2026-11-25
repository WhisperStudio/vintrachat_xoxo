import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import crypto from 'node:crypto';
import { signAuthRecord, validAuthRecord } from '../src/lib/auth-records.mjs';

function load(file, dependencies, env = {}) {
  const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const context = { exports: {}, Date, URL, process: { env }, console: { ...console, error: () => {} }, require: name => {
    if (name in dependencies) return dependencies[name];
    throw new Error(name);
  } };
  vm.runInNewContext(source, context);
  return context.exports;
}
function activation({ disabled = false, email = 'owner@example.test', expired = false, forged = false, failProvision = false } = {}) {
  const events = [], businesses = new Map();
  const record = { email: 'owner@example.test', tokenHash: crypto.createHash('sha256').update('token').digest('hex'), accountType: 'business', businessName: 'Team', expiresAt: new Date(Date.now() + (expired ? -1000 : 60000)) };
  record.signature = signAuthRecord('secret', 'verify', 'owner', record);
  if (forged) record.businessName = 'Forged';
  let removed = false;
  const db = {
    collection: name => ({
      where: () => ({ limit: () => ({ get: async () => name === 'pending_auth'
        ? { empty: removed, docs: [{ id: 'owner', data: () => record, ref: { delete: async () => { removed = true; } } }] }
        : { empty: !businesses.size, docs: [...businesses.keys()].map(id => ({ id })) } }) }),
      doc: id => ({ id, get: async () => ({ exists: businesses.has(id), data: () => businesses.get(id) }), collection: () => ({ doc: key => ({ id: key }) }) }),
    }),
    batch: () => {
      const writes = [];
      return { create: (ref, data) => writes.push([ref.id, data]), commit: async () => {
        if (failProvision) throw new Error('Offline');
        if (businesses.has(writes[0][0])) throw new Error('Already exists');
        businesses.set(...writes[0]); events.push('provision');
      } };
    },
  };
  const module = load('../src/lib/pending-auth.server.ts', {
    'node:crypto': crypto,
    '@/lib/auth-records.server': { validRecord: (purpose, uid, data) => validAuthRecord('secret', purpose, uid, data) },
    '@/lib/firebase-admin': { adminDb: db, adminAuth: { getUser: async () => ({ email, disabled }), updateUser: async () => events.push('verified') } },
    '@/lib/vintra-admin': { normalizeEmail: value => value.trim().toLowerCase() },
    '@/lib/conversation-cards': { defaultConversationCards: [] },
    '@/lib/studio-modules.mjs': { createFreshStudioAssistant: value => value },
  });
  return { run: () => module.activatePendingAuthToken('token'), events, businesses };
}

test('workspace is ready before verification, and repeat/concurrent clicks reuse it', async () => {
  const flow = activation();
  const results = await Promise.all([flow.run(), flow.run()]);
  assert.ok(results.every(result => result.success && result.userId === 'owner'));
  assert.equal(flow.events[0], 'provision');
  assert.equal(flow.businesses.size, 1);
  assert.equal((await flow.run()).businessId, results[0].businessId);
  assert.equal(flow.events.filter(event => event === 'provision').length, 1);
});

test('expired, forged, disabled and changed-email links cannot activate accounts', async () => {
  for (const options of [{ expired: true }, { forged: true }, { disabled: true }, { email: 'changed@example.test' }]) {
    const flow = activation(options);
    assert.equal((await flow.run()).success, false);
    assert.deepEqual(flow.events, []);
  }
});

test('provisioning failure never publishes verification before a workspace exists', async () => {
  const flow = activation({ failProvision: true });
  assert.equal((await flow.run()).success, false);
  assert.deepEqual(flow.events, []);
});

test('verification emails have localized copy, an escaped button URL and plain-text alternative', () => {
  const { buildVerificationEmail } = load('../src/lib/auth-email.ts', {
    '@/lib/site-config': { siteConfig: { contact: { email: 'support@example.test' } } },
  });
  for (const language of ['no', 'en']) {
    const email = buildVerificationEmail({ language, recipientName: '<img src=x>', verificationLink: 'https://app.example.test/auth/verify-email?token=abc&x=1' });
    assert.match(email.html, /&lt;img src=x&gt;/);
    assert.match(email.html, /token=abc&amp;x=1/);
    assert.match(email.html, /bgcolor="#285f80"/);
    assert.doesNotMatch(email.html, /linear-gradient|display:flex/);
    assert.match(email.text, /https:\/\/app.example.test\/auth\/verify-email\?token=abc&x=1/);
    assert.match(email.html, language === 'no' ? /Bekreft e-postadresse/ : /Verify email address/);
  }
});

test('mail endpoints report delivery errors and include localized HTML and plain text', async () => {
  for (const route of ['send-verification-email', 'resend-verification-email']) {
    let sent;
    for (const fail of [true, false]) {
      const ref = { set: async () => {}, get: async () => ({ data: () => ({}), ref }) };
      const endpoint = load(`../src/app/api/auth/${route}/route.ts`, {
        'node:crypto': crypto,
        'next/server': { NextResponse: Response },
        '@/lib/auth-link-origin': { authLinkOrigin: () => 'https://app.example.test' },
        '@/lib/auth-records.server': { signRecord: () => 'signature', validRecord: () => false },
        '@/lib/firebase-admin': { adminAuth: { verifyIdToken: async () => ({ uid: 'owner', email: 'owner@example.test' }), getUser: async () => ({ emailVerified: false }) }, adminDb: { collection: () => ({ doc: () => ref }) } },
        '@/lib/auth-email': { buildVerificationEmail: ({ language, verificationLink }) => { assert.equal(language, 'no'); assert.match(verificationLink, /^https:\/\/app.example.test\/auth\/verify-email\?token=/); return { subject: 'Bekreft', html: '<p>Bekreft</p>', text: 'Bekreft' }; } },
        '@/lib/pending-auth.server': { hashOpaqueToken: () => 'hash' },
        '@/lib/server-rate-limit': { consumeServerRateLimit: async () => ({ allowed: true }) },
        '@/lib/vintra-admin': { normalizeEmail: value => value },
        resend: { Resend: class { emails = { send: async payload => { sent = payload; return { error: fail ? { message: 'Rejected' } : null }; } }; } },
      });
      const response = await endpoint.POST(new Request('https://app.example.test/api/auth/send', {
        method: 'POST', headers: { Authorization: 'Bearer fixture' }, body: JSON.stringify({ language: 'no', displayName: 'Owner' }),
      }));
      assert.equal(response.status, fail ? 500 : 200);
      assert.equal((await response.json()).success, !fail);
      assert.equal(sent.text, 'Bekreft');
    }
  }
});

test('verification URLs stay local only during local development and never trust a spoofed host', () => {
  for (const env of [{ NODE_ENV: 'development' }, { NODE_ENV: 'production' }, { NODE_ENV: 'development', VERCEL: '1' }]) {
    const { authLinkOrigin } = load('../src/lib/auth-link-origin.ts', {
      '@/lib/site-config': { siteConfig: { url: 'https://app.example.test' } },
    }, env);
    const local = env.NODE_ENV === 'development' && !env.VERCEL;
    assert.equal(authLinkOrigin('http://localhost:3001/api/auth/send'), local ? 'http://localhost:3001' : 'https://app.example.test');
    for (const origin of ['https://evil.example', 'http://localhost.evil.test', 'http://localhost:3001@evil.test']) {
      assert.equal(authLinkOrigin(`${origin}/api/auth/send`), 'https://app.example.test');
    }
  }
});
