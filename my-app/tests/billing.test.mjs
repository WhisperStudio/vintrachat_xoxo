import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createBillingService, loadPrices } from '../src/lib/billing/service.mjs';
import { PLANS, effectivePlan, priceKey, subscriptionEntitlement } from '../src/lib/billing/catalog.mjs';
import { reserveUsage } from '../src/lib/billing/usage.mjs';

let db, app, service, state;
const actor = { uid: 'owner', email: 'owner@example.com', email_verified: true };
const future = Math.floor(Date.now() / 1000) + 86400;
const prices = ['pro', 'business'].flatMap(plan => ['monthly', 'yearly'].map(cycle => ({
  id: `price_${plan}_${cycle}`, lookup_key: priceKey(plan, cycle), unit_amount: PLANS[plan][cycle],
  currency: 'nok', tax_behavior: 'inclusive', recurring: { interval: cycle === 'monthly' ? 'month' : 'year', interval_count: 1 },
})));
const subscription = (status = 'active') => ({ id: 'sub_test', object: 'subscription', customer: 'cus_test', status,
  items: { data: [{ price: { id: 'price_pro_monthly' }, quantity: 1, current_period_end: future }] },
  latest_invoice: { status: 'paid' }, cancel_at_period_end: false });
before(() => {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8089', 'Only the isolated emulator is allowed');
  app = initializeApp({ projectId: 'demo-vintra-notifications' }, 'billing-tests');
  db = getFirestore(app);
});
beforeEach(async () => {
  await fetch('http://127.0.0.1:8089/emulator/v1/projects/demo-vintra-notifications/databases/(default)/documents', { method: 'DELETE' });
  await db.doc('businesses/b1').set({ name: 'Test business', ownerId: 'owner', chatWidgetConfig: { plan: 'free', billingCycle: 'monthly' } });
  state = { creates: 0, sessions: new Map(), subscriptions: new Map(), priceList: prices };
  const stripe = {
    prices: { list: async () => ({ data: state.priceList }) },
    customers: { create: async () => ({ id: 'cus_test' }) },
    subscriptions: { list: async () => ({ data: [...state.subscriptions.values()] }), retrieve: async id => state.subscriptions.get(id) },
    checkout: { sessions: {
      create: async params => { state.creates++; state.params = params; const session = { id: `cs_test_${state.creates}`, status: 'open',
        url: 'https://checkout.stripe.com/test', customer: params.customer, client_reference_id: params.client_reference_id, metadata: params.metadata,
        locale: params.locale, success_url: params.success_url, cancel_url: params.cancel_url };
        state.sessions.set(session.id, session); return session; },
      retrieve: async id => state.sessions.get(id),
      expire: async id => { state.sessions.get(id).status = 'expired'; },
    } },
    billingPortal: { sessions: { create: async params => { state.portalParams = params; return { url: 'https://billing.stripe.com/test' }; } } },
  };
  state.stripe = stripe;
  service = createBillingService({ db, stripe, origin: 'http://localhost:3000', portalConfiguration: 'bpc_test' });
});
after(async () => { await deleteApp(app); });

