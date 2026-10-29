// Self-contained so the exported shadow-DOM widget runs this exact controller.
export function installWidgetMobileViewport(root) {
  let open = false;
  let frame = 0;
  let locked = false;
  const viewport = window.visualViewport;
  const media = window.matchMedia('(max-width: 640px)');
  const documentRoot = document.documentElement;
  const lockKey = '__vintraMobileScrollLock';
  let pinned = true;
  function onScroll(event) {
    const body = event.target;
    if (body?.classList?.contains('chat-body')) pinned = body.scrollHeight - body.clientHeight - body.scrollTop < 64;
  }
  root.addEventListener('scroll', onScroll, true);
  const observer = new ResizeObserver(() => {
    const body = root.querySelector('.chat-body');
    if (pinned && body?.querySelector('.widget-message-thread')) body.scrollTop = body.scrollHeight;
  });
  observer.observe(root);

  function release() {
    if (!locked) return;
    locked = false;
    const lock = document[lockKey];
    if (!lock || --lock.count > 0) return;
    for (const [property, value] of Object.entries(lock.body)) document.body.style[property] = value;
    documentRoot.style.overflow = lock.overflow;
    documentRoot.style.overscrollBehavior = lock.overscroll;
    delete document[lockKey];
    const behavior = documentRoot.style.scrollBehavior;
    documentRoot.style.scrollBehavior = 'auto';
    window.scrollTo(lock.x, lock.y);
    documentRoot.style.scrollBehavior = behavior;
  }

  function sync() {
    frame = 0;
    const fullscreen = open && media.matches;
    root.classList.toggle('widget-mobile-fullscreen', fullscreen);
    if (!fullscreen) { release(); return; }
    if (!locked) {
      let lock = document[lockKey];
      if (!lock) {
        const body = {};
        for (const property of ['position', 'top', 'left', 'width', 'overflow']) body[property] = document.body.style[property];
        lock = document[lockKey] = { count: 0, body, x: window.scrollX, y: window.scrollY,
          overflow: documentRoot.style.overflow, overscroll: documentRoot.style.overscrollBehavior };
        Object.assign(document.body.style, { position: 'fixed', top: -lock.y + 'px', left: -lock.x + 'px', width: '100%', overflow: 'hidden' });
        documentRoot.style.overflow = 'hidden';
        documentRoot.style.overscrollBehavior = 'none';
      }
      lock.count++;
      locked = true;
    }
    // Use the visible height exactly once: no extra keyboard bottom offset.
    root.style.setProperty('--widget-visual-height', (viewport?.height || window.innerHeight) + 'px');
    root.style.setProperty('--widget-visual-top', (viewport?.offsetTop || 0) + 'px');
  }
  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(sync);
  }
  window.addEventListener('resize', schedule);
  viewport?.addEventListener('resize', schedule);
  viewport?.addEventListener('scroll', schedule);
  media.addEventListener('change', schedule);
  return {
    setOpen(value) { open = value; sync(); },
    destroy() {
      observer.disconnect();
      root.removeEventListener('scroll', onScroll, true);
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      media.removeEventListener('change', schedule);
      root.classList.remove('widget-mobile-fullscreen');
      release();
    },
  };
}

export function shouldAnimateWidgetLauncher(open, hasOpened, unread, waiting) {
  return Boolean(waiting || (!open && (!hasOpened || unread)));
}

// Keep the composer DOM node connected during polling/replies. Replacing the
// focused textarea dismisses and reopens the mobile keyboard on every render.
export function patchWidgetMarkup(root, html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  function patch(parent, desired) {
    const children = Array.from(desired.childNodes);
    children.forEach((next, index) => {
      const current = parent.childNodes[index];
      if (!current) { parent.appendChild(next.cloneNode(true)); return; }
      if (current.nodeType !== next.nodeType || current.nodeName !== next.nodeName) {
        parent.replaceChild(next.cloneNode(true), current);
        return;
      }
      if (current.nodeType === 3) {
        if (current.textContent !== next.textContent) current.textContent = next.textContent;
        return;
      }
      if (current.nodeType !== 1) return;
      for (const attribute of Array.from(current.attributes)) {
        if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
      }
      for (const attribute of Array.from(next.attributes)) {
        if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
      }
      if (current.nodeName === 'TEXTAREA' || current.nodeName === 'INPUT') {
        const value = next.nodeName === 'TEXTAREA' ? next.textContent : next.getAttribute('value') || '';
        if (current.value !== value) current.value = value;
      } else patch(current, next);
    });
    while (parent.childNodes.length > children.length) parent.lastChild.remove();
  }
  patch(root, template.content);
}
