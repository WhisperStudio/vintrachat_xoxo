import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Run the actual account configuration functions without Firebase/network side effects.
function loadFunctions(file, names) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const functions = ast.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text));
  assert.equal(functions.length, names.length);
  const code = functions.map(node => node.getText(ast)).join('\n') + `\nexports.result = { ${names.join(', ')} };`;
  const context = { exports: {}, launcherIconChoiceMap: {}, parseAllowedDomainsInput: value => value || [] };
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText, context);
  return context.exports.result;
}
const account = loadFunctions('../src/lib/auth.service.ts', ['buildDefaultWidgetConfig', 'mergeWidgetConfig']);
const signup = loadFunctions('../src/lib/pending-auth.server.ts', ['buildDefaultWidgetConfig']);
const plain = value => JSON.parse(JSON.stringify(value));
const defaultLogo = { zoom: 100, focusX: 50, focusY: 50 };

test('new verified business configuration opens with safe logo defaults', () => {
  const config = signup.buildDefaultWidgetConfig('New business');
  assert.deepEqual(plain(account.mergeWidgetConfig(config, 'New business').customBranding.logoStyle), defaultLogo);
  assert.deepEqual(plain(config.customBranding.logoStyle), defaultLogo);
});
test('older accounts without logo settings load without a crash', () => {
  for (const config of [undefined, {}, { customBranding: { title: 'Legacy' } }, { customBranding: { logoStyle: null } }]) {
    assert.deepEqual(plain(account.mergeWidgetConfig(config, 'Legacy').customBranding.logoStyle), defaultLogo);
  }
});
test('saved logo settings are preserved and partial settings are completed', () => {
  assert.deepEqual(plain(account.mergeWidgetConfig({ customBranding: { logoStyle: { zoom: 135, focusX: 0 } } }, 'Custom').customBranding.logoStyle), { zoom: 135, focusX: 0, focusY: 50 });
});
