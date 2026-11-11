import { getBuiltinWidgetTranslations } from '../src/lib/widget-builtin-translations.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { getWidgetPageStyle, getContextualWidgetSuggestions, resolveWidgetFlow, validateWidgetContact } from '../src/lib/widget-flow.mjs';
import { installWidgetMobileViewport, shouldAnimateWidgetLauncher, patchWidgetMarkup } from '../src/lib/widget-mobile.mjs';

test('support off overrides tickets and handoff; old configurations retain their behavior', () => {
  const legacy = resolveWidgetFlow({ tasksEnabled: true });
  assert.equal(legacy.ticketsEnabled, true);
  assert.equal(resolveWidgetFlow({}).supportEnabled, true);
  assert.equal(resolveWidgetFlow({}).ticketsEnabled, false);
  const off = resolveWidgetFlow({ tasksEnabled: true, ticket: { mode: 'off', allowVisitorCreation: true } });
  assert.equal(off.supportEnabled, false);
  assert.equal(off.ticketsEnabled, false);
  assert.equal(off.allowVisitorCreation, false);
  assert.equal(resolveWidgetFlow({ ticket: { mode: 'always' } }, { humanSupportEnabled: false }).ticketsEnabled, false);
});

test('ticket visibility, self service and review consent are independent', () => {
  const flow = resolveWidgetFlow({ ticket: { mode: 'always', allowVisitorCreation: false }, reviewsEnabled: true, reviewPage: { autoAsk: false, showHeaderButton: true } });
  assert.equal(flow.alwaysShowTickets, true);
  assert.equal(flow.allowVisitorCreation, false);
  assert.equal(flow.autoAskReview, false);
  assert.equal(flow.reviewHeaderButton, true);
  assert.equal(resolveWidgetFlow({ reviewsEnabled: false, reviewPage: { showHeaderButton: true } }).reviewHeaderButton, false);
  assert.equal(resolveWidgetFlow({ ticket: { mode: 'on-demand', showTabAlways: true } }).alwaysShowTickets, true);
  assert.equal(resolveWidgetFlow({ ticket: { mode: 'always', showTabAlways: false } }).alwaysShowTickets, false);
});

test('typed help suggestions rank welcome-menu prompts by the requested topic', () => {
  const prompts = [
    { prompt: 'What are your opening hours?', label: 'Opening hours', context: 'Frequently asked questions' },
    { prompt: 'Can you tell me your prices?', label: 'Prices', context: 'Frequently asked questions' },
    { prompt: 'How can I contact you?', label: 'Contact', context: 'Frequently asked questions' },
  ];
  assert.deepEqual(getContextualWidgetSuggestions('Hva er åpningstidene?', prompts), ['What are your opening hours?']);
  assert.deepEqual(getContextualWidgetSuggestions('How much does it cost?', prompts), ['Can you tell me your prices?']);
});

test('required contact fields are visible and validated consistently', () => {
  const flow = resolveWidgetFlow({ contactForm: { showEmail: false, requireEmail: true, requirePhone: true } });
  assert.equal(flow.showEmail, true);
  assert.match(validateWidgetContact(flow, { name: 'Ada' }), /email/);
  assert.match(validateWidgetContact(flow, { name: 'Ada', email: 'wrong' }), /valid email/);
  assert.match(validateWidgetContact(flow, { name: 'Ada', email: 'ada@example.com' }), /phone/);
  assert.equal(validateWidgetContact(flow, { name: 'Ada', email: 'ada@example.com', phone: '+4712345678' }), '');
});

function loadFunctions(file) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { exports });
  return exports;
}

function exportedScript() {
  const file = new URL('../src/app/api/widget-script/[widgetKey]/route.ts', import.meta.url);
  const source = ts.createSourceFile(file.pathname, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  let template;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'script') template = node.initializer.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert.ok(template);
  return vm.runInNewContext(template, {
    widgetKey: 'test-widget', origin: 'https://example.com', debugMode: false, forceOpen: false,
    serializeForJs: JSON.stringify, WIDGET_THEME_CLASS: {}, WIDGET_THEME_VARS: {}, WIDGET_ICON_MARKUP_BY_KEY: {}, WIDGET_ICON_ALIAS_MAP: {},
    widgetStyles: '', ORB_ICON_SVG: '', installWidgetMobileViewport, shouldAnimateWidgetLauncher, patchWidgetMarkup,
    getBuiltinWidgetTranslations, getWidgetPageStyle, resolveWidgetFlow, validateWidgetContact, getContextualWidgetSuggestions,
    ...loadFunctions('../src/lib/widget-motion.ts'), ...loadFunctions('../src/lib/surface-design.ts'), ...loadFunctions('../src/lib/launcher-design.ts'),
  });
}

test('the exported widget is valid JavaScript with its real serialized helpers', () => {
  assert.doesNotThrow(() => new vm.Script(exportedScript()));
});

