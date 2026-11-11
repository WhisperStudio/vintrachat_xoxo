import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { mergeWebsiteKnowledge } from '../src/lib/studio-onboarding.mjs'
import { createHash } from 'node:crypto'

function compile(path, dependencies = {}, globals = {}) {
  const module = { exports: {} }
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module, exports: module.exports, require: name => {
    if (!(name in dependencies)) throw new Error(name)
    return dependencies[name]
  }, ...globals })
  return module.exports
}
const localization = compile('../src/lib/widget-localization.ts')
test('language policy includes the default, removes unsupported languages and rejects inherited keys', () => {
  const result = localization.normalizeLocalization({ enabled: true, defaultLanguage: 'sv', allowedLanguages: ['de', 'sv', 'de', 'fr', 'constructor'] })
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { enabled: true, defaultLanguage: 'sv', allowedLanguages: ['sv', 'de'] })
  assert.equal(localization.normalizeLocalization({ defaultLanguage: 'constructor' }).defaultLanguage, 'no')
  assert.equal(localization.normalizeLocalization().enabled, false)
})
test('translation copy contains custom cards and FAQs without business instructions or URLs', () => {
  const copy = localization.collectWidgetCopy({ businessContext: 'Private facts', systemPrompt: 'Private rules', conversationCards: [{ title: 'Services', image: 'https://image.test', options: [{ label: 'Prices', prompt: 'What does it cost?' }] }], faqSuggestions: ['Opening hours?'], startCard: { text: 'Welcome' } })
  assert.deepEqual(Array.from(copy), ['Services', 'Prices', 'What does it cost?', 'Opening hours?', 'Welcome'])
})
test('website import proposes a welcome card without enabling it or replacing customer text', () => {
  const result = { autofill: { businessProfile: { businessName: 'Ski shop', shortDescription: 'Ski rental' } } }
  const first = mergeWebsiteKnowledge({}, result)
  assert.equal(first.startCard.enabled, false)
  assert.match(first.startCard.text, /Ski shop/)
  assert.match(first.startCard.text, /Ski rental/)
  const next = mergeWebsiteKnowledge({ startCard: { enabled: true, text: 'My own welcome' } }, result)
  assert.deepEqual(next.startCard, { enabled: true, text: 'My own welcome' })
})
test('public translation rejects disabled languages and unauthorized requests before cache or AI access', async () => {
  let permitted = true
  let cacheReads = 0
  const { POST } = compile('../src/app/api/widget/translate/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } },
    'node:crypto': {},
    '@/lib/widget.server': { getBusinessByWidgetKey: async () => ({ id: 'business', chatAssistantConfig: { localization: { enabled: false, defaultLanguage: 'no', allowedLanguages: ['no', 'de'] } } }) },
    '@/lib/widget-embed-token.server': { authorizeWidgetRequest: async () => ({ allowed: permitted, reason: 'Invalid origin' }) },
    '@/lib/verified-auth.server': {}, '@/lib/server-rate-limit': {},
    '@/lib/firebase-admin': { adminDb: { collection: () => { cacheReads++; throw new Error('Must not read cache') } } },
    '@/lib/widget-localization': localization, '@/lib/widget-ui-copy': { WIDGET_UI_COPY: [] },
  })
  const request = language => ({ text: async () => JSON.stringify({ widgetKey: 'widget', language }) })
  assert.equal((await POST(request('fr'))).status, 400)
  assert.equal((await POST(request('de'))).status, 403)
  permitted = false
  assert.equal((await POST(request('no'))).status, 403)
  assert.equal(cacheReads, 0)
})

test('translations are reused and long customer text is stored as field values, not Firestore field names', async () => {
  let stored
  let generated = 0
  const longText = 'Customer welcome '.repeat(150)
  const assistant = { localization: { enabled: true, defaultLanguage: 'no', allowedLanguages: ['no', 'sv'] }, startCard: { text: longText } }
  const { POST } = compile('../src/app/api/widget/translate/route.ts', {
    'next/server': { NextResponse: { json: (body, init = {}) => ({ body, status: init.status || 200 }) } },
    'node:crypto': { createHash },
    '@/lib/widget.server': { getBusinessByWidgetKey: async () => ({ id: 'business', chatAssistantConfig: assistant }), toPublicAssistantConfig: value => value, toPublicWidgetConfig: () => ({}) },
    '@/lib/widget-embed-token.server': { authorizeWidgetRequest: async () => ({ allowed: true }) },
    '@/lib/verified-auth.server': {},
    '@/lib/server-rate-limit': { consumeServerRateLimit: async () => ({ allowed: true }) },
    '@/lib/firebase-admin': { adminDb: { collection: () => ({ doc: () => ({ get: async () => ({ exists: Boolean(stored), data: () => stored }), set: async value => { stored = value } }) }) } },
    '@/lib/widget-localization': localization, '@/lib/widget-ui-copy': { WIDGET_UI_COPY: ['Close'] },
  }, {
    process: { env: { GEMINI_API_KEY: 'test-key' } }, AbortSignal,
    fetch: async (_url, options) => {
      generated++
      const strings = JSON.parse(JSON.parse(options.body).contents[0].parts[0].text)
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(strings.map(text => 'SV: ' + text)) }] } }] }) }
    },
  })
  const request = { text: async () => JSON.stringify({ widgetKey: 'widget', language: 'sv' }) }
  const first = await POST(request)
  assert.equal(first.status, 200)
  assert.equal(first.body.translations[longText], 'SV: ' + longText)
  assert.ok(stored.entries.every(entry => !Array.isArray(entry) && typeof entry.source === 'string'))
  const second = await POST(request)
  assert.equal(second.status, 200)
  assert.equal(second.body.translations.Close, 'SV: Close')
  assert.equal(generated, 1)
})
