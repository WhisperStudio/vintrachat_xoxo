import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { createAccessService } from '../src/lib/access/service.mjs';
import { createNotificationService } from '../src/lib/notifications/service.mjs';
import { hash } from '../src/lib/notifications/core.mjs';

const projectId = 'demo-vintra-notifications';
let env, app, db, service;
const actor = (uid, extras = {}) => ({ uid, token: { uid, email: `${uid}@example.com`, email_verified: true, ...extras } });
const request = (uid, data, extras) => ({ auth: actor(uid, extras), data });
const client = (uid, verified = true, extras = {}) => uid
  ? env.authenticatedContext(uid, { email: `${uid}@example.com`, email_verified: verified, ...extras }).firestore()
  : env.unauthenticatedContext().firestore();
const invited = { email: 'guest@example.com', role: 'support', createdBy: 'owner', status: 'pending',
  expiresAt: Timestamp.fromMillis(Date.now() + 86400000), createdAt: Timestamp.now() };
before(async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST || '', /^(127\.0\.0\.1|localhost):8089$/, 'Emulator required; never run against production.');
  env = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8089, rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  app = initializeApp({ projectId }, 'access-tests');
  db = getFirestore(app);
  service = createAccessService(db, { teamLimit: () => 10 });
});
beforeEach(async () => {
  await env.clearFirestore();
  await db.doc('businesses/b1').set({ name: 'One', ownerId: 'owner', chatWidgetConfig: { plan: 'pro', billingCycle: 'monthly' } });
  await db.doc('businesses/b2').set({ name: 'Two', ownerId: 'other' });
  await db.doc('businesses/b1/users/staff').set({ role: 'support', status: 'active' });
  await db.doc('businesses/b1/users/admin').set({ role: 'admin', status: 'active' });
  await db.doc('businesses/b1/users/disabled').set({ role: 'admin', status: 'disabled' });
  await db.doc('businesses/b1/invitations/invite').set(invited);
  await db.doc('businesses/b1/supportChats/chat').set({ businessId: 'b1', status: 'needs-human', messages: [{ id: 'm1', role: 'user', text: 'Hi' }], messageCount: 1 });
});
after(async () => { await env?.cleanup(); if (app) await deleteApp(app); });