test('exported ticket form respects self-service and escapes editable copy', () => {
  const script = exportedScript();
  const source = ts.createSourceFile('widget.js', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let getTaskPanel;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'getTaskPanelMarkup') getTaskPanel = node.getText(source);
    ts.forEachChild(node, visit);
  }
  visit(source);
  const context = {
    state: { tasks: [], tasksLoading: false, handoffName: '<script>bad</script>', handoffEmail: '', handoffPhone: '' },
    isTasksTabEnabled: () => true,
    pageStyle: () => '', pageIcon: () => '', pageCopy: (_, __, fallback) => fallback,
    validateContact: validateWidgetContact,
    getFlow: () => resolveWidgetFlow({ ticket: { mode: 'always', allowVisitorCreation: false, title: '<script>bad</script>' } }),
    escapeHtml: value => String(value || '').replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  };
  const render = vm.runInNewContext(`(${getTaskPanel})`, context);
  assert.doesNotMatch(render(), /widget-task-submit/);
  context.getFlow = () => resolveWidgetFlow({ ticket: { mode: 'always', allowVisitorCreation: true } });
  assert.match(render(), /widget-task-submit/);
  assert.match(render(), /data-contact-field="name"/);
  assert.match(render(), /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.doesNotMatch(render(), /data-task-field="(?:title|description)"/);
  context.state.supportStatus = 'open';
  assert.doesNotMatch(render(), /widget-task-submit|data-contact-field/);
  assert.match(render(), /Open conversation/);
  context.state.supportStatus = '';
  context.state.ticketSubmitted = true;
  assert.doesNotMatch(render(), /widget-task-submit|data-contact-field/);
  context.state.ticketSubmitted = false;
  context.state.tasks = [{ id: 'one', title: 'Request', status: 'open' }];
  context.formatTime = () => '';
  assert.doesNotMatch(render(), /widget-task-submit|data-contact-field/);
  assert.match(render(), /Request/);
});

function route(name, settings, assistant = {}, writes = []) {
  const exports = {};
  const file = new URL(`../src/app/api/widget/${name}/route.ts`, import.meta.url);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, {
    exports,
    console,
    require: name => {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => ({ body, ...init }) } };
      if (name.endsWith('widget-flow.mjs')) return { resolveWidgetFlow, validateWidgetContact };
      if (name.endsWith('widget.server')) return { getBusinessByWidgetKey: async () => ({ id: 'business', chatWidgetConfig: { settings }, chatAssistantConfig: assistant }) };
      if (name.endsWith('widget-embed-token.server')) return { authorizeWidgetRequest: async () => ({ allowed: true }) };
      if (name.endsWith('widget-rate-limit.server')) return { enforceWidgetRateLimit: async () => ({ allowed: true }) };
      if (name.endsWith('widget-security')) return { getClientIp: () => '127.0.0.1' };
      if (name === 'firebase-admin/firestore') return { FieldValue: { serverTimestamp: () => 0 } };
      if (name.endsWith('firebase-admin')) {
        const ref = path => ({
          collection: name => ({ doc: id => ref(`${path}/${name}/${id || 'task-1'}`) }),
          set: async data => writes.push({ path, data }), update: async () => {},
          get: async () => ({ id: 'task-1', data: () => writes.find(item => item.path === path)?.data }),
        });
        return { adminDb: { collection: name => ({ doc: id => ref(`${name}/${id}`) }) } };
      }
      return {};
    },
  });
  return exports;
}

test('public API blocks disabled reviews, tickets and human support before writing', async () => {
  const request = { headers: { get: () => null }, json: async () => ({ widgetKey: 'widget', sessionId: 'session', title: 'Help', description: 'Question', visitorName: 'Ada', rating: 5, text: 'Thanks' }) };
  for (const [name, settings] of [
    ['feedback', { reviewsEnabled: false }],
    ['tasks', { tasksEnabled: true, ticket: { mode: 'off' } }],
    ['tasks', { ticket: { mode: 'always', allowVisitorCreation: false } }],
    ['support', { ticket: { mode: 'off' } }],
  ]) {
    const response = await route(name, settings).POST(request);
    assert.equal(response.status, 403, `${name}: ${JSON.stringify(settings)}`);
  }
});

test('visitor tickets are stored in the owner business task collection with contact details', async () => {
  const writes = [];
  const request = { headers: { get: () => null }, json: async () => ({ widgetKey: 'widget', sessionId: 'session', title: 'Help', description: 'Question', visitorName: 'Ada', visitorEmail: 'ada@example.com', visitorPhone: '+4712345678' }) };
  const response = await route('tasks', { ticket: { mode: 'always' } }, {}, writes).POST(request);
  assert.equal(response.body.success, true);
  const saved = writes.find(item => item.path === 'businesses/business/supportTasks/task-1');
  assert.ok(saved);
  assert.equal(saved.data.businessId, 'business');
  assert.equal(saved.data.widgetKey, 'widget');
  assert.equal(saved.data.visitorEmail, 'ada@example.com');
  assert.equal(saved.data.visitorPhone, '+4712345678');
});

