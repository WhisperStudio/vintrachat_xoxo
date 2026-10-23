// Deliberately isolated fake for behavioral tests. No Firebase credentials/network.
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
export function memoryDb() {
  const store = new Map();
  let lock = Promise.resolve();
  function apply(path, values, merge = true) {
    const data = merge ? { ...store.get(path) } : {};
    for (const [key, value] of Object.entries(values)) {
      switch (value?.constructor?.name) {
        case 'ServerTimestampTransform':
          data[key] = Timestamp.now();
          break;
        case 'NumericIncrementTransform':
          data[key] = (data[key] || 0) + value.operand;
          break;
        case 'ArrayUnionTransform':
          data[key] = [...new Set([...(data[key] || []), ...value.elements])];
          break;
        case 'DeleteTransform':
          delete data[key];
          break;
        default:
          data[key] = value;
      }
    }
    store.set(path, data);
  }
  const snapshot = (ref) => ({
    id: ref.id,
    ref,
    exists: store.has(ref.path),
    data: () => store.get(ref.path),
  });
  function doc(path) {
    const ref = {
      path,
      id: path.split('/').at(-1),
      collection: (key) => collection(`${path}/${key}`),
      get: async () => snapshot(ref),
      set: async (data, opts) => apply(path, data, !!opts?.merge),
      update: async (data) => {
        assert.ok(store.has(path));
        apply(path, data);
      },
    };
    return ref;
  }
  function collection(path, filters = [], max = Infinity, sort = undefined) {
    return {
      doc: (id) => doc(`${path}/${id}`),
      where: (key, op, value) =>
        collection(path, [...filters, [key, op, value]], max, sort),
      limit: (limit) => collection(path, filters, limit, sort),
      orderBy: (key, direction) =>
        collection(path, filters, max, [key, direction]),
      get: async () => {
        let entries = [...store].filter(
          ([p, data]) =>
            p.startsWith(path + '/') &&
            !p.slice(path.length + 1).includes('/') &&
            filters.every(([key, op, value]) =>
              op === '=='
                ? data[key] === value
                : op === 'in'
                  ? value.includes(data[key])
                  : op === 'array-contains'
                    ? data[key]?.includes(value)
                    : false,
            ),
        );
        if (sort)
          entries.sort(
            (a, b) =>
              (Number(a[1][sort[0]]?.toMillis?.() || 0) -
                Number(b[1][sort[0]]?.toMillis?.() || 0)) *
              (sort[1] === 'desc' ? -1 : 1),
          );
        const docs = entries.slice(0, max).map(([p]) => snapshot(doc(p)));
        return { docs, size: docs.length, empty: !docs.length };
      },
    };
  }
  function batch() {
    const writes = [];
    return {
      get: async (ref) => {
        assert.equal(
          writes.length,
          0,
          'Firestore requires reads before writes',
        );
        return snapshot(ref);
      },
      set: (ref, data, opts) =>
        writes.push(() => apply(ref.path, data, !!opts?.merge)),
      create: (ref, data) =>
        writes.push(() => {
          assert.ok(!store.has(ref.path), 'create must not overwrite');
          apply(ref.path, data, false);
        }),
      update: (ref, data) =>
        writes.push(() => {
          assert.ok(store.has(ref.path), 'update needs document');
          apply(ref.path, data);
        }),
      delete: (ref) => writes.push(() => store.delete(ref.path)),
      commit: async () => {
        for (const write of writes) write();
      },
    };
  }
  return {
    store,
    doc,
    collection,
    batch,
    runTransaction: (fn) => {
      const task = lock.then(async () => {
        const tx = batch();
        const result = await fn(tx);
        await tx.commit();
        return result;
      });
      lock = task.catch(() => {});
      return task;
    },
  };
}
