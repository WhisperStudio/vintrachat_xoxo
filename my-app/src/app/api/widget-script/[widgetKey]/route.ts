import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  const { widgetKey } = await params

  if (!widgetKey) {
    return new Response('Missing widget key', { status: 400 })
  }

  const origin = req.nextUrl.origin
  const forceOpen = req.nextUrl.searchParams.get('open') === '1'
  const frameUrl = `${origin}/widget/${widgetKey}/frame${forceOpen ? '?open=1' : ''}`
  const debugMode = req.nextUrl.searchParams.get('debug') === '1'

  const script = `(function () {
  if (window.__vintraWidgetLoaded) return;
  window.__vintraWidgetLoaded = true;
  var debugMode = ${debugMode ? 'true' : 'false'};
  var debugEl = null;

  function ensureDebugEl() {
    if (!debugMode) return null;
    if (debugEl) return debugEl;
    debugEl = document.createElement('div');
    debugEl.id = 'vintra-widget-debug';
    debugEl.style.position = 'fixed';
    debugEl.style.left = '16px';
    debugEl.style.bottom = '16px';
    debugEl.style.maxWidth = '320px';
    debugEl.style.padding = '10px 12px';
    debugEl.style.borderRadius = '12px';
    debugEl.style.background = 'rgba(15, 23, 42, 0.92)';
    debugEl.style.color = '#fff';
    debugEl.style.font = '12px/1.45 Inter, Arial, sans-serif';
    debugEl.style.zIndex = '2147483001';
    debugEl.style.whiteSpace = 'pre-wrap';
    debugEl.textContent = 'Vintra widget debug started';
    document.body.appendChild(debugEl);
    return debugEl;
  }

  function setDebug(message) {
    var el = ensureDebugEl();
    if (!el) return;
    el.textContent = message;
  }

  setDebug('Script loaded\\nwidgetKey: ' + ${JSON.stringify(widgetKey)});

  var iframe = document.createElement('iframe');
  iframe.src = ${JSON.stringify(frameUrl)};
  iframe.title = 'Vintra Chat Widget';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '16px';
  iframe.style.right = '16px';
  iframe.style.left = 'auto';
  iframe.style.width = '84px';
  iframe.style.height = '84px';
  iframe.style.display = 'block';
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  iframe.style.zIndex = '2147483000';
  iframe.style.overflow = 'hidden';
  iframe.style.pointerEvents = 'auto';
  iframe.style.transition = 'width 180ms ease, height 180ms ease, left 180ms ease, right 180ms ease';
  iframe.allow = 'clipboard-write';
  iframe.onload = function () {
    setDebug('Script loaded\\niframe appended\\nframe loaded');
  };
  iframe.onerror = function () {
    setDebug('Script loaded\\niframe appended\\nframe failed to load');
  };

  document.body.appendChild(iframe);
  setDebug('Script loaded\\niframe appended');

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'vintra-widget-layout') return;
    if (event.data.widgetKey !== ${JSON.stringify(widgetKey)}) return;

    iframe.style.width = String(event.data.width || 84) + 'px';
    iframe.style.height = String(event.data.height || 84) + 'px';

    if (event.data.position === 'bottom-left') {
      iframe.style.left = '16px';
      iframe.style.right = 'auto';
    } else {
      iframe.style.right = '16px';
      iframe.style.left = 'auto';
    }

    setDebug(
      'Script loaded\\niframe appended\\nframe ready\\nposition: ' +
        String(event.data.position || 'bottom-right') +
        '\\nsize: ' +
        String(event.data.width || 84) +
        'x' +
        String(event.data.height || 84)
    );
  });

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'vintra-widget-debug') return;
    if (event.data.widgetKey !== ${JSON.stringify(widgetKey)}) return;

    setDebug(
      'Script loaded\\niframe appended\\nframe loaded\\n' +
        String(event.data.status || 'unknown') +
        (event.data.details ? '\\n' + String(event.data.details) : '')
    );
  });
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
