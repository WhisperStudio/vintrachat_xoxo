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
  vm.runInNewContext(js, { exports, require, URL, AbortController, setTimeout, clearTimeout, fetch });
  return exports;
}

const prices = `<html><head><title>Chatbot plans</title></head><body><main><h1>AI Chatbot subscriptions</h1>
<article><h2>Free chatbot</h2><div class="price"><span>0</span><span> kr / month</span></div><p>Permanently free, no credit card.</p><p>20 conversations, 100 messages per day</p></article>
<article><h2>Pro chatbot</h2><div class="price"><span>299</span><span> kr / month</span></div><p>500 conversations, 2500 messages per day</p></article>
<article><h2>Website development</h2><div class="price">15 150 kr one-off</div><p>Website project. Chatbot subscription is separate.</p></article></main></body></html>`;

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
