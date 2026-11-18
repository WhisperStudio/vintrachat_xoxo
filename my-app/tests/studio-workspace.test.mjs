import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createStudioSnapshot, getStudioReadiness } from '../src/lib/studio-state.mjs';
import { hasAssistantKnowledge } from '../src/lib/studio-onboarding.mjs';
import * as studioModules from '../src/lib/studio-modules.mjs';

const text = fs.readFileSync(new URL('../src/app/landings/auth/chatWidget/ChatWidgetBuilder.tsx', import.meta.url), 'utf8');
const source = ts.createSourceFile('builder.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function declaration(name) {
  let found;
  function visit(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText(source) === name) found = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(found, name);
  return ts.isFunctionDeclaration(found) ? found.getText(source) : 'const ' + found.getText(source) + ';';
}
const compile = code => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const cards = {};
vm.runInNewContext(compile(fs.readFileSync(new URL('../src/lib/conversation-cards.ts', import.meta.url), 'utf8')), { exports: cards });

function harness({ failAssistant = false } = {}) {
  const writes = [];
  const state = {};
  const context = vm.createContext({
    ...cards, ...studioModules, createStudioSnapshot, hasAssistantKnowledge, no: true, isSetup: false, knowledgeReviewed: false,
    isAuthenticated: true, dbUser: { businessId: 'fixture-business' }, business: {}, databasePlan: 'pro',
    selectedWidgetKey: 'fixture-widget', setupMode: false,
    getEffectiveBusinessPlan: () => 'pro', isPlanFeatureAvailable: () => true,
    sanitizeBubbleStyleForPlan: value => value, sanitizeChatWidgetConfigForPlan: value => value,
    setInputs: value => { state.inputs = value; context.inputs = value; },
    setAssistantConfigDraft: value => { state.assistant = value; context.assistantConfigDraft = value; },
    setSavedSnapshot: value => { state.saved = value; }, setSelectedPreset: () => {},
    setSetupError: value => { state.error = value; }, setWorkspaceMode: value => { state.category = value; },
    setIsSaving: value => { state.saving = value; }, setSaveStatus: value => { state.status = value; },
    setSetupFinished: value => { state.finished = value; },
    setEditingModule: value => { state.module = value; },
    navigateStudioPage: (kind, id) => { if (kind === 'module') state.module = id; },
    updateChatWidgetConfig: async (...args) => { writes.push(['widget', ...args]); return { success: true }; },
    updateChatAssistantConfig: async (...args) => { writes.push(['assistant', ...args]); return { success: !failAssistant }; },
    refreshBusiness: async () => {}, localStorage: { setItem() {} }, window: { dispatchEvent() {} },
    sessionStorage: { setItem: (key, value) => { state.temporaryDraft = { key, value }; } },
    CustomEvent: class { constructor(name, value) { this.name = name; this.value = value; } },
    router: { push: value => { state.redirect = value; } }, console,
  });
  vm.runInContext(compile(['defaultOrbStyle', 'defaultInputs', 'launcherIconChoiceMap', 'createDefaultAssistantConfig', 'mergeAssistantConfigDraft', 'applyWidgetConfig', 'continueWithAccount', 'saveConfig', 'goToStep'].map(declaration).join('\n')) + '\nthis.api = { applyWidgetConfig, saveConfig, goToStep, defaultInputs, createDefaultAssistantConfig };', context);
  context.inputs = context.api.defaultInputs;
  context.assistantConfigDraft = context.api.createDefaultAssistantConfig();
  return { context, state, writes, api: context.api };
}

test('guest preview starts without optional help cards or a welcome card', () => {
  const { api } = harness();
  assert.equal(api.defaultInputs.conversationCardsEnabled, false);
  assert.equal(api.defaultInputs.conversationCards.length, 0);
  const assistant = api.createDefaultAssistantConfig();
  assert.equal(assistant.conversationCardsEnabled, false);
  assert.equal(assistant.startCard.enabled, false);
});

test('guest save carries the draft into login before account validation without writing to a business', async () => {
  const { api, context, state, writes } = harness();
  context.isAuthenticated = false;
  context.isSetup = true;
  context.inputs = { ...context.inputs, colorTheme: 'luxury' };
  assert.equal(await api.saveConfig(), false);
  assert.equal(state.redirect, '/auth/login?from=widget-studio');
  assert.equal(state.temporaryDraft.key, 'vintra:studio-login-draft');
  const draft = JSON.parse(state.temporaryDraft.value);
  assert.equal(draft.inputs.colorTheme, 'luxury');
  assert.ok(draft.createdAt > 0);
  assert.equal(writes.length, 0);
  assert.equal(state.module, undefined);
});

