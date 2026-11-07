// Explicitly opt-in: real Stripe sandbox requests + isolated local Firestore only.
import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import Stripe from 'stripe';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createBillingService } from '../src/lib/billing/service.mjs';
import { priceKey, effectivePlan } from '../src/lib/billing/catalog.mjs';
nextEnv.loadEnvConfig(process.cwd(), true);
assert.equal(process.env.RUN_STRIPE_SANDBOX_TEST, '1');
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8089');
assert.match(process.env.STRIPE_SECRET_KEY || '', /^sk_test_/);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = initializeApp({ projectId: 'demo-vintra-notifications' }, 'stripe-smoke');
const db = getFirestore(app), id = `stripe-smoke-${Date.now()}`;
const actor = { uid: 'owner', email: 'billing-test@example.com', email_verified: true };
const service = createBillingService({ db, stripe, origin: 'http://localhost:3000', portalConfiguration: process.env.STRIPE_PORTAL_CONFIGURATION_ID });
let customerId, subscriptionId, checkoutId;
try {
  await db.doc(`businesses/${id}`).set({ name: 'Automated Stripe sandbox test', ownerId: 'owner', chatWidgetConfig: { plan: 'free', billingCycle: 'monthly' } });
  const checkout = await service.checkout(actor, { businessId: id, plan: 'pro', cycle: 'monthly' });
  assert.match(checkout.url, /^https:\/\/checkout.stripe.com\//);
  const account = (await db.doc(`billingAccounts/${id}`).get()).data();
  customerId = account.customerId; checkoutId = account.checkoutId;
  const session = await stripe.checkout.sessions.retrieve(checkoutId, { expand: ['line_items'] });
  assert.equal(session.amount_total, 29900); assert.equal(session.currency, 'nok'); assert.equal(session.livemode, false);
  assert.equal((await service.checkout(actor, { businessId: id, plan: 'pro', cycle: 'monthly' })).url, checkout.url);
  assert.match((await service.manage(actor, { businessId: id })).url, /^https:\/\/billing.stripe.com\//);
  console.log('PASS: real Checkout (299 NOK), duplicate protection and customer portal');
  await stripe.checkout.sessions.expire(checkoutId);
  const method = await stripe.paymentMethods.attach('pm_card_visa', { customer: customerId });
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: method.id } });
  const price = (await stripe.prices.list({ lookup_keys: [priceKey('pro', 'monthly')] })).data[0];
  const subscription = await stripe.subscriptions.create({ customer: customerId, items: [{ price: price.id }], payment_behavior: 'error_if_incomplete' });
  subscriptionId = subscription.id;
  await service.webhook({ data: { object: subscription } });
  assert.equal(effectivePlan((await db.doc(`businesses/${id}`).get()).data()), 'pro');
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
  await service.webhook({ data: { object: subscription } });
  assert.equal(effectivePlan((await db.doc(`businesses/${id}`).get()).data()), 'pro');
  const canceled = await stripe.subscriptions.cancel(subscriptionId);
  await service.webhook({ data: { object: canceled } });
  // Deliver an older event after cancellation; the server must still see Free.
  await service.webhook({ data: { object: subscription } });
  assert.equal(effectivePlan((await db.doc(`businesses/${id}`).get()).data()), 'free');
  console.log('PASS: paid test subscription, period-end cancellation, final cancellation and stale-event replay');
} finally {
  const savedAccount = (await db.doc(`billingAccounts/${id}`).get()).data();
  customerId ||= savedAccount?.customerId;
  checkoutId ||= savedAccount?.checkoutId;
  if (subscriptionId) { const s = await stripe.subscriptions.retrieve(subscriptionId); if (s.status !== 'canceled') await stripe.subscriptions.cancel(subscriptionId); }
  if (checkoutId) { const s = await stripe.checkout.sessions.retrieve(checkoutId); if (s.status === 'open') await stripe.checkout.sessions.expire(checkoutId); }
  if (customerId) await stripe.customers.del(customerId);
  await db.recursiveDelete(db.doc(`businesses/${id}`)); await db.doc(`billingAccounts/${id}`).delete();
  await deleteApp(app);
}