test('private server collections and arbitrary descendants deny every client, including superadmin', async () => {
  for (const path of ['notificationDevices/d', 'notificationDevices/d/private/x', 'notificationJobs/j', 'notificationJobs/j/attempts/a',
    'notificationAnnouncements/a', 'notificationReceipts/r', 'pending_auth/u', 'pending_password_resets/u', '_rate_limits/r', 'widgetRateLimits/r', '_widgetSecrets/b1', 'users/attacker']) {
    await db.doc(path).set({ secret: 'test' });
    for (const user of [null, 'staff', 'owner', 'super']) {
      const ref = doc(client(user, true, user === 'super' ? { superAdmin: true } : {}), path);
      await assertFails(getDoc(ref));
      await assertFails(setDoc(ref, { secret: 'forged' }));
      await assertFails(deleteDoc(ref));
    }
  }
});
test('anonymous, unverified, foreign and disabled accounts cannot read or mutate a business', async () => {
  for (const c of [client(null), client('owner', false), client('outsider'), client('disabled')]) {
    await assertFails(getDoc(doc(c, 'businesses/b1')));
    await assertFails(getDocs(collection(c, 'businesses/b1/supportChats')));
    await assertFails(updateDoc(doc(c, 'businesses/b1'), { name: 'forged' }));
  }
  await assertSucceeds(getDoc(doc(client('owner'), 'businesses/b1')));
  await assertSucceeds(getDocs(collection(client('staff'), 'businesses/b1/supportChats')));
  await assertFails(getDocs(collection(client('staff'), 'businesses')));
});
test('clients cannot self-enroll, grant roles, forge invitations, change ownership or billing', async () => {
  for (const uid of ['outsider', 'staff', 'admin', 'owner']) {
    const c = client(uid);
    await assertFails(setDoc(doc(c, `businesses/b1/users/${uid}`), { role: 'admin', status: 'active' }));
    await assertFails(setDoc(doc(c, 'businesses/b1/invitations/forged'), { ...invited, expiresAt: new Date(), createdAt: new Date() }));
    await assertFails(updateDoc(doc(c, 'businesses/b1/invitations/invite'), { status: 'accepted' }));
    await assertFails(updateDoc(doc(c, 'businesses/b1'), { ownerId: `forged-${uid}` }));
    await assertFails(updateDoc(doc(c, 'businesses/b1'), { 'chatWidgetConfig.plan': 'enterprise' }));
    await assertFails(setDoc(doc(c, 'businesses/new'), { ownerId: `forged-${uid}` }));
  }
});
test('staff reply and typing succeed; client visitor writes and history modifications are denied', async () => {
  const ref = doc(client('staff'), 'businesses/b1/supportChats/chat');
  await assertSucceeds(updateDoc(ref, { supportTypingAt: null }));
  await assertSucceeds(updateDoc(ref, { messages: arrayUnion({ id: 's1', role: 'support', text: 'Hello' }), messageCount: 2, status: 'open' }));
  await assertSucceeds(updateDoc(ref, { messages: arrayUnion({ id: 's2', role: 'system', text: 'Taken over' }) }));
  await assertFails(updateDoc(ref, { messages: arrayUnion({ id: 'fake', role: 'user', text: 'Fake customer' }) }));
  await assertFails(updateDoc(ref, { messages: [{ id: 'm1', role: 'support', text: 'Replace history' }] }));
  await assertFails(setDoc(doc(client('staff'), 'businesses/b1/supportChats/new'), { messages: [] }));
  await assertSucceeds(updateDoc(doc(client('staff'), 'businesses/b1'), { 'chatAnalytics.totalMessages': 1 }));
});
test('owner widget edits work while protected settings stay immutable', async () => {
  const c = client('owner');
  await assertSucceeds(updateDoc(doc(c, 'businesses/b1'), { name: 'Renamed' }));
  await assertSucceeds(setDoc(doc(c, 'businesses/b1/chatWidgets/w'), { widgetKey: 'w', name: 'Widget', config: { plan: 'pro' } }));
  await assertSucceeds(updateDoc(doc(c, 'businesses/b1/chatWidgets/w'), { name: 'New name' }));
  await assertFails(updateDoc(doc(c, 'businesses/b1/chatWidgets/w'), { 'config.plan': 'enterprise' }));
  await assertFails(updateDoc(doc(client('staff'), 'businesses/b1/chatWidgets/w'), { name: 'No' }));
});
test('discovery returns only active memberships and immutable ownership', async () => {
  assert.deepEqual((await service.listBusinesses(request('staff', { uid: 'owner' }))).map(p => p.businessId), ['b1']);
  assert.equal((await service.listBusinesses(request('disabled', {}))).length, 0);
  assert.equal((await service.listBusinesses(request('outsider', {}))).length, 0);
  assert.equal((await service.listBusinesses(request('owner', {})))[0].role, 'owner');
});
test('invitation acceptance is verified, email-bound, atomic and replay-safe', async () => {
  const data = { businessId: 'b1', invitationId: 'invite', userId: 'owner', role: 'admin' };
  await assert.rejects(service.acceptInvitation(request('outsider', data)), { code: 'permission-denied' });
  await assert.rejects(service.acceptInvitation(request('guest', data, { email_verified: false })), { code: 'unauthenticated' });
  const accepted = await service.acceptInvitation(request('guest', data));
  assert.equal(accepted.success, true);
  assert.equal((await db.doc('businesses/b1/users/guest').get()).data().role, 'support');
  assert.equal((await db.doc('businesses/b1/invitations/invite').get()).data().usedBy, 'guest');
  assert.equal((await service.listBusinesses(request('guest', {})))[0].businessId, 'b1');
  await service.acceptInvitation(request('guest', data));
  await db.doc('businesses/b1/users/guest').update({ status: 'disabled' });
  await assert.rejects(service.acceptInvitation(request('guest', data)), { code: 'permission-denied' });
});
test('expired, revoked, elevated and unverified-phone invitations never create membership', async () => {
  const data = { businessId: 'b1', invitationId: 'invite', phone: '+4712345678' };
  for (const change of [{ expiresAt: Timestamp.fromMillis(1) }, { status: 'revoked' }, { role: 'owner' },
    { email: '', phone: '+4712345678' }, { createdBy: 'disabled' }]) {
    await db.doc('businesses/b1/invitations/invite').set({ ...invited, ...change });
    await assert.rejects(service.acceptInvitation(request('guest', data)), { code: 'permission-denied' });
    assert.equal((await db.doc('businesses/b1/users/guest').get()).exists, false);
  }
});
test('only admins manage invitations and nobody changes their own or the owner role', async () => {
  const data = { businessId: 'b1', email: 'new@example.com', role: 'support' };
  for (const uid of ['outsider', 'staff', 'disabled']) await assert.rejects(service.createInvitation(request(uid, data)), { code: 'permission-denied' });
  const result = await service.createInvitation(request('admin', data));
  assert.ok(result.invitationId);
  await assert.rejects(service.updateUserRole(request('admin', { businessId: 'b1', userId: 'admin', role: 'admin' })), { code: 'permission-denied' });
  await assert.rejects(service.updateUserRole(request('admin', { businessId: 'b1', userId: 'owner', role: 'support' })), { code: 'permission-denied' });
  await service.updateUserRole(request('owner', { businessId: 'b1', userId: 'staff', role: 'manager' }));
  assert.equal((await db.doc('businesses/b1/users/staff').get()).data().role, 'manager');
});
test('concurrent invitation acceptance respects team limit', async () => {
  const limited = createAccessService(db, { teamLimit: () => 5 });
  await db.doc('businesses/b1/invitations/second').set({ ...invited, email: 'second@example.com' });
  const results = await Promise.allSettled([
    limited.acceptInvitation(request('guest', { businessId: 'b1', invitationId: 'invite' })),
    limited.acceptInvitation(request('second', { businessId: 'b1', invitationId: 'second' })),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await db.collection('businesses/b1/users').get()).size, 4);
});
test('real Firestore transaction atomically saves message and job; repeated history and staff responses do not enqueue', async () => {
  const notifications = createNotificationService(db, { fetchImpl: () => { throw new Error('External network forbidden'); } });
  const ref = db.doc('businesses/b1/supportChats/chat');
  const message = { id: 'm2', role: 'user', text: 'Help' };
  await notifications.saveChat(ref, { businessId: 'b1', messages: FieldValue.arrayUnion(message) }, [message], true);
  await notifications.saveChat(ref, { businessId: 'b1', messages: [message] }, [message], true);
  await notifications.saveChat(ref, { businessId: 'b1', messages: [{ id: 's2', role: 'support', text: 'Staff' }] }, [], true);
  assert.equal((await db.collection('notificationJobs').get()).size, 1);
  assert.equal((await ref.get()).data().messages.length, 3);
  // Invalid Firestore value fails the complete transaction, including its message write.
  const bad = { id: 'bad', role: 'user', text: 'Rollback' };
  await assert.rejects(notifications.saveChat(ref, { businessId: 'b1', messages: [bad], invalid: undefined }, [bad], true));
  assert.equal((await db.doc(`notificationJobs/${hash('b1:chat:bad')}`).get()).exists, false);
  assert.equal((await ref.get()).data().messages.length, 3);
});

test('authenticated access HTTP contract returns only caller profiles and rejects forged actions', async () => {
  const { createNotificationHandler } = await import('../src/lib/notifications/http.mjs');
  const handle = createNotificationHandler({ enabled: () => true, origins: [],
    verifyToken: async () => ({ uid: 'staff', email_verified: true, email: 'staff@example.com' }),
    actions: new Set(['listBusinesses', 'acceptInvitation']), service: () => service, schedule: () => {} });
  const send = input => handle(new Request('https://test/api/access', { method: 'POST',
    headers: { Authorization: 'Bearer emulator-test' }, body: JSON.stringify(input) }));
  const response = await send({ action: 'listBusinesses', data: { uid: 'owner' } });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].role, 'support');
  const denied = await send({ action: 'acceptInvitation', data: { businessId: 'b1', invitationId: 'invite' } });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, 'permission-denied');
  assert.equal((await send({ action: 'setOwner', data: {} })).status, 400);
});
