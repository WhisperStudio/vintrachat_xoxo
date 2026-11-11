import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import * as widgetMobile from '../src/lib/widget-mobile.mjs'
import * as widgetFlow from '../src/lib/widget-flow.mjs'

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
      if (name === '@/lib/widget-flow.mjs') return widgetFlow
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


test('launcher borders and shapes are independent and safely rendered', () => {
  const { createLauncherArtwork } = loadModule(join(appRoot, 'src/lib/launcher-design.ts'))
  const shapes = ['circle', 'rounded-square', 'square', 'triangle', 'diamond']
  const borders = ['none', 'solid', 'dashed', 'double', 'wavy']
  for (const shape of shapes) {
    const plain = createLauncherArtwork('none', shape)
    assert.match(plain, /stroke="none"/)
    assert.equal((plain.match(/<path /g) || []).length, 1)
    for (const border of borders) {
      const markup = createLauncherArtwork(border, shape)
      assert.doesNotMatch(markup, /NaN|undefined/)
      assert.match(markup, /viewBox="0 0 100 100"/)
      if (border === 'double') assert.equal((markup.match(/<path /g) || []).length, 2)
      if (border === 'dashed') assert.match(markup, /stroke-dasharray=/)
      if (border === 'wavy') assert.notEqual(markup.match(/d="([^"]+)"/)[1], plain.match(/d="([^"]+)"/)[1])
    }
  }
  assert.equal(createLauncherArtwork('rounded'), createLauncherArtwork('solid', 'circle'))
  assert.equal(createLauncherArtwork('solid'), createLauncherArtwork('solid', 'rounded-square'))
  assert.doesNotMatch(createLauncherArtwork('solid', '<script>'), /<script>/)
})


test('surface contours preserve independent corners and migrate legacy borders', () => {
  const { getSurfaceClasses } = loadModule(join(appRoot, 'src/lib/surface-design.ts'))
  for (const borderLine of ['none', 'solid', 'dashed', 'double', 'wavy']) {
    for (const cornerStyle of ['rounded', 'square']) {
      assert.equal(getSurfaceClasses({ borderLine, cornerStyle, borderType: 'rounded', showBorder: true }), 'surface-edge-' + borderLine + ' surface-shape-' + cornerStyle)
    }
  }
  assert.equal(getSurfaceClasses({ borderType: 'rounded' }), 'surface-edge-solid surface-shape-rounded')
  assert.equal(getSurfaceClasses({ borderType: 'solid', showBorder: false }), 'surface-edge-none surface-shape-square')
  assert.equal(getSurfaceClasses({ borderType: 'none', showBorder: true }), 'surface-edge-solid surface-shape-square')
})


test('widget motion validates stored values and keeps opening, sent and received settings independent', () => {
  const { getWidgetMotionClasses } = loadModule(join(appRoot, 'src/lib/widget-motion.ts'))
  assert.equal(getWidgetMotionClasses(), 'motion-open-none motion-sent-none motion-received-none')
  for (const kind of ['none', 'fade', 'slide', 'pop', 'bounce']) {
    assert.equal(getWidgetMotionClasses({ openAnimation: kind, sentAnimation: 'slide', receivedAnimation: 'fade' }), 'motion-open-' + kind + ' motion-sent-slide motion-received-fade')
  }
  assert.equal(getWidgetMotionClasses({ openAnimation: 'invalid', sentAnimation: '<script>', receivedAnimation: null }), 'motion-open-none motion-sent-none motion-received-none')
})


test('message bubble settings remain independent of the surrounding chat surfaces', () => {
  const { getMessageSurfaceClasses } = loadModule(join(appRoot, 'src/lib/surface-design.ts'))
  assert.equal(getMessageSurfaceClasses({}), '')
  assert.equal(getMessageSurfaceClasses({ borderLine: 'double', cornerStyle: 'square' }), '')
  for (const border of ['none', 'solid', 'dashed', 'double', 'wavy']) {
    assert.equal(getMessageSurfaceClasses({ messageBorderLine: border, messageCornerStyle: 'rounded', borderLine: 'none' }), 'surface-edge-' + border + ' surface-shape-rounded')
  }
})
