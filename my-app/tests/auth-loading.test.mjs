import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadTimeout() {
  const source = ts.transpileModule(readFileSync(new URL('../src/lib/with-timeout.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const timers = new Map();
  let next = 0;
  const context = { exports: {}, setTimeout: callback => { timers.set(++next, callback); return next; }, clearTimeout: id => timers.delete(id) };
  vm.runInNewContext(source, context);
  return { withTimeout: context.exports.withTimeout, timers };
}

test('an unresponsive account read rejects and releases its timer', async () => {
  const { withTimeout, timers } = loadTimeout();
  let finish;
  const operation = new Promise(resolve => { finish = resolve; });
  const result = withTimeout(operation, 20_000, 'Retry account loading');
  const rejection = assert.rejects(result, /Retry account loading/);
  [...timers.values()][0]();
  await rejection;
  assert.equal(timers.size, 0);
  finish({ role: 'admin' });
  // A late successful read must not turn the failed attempt into success.
  await assert.rejects(result, /Retry account loading/);
});

test('successful and rejected reads preserve their outcome and clear timers', async () => {
  const { withTimeout, timers } = loadTimeout();
  const account = { id: 'verified-user' };
  assert.equal(await withTimeout(Promise.resolve(account), 20_000, 'Timed out'), account);
  assert.equal(timers.size, 0);
  const denied = new Error('Access denied');
  await assert.rejects(withTimeout(Promise.reject(denied), 20_000, 'Timed out'), error => error === denied);
  assert.equal(timers.size, 0);
});
