import { NextRequest } from 'next/server'

const widgetStyles = `
:host {
  all: initial;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.vintra-root {
  position: fixed;
  inset: auto 24px 24px auto;
  z-index: 2147483000;
  pointer-events: none;
}

.vintra-root.position-bottom-left {
  inset: auto auto 24px 24px;
}

.vintra-frame {
  position: relative;
  width: 84px;
  height: 84px;
  pointer-events: none;
  transition:
    width 0.22s ease,
    height 0.22s ease;
}

.vintra-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
  pointer-events: auto;
}
`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  const { widgetKey } = await params
  const origin = request.nextUrl.origin
  const forceOpen = request.nextUrl.searchParams.get('open') === '1'
  const debugMode = request.nextUrl.searchParams.get('debug') === '1'

  const script = `(function () {
  var WIDGET_KEY = ${JSON.stringify(widgetKey)};
  var ORIGIN = ${JSON.stringify(origin)};
  var DEBUG_MODE = ${debugMode ? 'true' : 'false'};
  var FORCE_OPEN = ${forceOpen ? 'true' : 'false'};
  var GLOBAL_KEY = '__vintraWidgetLoaded__' + WIDGET_KEY;
  var FRAME_SRC = ORIGIN + '/widget/' + encodeURIComponent(WIDGET_KEY) + '/frame' + (FORCE_OPEN ? '?open=1' : '');

  if (window[GLOBAL_KEY]) return;
  window[GLOBAL_KEY] = true;

  var host = document.createElement('div');
  host.setAttribute('data-vintra-widget-key', WIDGET_KEY);
  document.body.appendChild(host);

  var shadowRoot = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = ${JSON.stringify(widgetStyles)};
  shadowRoot.appendChild(style);

  var mount = document.createElement('div');
  mount.className = 'vintra-root position-bottom-right';
  shadowRoot.appendChild(mount);

  var frameWrap = document.createElement('div');
  frameWrap.className = 'vintra-frame';
  if (FORCE_OPEN) {
    frameWrap.style.width = '460px';
    frameWrap.style.height = '760px';
  }
  mount.appendChild(frameWrap);

  var iframe = document.createElement('iframe');
  iframe.src = FRAME_SRC;
  iframe.title = 'Chat widget';
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.setAttribute('loading', 'eager');
  frameWrap.appendChild(iframe);

  var debugEl = null;
  function setDebug(message) {
    if (!DEBUG_MODE) return;
    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.className = 'vintra-debug';
      shadowRoot.appendChild(debugEl);
    }
    debugEl.textContent = message;
  }

  function applyLayout(data) {
    if (!data || data.widgetKey !== WIDGET_KEY) return;

    if (data.position === 'bottom-left') {
      mount.className = 'vintra-root position-bottom-left';
    } else {
      mount.className = 'vintra-root position-bottom-right';
    }

    var width = Number(data.width);
    var height = Number(data.height);
    if (Number.isFinite(width) && width > 0) {
      frameWrap.style.width = width + 'px';
    }
    if (Number.isFinite(height) && height > 0) {
      frameWrap.style.height = height + 'px';
    }
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== ORIGIN) return;
    var data = event.data || {};
    if (!data || data.widgetKey !== WIDGET_KEY) return;

    if (data.type === 'vintra-widget-layout') {
      applyLayout(data);
    }

    if (data.type === 'vintra-widget-debug' && DEBUG_MODE) {
      setDebug(data.status || 'debug');
    }
  });

  setDebug('iframe widget loaded');
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
