import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as guard from '../src/lib/studio-confirmation.mjs';

function mount(props) {
  const states = [], refs = [];
  let cursor = 0, refCursor = 0, now = 0, interval;
  const jsx = (type, props) => ({ type, props });
  const react = {
    useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
    useRef(initial) { const index = refCursor++; return refs[index] ||= { current: initial }; },
    useEffect() {}, useId: () => 'confirmation-test',
  };
  const source = fs.readFileSync(new URL('../src/components/chat/ConfirmStudioAction.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, performance: { now: () => now }, window: { setInterval: callback => { interval = callback; }, clearInterval() {} }, require: name => name === 'react' ? react : name === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : name.endsWith('.css') ? {} : name.includes('studio-confirmation') ? guard : { FiAlertTriangle: 'icon' } });
  function render() { cursor = 0; refCursor = 0; return exports.default(props); }
  function nodes(tree, type) { if (!tree || typeof tree !== 'object') return []; return [ ...(tree.type === type ? [tree] : []), ...[tree.props?.children].flat(Infinity).flatMap(child => nodes(child, type)) ]; }
  return { button: () => nodes(render(), 'button')[0], checkbox: () => nodes(render(), 'input')[0], advance: value => { now += value; interval?.(); }, render };
}

test('confirmation enforces the full five seconds and an additional checkbox for permanent deletion', () => {
  assert.equal(guard.canConfirmStudioAction(null, 10000), false);
  assert.equal(guard.confirmationSecondsRemaining(100, 100), 5);
  assert.equal(guard.canConfirmStudioAction(100, 5099), false);
  assert.equal(guard.canConfirmStudioAction(100, 5100), true);
  assert.equal(guard.canConfirmStudioAction(100, 5100, true, false), false);
  assert.equal(guard.canConfirmStudioAction(100, 5100, true, true), true);
});

test('actual button requires a new click and checkbox, and prevents duplicate requests', async () => {
  let calls = 0, finish;
  const fixture = mount({ requireCheck: true, onConfirm: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  fixture.button().props.onClick();
  fixture.advance(4999);
  fixture.button().props.onClick();
  assert.equal(calls, 0);
  fixture.advance(1);
  assert.equal(calls, 0, 'time passing never performs the action');
  fixture.button().props.onClick();
  assert.equal(calls, 0, 'checkbox is still required after the countdown');
  fixture.checkbox().props.onChange({ target: { checked: true } });
  fixture.button().props.onClick();
  fixture.button().props.onClick();
  assert.equal(calls, 1, 'double click cannot send a second request');
  finish(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.render().props['data-armed'], false);
});

test('failed destructive requests retain the confirmation instead of appearing successful', async () => {
  const fixture = mount({ onConfirm: async () => false });
  fixture.button().props.onClick();
  fixture.advance(5000);
  fixture.button().props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(fixture.render().props['data-armed'], true);
});
