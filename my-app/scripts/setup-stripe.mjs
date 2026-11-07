import nextEnv from '@next/env';
import Stripe from 'stripe';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { parseArgs, parseEnv } from 'node:util';
import { PLANS, priceKey } from '../src/lib/billing/catalog.mjs';
const { values: args } = parseArgs({ options: {
  live: { type: 'boolean' }, webhook: { type: 'boolean' },
  'env-file': { type: 'string' }, 'output-env-file': { type: 'string' },
} });
// An explicit environment file must never fall back to local sandbox credentials.
if (!args['env-file']) nextEnv.loadEnvConfig(process.cwd(), true);
const config = args['env-file'] ? parseEnv(readFileSync(args['env-file'], 'utf8')) : process.env;
const key = config.STRIPE_SECRET_KEY || '';
if (!/^(sk|rk)_(test|live)_/.test(key)) throw new Error('Missing or unreadable STRIPE_SECRET_KEY');
const live = /^(sk|rk)_live_/.test(key);
if (live !== Boolean(args.live)) throw new Error(live
  ? 'Use --live deliberately when provisioning production prices.'
  : '--live requires a live key. The supplied key belongs to a sandbox.');
const outputFile = args['output-env-file'] || (live ? '.env.billing-live.local' : '.env.local');
let webhookUrl;
if (args.webhook) {
  const base = new URL(config.BILLING_APP_URL || '');
  if (base.protocol !== 'https:') throw new Error('BILLING_APP_URL must be your deployed HTTPS origin for --webhook.');
  webhookUrl = `${base.origin}/api/billing/webhook`;
}
const stripe = new Stripe(key);
function saveVariable(name, value) {
  const old = existsSync(outputFile) ? readFileSync(outputFile, 'utf8') : '';
  const lines = old.split('\n').filter(line => !line.startsWith(`${name}=`));
  writeFileSync(outputFile, `${lines.join('\n').trimEnd()}\n${name}=${value}\n`, { mode: 0o600 });
  chmodSync(outputFile, 0o600);
}
const products = [];
for (const plan of ['pro', 'business']) {
  const productId = `vintra_${plan}_v1`;
  let product;
  try { product = await stripe.products.retrieve(productId); }
  catch (error) {
    if (error.code !== 'resource_missing') throw error;
    product = await stripe.products.create({ id: productId, name: `Vintra Chat ${PLANS[plan].name}` });
  }
  const prices = [];
  for (const cycle of ['monthly', 'yearly']) {
    const key = priceKey(plan, cycle);
    const existing = await stripe.prices.list({ lookup_keys: [key], active: true, limit: 1 });
    const price = existing.data[0] || await stripe.prices.create({ product: product.id, currency: 'nok',
      unit_amount: PLANS[plan][cycle], recurring: { interval: cycle === 'monthly' ? 'month' : 'year' },
      tax_behavior: 'inclusive', lookup_key: key, metadata: { plan, cycle } }, { idempotencyKey: key });
    if (price.unit_amount !== PLANS[plan][cycle] || price.currency !== 'nok' || price.tax_behavior !== 'inclusive'
      || price.recurring?.interval !== (cycle === 'monthly' ? 'month' : 'year') || price.recurring?.interval_count !== 1) {
      throw new Error(`Existing price ${key} differs from the catalogue. Create a new version deliberately; existing subscriptions must not be silently repriced.`);
    }
    prices.push(price.id);
    console.log(`${PLANS[plan].name} ${cycle}: ${price.unit_amount / 100} NOK (${live ? 'LIVE' : 'TEST'})`);
  }
  products.push({ product: product.id, prices });
}
const configurations = await stripe.billingPortal.configurations.list({ limit: 100 });
const existing = configurations.data.find(c => c.metadata?.vintra === 'billing-v1');
const options = { business_profile: { headline: 'Administrer Vintra Chat-abonnementet ditt' },
  metadata: { vintra: 'billing-v1' }, features: {
    invoice_history: { enabled: true }, payment_method_update: { enabled: true },
    customer_update: { enabled: true, allowed_updates: ['name', 'email', 'address', 'tax_id'] },
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
    subscription_update: { enabled: true, default_allowed_updates: ['price'], products,
      proration_behavior: 'always_invoice', billing_cycle_anchor: 'unchanged',
      schedule_at_period_end: { conditions: [{ type: 'decreasing_item_amount' }, { type: 'shortening_interval' }] } },
  } };
const portal = existing ? await stripe.billingPortal.configurations.update(existing.id, options)
  : await stripe.billingPortal.configurations.create(options);
saveVariable('STRIPE_PORTAL_CONFIGURATION_ID', portal.id);
console.log(`Customer portal configured; configuration ID saved to ${outputFile}.`);
if (args.webhook) {
  const url = webhookUrl;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const enabled_events = ['checkout.session.completed', 'checkout.session.async_payment_succeeded',
    'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted',
    'invoice.paid', 'invoice.payment_failed', 'invoice.payment_action_required'];
  const existing = endpoints.data.find(endpoint => endpoint.url === url);
  if (existing) {
    await stripe.webhookEndpoints.update(existing.id, { enabled_events });
    if (!config.STRIPE_WEBHOOK_SECRET || config.STRIPE_WEBHOOK_SECRET === '[SENSITIVE]') throw new Error('Webhook already exists. Copy its signing secret from Stripe Workbench to STRIPE_WEBHOOK_SECRET; it cannot be read back through the API.');
    console.log('Existing webhook updated. Signing secret preserved.');
  } else {
    const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events, description: 'Vintra Chat subscriptions' });
    saveVariable('STRIPE_WEBHOOK_SECRET', endpoint.secret);
    console.log(`Webhook registered. Signing secret saved to ${outputFile} (never printed).`);
  }
}
