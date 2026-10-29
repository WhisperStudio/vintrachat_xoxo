import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { installWidgetMobileViewport, shouldAnimateWidgetLauncher } from '../src/lib/widget-mobile.mjs';

function environment() {
  const listeners = new Map();
  const events = () => ({
    addEventListener(type, callback) { listeners.set(callback, type); },
    removeEventListener(type, callback) { listeners.delete(callback); },
  });
  const body = { style: { position: '', top: '', left: '', width: '', overflow: 'auto' } };
  const document = { body, documentElement: { style: { overflow: '', overscrollBehavior: '', scrollBehavior: 'smooth' } } };
  const media = { matches: true, ...events() };
  let restored;
  const window = {
    ...events(), scrollX: 0, scrollY: 620, innerHeight: 844,
    visualViewport: { height: 844, offsetTop: 0, ...events() },
    matchMedia: () => media,
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    scrollTo(x, y) { restored = [x, y]; },
  };
  const context = vm.createContext({ window, document, ResizeObserver: class { observe() {} disconnect() {} } });
  const install = vm.runInContext(`(${installWidgetMobileViewport.toString()})`, context);
  const root = () => {
    const classes = new Set();
    const values = new Map();
    return { ...events(), classes, values,
      classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); }, remove(name) { classes.delete(name); } },
      style: { setProperty: (key, value) => values.set(key, value) }, querySelector: () => null,
    };
  };
  return { root, install, window, document, media, listeners, restored: () => restored };
}

test('mobile locks the page, follows the visible keyboard area once, and restores the scroll position', () => {
  const env = environment();
  const root = env.root();
  const controller = env.install(root);
  controller.setOpen(true);
  assert.equal(env.document.body.style.top, '-620px');
  assert.equal(env.document.body.style.position, 'fixed');
  assert.equal(root.values.get('--widget-visual-height'), '844px');
  env.window.visualViewport.height = 480;
  env.window.visualViewport.offsetTop = 12;
  controller.setOpen(true);
  assert.equal(root.values.get('--widget-visual-height'), '480px');
  assert.equal(root.values.get('--widget-visual-top'), '12px');
  controller.setOpen(false);
  assert.equal(env.document.body.style.position, '');
  assert.equal(env.document.body.style.overflow, 'auto');
  assert.deepEqual(env.restored(), [0, 620]);
  assert.equal(env.document.documentElement.style.scrollBehavior, 'smooth');
  controller.destroy();
  assert.equal(env.listeners.size, 0);
});

test('closing one of two widgets keeps the page locked until the last one closes', () => {
  const env = environment();
  const first = env.install(env.root());
  const second = env.install(env.root());
  first.setOpen(true);
  second.setOpen(true);
  first.destroy();
  assert.equal(env.document.body.style.position, 'fixed');
  second.destroy();
  assert.equal(env.document.body.style.position, '');
  assert.deepEqual(env.restored(), [0, 620]);
});

test('desktop and resizing to desktop leave the underlying page scrollable', () => {
  const env = environment();
  env.media.matches = false;
  const controller = env.install(env.root());
  controller.setOpen(true);
  assert.equal(env.document.body.style.position, '');
  env.media.matches = true;
  controller.setOpen(true);
  assert.equal(env.document.body.style.position, 'fixed');
  env.media.matches = false;
  controller.setOpen(true);
  assert.equal(env.document.body.style.position, '');
  controller.destroy();
});

test('launcher attention covers arrival, waiting and unread replies without disturbing an idle conversation', () => {
  assert.equal(shouldAnimateWidgetLauncher(false, false, false, false), true);
  assert.equal(shouldAnimateWidgetLauncher(true, true, false, true), true);
  assert.equal(shouldAnimateWidgetLauncher(false, true, true, false), true);
  assert.equal(shouldAnimateWidgetLauncher(false, true, false, false), false);
  assert.equal(shouldAnimateWidgetLauncher(true, true, false, false), false);
});
