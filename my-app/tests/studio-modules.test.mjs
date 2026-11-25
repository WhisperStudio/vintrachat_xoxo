import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { addStudioModule, createFreshStudioAssistant, enableStudioModule, getActiveStudioModules, getPendingStudioDesign, getStudioModuleStatus, markStudioDesignReviewed, markStudioModuleConfigured, mergeStudioModuleImport, normalizeStudioModules, removeStudioModule } from '../src/lib/studio-modules.mjs';
import { getStudioReadiness } from '../src/lib/studio-state.mjs';

test('new widgets only contain mandatory modules, without activating copied optional features', () => {
  const source = { setupCompleted: true, humanSupportEnabled: true, faqSuggestionsEnabled: true, conversationCardsEnabled: true, businessContext: 'Company facts', knowledgeBase: { offerings: 'Haircuts', pricing: 'Old price' }, integrations: { bookMeetings: true } };
  const fresh = createFreshStudioAssistant(source);
  assert.deepEqual(getActiveStudioModules(fresh, { reviewsEnabled: true }), ['company', 'chat', 'personality']);
  assert.equal(fresh.humanSupportEnabled, false);
  assert.equal(fresh.faqSuggestionsEnabled, false);
  assert.equal(fresh.knowledgeBase.pricing, '');
  assert.equal(fresh.knowledgeBase.offerings, 'Haircuts');
  assert.equal(fresh.businessContext, 'Company facts');
  assert.equal(source.humanSupportEnabled, true);
});

test('company row goes from red to yellow to complete without requiring optional fields to save', () => {
  const fresh = createFreshStudioAssistant({});
  assert.equal(getStudioModuleStatus('company', fresh).level, 'error');
  const filled = markStudioModuleConfigured({ ...fresh, businessProfile: { businessName: 'Hair studio', industry: 'Hair care' }, businessContext: 'Haircuts for families.' }, {}, 'company');
  const yellow = getStudioModuleStatus('company', filled);
  assert.equal(yellow.level, 'warning');
  assert.deepEqual(yellow.required, []);
  assert.deepEqual(yellow.optional, ['shortDescription', 'website']);
  const complete = { ...filled, businessProfile: { ...filled.businessProfile, shortDescription: 'Family salon' }, knowledgeBase: { ...filled.knowledgeBase, websiteUrls: ['https://example.test'] } };
  assert.equal(getStudioModuleStatus('company', complete).level, 'complete');
});

test('optional gaps remain usable warnings, while missing support setup and design review are distinct', () => {
  let assistant = createFreshStudioAssistant({ businessProfile: { businessName: 'Shop', industry: 'Retail' }, businessContext: 'A local shop.', responseStyle: 'Friendly', systemPrompt: 'Use approved information.' });
  assert.equal(getStudioReadiness(assistant).knowledge, 'warning');
  assert.equal(getStudioReadiness(assistant).features, 'warning');
  assert.equal(getStudioReadiness(assistant).design, 'ready');
  assistant = addStudioModule(assistant, {}, 'support');
  assert.equal(getStudioReadiness(assistant).features, 'missing');
  assert.equal(getStudioReadiness(assistant).design, 'review');
});

test('new support stays red and inactive until configured; its design warning persists across reloads', () => {
  const added = addStudioModule(createFreshStudioAssistant({ handoffMessage: 'We will ask the team.' }), {}, 'support');
  assert.equal(getStudioModuleStatus('support', added).level, 'error');
  assert.equal(added.humanSupportEnabled, false);
  assert.deepEqual(getPendingStudioDesign(added).map(item => item.id), ['support']);
  const editor = enableStudioModule(added, {}, 'support');
  const saved = markStudioModuleConfigured(editor.assistant, editor.settings, 'support');
  assert.equal(saved.humanSupportEnabled, true);
  assert.equal(getStudioModuleStatus('support', saved, editor.settings).level, 'warning');
  const reloaded = JSON.parse(JSON.stringify(saved));
  assert.deepEqual(getPendingStudioDesign(reloaded, editor.settings).map(item => item.id), ['support']);
  assert.equal(getPendingStudioDesign(markStudioDesignReviewed(reloaded, editor.settings, 'bubble'), editor.settings).length, 1);
  assert.equal(getPendingStudioDesign(markStudioDesignReviewed(reloaded, editor.settings, 'tickets'), editor.settings).length, 0);
});

test('removing a module disables only that feature and re-adding requires a new review', () => {
  let assistant = addStudioModule(createFreshStudioAssistant({}), {}, 'support');
  assistant = markStudioModuleConfigured({ ...assistant, humanSupportEnabled: true, contactSharing: { enabled: true } }, {}, 'support');
  const removed = removeStudioModule(assistant, { reviewsEnabled: true, tasksEnabled: true, ticket: { mode: 'always' } }, 'support');
  assert.equal(removed.assistant.humanSupportEnabled, false);
  assert.equal(removed.assistant.contactSharing.enabled, true);
  assert.equal(removed.settings.reviewsEnabled, true);
  assert.equal(removed.settings.ticket.mode, 'off');
  assert.ok(!getActiveStudioModules(removed.assistant, removed.settings).includes('support'));
  assert.equal(getStudioModuleStatus('support', addStudioModule(removed.assistant, removed.settings, 'support'), removed.settings).level, 'error');
  assert.equal(removeStudioModule(assistant, {}, 'company').assistant, assistant);
});

