import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import * as widgetMobile from '../src/lib/widget-mobile.mjs'

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const require = createRequire(import.meta.url)

// Execute the actual script generator without connecting to Firestore.
function loadModule(file, cache = new Map()) {
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }
  cache.set(file, module.exports)
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(compiled, {
    module, exports: module.exports, Response, console,
    process: { cwd: () => appRoot },
    require: name => {
      if (name === '@/lib/widget-mobile.mjs') return widgetMobile
      if (name === '@/lib/widget.server') return { getBusinessByWidgetKey: async () => ({ id: 'fixture', chatWidgetConfig: { allowedDomains: [] } }) }
      if (name === '@/lib/widget-security') return { isWidgetOriginPermitted: () => ({ allowed: true }) }
      if (name.startsWith('@/')) {
        const base = join(appRoot, 'src', name.slice(2))
        return loadModule(existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`, cache)
      }
      return require(name)
    },
  }, { filename: file })
  return module.exports
}

function luminance(hex) {
  const channels = hex.replace('#', '').match(/../g).map(value => {
    const c = parseInt(value, 16) / 255
    return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4
  })
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + .05) / (values[1] + .05)
}

test('all widget themes keep normal text readable on their actual surfaces', () => {
  const { WIDGET_THEME_VARS } = loadModule(join(appRoot, 'src/components/chat/widgetDesign.ts'))
  for (const [theme, colors] of Object.entries(WIDGET_THEME_VARS)) {
    for (const [foreground, background] of [['--chat-on-primary', '--chat-primary'], ['--chat-on-secondary', '--chat-secondary'], ['--chat-text', '--chat-bg'], ['--chat-on-bot', '--chat-bot-bg']]) {
      assert.ok(contrast(colors[foreground], colors[background]) >= 4.5, `${theme}: ${foreground} on ${background} must meet 4.5:1`)
    }
  }
})

test('the exported customer script is valid JavaScript after template interpolation', async () => {
  const { GET } = loadModule(join(appRoot, 'src/app/api/widget-script/[widgetKey]/route.ts'))
  const response = await GET({ nextUrl: new URL('https://example.test/api/widget-script/test?open=1') }, { params: Promise.resolve({ widgetKey: 'test-"-\\-ø' }) })
  assert.equal(response.status, 200)
  assert.match(response.headers.get('Content-Type'), /javascript/)
  const script = await response.text()
  assert.doesNotThrow(() => new vm.Script(script))
})
