import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('creating a widget from a finished template always persists a fresh setup requirement', async () => {
  let created;
  const ref = { collection: name => ({ kind: name, doc: id => ({ kind: name, id }) }) };
  const transaction = {
    get: async target => target === ref ? { data: () => ({ name: 'Business' }) } : target.kind === 'users' ? { data: () => ({ role: 'owner' }) } : { size: 1, docs: [{ id: 'template', data: () => ({ config: {}, assistantConfig: { setupCompleted: true, businessContext: 'Existing company facts' } }) }] },
    create: (_, data) => { created = data; }, update: () => {},
  };
  class BillingError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const dependencies = {
    'node:crypto': { randomUUID: () => 'new-widget' },
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status || 200 }) } },
    '@/lib/firebase-admin': { getAdminDb: () => ({ doc: () => ref, runTransaction: action => action(transaction) }) },
    '@/lib/verified-auth.server': { verifyActiveUserToken: async () => ({ uid: 'owner', email_verified: true }) },
    '@/lib/access/service.mjs': { accessRole: () => 'owner' },
    '@/lib/subscription': { getEffectiveBusinessPlan: () => 'pro', getPlanLimits: () => ({ maxWidgets: 10 }), sanitizeChatWidgetConfigForPlan: value => value },
    '@/lib/widget.server': { mergeWidgetConfig: () => ({ customBranding: {} }) },
    '@/lib/billing/service.mjs': { BillingError },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/app/api/widgets/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, require: name => { if (!dependencies[name]) throw new Error(name); return dependencies[name]; } });
  const response = await exports.POST({ headers: { get: () => 'Bearer valid-token' }, json: async () => ({ businessId: 'business', templateWidgetKey: 'template' }) });
  assert.equal(response.status, 200);
  assert.equal(created.assistantConfig.setupCompleted, false);
  assert.equal(created.assistantConfig.businessContext, 'Existing company facts');
});
