import test from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { createNotificationService } from '../src/lib/notifications/service.mjs';
import { createNotificationHandler } from '../src/lib/notifications/http.mjs';
import { hash } from '../src/lib/notifications/core.mjs';
import { memoryDb } from './notification-memory-db.mjs';
import { deliveryEnabled } from '../src/lib/notifications/release.mjs';

test('delivery requires explicit activation in production, never in previews', () => {
  assert.equal(deliveryEnabled('true', 'production'), true);
  for (const environment of ['preview', 'development', undefined])
    assert.equal(deliveryEnabled('true', environment), false);
  for (const value of ['false', undefined, '', 'TRUE'])
    assert.equal(deliveryEnabled(value, 'production'), false);
});

const staff = {
  uid: 'staff',
  token: { email_verified: true, email: 'staff@example.com' },
};
const admin = {
  uid: 'admin',
  token: { email_verified: true, superAdmin: true },
};
const deviceToken = 'ExpoPushToken[test-device]';
const req = (auth, data) => ({ auth, data });
async function setup(
  fetchImpl = async () =>
    Response.json({ data: [{ status: 'ok', id: 'receipt1' }] }),
) {
  const db = memoryDb();
  await db.doc('businesses/b1').set({ ownerId: 'owner', name: 'Test' });
  await db
    .doc('businesses/b1/users/staff')
    .set({ role: 'support', status: 'active' });
  const service = createNotificationService(db, { fetchImpl });
  await service.registerNotificationDevice(
    req(staff, {
      token: deviceToken,
      businessIds: ['b1', 'outside'],
      platform: 'ios',
    }),
  );
  return { db, service };
}
const message = {
  id: 'm1',
  role: 'user',
  text: 'Hello',
  createdAt: '2026-01-01',
};
async function save(db, service, messages = [message]) {
  return service.saveChat(
    db.doc('businesses/b1/supportChats/c1'),
    {
      businessId: 'b1',
      widgetKey: 'widget1',
      messages,
      visitorName: 'Visitor',
    },
    messages,
    true,
  );
}

