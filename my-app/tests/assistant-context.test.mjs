import { cleanImportedKnowledge } from '../src/lib/website-knowledge.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as cheerio from 'cheerio';
import { buildAnswerPolicy, isHumanSupportRequest, filterContactDisclosure } from '../src/lib/assistant-answer-policy.mjs';
import { mergeWebsiteKnowledge } from '../src/lib/studio-onboarding.mjs';

const require = createRequire(import.meta.url);
function scanner(fetch) {
  const exports = {};
  const js = ts.transpileModule(fs.readFileSync(new URL('../src/lib/website-context-scanner.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(js, { exports, require: name => name === './website-knowledge.mjs' ? { cleanImportedKnowledge } : require(name), URL, AbortController, setTimeout, clearTimeout, fetch });
  return exports;
}

const prices = `<html><head><title>Chatbot plans</title></head><body><main><h1>AI Chatbot subscriptions</h1>
<article><h2>Free chatbot</h2><div class="price"><span>0</span><span> kr / month</span></div><p>Permanently free, no credit card.</p><p>20 conversations, 100 messages per day</p></article>
<article><h2>Pro chatbot</h2><div class="price"><span>299</span><span> kr / month</span></div><p>500 conversations, 2500 messages per day</p></article>
<article><h2>Website development</h2><div class="price">15 150 kr one-off</div><p>Website project. Chatbot subscription is separate.</p></article></main></body></html>`;

test('import separates branch contacts and hours, rejects social IDs and keeps privacy out of services', async () => {
  const pages = {
    'https://example.com/': `<title>Example Frisør</title><main><h1>Frisør og hårpleie</h1><a href="/avdelinger">Avdelinger</a><a href="/behandlinger">Behandlinger</a><a href="/personvern">Personvern</a><a href="https://instagram.com/p/18111486173360663">Instagram</a><p>18118399507966367</p></main>`,
    'https://example.com/avdelinger': `<title>Avdelinger</title><main><p>Example Sentrum tlf. 22334455</p><p>Example Nord tlf. 66778899</p><section><h2>Example Sentrum</h2><p>Adresse: Storgata 1, 0123 Oslo</p><p>Mandag 09:00–17:00</p><a href="tel:22334455">Ring</a></section><section><h2>Example Nord</h2><p>Adresse: Nordgata 2, 0456 Oslo</p><p>Mandag 10:00–18:00</p><a href="tel:66778899">Ring</a></section></main>`,
    'https://example.com/behandlinger': `<title>Behandlinger</title><main><h1>Våre behandlinger</h1><h2>Barneklipp</h2><p>Hårklipp for barn.</p><h2>Skjeggklipp</h2><p>Vi former skjegget.</p></main>`,
    'https://example.com/personvern': `<title>Personvern</title><main><p>Vi beholder personopplysningene dine for å utføre tjenestene.</p><p>Vår daglige leder: privacy@example.com</p></main>`,
  };
  const result = await scanner(async url => ({ ok: Boolean(pages[url]), status: pages[url] ? 200 : 404, headers: { get: () => 'text/html' }, text: async () => pages[url] || '' })).scanWebsiteForAssistantContext('https://example.com', { maxPages: 4 });
  const knowledge = result.autofill.knowledgeBase;
  assert.match(knowledge.contactInfo, /\[Example Sentrum\] 22334455/);
  assert.match(knowledge.contactInfo, /\[Example Nord\] 66778899/);
  assert.doesNotMatch(knowledge.contactInfo, /18111486173360663|18118399507966367|privacy@example/);
  assert.match(knowledge.openingHours, /\[Example Sentrum\] Mandag 09:00/);
  assert.match(knowledge.openingHours, /\[Example Nord\] Mandag 10:00/);
  assert.match(knowledge.addresses, /\[Example Nord\].*Nordgata/);
  assert.match(knowledge.offerings, /Barneklipp/);
  assert.doesNotMatch(knowledge.offerings, /personopplysning/);
  assert.doesNotMatch(knowledge.policies, /personopplysning/);
  assert.equal(result.autofill.businessProfile.industry, 'Frisør og hårpleie');
  const merged = mergeWebsiteKnowledge({ businessProfile: { industry: 'Game dev studio' }, contactSharing: { enabled: true } }, result);
  assert.equal(merged.businessProfile.industry, 'Frisør og hårpleie');
  assert.match(merged.knowledgeBase.contactInfo, /Example Nord: 66778899/);
  assert.match(buildAnswerPolicy({}), /ask which branch or department/);
});

test('structured department records retain their own address and hours', async () => {
  const html = '<title>Hospital departments</title><script type="application/ld+json">' + JSON.stringify({ '@type': 'Hospital', name: 'Hospital', department: [
    { '@type': 'MedicalClinic', name: 'Clinic West', telephone: '+4722334455', address: { streetAddress: 'West road 1', postalCode: '0123', addressLocality: 'Oslo' }, openingHoursSpecification: { dayOfWeek: ['Monday'], opens: '08:00', closes: '16:00' } },
    { '@type': 'MedicalClinic', name: 'Clinic East', telephone: '+4766778899', address: { streetAddress: 'East road 2', postalCode: '0456', addressLocality: 'Oslo' }, openingHours: 'Monday 10:00–18:00' },
  ] }) + '</script>';
  const result = await scanner(async url => ({ ok: url === 'https://example.com/', headers: { get: () => 'text/html' }, text: async () => html })).scanWebsiteForAssistantContext('https://example.com', { maxPages: 1 });
  assert.match(result.autofill.knowledgeBase.addresses, /\[Clinic West\] West road 1/);
  assert.match(result.autofill.knowledgeBase.openingHours, /\[Clinic East\] Monday 10:00/);
  assert.doesNotMatch(result.autofill.knowledgeBase.contactInfo, /\[Hospital\].*22334455/);
});

test('price extraction keeps product, interval, free-plan terms and source together without joining offer amounts', () => {
  const lines = scanner().extractPricingEvidence(cheerio.load(prices), 'https://example.com/priser');
  assert.equal(lines.length, 3);
  const pro = lines.find(line => line.startsWith('[Pro chatbot]'));
  assert.match(pro, /299 kr \/ month/);
  assert.match(pro, /Source: https:\/\/example.com\/priser/);
  assert.doesNotMatch(pro, /15 150|Website development/);
  assert.match(lines.find(line => line.startsWith('[Free chatbot]')), /Permanently free/);
});

test('the crawl prioritizes a real pricing page and stores editable per-offer prices', async () => {
  const visited = [];
  const pages = {
    'https://example.com/': '<html lang="en"><head><title>Example Studio</title></head><body><main><h1>Example Studio</h1><p>We offer websites and AI chatbots for businesses.</p><a href="/contact">Contact</a><a href="/priser">Prices</a></main></body></html>',
    'https://example.com/priser': prices,
  };
  const result = await scanner(async url => {
    visited.push(url);
    return { ok: Boolean(pages[url]), status: pages[url] ? 200 : 404, headers: { get: () => 'text/html' }, text: async () => pages[url] || '' };
  }).scanWebsiteForAssistantContext('https://example.com', { maxPages: 2, timeoutMs: 2000 });
  assert.ok(visited.includes('https://example.com/priser'));
  assert.match(result.autofill.knowledgeBase.pricing, /Pro chatbot.*299/);
  const merged = mergeWebsiteKnowledge({ knowledgeBase: {} }, result);
  assert.equal(merged.knowledgeBase.pricing, result.autofill.knowledgeBase.pricing);
});

test('pricing remains readable when the visible page is client-rendered but offers are in JSON-LD', async () => {
  const html = '<html><head><title>Chatbot prices</title><script type="application/ld+json">' + JSON.stringify({ '@type': 'Product', name: 'AI chatbot', offers: [{ '@type': 'Offer', name: 'Chatbot Pro monthly', price: 299, priceCurrency: 'NOK', description: 'Billed per month. Website development is separate.' }, { '@type': 'Offer', name: 'Chatbot Pro yearly', price: 2990, priceCurrency: 'NOK', description: 'Total annual charge, not a monthly price.' }] }) + '</script></head><body><main>Loading plans...</main></body></html>';
  const result = await scanner(async url => ({ ok: url === 'https://example.com/priser', status: url === 'https://example.com/priser' ? 200 : 404, headers: { get: () => 'text/html' }, text: async () => html })).scanWebsiteForAssistantContext('https://example.com/priser', { maxPages: 1 });
  assert.match(result.autofill.knowledgeBase.pricing, /Chatbot Pro monthly 299 NOK Billed per month/);
  assert.match(result.autofill.knowledgeBase.pricing, /Chatbot Pro yearly 2990 NOK Total annual charge/);
});

test('contact details, ambiguous service questions and normal thanks never auto-open human support', () => {
  const keywords = ['support', 'human', 'person', 'agent', 'contact'];
  for (const message of ['Hvilken AI bruker dere?', 'Hva er e-postadressen deres?', 'How do I contact you?', 'Do you support hair salons?', 'Hvorfor ber du meg kontakte support?', 'Takk']) {
    assert.equal(isHumanSupportRequest(message, keywords), false, message);
  }
  assert.equal(isHumanSupportRequest('Jeg vil snakke med et menneske', keywords), true);
  assert.equal(isHumanSupportRequest('Please email me', keywords), true);
  assert.equal(isHumanSupportRequest('Nei, ikke kontakt meg', keywords), false);
  assert.equal(isHumanSupportRequest('Ja takk', keywords, [{ role: 'assistant', text: 'Ønsker du å snakke med teamet?' }]), true);
});

test('public contact sharing and support are independent, and prices survive contact filtering', () => {
  const reply = 'Pro koster 299 kr per måned. Kontakt oss på salong@example.com.';
  assert.equal(filterContactDisclosure(reply, { message: 'Hva koster Pro?', language: 'Norwegian' }), 'Pro koster 299 kr per måned.');
  assert.equal(filterContactDisclosure(reply, { contactSharing: { enabled: true }, message: 'Hva koster Pro?' }), 'Pro koster 299 kr per måned.');
  assert.equal(filterContactDisclosure(reply, { contactSharing: { enabled: true }, message: 'Hva er e-postadressen?' }), reply);
  assert.doesNotMatch(filterContactDisclosure('Ring oss på 41 76 12 52.', { message: 'Hva koster det?' }), /41 76/);
  assert.match(buildAnswerPolicy({ contactSharing: { enabled: true }, humanSupportEnabled: false }), /may still provide approved public contact details/);
  assert.match(buildAnswerPolicy({ contactSharing: { enabled: false }, humanSupportEnabled: true }), /does not disable the separate human-support/);
});

test('the real chat prompt includes product-specific facts, scope reasoning and contact policy', () => {
  const file = fs.readFileSync(new URL('../src/app/api/widget/chat/route.ts', import.meta.url), 'utf8');
  const source = ts.createSourceFile('chat.ts', file, ts.ScriptTarget.Latest, true);
  const node = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'buildPrompt');
  const js = ts.transpileModule(node.getText(source), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const build = vm.runInNewContext(js + '\nbuildPrompt', { buildAnswerPolicy });
  const prompt = build({ businessName: 'Salon', businessContext: 'Hair salon', knowledgeBase: { websiteUrls: [], uploadedDocuments: [], keyFAQs: [], pricing: 'Haircut: 499 NOK per visit', notOffered: 'Vehicle repairs' }, faqSuggestions: [], conversationCards: [], supportKeywords: [], history: [{ role: 'user', text: 'Jeg vil ha en AI chatbot' }], message: 'Hva koster det?', humanSupportEnabled: false });
  assert.match(prompt, /Haircut: 499 NOK per visit/);
  assert.match(prompt, /Vehicle repairs/);
  assert.match(prompt, /hair salon does not offer car oil changes/i);
  assert.match(prompt, /Previous assistant replies can be wrong/);
  assert.match(prompt, /Public contact sharing is DISABLED/);
  assert.match(prompt, /Never concatenate numbers/);
});
