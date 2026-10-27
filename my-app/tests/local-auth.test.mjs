import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createNotificationHandler } from '../src/lib/notifications/http.mjs';

const source = ts.transpileModule(readFileSync(new URL('../src/lib/firebase-admin.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
function loadAdmin(env) {
  let initialized;
  const admin = {
    apps: [],
    credential: { cert: value => ({ type: 'cert', value }), applicationDefault: () => ({ type: 'adc' }) },
    initializeApp: options => { initialized = options; admin.apps.push({}); },
    app: () => initialized,
    auth: app => app,
    firestore: app => app,
  };
  const context = { exports: {}, process: { env }, require: name => {
    assert.equal(name, 'firebase-admin'); return admin;
  } };
  vm.runInNewContext(source, context);
  return context.exports;
}
const dev = { NODE_ENV: 'development', FIREBASE_PROJECT_ID: 'demo-vintra', GOOGLE_APPLICATION_CREDENTIALS: '/private/local.json' };

test('local Admin SDK accepts explicit ADC, but hosted environments never fall back to it', () => {
  const app = loadAdmin(dev).getAdminAuth();
  assert.equal(app.projectId, 'demo-vintra');
  assert.equal(app.credential.type, 'adc');
  for (const env of [ { ...dev, NODE_ENV: 'production' }, { ...dev, VERCEL: '1' }, { ...dev, GOOGLE_APPLICATION_CREDENTIALS: '' }, { ...dev, FIREBASE_PROJECT_ID: '' } ]) {
    assert.throws(() => loadAdmin(env).getAdminAuth(), { code: 'server/misconfigured' });
  }
});

test('production keeps using configured service-account credentials', () => {
  const app = loadAdmin({ ...dev, NODE_ENV: 'production', VERCEL: '1', FIREBASE_CLIENT_EMAIL: 'server@example.test', FIREBASE_PRIVATE_KEY: 'first\\nsecond' }).getAdminAuth();
  assert.equal(app.credential.type, 'cert');
  assert.equal(app.credential.value.privateKey, 'first\nsecond');
});

test('missing server credentials return 503 rather than falsely expiring the user session', async () => {
  for (const [error, expectedStatus, expectedCode] of [
    [Object.assign(new Error('private diagnostic'), { code: 'server/misconfigured' }), 503, 'unavailable'],
    [new Error('invalid token'), 401, 'unauthenticated'],
  ]) {
    const handler = createNotificationHandler({
      verifyToken: async () => { throw error; },
      service: () => { throw new Error('Must not reach data'); },
      schedule: () => { throw new Error('Must not schedule'); },
      enabled: () => true, origins: [],
    });
    const response = await handler(new Request('http://localhost/api/access', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: '{}' }));
    assert.equal(response.status, expectedStatus);
    const result = await response.json();
    assert.equal(result.error.code, expectedCode);
    assert.doesNotMatch(result.error.message, /private diagnostic/);
  }
});