test('legacy assistants preserve enabled modules and do not receive false new-design warnings', () => {
  const old = { humanSupportEnabled: true, faqSuggestionsEnabled: true, localization: { enabled: true }, knowledgeBase: { pricing: 'Haircut 500 NOK' } };
  assert.ok(getActiveStudioModules(old, { reviewsEnabled: true }).includes('support'));
  assert.ok(getActiveStudioModules(old, { reviewsEnabled: true }).includes('pricing'));
  assert.equal(getPendingStudioDesign(old, { reviewsEnabled: true }).length, 0);
  const migrated = addStudioModule(old, { reviewsEnabled: true }, 'welcome');
  assert.ok(getActiveStudioModules(migrated, { reviewsEnabled: true }).includes('support'));
  assert.deepEqual(getPendingStudioDesign(migrated, { reviewsEnabled: true }).map(item => item.id), ['welcome']);
});

test('autofill is scoped to the selected module and never changes behaviour or unrelated facts', () => {
  const current = { enabled: false, humanSupportEnabled: true, responseStyle: 'My tone', businessProfile: { businessName: 'Old', industry: 'Retail' }, knowledgeBase: { pricing: 'Approved prices', addresses: 'West branch', contactInfo: 'Approved contact' }, startCard: { enabled: true, text: 'My greeting' } };
  const scan = { businessContext: 'Imported facts', autofill: { businessProfile: { businessName: 'New', industry: 'Hair care' }, knowledgeBase: { offerings: 'Haircuts', pricing: 'Wrong scope', addresses: 'Wrong branch', contactInfo: 'new@example.test' } } };
  const company = mergeStudioModuleImport(current, scan, 'company');
  assert.equal(company.businessProfile.businessName, 'New');
  assert.equal(company.knowledgeBase.offerings, 'Haircuts');
  assert.equal(company.knowledgeBase.pricing, 'Approved prices');
  assert.equal(company.knowledgeBase.addresses, 'West branch');
  assert.equal(company.enabled, false);
  assert.equal(company.responseStyle, 'My tone');
  const support = mergeStudioModuleImport(current, scan, 'support');
  assert.equal(support.knowledgeBase.contactInfo, 'new@example.test');
  assert.equal(support.businessProfile.businessName, 'Old');
  assert.equal(support.startCard.text, 'My greeting');
});

test('module state accepts only known IDs and survives the server normalizer', () => {
  assert.deepEqual(normalizeStudioModules({ added: ['support', 'support', '__proto__', 'unknown'], configured: 'invalid', designReviewed: ['support'] }), { version: 1, added: ['support'], configured: [], designReviewed: ['support'] });
  const file = fs.readFileSync(new URL('../src/app/api/chatwidget/update/route.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('route.ts', file, ts.ScriptTarget.Latest, true);
  const declarations = ast.statements.filter(node => ts.isFunctionDeclaration(node) && ['buildDefaultAssistantConfig', 'normalizeAssistantConfig'].includes(node.name?.text));
  const context = vm.createContext({ normalizeStudioModules, normalizeLocalization: value => value, normalizeConversationCards: value => value });
  vm.runInContext(ts.transpileModule(declarations.map(node => node.getText(ast)).join('\n') + '\nthis.normalize = normalizeAssistantConfig;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const saved = context.normalize({ studio: { version: 1, added: ['support'], configured: ['company'], designReviewed: [] } });
  assert.deepEqual(saved.studio, { version: 1, added: ['support'], configured: ['company'], designReviewed: [] });
});

test('both account creation paths start with only mandatory modules', () => {
  for (const path of ['../src/lib/auth.service.ts', '../src/lib/pending-auth.server.ts']) {
    const file = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    const ast = ts.createSourceFile(path, file, ts.ScriptTarget.Latest, true);
    const fn = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'buildDefaultAssistantConfig');
    const context = vm.createContext({ createFreshStudioAssistant, defaultConversationCards: [] });
    vm.runInContext(ts.transpileModule(fn.getText(ast) + '\nthis.build = buildDefaultAssistantConfig;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
    assert.deepEqual(getActiveStudioModules(context.build('Example', 'test@example.test'), {}), ['company', 'chat', 'personality']);
  }
});

test('loading a legacy account does not inject fresh module metadata or restart setup', () => {
  const file = fs.readFileSync(new URL('../src/lib/auth.service.ts', import.meta.url), 'utf8');
  const ast = ts.createSourceFile('auth.service.ts', file, ts.ScriptTarget.Latest, true);
  const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && ['buildDefaultAssistantConfig', 'mergeAssistantConfig'].includes(node.name?.text));
  const context = vm.createContext({ createFreshStudioAssistant, defaultConversationCards: [], normalizeConversationCards: value => value || [] });
  vm.runInContext(ts.transpileModule(functions.map(node => node.getText(ast)).join('\n') + '\nthis.merge = mergeAssistantConfig;', { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  const old = { humanSupportEnabled: true, faqSuggestionsEnabled: true, businessContext: 'Approved facts', knowledgeBase: { pricing: 'Approved prices' } };
  const loaded = context.merge(old, old);
  assert.equal(loaded.studio, undefined);
  assert.equal(loaded.setupCompleted, undefined);
  assert.equal(loaded.humanSupportEnabled, true);
  assert.equal(loaded.knowledgeBase.pricing, 'Approved prices');
  assert.ok(getActiveStudioModules(loaded, {}).includes('support'));
});

test('help card setup accepts direct questions and validates explicit choices', () => {
  const base = { conversationCardsEnabled: true, conversationCards: [{ id: 'hours', title: 'Åpningstider', options: [] }] };
  assert.equal(getStudioModuleStatus('cards', base, {}).required.includes('cardQuestions'), false);
  base.conversationCards[0].options = [{ label: '', prompt: '' }];
  assert.equal(getStudioModuleStatus('cards', base, {}).required.includes('cardQuestions'), true);
  base.conversationCards[0].options = [{ label: 'Helg', prompt: 'Når er dere åpne i helgen?' }];
  assert.equal(getStudioModuleStatus('cards', base, {}).required.includes('cardQuestions'), false);
});