test('only a verified, active owner can initiate payments or open the customer portal', async () => {
  await db.doc('businesses/b1/users/admin').set({ status: 'active', role: 'admin' });
  for (const auth of [{ ...actor, email_verified: false }, { ...actor, uid: 'outsider' }, { ...actor, uid: 'admin' }]) {
    await assert.rejects(service.checkout(auth, { businessId: 'b1', plan: 'pro', cycle: 'monthly' }));
    await assert.rejects(service.manage(auth, { businessId: 'b1' }));
  }
  await db.doc('businesses/b1/users/owner').set({ status: 'disabled', role: 'admin' });
  await assert.rejects(service.checkout(actor, { businessId: 'b1', plan: 'pro', cycle: 'monthly' }));
  assert.equal(state.creates, 0);
});
test('checkout validates the plan and price, ignores caller amounts, and reuses sessions', async () => {
  await assert.rejects(service.checkout(actor, { businessId: 'b1', plan: 'free', cycle: 'monthly' }), { status: 400 });
  await assert.rejects(service.checkout(actor, { businessId: 'b1', plan: 'pro', cycle: 'weekly' }), { status: 400 });
  const data = { businessId: 'b1', plan: 'pro', cycle: 'monthly', price: 'price_forged', amount: 1 };
  await service.checkout(actor, data);
  await service.checkout(actor, data);
  assert.equal(state.creates, 1);
  assert.deepEqual(state.params.line_items, [{ price: 'price_pro_monthly', quantity: 1 }]);
  assert.equal((await db.doc('businesses/b1').get()).data().chatWidgetConfig.plan, 'free');
  await service.checkout(actor, { ...data, plan: 'business' });
  assert.equal(state.sessions.get('cs_test_1').status, 'expired');
  assert.equal(state.creates, 2);
});
test('concurrent checkout requests cannot create duplicate subscriptions', async () => {
  const data = { businessId: 'b1', plan: 'pro', cycle: 'monthly' };
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => service.checkout(actor, data)));
  assert.ok(results.some(r => r.status === 'fulfilled'));
  assert.equal(state.creates, 1);
  for (const result of results.filter(r => r.status === 'rejected')) assert.equal(result.reason.status, 409);
});
test('switching website domains replaces the pending checkout so the customer returns to their signed-in site', async () => {
  const data = { businessId: 'b1', plan: 'pro', cycle: 'monthly' };
  await service.checkout(actor, data);
  const otherSite = createBillingService({ db, stripe: state.stripe, origin: 'https://www.vintranordic.com', portalConfiguration: 'bpc_test' });
  await otherSite.checkout(actor, data);
  assert.equal(state.sessions.get('cs_test_1').status, 'expired');
  assert.equal(new URL(state.params.success_url).origin, 'https://www.vintranordic.com');
  assert.equal(new URL(state.params.cancel_url).origin, 'https://www.vintranordic.com');
  await otherSite.checkout(actor, data);
  assert.equal(state.creates, 2);
});
test('a success URL alone cannot grant paid access or confirm another customer payment', async () => {
  await service.checkout(actor, { businessId: 'b1', plan: 'pro', cycle: 'monthly' });
  const session = state.sessions.get('cs_test_1');
  assert.deepEqual(await service.confirm(actor, { businessId: 'b1', sessionId: session.id }), { pending: true });
  session.status = 'complete'; session.payment_status = 'paid'; session.subscription = 'sub_test'; session.customer = 'cus_foreign';
  await assert.rejects(service.confirm(actor, { businessId: 'b1', sessionId: session.id }), { status: 403 });
  assert.equal((await db.doc('businesses/b1').get()).data().chatWidgetConfig.plan, 'free');
});
test('paid confirmation, replayed webhooks, cancellation, team downgrade and reactivation', async () => {
  await service.checkout(actor, { businessId: 'b1', plan: 'pro', cycle: 'monthly' });
  const session = state.sessions.get('cs_test_1');
  Object.assign(session, { status: 'complete', payment_status: 'paid', subscription: 'sub_test' });
  state.subscriptions.set('sub_test', subscription());
  for (let i = 0; i < 6; i++) await db.doc(`businesses/b1/users/user${i}`).set({ status: 'active', role: 'support' });
  await service.confirm(actor, { businessId: 'b1', sessionId: session.id });
  let business = (await db.doc('businesses/b1').get()).data();
  assert.equal(effectivePlan(business), 'pro');
  assert.equal((await db.collection('businesses/b1/users').where('status', '==', 'active').get()).size, 4);
  assert.equal((await service.checkout(actor, { businessId: 'b1', plan: 'business', cycle: 'yearly' })).url, 'https://billing.stripe.com/test');
  assert.equal(state.creates, 1);
  const event = { data: { object: subscription() } };
  state.subscriptions.set('sub_test', { ...subscription(), cancel_at_period_end: true });
  await service.webhook(event);
  assert.equal(effectivePlan((await db.doc('businesses/b1').get()).data()), 'pro');
  state.subscriptions.set('sub_test', subscription('canceled'));
  // Old active event must retrieve current canceled state instead of restoring Pro.
  await service.webhook(event); await service.webhook(event);
  business = (await db.doc('businesses/b1').get()).data();
  assert.equal(effectivePlan(business), 'free');
  assert.equal((await db.collection('businesses/b1/users').where('status', '==', 'active').get()).size, 0);
  state.subscriptions.set('sub_test', subscription());
  await service.webhook(event);
  assert.equal((await db.collection('businesses/b1/users').where('status', '==', 'active').get()).size, 4);
});
test('unpaid renewals, paused subscriptions, unknown prices and expired entitlement fail closed', async () => {
  await db.doc('billingAccounts/b1').set({ customerId: 'cus_test', subscriptionId: 'sub_test' });
  state.subscriptions.set('sub_test', { ...subscription(), latest_invoice: { status: 'open' } });
  await service.webhook({ data: { object: subscription() } });
  assert.equal(effectivePlan((await db.doc('businesses/b1').get()).data()), 'free');
  const catalog = [{ id: 'price_pro_monthly', plan: 'pro', cycle: 'monthly' }];
  assert.equal(subscriptionEntitlement({ ...subscription(), pause_collection: { behavior: 'void' } }, catalog).plan, 'free');
  assert.equal(subscriptionEntitlement(subscription(), []).plan, 'free');
  assert.equal(subscriptionEntitlement(subscription(), catalog, (future + 1) * 1000).plan, 'free');
  assert.equal(effectivePlan({ billing: { subscriptionId: 's', status: 'active', plan: 'pro', currentPeriodEnd: 1 } }), 'free');
});
test('configured prices must match the public NOK catalogue', async () => {
  await assert.rejects(loadPrices({ prices: { list: async () => ({ data: prices.map(p => ({ ...p, unit_amount: 1 })) }) } }), { status: 503 });
});
test('free conversation quotas are atomic, cannot trust a supplied session ID, and reset daily', async () => {
  const now = new Date('2026-11-07T12:00:00Z');
  // Independent module instances simulate three server processes; each has its own queue.
  const workers = await Promise.all([1, 2, 3].map(i => import(`../src/lib/billing/usage.mjs?worker=${i}`)));
  const settled = await Promise.allSettled(Array.from({ length: 30 }, (_, i) => workers[i % 3].reserveUsage(db, 'b1', 'w1', `supplied-${i}`, now)));
  assert.equal(settled.filter(r => r.status === 'rejected').length, 0);
  const results = settled.map(r => r.value);
  assert.equal(results.filter(r => r.retry).length, 0);
  assert.equal(results.filter(r => r.allowed).length, 20);
  const usage = (await db.doc('businesses/b1/billingUsage/2026-11-07').get()).data();
  assert.equal(usage.conversations, 20);
  assert.equal(usage.messages, 20);
  assert.equal((await reserveUsage(db, 'b1', 'w1', 'new', new Date('2026-11-08T00:00:00Z'))).allowed, true);
});
for (const [plan, conversations, messages] of [['free', 20, 100], ['pro', 500, 2500], ['business', 2000, 10000]]) {
  test(`${plan} allows its last conversation and message, then blocks excess usage`, async () => {
    const now = new Date();
    const ref = db.doc(`businesses/b1/billingUsage/${now.toISOString().slice(0, 10)}`);
    await db.doc('businesses/b1').update({ billing: { subscriptionId: 'sub_test', status: 'active', plan, currentPeriodEnd: future } });
    await ref.set({ conversations: conversations - 1, messages: conversations - 1 });
    assert.equal((await reserveUsage(db, 'b1', 'w1', 'last', now)).allowed, true);
    assert.equal((await reserveUsage(db, 'b1', 'w1', 'extra', now)).allowed, false);
    await ref.update({ messages: messages - 1 });
    assert.equal((await reserveUsage(db, 'b1', 'w1', 'last', now)).allowed, true);
    assert.equal((await reserveUsage(db, 'b1', 'w1', 'last', now)).allowed, false);
    assert.equal((await ref.get()).data().messages, messages);
    await db.doc('businesses/b1').update({ 'billing.currentPeriodEnd': 1 });
    assert.equal((await reserveUsage(db, 'b1', 'w1', 'last', now)).allowed, false);
  });
}
test('reusing a session cannot bypass the daily message limit; quotas are shared across widgets', async () => {
  const now = new Date('2026-11-07T12:00:00Z');
  for (let i = 0; i < 100; i++) assert.equal((await reserveUsage(db, 'b1', 'w1', 'same-session', now)).allowed, true);
  assert.equal((await reserveUsage(db, 'b1', 'w1', 'same-session', now)).allowed, false);
  assert.equal((await reserveUsage(db, 'b1', 'w2', 'another-session', now)).allowed, false);
  assert.equal((await db.doc('businesses/b1/billingUsage/2026-11-07').get()).data().conversations, 1);
});

