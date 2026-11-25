import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { getBuiltinWidgetTranslations } from '../src/lib/widget-builtin-translations.mjs'
const require = createRequire(import.meta.url)
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function plainModule(path) { const module = { exports: {} }; vm.runInNewContext(compile(path), { module, exports: module.exports }); return module.exports }
const localization = plainModule('../src/lib/widget-localization.ts')
const uiCopy = plainModule('../src/lib/widget-ui-copy.ts')
function fixture(options = {}) {
  const calls = [], cache = new Map()
  let limited = 0
  const module = { exports: {} }
  const business = { id: 'business', chatWidgetConfig: { customBranding: { description: 'Vi reparerer sykler.' } }, chatAssistantConfig: { localization: { enabled: true, defaultLanguage: 'no', allowedLanguages: ['no','en','de'] } } }
  vm.runInNewContext(compile('../src/app/api/widget/translate/route.ts'), {
    module, exports: module.exports, console: { error() {}, warn() {} }, AbortSignal,
    process: { env: { GEMINI_API_KEY: options.missingKey ? '' : 'fixture-key' } },
    fetch: async (_url, init) => {
      const texts = JSON.parse(JSON.parse(init.body).contents[0].parts[0].text); calls.push(texts)
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(options.incomplete ? [] : texts.map(t => t === 'Vi reparerer sykler.' ? 'We repair bicycles.' : `DE: ${t}`)) }] } }] })
    },
    require: name => {
      if (name === '@/lib/widget.server') return { getBusinessByWidgetKey: async () => business, toPublicWidgetConfig: x => x, toPublicAssistantConfig: x => x }
      if (name === '@/lib/widget-embed-token.server') return { authorizeWidgetRequest: async () => ({ allowed: !options.denied, reason: 'Denied' }) }
      if (name === '@/lib/verified-auth.server') return { verifyActiveUserToken: async () => ({ uid: 'preview-owner' }) }
      if (name === '@/lib/server-rate-limit') return { consumeServerRateLimit: async () => { limited++; return { allowed: !options.limited } } }
      if (name === '@/lib/firebase-admin') return { adminDb: { collection: () => ({ doc: key => ({ get: async () => ({ exists: cache.has(key), data: () => cache.get(key) }), set: async value => { if (options.cacheWriteFails) throw Error('offline'); cache.set(key, value) } }) }) } }
      if (name === '@/lib/widget-localization') return localization
      if (name === '@/lib/widget-ui-copy') return uiCopy
      if (name === '@/lib/widget-builtin-translations.mjs') return { getBuiltinWidgetTranslations }
      return require(name)
    },
  })
  return { calls, limited: () => limited, post: body => module.exports.POST(new Request('http://example.test/api/widget/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ widgetKey: 'fixture', ...body }) })) }
}
test('all shared Norwegian and English interface copy works without a provider', () => {
  for (const language of ['no', 'en']) for (const text of uiCopy.WIDGET_UI_COPY) assert.ok(getBuiltinWidgetTranslations(language)[text], `${language}: ${text}`)
  assert.equal(getBuiltinWidgetTranslations('en')['Send melding'], 'Send message')
})
test('source language works with no API key or database translation writes', async () => {
  const f = fixture({ missingKey: true }); const r = await f.post({ language: 'no' })
  assert.equal(r.status, 200); assert.equal((await r.json()).translations['Send message'], 'Send melding'); assert.equal(f.calls.length, 0); assert.equal(f.limited(), 0)
})
test('authored content is translated and a second request uses the cache', async () => {
  const f = fixture(); const r = await f.post({ language: 'en' })
  assert.equal(r.status, 200); assert.equal((await r.json()).translations['Vi reparerer sykler.'], 'We repair bicycles.')
  assert.deepEqual(f.calls[0], ['Vi reparerer sykler.'])
  assert.equal((await f.post({ language: 'en' })).status, 200); assert.equal(f.calls.length, 1)
})
test('additional languages include standard UI and custom copy', async () => {
  const f = fixture(); assert.equal((await f.post({ language: 'de' })).status, 200)
  assert.ok(f.calls[0].includes('Send message')); assert.ok(f.calls[0].includes('Vi reparerer sykler.'))
})
test('forbidden widgets and languages cannot call the translation provider', async () => {
  const f = fixture({ denied: true }); assert.equal((await f.post({ language: 'en' })).status, 403)
  const g = fixture(); assert.equal((await g.post({ language: 'fi' })).status, 403)
  assert.equal(f.calls.length + g.calls.length, 0)
})
test('missing configuration and rate limits are distinguishable from success', async () => {
  const f = fixture({ missingKey: true }); const r = await f.post({ language: 'en' })
  assert.equal(r.status, 503); assert.equal((await r.json()).code, 'translation_not_configured')
  const g = fixture({ limited: true }); assert.equal((await g.post({ language: 'en' })).status, 429); assert.equal(g.calls.length, 0)
})
test('incomplete provider output fails instead of being cached as a success', async () => {
  const f = fixture({ incomplete: true }); assert.equal((await f.post({ language: 'en' })).status, 503)
})
test('a cache write failure does not discard a completed translation', async () => {
  const f = fixture({ cacheWriteFails: true }); const r = await f.post({ language: 'en' })
  assert.equal(r.status, 200); assert.equal((await r.json()).translations['Vi reparerer sykler.'], 'We repair bicycles.')
})
