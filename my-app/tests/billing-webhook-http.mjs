import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import nextEnv from '@next/env';
import Stripe from 'stripe';

nextEnv.loadEnvConfig(process.cwd(), true);
assert.match(process.env.STRIPE_SECRET_KEY || '', /^sk_test_/, 'Use a local Stripe sandbox only');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const secret = `whsec_${randomBytes(32).toString('hex')}`;
const available = createServer();
await new Promise(resolve => available.listen(0, '127.0.0.1', resolve));
const port = available.address().port;
await new Promise(resolve => available.close(resolve));
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', VERCEL_ENV: 'preview', STRIPE_WEBHOOK_SECRET: secret }, stdio: 'ignore',
});
const origin = `http://localhost:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${origin}/priser`); ready = true; break; } catch { await delay(200); }
  }
  assert.ok(ready, 'Build the app with npm run build before running the HTTP tests');
  const payload = JSON.stringify({ id: 'evt_local_signature_check', type: 'test.signature_check', data: { object: {} } });
  const post = (body, signature) => fetch(`${origin}/api/billing/webhook`, {
    method: 'POST', body, headers: { 'Content-Type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}) },
  });
  assert.equal((await post(payload)).status, 400);
  assert.equal((await post(payload, 'forged')).status, 400);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal((await post(`${payload} `, signature)).status, 400, 'Tampered bodies must fail');
  const expired = stripe.webhooks.generateTestHeaderString({ payload, secret, timestamp: Math.floor(Date.now() / 1000) - 600 });
  assert.equal((await post(payload, expired)).status, 400, 'Expired signatures must fail');
  assert.equal((await post(payload, signature)).status, 200, 'Valid, unrelated events are acknowledged without writes');
  const unauthorized = await fetch(`${origin}/api/billing`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'checkout', businessId: 'forged', plan: 'business', cycle: 'yearly' }) });
  assert.equal(unauthorized.status, 401);
  console.log('PASS: real HTTP webhook endpoint rejects missing, forged, modified and expired signatures; accepts a valid signature. Unauthenticated Checkout returns 401.');
} finally { server.kill('SIGTERM'); }