test('ticket API enforces required contact fields independently of the client', async () => {
  const request = { headers: { get: () => null }, json: async () => ({ widgetKey: 'widget', sessionId: 'session', title: 'Help', description: 'Question', visitorName: 'Ada' }) };
  const response = await route('tasks', { ticket: { mode: 'always' }, contactForm: { requireEmail: true } }).POST(request);
  assert.equal(response.status, 400);
  assert.match(response.body.error, /email/);
});

test('review form requires an explicit request or acceptance of the latest offer', () => {
  const file = new URL('../src/app/api/widget/chat/route.ts', import.meta.url);
  const source = ts.createSourceFile('chat.ts', fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const names = ['didUserRequestFeedback', 'didAssistantOfferFeedback', 'isAffirmativeReply'];
  const functions = source.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)).map(node => node.getText(source)).join('\n');
  const js = ts.transpileModule(functions, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const consent = vm.runInNewContext(js + '\n(message, history) => didUserRequestFeedback(message, ["review", "anmeldelse"]) || (didAssistantOfferFeedback(history) && isAffirmativeReply(message))');
  const offer = [{ role: 'assistant', text: 'Vil du gi en anmeldelse?' }];
  assert.equal(consent('Ja takk!', offer), true);
  assert.equal(consent('Nei takk', offer), false);
  assert.equal(consent('Jeg vil ikke gi en anmeldelse', offer), false);
  assert.equal(consent('Takk for hjelpen', []), false);
  assert.equal(consent('Yes', [{ role: 'assistant', text: 'Do you need more help?' }]), false);
  assert.equal(consent('I want to leave a review', []), true);
});

test('ticket submission and support navigation do not trigger feedback actions', () => {
  const source = ts.createSourceFile('widget.js', exportedScript(), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let bind;
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name?.text === 'bindWidgetActions') bind = node.getText(source); ts.forEachChild(node, visit); }
  visit(source);
  const listeners = {}; const calls = [];
  const state = { activePanel: 'tasks', feedbackOpen: false };
  const context = { widgetActionsBound: false, state,
    mount: { addEventListener: (name, fn) => { listeners[name] = fn; } },
    submitTask: () => calls.push('ticket'), submitFeedback: () => calls.push('feedback'), render: () => calls.push('render'),
  };
  vm.runInNewContext(`(${bind})()`, context);
  function click(classes, panel) {
    const button = { classList: { contains: name => classes.includes(name) }, hasAttribute: name => name === 'data-widget-panel' && !!panel, getAttribute: () => panel, closest: () => null };
    listeners.click({ target: { closest: () => button } });
  }
  click(['widget-feedback-primary', 'widget-task-submit']);
  assert.deepEqual(calls, ['ticket']);
  click(['widget-feedback-secondary'], 'chats');
  assert.equal(state.activePanel, 'chats');
  assert.deepEqual(calls, ['ticket', 'render']);
});

test('the installed widget localizes fields and offers languages behind an icon', () => {
  const source = ts.createSourceFile('widget.js', exportedScript(), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const functions = {};
  function visit(node) { if (ts.isFunctionDeclaration(node) && node.name) functions[node.name.text] = node.getText(source); ts.forEachChild(node, visit); }
  visit(source);
  const textNode = { textContent: 'Contact information', parentElement: { closest: () => null } };
  const mount = { querySelectorAll: () => [], lang: '' };
  const context = {
    state: { uiLanguage: 'no', translations: {} }, mount, NodeFilter: { SHOW_TEXT: 4 },
    document: { createTreeWalker: () => { let seen = false; return { nextNode() { if (seen) return null; seen = true; return textNode; } }; } },
    builtinTranslations: getBuiltinWidgetTranslations,
    languageNames: { no: 'Norsk', en: 'English' },
    getLanguages: () => ({ enabled: true, allowed: ['no', 'en'] }), escapeHtml: String,
  };
  context.uiText = vm.runInNewContext(`(${functions.uiText})`, context);
  const translate = vm.runInNewContext(`(${functions.translateRenderedCopy})`, context);
  translate(); assert.equal(textNode.textContent, 'Kontaktinformasjon');
  translate(); assert.equal(textNode.textContent, 'Kontaktinformasjon');
  context.state.uiLanguage = 'en'; translate(); assert.equal(textNode.textContent, 'Contact information');
  const picker = vm.runInNewContext(`(${functions.languageSelectorMarkup})`, context)();
  assert.match(picker, /widget-language-picker/); assert.match(picker, /<svg/);
  assert.match(picker, /data-widget-language="no"/); assert.match(picker, /data-widget-language="en" aria-pressed="true"/);
});
