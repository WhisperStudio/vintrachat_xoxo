import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createNotificationHandler } from '../src/lib/notifications/http.mjs';

// Exercise the actual provider with controlled Auth/Firestore responses.
const source = ts.transpileModule(readFileSync(new URL('../src/context/AuthContext.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React },
}).outputText;
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const settle = () => new Promise(resolve => setImmediate(resolve));
const user = uid => ({ uid, emailVerified: true, reload: async () => {} });
function provider({ profile = async u => ({ id: u.uid, businessId: u.uid }), business = async id => ({ id }) } = {}) {
  const slots = [];
  let index = 0, listener;
  const React = {
    createContext: () => ({ Provider: 'Provider' }),
    createElement: (type, props) => ({ type, props }),
    useState: initial => {
      const i = index++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef: initial => {
      const i = index++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useCallback: fn => fn,
    useEffect: fn => { if (!listener) fn(); },
  };
  const service = {
    setupAuthListener: fn => { listener = fn; return () => {}; },
    getCurrentUser: profile, getBusinessInfo: business,
    signOut: async () => listener(null),
  };
  const context = { exports: {}, console, Error, setTimeout: () => 1, clearTimeout: () => {},
    require: name => {
      if (name === 'react') return { ...React, default: React };
      if (name === '@/lib/auth.service') return service;
      if (name === '@/lib/with-timeout') return { withTimeout: promise => promise };
      throw new Error(`Unexpected dependency: ${name}`);
    } };
  vm.runInNewContext(source, context);
  const read = () => { index = 0; return context.exports.AuthProvider({ children: null }).props.value; };
  read();
  return { read, emit: u => listener(u) };
}

test('profile server failure retains the session, denies workspace access, and supports retry', async () => {
  let failed = true;
  const session = provider({ profile: async u => {
    if (failed) throw new Error('Server configuration missing');
    return { id: u.uid, businessId: 'business' };
  } });
  session.emit(user('alice'));
  await settle();
  let state = session.read();
  assert.equal(state.firebaseUser.uid, 'alice');
  assert.equal(state.isAuthenticated, false);
  assert.equal(state.loading, false);
  assert.match(state.error, /configuration/);
  failed = false;
  await state.refreshCurrentUser();
  state = session.read();
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.error, null);
  assert.equal(state.business.id, 'business');
});

test('late business refresh cannot restore another account data after account switching or logout', async () => {
  const late = deferred();
  let delay = false;
  const session = provider({ business: async id => delay && id === 'alice' ? late.promise : { id } });
  session.emit(user('alice'));
  await settle();
  delay = true;
  const refresh = session.read().refreshBusiness();
  session.emit(user('bob'));
  await settle();
  assert.equal(session.read().business.id, 'bob');
  await session.read().logout();
  await settle();
  late.resolve({ id: 'alice' });
  await refresh;
  const state = session.read();
  assert.equal(state.firebaseUser, null);
  assert.equal(state.business, null);
  assert.equal(state.dbUser, null);
  assert.equal(state.isAuthenticated, false);
});

test('late membership response from previous session is discarded', async () => {
  const late = deferred();
  const session = provider({ profile: async u => u.uid === 'alice' ? late.promise : { id: u.uid, businessId: u.uid } });
  session.emit(user('alice'));
  await settle();
  session.emit(user('bob'));
  await settle();
  late.resolve({ id: 'alice', businessId: 'alice' });
  await settle();
  assert.equal(session.read().dbUser.id, 'bob');
  assert.equal(session.read().business.id, 'bob');
});

test('unverified users cannot load a workspace', async () => {
  const session = provider({ profile: async () => { throw new Error('Must not read membership'); } });
  session.emit({ ...user('alice'), emailVerified: false });
  await settle();
  assert.equal(session.read().isAuthenticated, false);
  assert.match(session.read().error, /Verifiser/);
});

test('localhost ports work in development without allowing spoofed hosts or weakening token checks', async () => {
  for (const development of [false, true]) {
    let checked = 0;
    const handler = createNotificationHandler({
      origins: [], allowDevelopmentLoopback: development, enabled: () => false,
      verifyToken: async () => { checked++; throw new Error('revoked'); },
      service: () => { throw new Error('Must not access data'); }, schedule: () => {},
    });
    for (const origin of ['http://localhost:3001', 'http://127.0.0.1:8081', 'http://[::1]:3000', 'http://localhost.evil.test:3001', 'http://localhost:3000@evil.test', 'https://evil.test']) {
      const loopback = ['http://localhost:3001', 'http://127.0.0.1:8081', 'http://[::1]:3000'].includes(origin);
      const response = await handler(new Request('http://localhost:3001/api/access', {
        method: 'POST', headers: { Origin: origin, Authorization: 'Bearer revoked' }, body: '{}',
      }));
      assert.equal(response.status, development && loopback ? 401 : 403, origin);
    }
    assert.equal(checked, development ? 3 : 0);
  }
});
