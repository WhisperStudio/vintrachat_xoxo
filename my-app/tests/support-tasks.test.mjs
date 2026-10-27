import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the real service's write/read mapping without contacting Firebase.
function loadService(firestore) {
  function load(file, dependencies = {}) {
    const source = ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const context = { exports: {}, Date, crypto: globalThis.crypto, require: name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    } };
    vm.runInNewContext(source, context);
    return context.exports;
  }
  return load('../src/lib/chat.service.ts', {
    'firebase/firestore': firestore,
    '@/lib/firebase': { db: {} },
    '@/lib/chat-analytics': load('../src/lib/chat-analytics.ts'),
  });
}

test('created tasks retain their widget through reading and remain visible to the correct widget filter', async () => {
  const records = new Map();
  const service = loadService({
    collection: (_db, path) => ({ path }),
    doc: collection => ({ path: collection.path, id: `task-${records.size}` }),
    serverTimestamp: () => ({ toDate: () => new Date('2026-10-27T10:00:00Z') }),
    setDoc: async (ref, data) => { records.set(ref.id, data); },
    orderBy: () => ({}),
    query: ref => ref,
    getDocs: async ref => {
      assert.equal(ref.path, 'businesses/business-a/supportTasks');
      return { docs: [...records].map(([id, data]) => ({ id, data: () => data })) };
    },
  });
  for (const widgetKey of ['widget-a', 'widget-b']) {
    await service.createSupportTask('business-a', {
      widgetKey, title: `Task for ${widgetKey}`, description: 'Help the customer',
      categoryId: 'general', categoryName: 'General', priority: 'medium', status: 'open',
    });
  }
  const tasks = await service.getSupportTasks('business-a');
  assert.equal(tasks.length, 2);
  for (const widgetKey of ['widget-a', 'widget-b']) {
    const visible = tasks.filter(task => task.widgetKey === widgetKey);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].title, `Task for ${widgetKey}`);
    assert.equal(visible[0].businessId, 'business-a');
    assert.equal(visible[0].createdAt.toISOString(), '2026-10-27T10:00:00.000Z');
  }
});

test('Firestore permission failures propagate instead of being returned as an empty task list', async () => {
  const failure = Object.assign(new Error('Access denied'), { code: 'permission-denied' });
  const service = loadService({
    collection: () => ({}), orderBy: () => ({}), query: ref => ref,
    getDocs: async () => { throw failure; },
  });
  await assert.rejects(service.getSupportTasks('business-a'), error => error === failure);
});
