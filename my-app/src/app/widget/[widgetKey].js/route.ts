import { NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Record<string, string | string[] | undefined>> }
) {
  const resolvedParams = await params
  const widgetKey = Array.isArray(resolvedParams.widgetKey)
    ? resolvedParams.widgetKey[0]
    : resolvedParams.widgetKey

  if (!widgetKey) {
    return new Response('Missing widget key', { status: 400 })
  }
  const origin = req.nextUrl.origin
  const frameUrl = `${origin}/widget/${widgetKey}/frame`

  const script = `(function () {
  if (window.__vintraWidgetLoaded) return;
  window.__vintraWidgetLoaded = true;

  var iframe = document.createElement('iframe');
  iframe.src = ${JSON.stringify(frameUrl)};
  iframe.title = 'Vintra Chat Widget';
  iframe.style.position = 'fixed';
  iframe.style.bottom = '16px';
  iframe.style.right = '16px';
  iframe.style.left = 'auto';
  iframe.style.width = '84px';
  iframe.style.height = '84px';
  iframe.style.border = '0';
  iframe.style.background = 'transparent';
  iframe.style.zIndex = '2147483000';
  iframe.style.overflow = 'hidden';
  iframe.style.transition = 'width 180ms ease, height 180ms ease, left 180ms ease, right 180ms ease';
  iframe.allow = 'clipboard-write';

  document.body.appendChild(iframe);

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
  });
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