test('checkout and portal use the chosen language; changing language replaces a pending checkout', async () => {
  const data = { businessId: 'b1', plan: 'pro', cycle: 'monthly', language: 'en' };
  await service.checkout(actor, data);
  assert.equal(state.params.locale, 'en');
  await service.checkout(actor, data);
  assert.equal(state.creates, 1);
  await service.checkout(actor, { ...data, language: 'no' });
  assert.equal(state.params.locale, 'nb');
  assert.equal(state.sessions.get('cs_test_1').status, 'expired');
  await service.manage(actor, { businessId: 'b1', language: 'en' });
  assert.equal(state.portalParams.locale, 'en');
  await service.manage(actor, { businessId: 'b1', language: 'invalid' });
  assert.equal(state.portalParams.locale, 'nb');
});
test('cancellation opens an owner-only confirmation for the stored subscription without canceling it', async () => {
  await db.doc('billingAccounts/b1').set({ customerId: 'cus_test', subscriptionId: 'sub_test' });
  state.subscriptions.set('sub_test', subscription());
  const data = { businessId: 'b1', cancel: true, language: 'en', subscriptionId: 'sub_forged' };
  await assert.rejects(service.manage({ ...actor, uid: 'outsider' }, data), { status: 403 });
  assert.equal(state.portalParams, undefined);
  await service.manage(actor, data);
  assert.equal(state.portalParams.flow_data.type, 'subscription_cancel');
  assert.equal(state.portalParams.flow_data.subscription_cancel.subscription, 'sub_test');
  assert.equal(state.portalParams.flow_data.after_completion.redirect.return_url, 'http://localhost:3000/priser?portal=returned');
  assert.equal(state.portalParams.locale, 'en');
  assert.equal(state.subscriptions.get('sub_test').status, 'active');
  state.subscriptions.set('sub_test', { ...subscription(), customer: 'cus_foreign' });
  await assert.rejects(service.manage(actor, data), { status: 403 });
  state.subscriptions.set('sub_test', { ...subscription(), cancel_at_period_end: true });
  await service.manage(actor, data);
  assert.equal(state.portalParams.flow_data, undefined);
});