test('dirty tracking compares values and recognizes undo and reordered keys', () => {
  const saved = createStudioSnapshot({ settings: { enabled: true, label: 'Send' } }, { enabled: false });
  assert.equal(saved, createStudioSnapshot({ settings: { label: 'Send', enabled: true } }, { enabled: false }));
  assert.notEqual(saved, createStudioSnapshot({ settings: { label: 'Send', enabled: false } }, { enabled: false }));
  assert.notEqual(createStudioSnapshot({}, { faqSuggestions: ['A', 'B'] }), createStudioSnapshot({}, { faqSuggestions: ['B', 'A'] }));
});

test('only enabled AI requires knowledge; optional defaults never block category navigation', () => {
  assert.equal(getStudioReadiness({ enabled: false }, { isSetup: true }).knowledge, 'optional');
  assert.equal(getStudioReadiness({ enabled: true }).knowledge, 'missing');
  assert.equal(getStudioReadiness({ enabled: true, businessContext: 'Facts' }, { isSetup: true }).knowledge, 'review');
  assert.equal(getStudioReadiness({ enabled: true, businessContext: 'Facts' }, { isSetup: true, knowledgeReviewed: true }).knowledge, 'ready');
  const { api, context, state } = harness();
  context.isSetup = true;
  for (const category of ['design', 'personality', 'knowledge', 'features']) {
    api.goToStep(category);
    assert.equal(state.category, category);
    assert.equal(state.error, '');
  }
});

test('loading and saving preserve custom design, branch facts, language and disabled options', async () => {
  const { api, context, state, writes } = harness();
  const config = { ...api.defaultInputs, colorTheme: 'luxury', customBranding: { title: 'My salon', logo: 'https://example.test/logo.png', logoStyle: { zoom: 125, focusX: 35, focusY: 75 } }, settings: { ...api.defaultInputs.settings, reviewsEnabled: false, ticket: { mode: 'off', allowVisitorCreation: false } } };
  const assistant = { ...api.createDefaultAssistantConfig(), enabled: true, humanSupportEnabled: false, businessProfile: { businessName: 'My salon', industry: 'Hair care' }, businessContext: 'Approved facts', localization: { enabled: true, defaultLanguage: 'no', allowedLanguages: ['no', 'en'] }, knowledgeBase: { addresses: 'West: West road 1', openingHours: 'West: Monday 09:00–17:00', contactInfo: 'West: 22334455', uploadedDocuments: [{ name: 'terms.txt', text: 'Approved terms' }] } };
  api.applyWidgetConfig(config, assistant);
  assert.equal(state.inputs.customBranding.logoStyle.zoom, 125);
  assert.equal(state.inputs.settings.reviewsEnabled, false);
  assert.equal(state.saved, createStudioSnapshot(state.inputs, state.assistant));
  const previous = state.saved;
  context.inputs = { ...state.inputs, colorTheme: 'modern' };
  await api.saveConfig();
  assert.equal(writes.length, 2);
  assert.equal(writes[0][1], 'fixture-business');
  assert.equal(writes[0][3], 'fixture-widget');
  assert.equal(writes[0][2].colorTheme, 'modern');
  assert.equal(writes[0][2].settings.ticket.allowVisitorCreation, false);
  assert.equal(writes[1][2].knowledgeBase.addresses, assistant.knowledgeBase.addresses);
  assert.equal(writes[1][2].knowledgeBase.uploadedDocuments[0].text, 'Approved terms');
  assert.equal(writes[1][2].localization.defaultLanguage, 'no');
  assert.notEqual(state.saved, previous);
  assert.equal(state.saved, createStudioSnapshot(context.inputs, state.assistant));
  assert.equal(state.status, 'success');
  assert.equal(state.saving, false);
});

test('a failed assistant write keeps the draft unsaved and reports failure', async () => {
  const { api, state } = harness({ failAssistant: true });
  await api.saveConfig({ finalize: false });
  assert.equal(state.status, 'error');
  assert.equal(state.saved, undefined);
  assert.equal(state.saving, false);
});

test('first completion requires company facts; module drafts can be saved independently', async () => {
  const off = harness();
  off.context.isSetup = true;
  off.context.assistantConfigDraft.enabled = false;
  await off.api.saveConfig();
  assert.equal(off.writes.length, 0);
  assert.equal(off.state.module, 'company');
  off.context.assistantConfigDraft.businessProfile = { businessName: 'Shop', industry: 'Retail' };
  off.context.assistantConfigDraft.businessContext = 'A local shop.';
  await off.api.saveConfig();
  assert.equal(off.state.finished, true);
  assert.equal(off.writes[1][2].setupCompleted, true);
  const ai = harness();
  ai.context.isSetup = true;
  await ai.api.saveConfig({ finalize: false });
  assert.equal(ai.state.status, 'success');
  assert.equal(ai.writes[1][2].setupCompleted, false);
});
