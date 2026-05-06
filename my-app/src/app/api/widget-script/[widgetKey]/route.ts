import { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { WIDGET_THEME_CLASS, WIDGET_THEME_VARS } from '@/components/chat/widgetDesign'

function serializeForJs(value: unknown) {
  return JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

const widgetStyles = `
:host {
  all: initial;
  --vintra-viewport-height: 100vh;
  --vintra-viewport-width: 100vw;
  --vintra-keyboard-offset: 0px;
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  display: block;
  visibility: visible;
  opacity: 1;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.vintra-root {
  position: fixed;
  inset: auto 24px calc(24px + env(safe-area-inset-bottom, 0px)) auto;
  z-index: 2147483647;
  font-family: Inter, Arial, sans-serif;
  pointer-events: none;
  display: block;
  visibility: visible;
  opacity: 1;
}

.vintra-root.position-bottom-left {
  inset: auto auto calc(24px + env(safe-area-inset-bottom, 0px)) 24px;
}

.vintra-stack {
  position: relative;
  width: min(390px, calc(var(--vintra-viewport-width) - 32px));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;
  isolation: isolate;
}

.vintra-root.position-bottom-left .vintra-stack {
  align-items: flex-start;
}

.vintra-stack > .chat-widget {
  z-index: 2147483646;
}

.vintra-stack > .widget-icon {
  z-index: 2147483647;
}

.vintra-root.viewport-mobile {
  inset: auto 10px calc(10px + env(safe-area-inset-bottom, 0px)) 10px;
}

.vintra-root.viewport-mobile.position-bottom-left,
.vintra-root.viewport-mobile.position-bottom-right {
  inset: auto 10px calc(10px + env(safe-area-inset-bottom, 0px)) 10px;
}

.vintra-root.viewport-mobile .vintra-stack {
  width: min(100%, calc(var(--vintra-viewport-width) - 20px));
  align-items: stretch;
  gap: 10px;
}

.vintra-root.viewport-mobile .chat-widget {
  position: fixed;
  left: 10px;
  right: 10px;
  bottom: calc(84px + env(safe-area-inset-bottom, 0px) + var(--vintra-keyboard-offset));
  width: auto;
  max-width: none;
  max-height: min(720px, calc(var(--vintra-viewport-height) - 104px - var(--vintra-keyboard-offset)));
  border-radius: 24px;
  transform: translateY(18px) scale(0.98);
  transform-origin: bottom center;
  box-shadow: 0 28px 56px rgba(15, 23, 42, 0.22);
}

.vintra-root.viewport-mobile .chat-widget.open {
  transform: translateY(0) scale(1);
}

.vintra-root.viewport-mobile .chat-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.vintra-root.viewport-mobile .chat-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.95rem 0.95rem 0.8rem;
}

.vintra-root.viewport-mobile .chat-header-left,
.vintra-root.viewport-mobile .chat-header-actions {
  width: 100%;
}

.vintra-root.viewport-mobile .chat-header-actions {
  justify-content: space-between;
}

.vintra-root.viewport-mobile .chat-body {
  height: auto;
  min-height: 220px;
  max-height: clamp(220px, calc(var(--vintra-viewport-height) - 310px - var(--vintra-keyboard-offset)), 52vh);
  padding: 0.95rem;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.vintra-root.viewport-mobile .widget-faq-suggestions {
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 0 0.95rem 0.25rem;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.vintra-root.viewport-mobile .widget-faq-suggestions::-webkit-scrollbar {
  display: none;
}

.vintra-root.viewport-mobile .widget-faq-chip {
  flex: 0 0 auto;
}

.vintra-root.viewport-mobile .chat-footer {
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 0.95rem calc(0.85rem + env(safe-area-inset-bottom, 0px));
}

.vintra-root.viewport-mobile .chat-footer input {
  min-height: 52px;
  font-size: 16px;
}

.vintra-root.viewport-mobile .chat-footer button {
  min-width: 52px;
  min-height: 52px;
  padding-inline: 1rem;
}

.vintra-root.viewport-mobile .widget-icon {
  width: 64px;
  height: 64px;
  touch-action: manipulation;
}

.vintra-root.viewport-mobile .close-btn {
  width: 34px;
  height: 34px;
  font-size: 16px;
}

.vintra-root.viewport-mobile.viewport-keyboard-open .chat-widget {
  bottom: max(10px, calc(10px + env(safe-area-inset-bottom, 0px)));
}

${readFileSync(join(process.cwd(), 'src/app/landings/auth/chatWidget/components/WidgetPreview.css'), 'utf8')}
`

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  const { widgetKey } = await params

  if (!widgetKey) {
    return new Response('Missing widget key', { status: 400 })
  }

  const origin = req.nextUrl.origin
  const debugMode = req.nextUrl.searchParams.get('debug') === '1'
  const forceOpen = req.nextUrl.searchParams.get('open') === '1'

  const script = `(function () {
  var WIDGET_KEY = ${serializeForJs(widgetKey)};
  var ORIGIN = ${serializeForJs(origin)};
  var DEBUG_MODE = ${debugMode ? 'true' : 'false'};
  var FORCE_OPEN = ${forceOpen ? 'true' : 'false'};
  var GLOBAL_KEY = '__vintraWidgetLoaded__' + WIDGET_KEY;
  var SESSION_STORAGE_KEY = '__vintraWidgetSession__' + WIDGET_KEY;
  var THEME_CLASS_BY_NAME = ${serializeForJs(WIDGET_THEME_CLASS)};
  var THEME_VARS_BY_NAME = ${serializeForJs(WIDGET_THEME_VARS)};

  if (window[GLOBAL_KEY]) return;
  window[GLOBAL_KEY] = true;

  var host = null;
  var shadowRoot = null;
  var mount = null;
  var viewportListenersBound = false;
  var EMBED_TOKEN = '';
  var CAPTCHA_TOKEN = '';
  var FINGERPRINT_LIGHT = buildFingerprintLight();

  function createHost() {
    if (host && shadowRoot && mount) return;

    var mountTarget = document.body || document.documentElement;
    if (!mountTarget) {
      throw new Error('Document is not ready for widget mount');
    }

    host = document.createElement('div');
    host.setAttribute('data-vintra-widget-key', WIDGET_KEY);
    host.style.position = 'fixed';
    host.style.inset = '0';
    host.style.zIndex = '2147483647';
    host.style.pointerEvents = 'none';
    host.style.display = 'block';
    host.style.visibility = 'visible';
    host.style.opacity = '1';
    mountTarget.appendChild(host);

    shadowRoot = host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = ${serializeForJs(widgetStyles)};
    shadowRoot.appendChild(style);

    mount = document.createElement('div');
    mount.className = 'vintra-root position-bottom-right';
    shadowRoot.appendChild(mount);
  }
  function setDebug(message) {
    if (!DEBUG_MODE) return;
    if (window.console && typeof window.console.debug === 'function') {
      window.console.debug('[Vintra widget]', message);
    }
  }

  function applyViewportStateToMount() {
    if (!mount) return;
    mount.classList.toggle('viewport-mobile', !!state.compactViewport);
    mount.classList.toggle('viewport-keyboard-open', state.keyboardOffset > 0);
  }

  function getViewportMetrics() {
    var visualViewport = window.visualViewport || null;
    var width = Math.round(
      (visualViewport && visualViewport.width) ||
      window.innerWidth ||
      document.documentElement.clientWidth ||
      0
    );
    var height = Math.round(
      (visualViewport && visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      0
    );
    var keyboardOffset = 0;

    if (visualViewport && window.innerHeight) {
      keyboardOffset = Math.max(
        0,
        Math.round(window.innerHeight - visualViewport.height - visualViewport.offsetTop)
      );
    }

    return {
      width: width,
      height: height,
      keyboardOffset: keyboardOffset
    };
  }

  function syncViewportMetrics() {
    if (!host) return;

    var metrics = getViewportMetrics();
    state.compactViewport = metrics.width <= 640 || metrics.height <= 760;
    state.keyboardOffset = metrics.keyboardOffset;

    host.style.setProperty('--vintra-viewport-width', metrics.width + 'px');
    host.style.setProperty('--vintra-viewport-height', metrics.height + 'px');
    host.style.setProperty('--vintra-keyboard-offset', metrics.keyboardOffset + 'px');

    applyViewportStateToMount();
  }

  function bindViewportListeners() {
    if (viewportListenersBound) return;
    viewportListenersBound = true;

    var syncLater = function () {
      window.setTimeout(syncViewportMetrics, 40);
    };

    window.addEventListener('resize', syncViewportMetrics);
    window.addEventListener('orientationchange', syncLater);
    window.addEventListener('focusin', syncLater);
    window.addEventListener('focusout', syncLater);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', syncViewportMetrics);
      window.visualViewport.addEventListener('scroll', syncViewportMetrics);
    }
  }

  function readStoredSessionId() {
    try {
      return window.localStorage.getItem(SESSION_STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function writeStoredSessionId(value) {
    try {
      if (value) {
        window.localStorage.setItem(SESSION_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {}
  }

  function captchaStorageKey() {
    return '__vintraWidgetCaptcha__' + WIDGET_KEY;
  }

  function readStoredCaptchaToken() {
    try {
      return window.sessionStorage.getItem(captchaStorageKey()) || '';
    } catch (error) {
      return '';
    }
  }

  function writeStoredCaptchaToken(value) {
    try {
      if (value) {
        window.sessionStorage.setItem(captchaStorageKey(), value);
      } else {
        window.sessionStorage.removeItem(captchaStorageKey());
      }
    } catch (error) {}
  }

  var state = {
    open: FORCE_OPEN,
    sessionId: readStoredSessionId(),
    sending: false,
    inputValue: '',
    error: '',
    assistantEnabled: true,
    config: null,
    assistantConfig: null,
    configLoaded: false,
    messages: [],
    supportStatus: '',
    supportPolling: false,
    supportSnapshot: '',
    awaitingVisitorName: false,
    pendingHumanSupportText: '',
    countryCode: '',
    hasOpenedOnce: FORCE_OPEN,
    hasUnreadWhileClosed: false,
    hovered: false,
    feedbackOpen: false,
    feedbackRating: 5,
    feedbackText: '',
    feedbackSubmitting: false,
    faqSuggestions: [],
    compactViewport: false,
    keyboardOffset: 0,
    orbInactiveActive: false,
    orbCycleTick: 0,
    orbTicker: null,
    orbInactivityTimer: null,
    orbInactiveHoldTimer: null
  };

  CAPTCHA_TOKEN = readStoredCaptchaToken();

  var icons = {
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.75C4 4.784 4.784 4 5.75 4h12.5C19.216 4 20 4.784 20 5.75v8.5c0 .966-.784 1.75-1.75 1.75H12l-4 4v-4H5.75C4.784 16 4 15.216 4 14.25z"></path></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4a8 8 0 0 0-6.9 12.1L4 20l3.9-1.1A8 8 0 1 0 12 4Z"></path></svg>',
    support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10a6 6 0 1 0-12 0v4a2 2 0 0 0 2 2h1v-5H6"></path><path d="M18 10v6a4 4 0 0 1-4 4h-2"></path><path d="M15 16h1a2 2 0 0 0 2-2v-4"></path></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.77.67 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.33a2 2 0 0 1 2.11-.45c.84.33 1.72.55 2.61.67A2 2 0 0 1 22 16.92Z"></path></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3"></path><path d="M15 1v3"></path><path d="M9 20v3"></path><path d="M15 20v3"></path><path d="M20 9h3"></path><path d="M20 14h3"></path><path d="M1 9h3"></path><path d="M1 14h3"></path></svg>',
    orb: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="orbGlow" cx="32%" cy="28%" r="72%"><stop offset="0%" stop-color="#ffffff"/><stop offset="38%" stop-color="#dbeafe"/><stop offset="74%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#4c1d95"/></radialGradient><radialGradient id="orbHighlight" cx="28%" cy="24%" r="58%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="12" cy="12" r="9" fill="url(#orbGlow)"/><circle cx="12" cy="12" r="6.8" fill="url(#orbHighlight)" opacity="0.7"/><path d="M11 7.3c-1.7.3-3 1.7-3 3.4" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="1.6" opacity=".92"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
  };

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getOrbStyle(config) {
    return (config && config.bubbleStyle && config.bubbleStyle.orbStyle) || {
      hoverEnabled: true,
      hoverGlyph: 'A',
      replyEnabled: false,
      replyGlyphs: '',
      inactiveEnabled: false,
      inactiveGlyphs: '',
      inactivityMinMinutes: 2,
      inactivityMaxMinutes: 4
    };
  }

  function normalizeGlyphList(value, maxLength) {
    return String(value || '')
      .split('')
      .map(function (char) { return char.toUpperCase(); })
      .filter(Boolean)
      .slice(0, maxLength);
  }

  function getOrbPhase(orbStyle) {
    if (state.hovered && orbStyle.hoverEnabled) return 'hover';
    if (state.sending && orbStyle.replyEnabled) return 'reply';
    if (state.orbInactiveActive && orbStyle.inactiveEnabled) return 'inactive';
    return 'none';
  }

  function getOrbGlyphList(orbStyle, phase) {
    if (phase === 'hover') {
      return orbStyle.hoverEnabled ? normalizeGlyphList(orbStyle.hoverGlyph, 1) : [];
    }
    if (phase === 'reply') {
      return orbStyle.replyEnabled ? normalizeGlyphList(orbStyle.replyGlyphs, 3) : [];
    }
    if (phase === 'inactive') {
      return orbStyle.inactiveEnabled ? normalizeGlyphList(orbStyle.inactiveGlyphs, 5) : [];
    }
    return [];
  }

  function syncOrbTicker(orbStyle, phase, glyphList) {
    if (state.orbTicker) {
      clearInterval(state.orbTicker);
      state.orbTicker = null;
    }

    if (phase === 'hover' || glyphList.length <= 1) {
      state.orbCycleTick = 0;
      return;
    }

    state.orbTicker = setInterval(function () {
      state.orbCycleTick += 1;
      render();
    }, 650);
  }

  function clearOrbInactivityTimers() {
    if (state.orbInactivityTimer) {
      clearTimeout(state.orbInactivityTimer);
      state.orbInactivityTimer = null;
    }
    if (state.orbInactiveHoldTimer) {
      clearTimeout(state.orbInactiveHoldTimer);
      state.orbInactiveHoldTimer = null;
    }
  }

  function markOrbActivity() {
    state.orbInactiveActive = false;
    clearOrbInactivityTimers();
  }

  function normalizeOrbInactivityWindow(orbStyle) {
    var minMinutes = Math.max(1, Number(orbStyle && orbStyle.inactivityMinMinutes) || 2);
    var maxMinutes = Math.max(minMinutes, Number(orbStyle && orbStyle.inactivityMaxMinutes) || 4);
    return {
      minMs: minMinutes * 60000,
      maxMs: maxMinutes * 60000
    };
  }

  function syncOrbInactivity(orbStyle, phase) {
    clearOrbInactivityTimers();

    if (!orbStyle || !orbStyle.inactiveEnabled || phase === 'hover' || phase === 'reply') {
      state.orbInactiveActive = false;
      return;
    }

    if (state.orbInactiveActive) {
      state.orbInactiveHoldTimer = setTimeout(function () {
        state.orbInactiveActive = false;
        render();
      }, 20000);
      return;
    }

    var windowMs = normalizeOrbInactivityWindow(orbStyle);
    var delayMs = windowMs.minMs >= windowMs.maxMs
      ? windowMs.minMs
      : Math.floor(windowMs.minMs + Math.random() * (windowMs.maxMs - windowMs.minMs));

    state.orbInactivityTimer = setTimeout(function () {
      state.orbInactiveActive = true;
      render();
    }, delayMs);
  }

  function formatTime(value) {
    try {
      return new Date(value || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  }

  function classes(parts) {
    return parts.filter(Boolean).join(' ');
  }

  function buildFingerprintLight() {
    var nav = window.navigator || {};
    var scr = window.screen || {};
    var timeZone = '';

    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch (error) {}

    return [
      nav.userAgent || 'ua:unknown',
      nav.language || 'lang:unknown',
      nav.platform || 'platform:unknown',
      timeZone || 'tz:unknown',
      scr.width || 0,
      scr.height || 0,
      scr.colorDepth || 0,
      nav.hardwareConcurrency || 0,
      nav.maxTouchPoints || 0
    ].join('|');
  }

  function widgetHeaders() {
    var headers = {
      'Content-Type': 'application/json',
      'X-Vintra-Fingerprint': FINGERPRINT_LIGHT
    };

    if (DEBUG_MODE) {
      headers['X-Vintra-Debug'] = '1';
    }

    if (EMBED_TOKEN) {
      headers['X-Vintra-Embed-Token'] = EMBED_TOKEN;
    }

    if (CAPTCHA_TOKEN) {
      headers['X-Vintra-Captcha-Token'] = CAPTCHA_TOKEN;
    }

    return headers;
  }

  function countWords(text) {
    return String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }

  function truncateTextByWords(text, maxWords) {
    var words = String(text || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return words.slice(0, maxWords).join(' ');
  }

  function applyThemeVars(node, themeName) {
    if (!node) return;
    var vars = THEME_VARS_BY_NAME[themeName] || THEME_VARS_BY_NAME.modern || {};
    Object.keys(vars).forEach(function (key) {
      node.style.setProperty(key, vars[key]);
    });
  }

  function normalizeRole(role) {
    if (role === 'assistant' || role === 'support' || role === 'system') {
      return role;
    }
    return 'user';
  }

  function isIncomingRole(role) {
    return role === 'assistant' || role === 'support' || role === 'system';
  }

  function mapMessage(message) {
    return {
      id: message && message.id ? String(message.id) : 'message-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      role: normalizeRole(message && message.role),
      text: String((message && message.text) || ''),
      createdAt: message && message.createdAt ? String(message.createdAt) : new Date().toISOString()
    };
  }

  function updateMessages(nextMessages) {
    var normalized = Array.isArray(nextMessages) ? nextMessages.map(mapMessage) : [];
    var previousLast = state.messages.length ? state.messages[state.messages.length - 1] : null;
    var nextLast = normalized.length ? normalized[normalized.length - 1] : null;

    state.messages = normalized;

    if (
      nextLast &&
      isIncomingRole(nextLast.role) &&
      (!previousLast ||
        previousLast.id !== nextLast.id ||
        previousLast.text !== nextLast.text ||
        previousLast.role !== nextLast.role) &&
      !state.open &&
      state.hasOpenedOnce
    ) {
      state.hasUnreadWhileClosed = true;
    }

    if (state.open) {
      state.hasUnreadWhileClosed = false;
    }
  }

  function getThemeName(config) {
    return config && config.colorTheme ? config.colorTheme : 'modern';
  }

  function getTitle(config) {
    return config && config.customBranding && config.customBranding.title ? config.customBranding.title : 'Support Chat';
  }

  function getDescription(config) {
    return config && config.customBranding && config.customBranding.description
      ? config.customBranding.description
      : 'Usually replies in a few minutes';
  }

  function getLogo(config) {
    return config && config.customBranding ? config.customBranding.logo : '';
  }

  function getLogoStyle(config) {
    var style = config && config.customBranding ? config.customBranding.logoStyle : null;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    return {
      zoom: clamp(style && typeof style.zoom === 'number' ? style.zoom : 100, 80, 180),
      focusX: clamp(style && typeof style.focusX === 'number' ? style.focusX : 50, 0, 100),
      focusY: clamp(style && typeof style.focusY === 'number' ? style.focusY : 50, 0, 100),
    };
  }

  function getAssistantConfig() {
    return state.assistantConfig || {};
  }

  function refreshFaqSuggestions() {
    var assistantConfig = getAssistantConfig();

    if (!assistantConfig.faqSuggestionsEnabled || !Array.isArray(assistantConfig.faqSuggestions)) {
      state.faqSuggestions = [];
      return;
    }

    var cleaned = assistantConfig.faqSuggestions
      .map(function (item) { return String(item || '').trim(); })
      .filter(Boolean);

    if (!cleaned.length) {
      state.faqSuggestions = [];
      return;
    }

    var unique = Array.from(new Set(cleaned));
    var seeded = unique.map(function (item) {
      return { item: item, sort: Math.random() };
    });

    seeded.sort(function (a, b) {
      return a.sort - b.sort;
    });

    state.faqSuggestions = seeded.slice(0, 3).map(function (entry) {
      return entry.item;
    });
  }

  function getPosition(config) {
    return config && config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
  }

  function getStatusLabel() {
    if (state.supportStatus === 'needs-human') return 'Waiting for support';
    if (state.supportStatus === 'open') return 'Human support live';
    if (state.supportStatus === 'ai-active') return 'AI resumed';
    return state.assistantEnabled ? 'AI live' : 'Offline';
  }

  function shouldShowSupportGate() {
    return state.supportStatus === 'needs-human';
  }

  function getMessagesMarkup(config) {
    var bodyStyle = (config && config.bodyStyle) || {};
    var waitingLine = state.supportStatus === 'needs-human'
      ? '<div class="chat-status-line">Waiting for a support assistant</div>'
      : '';

    if (!state.messages.length) {
      return waitingLine + '<div class="message message-bot">Chat is ready. Send a message to start.</div>';
    }

    return waitingLine + state.messages.map(function (msg) {
      var roleClass = msg.role === 'assistant'
        ? 'message-bot'
        : msg.role === 'support'
          ? 'message-support'
          : msg.role === 'system'
            ? 'message-system'
            : 'message-user';
      if (msg.role === 'system') {
        return (
          '<div class="' + classes(['message', roleClass]) + '">' +
            escapeHtml(msg.text) +
          '</div>'
        );
      }

      return (
        '<div class="' + classes(['message', roleClass]) + '">' +
          '<div class="message-content">' + escapeHtml(msg.text) + '</div>' +
          ((bodyStyle.showTimestamps || (bodyStyle.showReadReceipts && msg.role === 'user')) ? (
            '<div class="message-meta">' +
              (bodyStyle.showTimestamps ? '<span class="message-time">' + escapeHtml(formatTime(msg.createdAt)) + '</span>' : '') +
              (bodyStyle.showReadReceipts && msg.role === 'user' ? '<span class="message-read">Read</span>' : '') +
            '</div>'
          ) : '') +
        '</div>'
      );
    }).join('');
  }

  function getFaqSuggestionsMarkup() {
    if (!state.open || !state.faqSuggestions.length) return '';

    return (
      '<div class="widget-faq-suggestions" aria-label="Suggested questions">' +
        state.faqSuggestions.map(function (suggestion) {
          return (
            '<button type="button" class="widget-faq-chip" data-faq-suggestion="' + escapeHtml(suggestion) + '">' +
              escapeHtml(suggestion) +
            '</button>'
          );
        }).join('') +
      '</div>'
    );
  }

  function getFeedbackOverlayMarkup() {
    if (!state.feedbackOpen) return '';

    var stars = Array.from({ length: 5 }, function (_, index) {
      var value = index + 1;
      return (
        '<button type="button" class="widget-feedback-star' + (value <= state.feedbackRating ? ' is-active' : '') + '" data-feedback-rating="' + value + '" aria-label="' + value + ' star' + (value === 1 ? '' : 's') + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.6 3.1 6.29 6.94 1.01-5.02 4.9 1.18 6.9L12 18.98 5.8 21.7l1.18-6.9-5.02-4.9 6.94-1.01Z"></path></svg>' +
        '</button>'
      );
    }).join('');

    return (
      '<div class="widget-feedback-overlay" role="dialog" aria-modal="true" aria-label="Leave feedback">' +
        '<div class="widget-feedback-card">' +
          '<div class="widget-feedback-header">' +
            '<div>' +
              '<h4>Leave feedback</h4>' +
              '<p>Tell us what you think and give us a star rating.</p>' +
            '</div>' +
            '<button type="button" class="widget-feedback-close" aria-label="Close">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>' +
            '</button>' +
          '</div>' +
          '<div class="widget-feedback-rating" aria-label="Rating selector">' + stars + '</div>' +
          '<label class="widget-feedback-field">' +
            '<span>Your feedback</span>' +
            '<textarea rows="5" placeholder="What went well, and what could be better?">' + escapeHtml(state.feedbackText) + '</textarea>' +
          '</label>' +
          '<div class="widget-feedback-actions">' +
            '<button type="button" class="widget-feedback-secondary" ' + (state.feedbackSubmitting ? 'disabled' : '') + '>Cancel</button>' +
            '<button type="button" class="widget-feedback-primary" ' + (state.feedbackSubmitting ? 'disabled' : '') + '>' + (state.feedbackSubmitting ? 'Submitting...' : 'Submit feedback') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  var supportPollTimer = null;
  var MAX_WIDGET_MESSAGE_WORDS = 400;

  function clearSupportState() {
    state.supportStatus = '';
    state.sessionId = '';
    state.supportSnapshot = '';
    writeStoredSessionId('');
  }

  function stopSupportPolling() {
    state.supportPolling = false;
    if (supportPollTimer) {
      window.clearInterval(supportPollTimer);
      supportPollTimer = null;
    }
  }

  async function syncSupportChat() {
    if (!state.sessionId) return;

    try {
      var response = await fetch(
        ORIGIN + '/api/widget/support?key=' + encodeURIComponent(WIDGET_KEY) + '&sessionId=' + encodeURIComponent(state.sessionId),
        {
          mode: 'cors',
          headers: {
            'X-Vintra-Embed-Token': EMBED_TOKEN,
            'X-Vintra-Fingerprint': FINGERPRINT_LIGHT,
            ...(CAPTCHA_TOKEN ? { 'X-Vintra-Captcha-Token': CAPTCHA_TOKEN } : {}),
            ...(DEBUG_MODE ? { 'X-Vintra-Debug': '1' } : {})
          }
        }
      );

      if (response.status === 404) {
        stopSupportPolling();
        clearSupportState();
        render();
        return;
      }

      var json = await response.json();

      if (!response.ok) {
        if (response.status === 429 && json && json.captchaRequired && json.captchaQuestion && json.captchaToken) {
          try {
            var solved = await solveCaptchaChallenge(json.captchaQuestion, json.captchaToken);
            if (solved) {
              window.setTimeout(sendMessage, 0);
              return;
            }
          } catch (captchaError) {
            state.error = captchaError instanceof Error ? captchaError.message : 'Failed to verify captcha';
            render();
            return;
          }
        }
        if (response.status === 429 && json && json.retryAfterSeconds) {
          state.error = 'Please wait ' + json.retryAfterSeconds + 's before sending another message.';
          render();
          return;
        }
        throw new Error(json && json.error ? json.error : 'Failed to sync support chat');
      }

      var nextStatus = json.status || state.supportStatus || 'needs-human';
      if (json.countryCode) {
        state.countryCode = String(json.countryCode).toUpperCase();
      }
      var nextMessages = Array.isArray(json.messages) ? json.messages.map(mapMessage) : [];
      var nextSnapshot = JSON.stringify({
        status: nextStatus,
        messageCount: Number(json.messageCount || nextMessages.length || 0),
        messages: nextMessages.map(function (msg) {
          return {
            id: msg.id,
            role: msg.role,
            text: msg.text,
            createdAt: msg.createdAt,
          };
        }),
      });

      if (nextSnapshot === state.supportSnapshot) {
        state.supportStatus = nextStatus;
        return;
      }

      state.supportSnapshot = nextSnapshot;
      state.supportStatus = nextStatus;
      updateMessages(nextMessages);

      if (state.supportStatus !== 'needs-human' && state.supportStatus !== 'open') {
        stopSupportPolling();
      }

      render();
    } catch (error) {
      setDebug('Support sync failed\\n' + (error && error.message ? error.message : String(error)));
    }
  }

  function startSupportPolling() {
    if (!state.sessionId) return;
    if (supportPollTimer) return;
    state.supportPolling = true;
    supportPollTimer = window.setInterval(syncSupportChat, 3000);
  }

  async function loadEmbedToken() {
    if (EMBED_TOKEN) return EMBED_TOKEN;

    var response = await fetch(ORIGIN + '/api/widget/embed-token?key=' + encodeURIComponent(WIDGET_KEY), {
      method: 'GET',
      mode: 'cors',
      headers: {
        'X-Vintra-Embed-Token': EMBED_TOKEN,
        ...(DEBUG_MODE ? { 'X-Vintra-Debug': '1' } : {})
      }
    });

    var json = await response.json();

    if (!response.ok) {
      throw new Error(json && json.error ? json.error : 'Failed to load widget token');
    }

    EMBED_TOKEN = String(json.token || '');
    if (!EMBED_TOKEN) {
      throw new Error('Missing widget token');
    }

    return EMBED_TOKEN;
  }

  async function solveCaptchaChallenge(challengeQuestion, challengeToken) {
    var answer = window.prompt(String(challengeQuestion || '') + '\\n\\nEnter the answer to continue:');
    if (!answer) {
      return false;
    }

    var response = await fetch(ORIGIN + '/api/widget/captcha/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vintra-Fingerprint': FINGERPRINT_LIGHT,
        ...(DEBUG_MODE ? { 'X-Vintra-Debug': '1' } : {})
      },
      mode: 'cors',
      body: JSON.stringify({
        widgetKey: WIDGET_KEY,
        sessionId: state.sessionId || '',
        fingerprint: FINGERPRINT_LIGHT,
        challengeToken: challengeToken,
        answer: answer
      })
    });

    var json = await response.json();
    if (!response.ok) {
      throw new Error(json && json.error ? json.error : 'Failed to verify captcha');
    }

    CAPTCHA_TOKEN = String(json.captchaToken || '');
    writeStoredCaptchaToken(CAPTCHA_TOKEN);
    return true;
  }

  var widgetActionsBound = false;
  function bindWidgetActions() {
    if (widgetActionsBound) return;
    widgetActionsBound = true;

    mount.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;

      var button = target.closest('button');
      if (!button) return;

      if (button.classList.contains('widget-icon')) {
        state.open = !state.open;
        if (state.open) {
          state.hasOpenedOnce = true;
          state.hasUnreadWhileClosed = false;
          refreshFaqSuggestions();
        }
        render();
        return;
      }

      if (button.classList.contains('close-btn')) {
        state.open = false;
        render();
        return;
      }

      if (button.classList.contains('widget-faq-chip')) {
        var suggestion = String(button.getAttribute('data-faq-suggestion') || button.textContent || '').trim();
        if (suggestion) {
          state.inputValue = suggestion;
          render();
          sendMessage();
        }
        return;
      }

      if (button.classList.contains('widget-feedback-star')) {
        var rating = Number(button.getAttribute('data-feedback-rating') || 0);
        if (rating >= 1 && rating <= 5) {
          state.feedbackRating = rating;
          render();
        }
        return;
      }

      if (button.classList.contains('widget-feedback-close') || button.classList.contains('widget-feedback-secondary')) {
        state.feedbackOpen = false;
        state.feedbackText = '';
        state.feedbackRating = 5;
        render();
        return;
      }

      if (button.classList.contains('widget-feedback-primary')) {
        submitFeedback();
        return;
      }

      if (button.classList.contains('send-btn')) {
        markOrbActivity();
        sendMessage();
      }
    });

    mount.addEventListener('input', function (event) {
      var target = event.target;
      if (!target || target.tagName !== 'TEXTAREA') return;
      state.feedbackText = target.value;
    });
  }

  function render() {
    var config = state.config || {};
    var bubbleStyle = config.bubbleStyle || {};
    var headerStyle = config.headerStyle || {};
    var bodyStyle = config.bodyStyle || {};
    var footerStyle = config.footerStyle || {};
    var assistantConfig = getAssistantConfig();
    var theme = getThemeName(config);
    var themeClass = THEME_CLASS_BY_NAME[theme] || THEME_CLASS_BY_NAME.modern || 'theme-modern';
    var position = getPosition(config);
    var iconChoice = bubbleStyle.iconChoice || 'chat';
    var orbStyle = getOrbStyle(config);
    var bubbleIcon = icons[iconChoice] || icons.chat;
    var shouldAnimateBubble =
      bubbleStyle.animationType &&
      bubbleStyle.animationType !== 'none' &&
      (!state.hasOpenedOnce || (!state.open && state.hasUnreadWhileClosed));
    var logoStyle = getLogoStyle(config);
    if (state.open && assistantConfig.faqSuggestionsEnabled && !state.faqSuggestions.length) {
      refreshFaqSuggestions();
    }
    var headerAvatar = getLogo(config)
      ? '<div class="avatar avatar--image">' +
          '<img' +
            ' class="avatar-image avatar-image--img"' +
            ' alt=""' +
            ' aria-hidden="true"' +
            ' src="' + escapeHtml(getLogo(config)) + '"' +
            ' style="object-fit: contain; object-position: ' + logoStyle.focusX + '% ' + logoStyle.focusY + '%; transform: scale(' + (logoStyle.zoom / 100) + '); transform-origin: ' + logoStyle.focusX + '% ' + logoStyle.focusY + '%;"' +
          ' />' +
        '</div>'
      : icons.message;
    var orbPhase = iconChoice === 'orb' ? getOrbPhase(orbStyle) : 'none';
    var orbGlyphList = iconChoice === 'orb' ? getOrbGlyphList(orbStyle, orbPhase) : [];
    var orbGlyph = orbGlyphList.length ? orbGlyphList[state.orbCycleTick % orbGlyphList.length] : '';

    syncOrbTicker(orbStyle, orbPhase, orbGlyphList);
    syncOrbInactivity(orbStyle, orbPhase);

    mount.className = 'vintra-root position-' + position;
    applyViewportStateToMount();
    var shouldShowWidget = state.configLoaded && state.open;
    mount.innerHTML =
      '<div class="vintra-stack ' + themeClass + '">' +
        '<div class="' + classes([
          'chat-widget',
          shouldShowWidget ? 'open' : '',
          shouldShowSupportGate() ? 'chat-widget-locked' : '',
          'border-' + (headerStyle.borderType || 'none'),
          'shadow-' + (headerStyle.shadowType || 'none'),
          'messages-' + (bodyStyle.messageStyle || 'bubble')
        ]) + '">' +
          '<div class="chat-content">' +
          '<div class="chat-header">' +
            '<div class="chat-header-left">' +
              (headerStyle.showAvatar !== false ? headerAvatar : '') +
              '<div class="chat-header-copy">' +
                (headerStyle.showTitle !== false ? '<h3>' + escapeHtml(getTitle(config)) + '</h3>' : '') +
                '<p>' + escapeHtml(getDescription(config)) + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="chat-header-actions">' +
              (headerStyle.showStatus ? '<span class="status-pill">' + icons.check + ' ' + escapeHtml(getStatusLabel()) + '</span>' : '') +
              (headerStyle.showCloseButton && state.open ? '<button type="button" class="close-btn" aria-label="Close chat">×</button>' : '') +
            '</div>' +
          '</div>' +
          '<div class="' + classes(['chat-body', 'border-' + (bodyStyle.borderType || 'none'), 'shadow-' + (bodyStyle.shadowType || 'none')]) + '">' +
            getMessagesMarkup(config) +
          '</div>' +
          getFaqSuggestionsMarkup() +
          '<div class="' + classes([
            'chat-footer',
            'border-' + (footerStyle.borderType || 'none'),
            'shadow-' + (footerStyle.shadowType || 'none'),
            'input-' + (footerStyle.inputStyle || 'flat')
          ]) + '">' +
            '<input type="text" ' +
              ((state.sending || state.feedbackOpen || (state.supportStatus === 'needs-human' && !state.awaitingVisitorName)) ? 'disabled ' : '') +
              'value="' + escapeHtml(state.inputValue) + '" ' +
              'placeholder="' + escapeHtml(footerStyle.showPlaceholder === false ? '' : (state.awaitingVisitorName ? 'Write your name to contact human support...' : (state.supportStatus === 'needs-human' ? 'Waiting for human support...' : 'Write a message...'))) + '" />' +
            (footerStyle.showSendButton === false ? '' : '<button type="button" class="send-btn" ' + ((state.sending || state.feedbackOpen || (state.supportStatus === 'needs-human' && !state.awaitingVisitorName)) ? 'disabled' : '') + '>' + icons.send + '</button>') +
          '</div>' +
          (state.awaitingVisitorName ? '<div class="name-request-hint">Please write your name to connect with human support.</div>' : '') +
          (state.error ? '<div class="widget-inline-error">' + escapeHtml(state.error) + '</div>' : '') +
          getFeedbackOverlayMarkup() +
          '</div>' +
          (shouldShowSupportGate() ? (
            '<div class="chat-lock-overlay">' +
              '<div class="chat-lock-card">' +
                '<p>Waiting for human support</p>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<button type="button" class="' + classes([
          'widget-icon',
          'border-' + (bubbleStyle.borderType || 'none'),
          'shadow-' + (bubbleStyle.shadowType || 'none'),
          shouldAnimateBubble ? 'animation-' + bubbleStyle.animationType : 'animation-none',
          'size-' + (bubbleStyle.sizeType || 'medium'),
          iconChoice === 'orb' ? 'widget-icon--orb' : '',
          iconChoice === 'orb' && orbPhase === 'hover' ? 'widget-icon--orb-hover' : '',
          iconChoice === 'orb' && orbPhase === 'reply' ? 'widget-icon--orb-replying' : '',
          iconChoice === 'orb' && orbPhase === 'inactive' ? 'widget-icon--orb-idle' : ''
        ]) + '" aria-label="Open chat">' +
          (iconChoice === 'orb' ? '<span class="' + classes([
            'widget-orb-avatar',
            'widget-icon--orb-mode-' + (orbPhase === 'hover' ? 'color-shift' : orbPhase === 'reply' ? 'pulse' : 'spin')
          ]) + '">' +
            '<span class="widget-orb-avatar-base"></span>' +
            '<canvas class="widget-orb-avatar-canvas" aria-hidden="true"></canvas>' +
          '</span>' : '') +
          (iconChoice === 'orb' && orbGlyph ? '<span class="widget-orb-overlay widget-orb-overlay--glyph widget-orb-overlay--' + orbPhase + '">' + escapeHtml(orbGlyph) + '</span>' : (iconChoice === 'orb' ? '' : bubbleIcon)) +
          (bubbleStyle.showStatus ? '<span class="status-dot"></span>' : '') +
        '</button>' +
      '</div>';

    applyThemeVars(mount.querySelector('.vintra-stack'), theme);

    var bubbleButton = mount.querySelector('.widget-icon');
    var input = mount.querySelector('input');
    var body = mount.querySelector('.chat-body');

    if (body) {
      body.scrollTop = body.scrollHeight;
    }

    if (bubbleButton && iconChoice === 'orb' && orbStyle.hoverEnabled) {
      bubbleButton.addEventListener('mouseenter', function () {
        bubbleButton.classList.add('widget-icon--orb-hover', 'widget-icon--orb-mode-color-shift');
      });

      bubbleButton.addEventListener('mouseleave', function () {
        bubbleButton.classList.remove('widget-icon--orb-hover', 'widget-icon--orb-mode-color-shift');
      });
    }

    if (input) {
      input.addEventListener('input', function (event) {
        var nextValue = String(event.target.value || '');
        if (countWords(nextValue) > MAX_WIDGET_MESSAGE_WORDS) {
          nextValue = truncateTextByWords(nextValue, MAX_WIDGET_MESSAGE_WORDS);
        }
        state.inputValue = nextValue;
        markOrbActivity();
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendMessage();
        }
      });
    }

    setDebug(
      'Script loaded\\n' +
      'shadow root mounted\\n' +
      'config ' + (state.config ? 'loaded' : 'pending') + '\\n' +
      'position: ' + position + '\\n' +
      'state: ' + (state.open ? 'open' : 'closed') + '\\n' +
      'support: ' + (state.supportStatus || 'none')
    );
  }

  async function loadConfig() {
    try {
      await loadEmbedToken();
      var response = await fetch(ORIGIN + '/api/widget/config?key=' + encodeURIComponent(WIDGET_KEY), {
        mode: 'cors',
        headers: {
          'X-Vintra-Embed-Token': EMBED_TOKEN,
          'X-Vintra-Fingerprint': FINGERPRINT_LIGHT,
          ...(CAPTCHA_TOKEN ? { 'X-Vintra-Captcha-Token': CAPTCHA_TOKEN } : {}),
          ...(DEBUG_MODE ? { 'X-Vintra-Debug': '1' } : {})
        }
      });
      var json = await response.json();

      if (!response.ok) {
        throw new Error(json && (json.details || json.error) ? (json.details || json.error) : 'Failed to load widget config');
      }

      state.config = json.widgetConfig || null;
      state.assistantConfig = json.assistantConfig || null;
      state.assistantEnabled = json.assistantEnabled !== false;
      state.configLoaded = true;

      if (FORCE_OPEN || (state.config && state.config.settings && state.config.settings.autoOpen)) {
        state.open = true;
        state.hasOpenedOnce = true;
        state.hasUnreadWhileClosed = false;
      }

      if (state.sessionId) {
        startSupportPolling();
        void syncSupportChat();
      }

      refreshFaqSuggestions();

      render();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load widget config';
      render();
      setDebug('Script loaded\\nconfig failed\\n' + state.error);
    }
  }

  async function sendMessage() {
    var text = truncateTextByWords(String(state.inputValue || '').trim(), MAX_WIDGET_MESSAGE_WORDS);
    if (!text || state.sending) return;

    markOrbActivity();

    if (state.awaitingVisitorName) {
      state.sending = true;
      state.error = '';
      render();

      try {
        var humanSupportResponse = await fetch(ORIGIN + '/api/widget/chat', {
          method: 'POST',
          headers: widgetHeaders(),
          mode: 'cors',
          body: JSON.stringify({
            widgetKey: WIDGET_KEY,
            sessionId: state.sessionId || undefined,
            requestHumanSupport: true,
            visitorName: text,
            supportRequestText: state.pendingHumanSupportText,
            countryCode: state.countryCode || undefined,
            pageTitle: document.title,
            pageUrl: window.location.href
          })
        });

        var humanSupportJson = await humanSupportResponse.json();

        if (!humanSupportResponse.ok) {
          if (humanSupportResponse.status === 429 && humanSupportJson && humanSupportJson.captchaRequired && humanSupportJson.captchaQuestion && humanSupportJson.captchaToken) {
            try {
              var humanSolved = await solveCaptchaChallenge(humanSupportJson.captchaQuestion, humanSupportJson.captchaToken);
              if (humanSolved) {
                window.setTimeout(sendMessage, 0);
                return;
              }
            } catch (captchaError) {
              state.error = captchaError instanceof Error ? captchaError.message : 'Failed to verify captcha';
              render();
              return;
            }
          }
          if (humanSupportResponse.status === 429 && humanSupportJson && humanSupportJson.retryAfterSeconds) {
            state.error = 'Please wait ' + humanSupportJson.retryAfterSeconds + 's before sending another message.';
            render();
            return;
          }
          throw new Error(humanSupportJson && humanSupportJson.error ? humanSupportJson.error : 'Failed to process chat');
        }

        state.sessionId = humanSupportJson.sessionId || state.sessionId;
        writeStoredSessionId(state.sessionId);
        state.countryCode = String(humanSupportJson.countryCode || state.countryCode || '').toUpperCase();
        state.awaitingVisitorName = false;
        state.pendingHumanSupportText = '';
        state.inputValue = '';
        state.supportStatus = 'needs-human';

        updateMessages(state.messages.concat([
          {
            id: 'assistant-' + Date.now(),
            role: 'assistant',
            text: String(humanSupportJson.reply || 'The chat has been handed over to human support.'),
            createdAt: new Date().toISOString()
          }
        ]));

        startSupportPolling();
        void syncSupportChat();
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to process chat';
      } finally {
        state.sending = false;
        render();
      }

      return;
    }

    if (state.supportStatus === 'needs-human') return;

    var inHumanSupportMode = state.supportStatus === 'needs-human' || state.supportStatus === 'open';
    if (state.sessionId && inHumanSupportMode) {
      await syncSupportChat();
      inHumanSupportMode = state.supportStatus === 'needs-human' || state.supportStatus === 'open';
    }

    updateMessages(state.messages.concat([
      {
        id: 'user-' + Date.now(),
        role: 'user',
        text: text,
        createdAt: new Date().toISOString()
      }
    ]));
    state.inputValue = '';
    state.error = '';
    state.sending = true;
    render();

    try {
      var response = await fetch(ORIGIN + (inHumanSupportMode ? '/api/widget/support' : '/api/widget/chat'), {
        method: 'POST',
        headers: widgetHeaders(),
        mode: 'cors',
        body: JSON.stringify(
          inHumanSupportMode
            ? {
                widgetKey: WIDGET_KEY,
                sessionId: state.sessionId || undefined,
                message: text
              }
            : {
                widgetKey: WIDGET_KEY,
                sessionId: state.sessionId || undefined,
                message: text,
                countryCode: state.countryCode || undefined,
                history: state.messages.map(function (msg) {
                  return {
                    id: msg.id,
                    role: msg.role,
                    text: msg.text,
                    createdAt: msg.createdAt
                  };
                }),
                pageTitle: document.title,
                pageUrl: window.location.href
              }
        )
      });

      var json = await response.json();

      if (!response.ok) {
        if (response.status === 429 && json && json.captchaRequired && json.captchaQuestion && json.captchaToken) {
          try {
            var supportSolved = await solveCaptchaChallenge(json.captchaQuestion, json.captchaToken);
            if (supportSolved) {
              window.setTimeout(sendMessage, 0);
              return;
            }
          } catch (captchaError) {
            state.error = captchaError instanceof Error ? captchaError.message : 'Failed to verify captcha';
            render();
            return;
          }
        }
        if (response.status === 429 && json && json.retryAfterSeconds) {
          state.error = 'Please wait ' + json.retryAfterSeconds + 's before sending another message.';
          render();
          return;
        }
        throw new Error(json && json.error ? json.error : 'Failed to process chat');
      }

      state.sessionId = json.sessionId || state.sessionId;
      writeStoredSessionId(state.sessionId);
      state.countryCode = String(json.countryCode || state.countryCode || '').toUpperCase();

      if (inHumanSupportMode) {
        state.supportStatus = json.status || state.supportStatus || 'needs-human';
        updateMessages(Array.isArray(json.messages) ? json.messages : state.messages);
        startSupportPolling();
      } else {
        updateMessages(
          state.messages.concat([
            {
              id: 'assistant-' + Date.now(),
              role: 'assistant',
              text: String(json.reply || 'I could not generate a reply.'),
              createdAt: new Date().toISOString()
            }
          ])
        );

        if (json.visitorNameRequired) {
          state.awaitingVisitorName = true;
          state.pendingHumanSupportText = text;
        }

        if (json.feedbackFormRequested) {
          state.feedbackOpen = true;
          state.feedbackText = '';
          state.feedbackRating = 5;
        }

        if (json.supportRequested) {
          state.supportStatus = 'needs-human';
          startSupportPolling();
          void syncSupportChat();
        } else if (state.supportStatus === 'ai-active') {
          stopSupportPolling();
        }
      }
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to process chat';
    } finally {
      state.sending = false;
      render();
    }
  }

  async function submitFeedback() {
    if (!state.sessionId || state.feedbackSubmitting || !String(state.feedbackText || '').trim()) {
      return;
    }

    state.feedbackSubmitting = true;
    state.error = '';
    render();

    try {
      var response = await fetch(ORIGIN + '/api/widget/feedback', {
        method: 'POST',
        headers: widgetHeaders(),
        mode: 'cors',
        body: JSON.stringify({
          widgetKey: WIDGET_KEY,
          sessionId: state.sessionId,
          rating: state.feedbackRating,
          text: state.feedbackText,
          pageTitle: document.title,
          pageUrl: window.location.href
        })
      });

      var json = await response.json();

      if (!response.ok) {
        if (response.status === 429 && json && json.captchaRequired && json.captchaQuestion && json.captchaToken) {
          try {
            var feedbackSolved = await solveCaptchaChallenge(json.captchaQuestion, json.captchaToken);
            if (feedbackSolved) {
              window.setTimeout(submitFeedback, 0);
              return;
            }
          } catch (captchaError) {
            state.error = captchaError instanceof Error ? captchaError.message : 'Failed to verify captcha';
            render();
            return;
          }
        }
        if (response.status === 429 && json && json.retryAfterSeconds) {
          state.error = 'Please wait ' + json.retryAfterSeconds + 's before sending feedback again.';
          render();
          return;
        }
        throw new Error(json && json.error ? json.error : 'Failed to submit feedback');
      }

      state.feedbackOpen = false;
      state.feedbackText = '';
      state.feedbackRating = 5;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to submit feedback';
    } finally {
      state.feedbackSubmitting = false;
      render();
    }
  }

  function startWidget() {
    createHost();
    syncViewportMetrics();
    bindViewportListeners();
    setDebug('Script loaded');
    bindWidgetActions();
    render();
    loadConfig();
  }

  if (document.body || document.documentElement) {
    startWidget();
  } else {
    document.addEventListener('DOMContentLoaded', startWidget, { once: true });
  }
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}