test('verified device is restricted to active businesses; another user cannot unregister it', async () => {
  const { db, service } = await setup();
  const key = `notificationDevices/${hash(deviceToken)}`;
  assert.deepEqual(db.store.get(key).businessIds, ['b1']);
  await service.unregisterNotificationDevice(
    req(admin, { token: deviceToken }),
  );
  assert.ok(db.store.has(key));
  await service.unregisterNotificationDevice(
    req(staff, { token: deviceToken }),
  );
  assert.equal(db.store.has(key), false);
  await assert.rejects(
    () => service.registerNotificationDevice(req({ ...staff, token: {} }, {})),
    { code: 'unauthenticated' },
  );
});
test('visitor message and job persist together; replay, staff and AI replies do not duplicate alerts', async () => {
  const sent = [];
  const { db, service } = await setup(async (_, options) => {
    sent.push(JSON.parse(options.body));
    return Response.json({ data: [{ status: 'ok', id: 'r' }] });
  });
  await save(db, service);
  await save(db, service, [
    message,
    { id: 'a1', role: 'assistant', text: 'Answer' },
  ]);
  await Promise.all([service.drain(), service.drain()]);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0][0].data, {
    type: 'chat',
    businessId: 'b1',
    chatId: 'c1',
    widgetKey: 'widget1',
    notificationId: hash('b1:c1:m1'),
  });
  assert.equal(db.store.get('businesses/b1/supportChats/c1').messageCount, 2);
  assert.equal(
    db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).status,
    'accepted',
  );
});
test('revoked membership and disabled devices receive no chat pushes', async () => {
  let sends = 0;
  const { db, service } = await setup(async () => {
    sends++;
    return Response.json({ data: [] });
  });
  await save(db, service);
  await db.doc('businesses/b1/users/staff').update({ status: 'disabled' });
  await service.drain();
  assert.equal(sends, 0);
  assert.equal(
    db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).status,
    'no-recipients',
  );
});
test('network failure stays retryable; accepted retry is not sent again', async () => {
  let sends = 0;
  const { db, service } = await setup(async () => {
    if (++sends === 1) throw new Error('offline');
    return Response.json({ data: [{ status: 'ok', id: 'r' }] });
  });
  await save(db, service);
  await service.drain();
  const job = db.doc(`notificationJobs/${hash('b1:c1:m1')}`);
  assert.equal((await job.get()).data().status, 'retry');
  await job.update({ leaseUntil: null });
  await service.drain();
  await service.drain();
  assert.equal(sends, 2);
  assert.equal((await job.get()).data().status, 'accepted');
});
test('unregistered tokens are disabled and send is recorded as failed', async () => {
  const { db, service } = await setup(async () =>
    Response.json({
      data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }],
    }),
  );
  await save(db, service);
  await service.drain();
  assert.equal(
    db.store.get(`notificationDevices/${hash(deviceToken)}`).enabled,
    false,
  );
  assert.equal(
    db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).status,
    'failed',
  );
});
test('announcements require administrator, test token ownership and stable request IDs', async () => {
  const { db, service } = await setup();
  const data = {
    title: 'Hello',
    body: 'World',
    targetBusinessId: 'all',
    requestId: 'request-123456',
  };
  await assert.rejects(() => service.queueAnnouncement(req(staff, data)), {
    code: 'permission-denied',
  });
  await assert.rejects(
    () =>
      service.queueAnnouncement(
        req(admin, { ...data, testToken: deviceToken }),
      ),
    { code: 'permission-denied' },
  );
  const first = await service.queueAnnouncement(req(admin, data));
  const second = await service.queueAnnouncement(req(admin, data));
  assert.equal(first.id, second.id);
  assert.equal((await db.collection('notificationJobs').get()).size, 1);
});
test('concurrent receipt checks count provider confirmation once', async () => {
  const { db, service } = await setup(async (url) =>
    Response.json({
      data: url.endsWith('getReceipts')
        ? { receipt1: { status: 'ok' } }
        : [{ status: 'ok', id: 'receipt1' }],
    }),
  );
  await save(db, service);
  await service.drain();
  await db
    .doc('notificationReceipts/receipt1')
    .update({ createdAt: Timestamp.fromMillis(Date.now() - 120000) });
  await Promise.all([service.drain(), service.drain()]);
  assert.equal(
    db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).confirmedCount,
    1,
  );
});
test('HTTP blocks unsigned, unverified, malformed, disallowed-origin and disabled requests before service use', async () => {
  let calls = 0;
  let enabled = true;
  const handle = createNotificationHandler({
    enabled: () => enabled,
    origins: ['https://chat.vintrastudio.com'],
    verifyToken: async (token) => ({
      uid: 'staff',
      email_verified: token === 'verified',
    }),
    service: () => {
      calls++;
      throw new Error('must not run');
    },
    schedule: () => {},
  });
  const request = (token, input, origin) =>
    new Request('https://test/api/notifications', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(origin ? { Origin: origin } : {}),
      },
      body: JSON.stringify(input),
    });
  const data = { action: 'registerNotificationDevice', data: {} };
  assert.equal((await handle(request(null, data))).status, 401);
  assert.equal((await handle(request('unverified', data))).status, 403);
  assert.equal(
    (await handle(request('verified', data, 'https://evil.example'))).status,
    403,
  );
  assert.equal(
    (await handle(request('verified', { action: 'drain', data: {} }))).status,
    400,
  );
  enabled = false;
  assert.equal((await handle(request('verified', { action: 'queueAnnouncement', data: {} }))).status, 503);
  assert.equal(calls, 0);
});
test('HTTP valid registration uses authenticated identity and schedules delivery after response', async () => {
  let scheduled;
  let call;
  const handle = createNotificationHandler({
    enabled: () => true,
    origins: [],
    verifyToken: async () => ({ uid: 'server-user', email_verified: true }),
    service: () => ({
      registerNotificationDevice: async (input) => {
        call = input;
        return { registered: true };
      },
      drain: async () => {},
    }),
    schedule: (fn) => {
      scheduled = fn;
    },
  });
  const response = await handle(
    new Request('https://test/api/notifications', {
      method: 'POST',
      headers: { Authorization: 'Bearer signed' },
      body: JSON.stringify({
        action: 'registerNotificationDevice',
        data: { uid: 'forged' },
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(call.auth.uid, 'server-user');
  assert.deepEqual(await response.json(), { data: { registered: true } });
  assert.equal(typeof scheduled, 'function');
});

test('multiple phones, opt-out, unregister and account reassignment stay independent', async () => {
  const sent = [];
  const { db, service } = await setup(async (_, options) => {
    sent.push(JSON.parse(options.body)[0].to);
    return Response.json({ data: [{ status: 'ok', id: `r${sent.length}` }] });
  });
  const second = 'ExpoPushToken[second]';
  const third = 'ExpoPushToken[third]';
  for (const token of [second, third]) await service.registerNotificationDevice(req(staff, { token, businessIds: ['b1'], platform: 'ios' }));
  await service.registerNotificationDevice(req(staff, { token: second, businessIds: ['b1'], platform: 'ios', enabled: false }));
  await service.unregisterNotificationDevice(req(staff, { token: third }));
  await save(db, service);
  await service.drain();
  assert.deepEqual(sent, [deviceToken]);
  await service.registerNotificationDevice(req({ ...staff, uid: 'outsider' }, { token: deviceToken, businessIds: ['b1'], platform: 'ios' }));
  await save(db, service, [{ ...message, id: 'm2' }]);
  await service.drain();
  assert.deepEqual(sent, [deviceToken]);
});
test('global announcements exclude recipients with revoked or missing business access', async () => {
  let sends = 0;
  const { db, service } = await setup(async () => { sends++; return Response.json({ data: [] }); });
  await service.queueAnnouncement(req(admin, { title: 'Test', body: 'Mock only', targetBusinessId: 'all', requestId: 'global-123456' }));
  await db.doc('businesses/b1/users/staff').update({ status: 'disabled' });
  await service.drain();
  assert.equal(sends, 0);
});
test('all active roles receive announcements, while customer messages only reach support staff', async () => {
  const sent = [];
  const { db, service } = await setup(async (_, options) => {
    sent.push(JSON.parse(options.body)[0]);
    return Response.json({ data: [{ status: 'ok', id: `receipt-${sent.length}` }] });
  });
  const recipientTokens = [deviceToken];
  for (const role of ['viewer', 'user', 'admin', 'manager']) {
    await db.doc(`businesses/b1/users/${role}`).set({ role, status: 'active' });
    const token = `ExpoPushToken[${role}]`;
    recipientTokens.push(token);
    const result = await service.registerNotificationDevice(req({ ...staff, uid: role }, { token, businessIds: ['b1'], platform: 'ios' }));
    assert.equal(result.businesses, 1);
  }
  await service.registerNotificationDevice(req({ ...staff, uid: 'outsider' }, { token: 'ExpoPushToken[outsider]', businessIds: ['b1'], platform: 'ios' }));
  await save(db, service);
  await service.drain();
  assert.deepEqual(sent.map(x => x.to).sort(), [deviceToken, 'ExpoPushToken[admin]', 'ExpoPushToken[manager]'].sort());
  for (const targetBusinessId of ['b1', 'all']) {
    const start = sent.length;
    await service.queueAnnouncement(req(admin, { title: 'News', body: 'Mock only', targetBusinessId, requestId: `all-roles-${targetBusinessId}-123456` }));
    await service.drain();
    assert.deepEqual(sent.slice(start).map(x => x.to).sort(), [...recipientTokens].sort());
  }
  await db.doc('businesses/b1/users/viewer').update({ status: 'disabled' });
  const start = sent.length;
  await service.queueAnnouncement(req(admin, { title: 'News', body: 'Mock only', targetBusinessId: 'all', requestId: 'revoked-viewer-123456' }));
  await service.drain();
  assert.ok(!sent.slice(start).some(x => x.to === 'ExpoPushToken[viewer]'));
});

test('Vintra admin can open the panel while ordinary recipients cannot; disabled delivery still allows device registration', async () => {
  const { db, service } = await setup(() => { throw new Error('No real pushes'); });
  const vintra = { uid: 'vintra', email_verified: true, email: 'vintrastudio@gmail.com' };
  const handle = createNotificationHandler({ enabled: () => false, origins: [],
    verifyToken: async token => token === 'vintra' ? vintra : { uid: 'staff', ...staff.token },
    service: () => service, schedule: () => { throw new Error('Disabled delivery must not run'); } });
  const call = (token, action, data = {}) => handle(new Request('https://test', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ action, data }),
  }));
  const panel = await call('vintra', 'notificationCenter');
  assert.equal(panel.status, 200);
  assert.equal((await panel.json()).data.businesses.length, 1);
  assert.equal((await call('staff', 'notificationCenter')).status, 403);
  await assert.rejects(() => service.queueAnnouncement(req(staff, { title: 'News', body: 'Mock', targetBusinessId: 'all', requestId: 'staff-cannot-send-123' })), { code: 'permission-denied' });
  assert.equal((await call('staff', 'registerNotificationDevice', { token: 'ExpoPushToken[pending-activation]', businessIds: ['b1'], platform: 'ios' })).status, 200);
  assert.equal((await call('vintra', 'queueAnnouncement', { title: 'News', body: 'Mock', targetBusinessId: 'all', requestId: 'no-queue-disabled-123' })).status, 503);
  assert.equal((await db.collection('notificationJobs').get()).size, 0);
});
test('recipient Auth disablement/revocation prevents delivery even with a membership', async () => {
  const { db } = await setup();
  const service = createNotificationService(db, {
    recipientActive: async () => false,
    fetchImpl: () => { throw new Error('Must not send'); },
  });
  await save(db, service);
  await service.drain();
  assert.equal(db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).status, 'no-recipients');
});
test('DeviceNotRegistered receipts disable a previously accepted device', async () => {
  const { db, service } = await setup(async url => Response.json({ data: url.endsWith('getReceipts')
    ? { receipt1: { status: 'error', details: { error: 'DeviceNotRegistered' } } }
    : [{ status: 'ok', id: 'receipt1' }] }));
  await save(db, service);
  await service.drain();
  await db.doc('notificationReceipts/receipt1').update({ createdAt: Timestamp.fromMillis(Date.now() - 120000) });
  await service.drain();
  assert.equal(db.store.get(`notificationDevices/${hash(deviceToken)}`).enabled, false);
  assert.equal(db.store.get(`notificationJobs/${hash('b1:c1:m1')}`).receiptFailedCount, 1);
});
test('all HTTP errors include code and message; invalid and revoked tokens fail authentication', async () => {
  const handle = createNotificationHandler({ enabled: () => true, origins: [],
    verifyToken: async () => { throw new Error('revoked'); }, service: () => { throw new Error('must not run'); }, schedule: () => {} });
  for (const request of [
    new Request('https://test', { method: 'POST', headers: { Origin: 'https://evil.example' } }),
    new Request('https://test', { method: 'GET' }),
    new Request('https://test', { method: 'POST', headers: { Authorization: 'Bearer invalid' } }),
  ]) {
    const response = await handle(request);
    assert.ok(response.status >= 400);
    const body = await response.json();
    assert.equal(typeof body.error.code, 'string');
    assert.equal(typeof body.error.message, 'string');
  }
});
test('unregister still works while delivery is disabled and never drains jobs', async () => {
  let removed = false;
  const handle = createNotificationHandler({ enabled: () => false, origins: [],
    verifyToken: async () => ({ uid: 'staff', email_verified: true }),
    service: () => ({ unregisterNotificationDevice: async () => { removed = true; return { removed: true }; } }),
    schedule: () => { throw new Error('Disabled delivery must not run'); } });
  const response = await handle(new Request('https://test', { method: 'POST', headers: { Authorization: 'Bearer verified' },
    body: JSON.stringify({ action: 'unregisterNotificationDevice', data: { token: deviceToken } }) }));
  assert.equal(response.status, 200);
  assert.equal(removed, true);
});
