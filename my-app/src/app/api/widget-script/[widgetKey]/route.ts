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
  font-family: Inter, Arial, sans-serif;
  pointer-events: none;
}

.vintra-root.position-bottom-left {
  inset: auto auto 24px 24px;
}

.vintra-stack {
  position: relative;
  width: min(390px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;
}

.vintra-root.position-bottom-left .vintra-stack {
  align-items: flex-start;
}

.chat-widget {
  --widget-scale: 1;
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: var(--chat-bg, #ffffff);
  color: var(--chat-text, #1f2937);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  opacity: 0;
  pointer-events: none;
  transform: translateY(12px) scale(var(--widget-scale));
  transform-origin: bottom right;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease,
    visibility 0.24s ease;
  visibility: hidden;
}

.vintra-root.position-bottom-left .chat-widget {
  transform-origin: bottom left;
}

.chat-widget.open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0) scale(var(--widget-scale));
  visibility: visible;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1rem 0.95rem;
  background: var(--chat-primary, #3b82f6);
  color: #fff;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.chat-header-copy {
  min-width: 0;
}

.chat-header-copy h3 {
  margin: 0;
  font-size: 1rem;
}

.chat-header-copy p {
  margin: 0.15rem 0 0;
  font-size: 0.78rem;
  opacity: 0.9;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar svg {
  width: 20px;
  height: 20px;
  display: block;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.72rem;
  font-weight: 700;
}

.status-pill svg {
  width: 14px;
  height: 14px;
  display: block;
}

.close-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  cursor: pointer;
}

.chat-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 360px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--chat-bg, #ffffff);
}

.chat-content {
  display: flex;
  flex-direction: column;
}

.chat-widget-locked .chat-content {
  filter: blur(5px) grayscale(1);
  opacity: 0.48;
  pointer-events: none;
  user-select: none;
}

.chat-lock-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
}

.chat-lock-card {
  display: grid;
  gap: 0.75rem;
  place-items: center;
  min-width: min(260px, 100%);
  padding: 1.2rem 1.4rem;
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.14);
}

.chat-lock-card p {
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  text-align: center;
}

.message {
  max-width: 82%;
  padding: 0.85rem 1rem;
  border-radius: 18px;
  font-size: 0.92rem;
  line-height: 1.55;
  animation: fadeInUp 0.24s ease;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-bot {
  align-self: flex-start;
  background: #eef2ff;
  color: #1f2937;
}

.message-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  color: #fff;
}

.message-support {
  align-self: flex-start;
  background: #dcfce7;
  color: #14532d;
}

.message-system {
  align-self: center;
  max-width: 100%;
  padding: 0.2rem 0.4rem;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  text-align: center;
 }

.message-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.78;
}

.chat-status-line {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  max-width: 100%;
  color: #64748b;
  font-size: 0.78rem;
  text-align: center;
}

.chat-status-line::before,
.chat-status-line::after {
  content: '';
  width: 42px;
  height: 1px;
  background: rgba(100, 116, 139, 0.28);
}

.message-time {
  display: inline-block;
  margin-left: 8px;
  font-size: 11px;
  color: inherit;
  opacity: 0.5;
}

.message-read {
  display: inline-block;
  margin-left: 4px;
  font-size: 12px;
  color: #10b981;
}

.chat-footer {
  display: flex;
  gap: 0.7rem;
  padding: 1rem;
  background: var(--chat-bg, #ffffff);
}

.chat-footer input {
  flex: 1;
  min-width: 0;
  padding: 0.9rem 1rem;
  border: none;
  outline: none;
  border-radius: 14px;
  font-size: 0.92rem;
  background: rgba(241, 245, 249, 0.94);
  color: var(--chat-text, #1f2937);
}

.chat-footer input::placeholder {
  color: rgba(71, 85, 105, 0.88);
}

.chat-footer button {
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(241, 245, 249, 0.94);
  color: #111827;
}

.chat-footer button svg {
  width: 20px;
  height: 20px;
  display: block;
}

.widget-inline-error {
  padding: 0 1rem 1rem;
  color: #b91c1c;
  font-size: 0.84rem;
}

.name-request-hint {
  padding: 0 1rem 0.75rem;
  color: #475569;
  font-size: 0.84rem;
  line-height: 1.45;
}

.widget-icon {
  position: relative;
  width: calc(58px * var(--widget-scale));
  height: calc(58px * var(--widget-scale));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
  color: #fff;
  font-size: 0;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.widget-icon:hover {
  transform: scale(1.06);
}

.widget-icon--orb {
  background: #000;
  border: none;
  box-shadow: none;
  overflow: visible;
}

.widget-icon--orb:hover {
  transform: scale(1.03);
  box-shadow: none;
}

.widget-orb-avatar {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 30% 28%, rgba(255, 255, 255, 0.95), transparent 28%),
    radial-gradient(circle at 40% 42%, rgba(219, 234, 254, 0.92), rgba(139, 92, 246, 0.82) 62%, rgba(76, 29, 149, 0.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 20px rgba(124, 58, 237, 0.18);
  pointer-events: none;
  z-index: 1;
}

.widget-icon--orb-idle .widget-orb-overlay {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
}

.widget-icon--orb-replying .widget-orb-overlay {
  animation: orbOverlaySpin 1.15s linear infinite;
}

.widget-icon--orb-replying.widget-icon--orb .widget-orb-avatar {
  animation: orbPulse 1.15s ease-in-out infinite;
}

.widget-icon--orb-mode-color-shift.widget-icon--orb .widget-orb-avatar {
  animation: orbColorShift 1.15s ease-in-out infinite;
}

.widget-icon--orb-mode-spin.widget-icon--orb .widget-orb-avatar {
  animation: orbSpin 1.15s linear infinite;
}

.widget-icon--orb-mode-pulse.widget-icon--orb .widget-orb-avatar {
  animation: orbPulse 1.15s ease-in-out infinite;
}

.widget-icon--orb-replying.widget-icon--orb {
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 24px rgba(124, 58, 237, 0.2),
    0 0 42px rgba(59, 130, 246, 0.12);
}

.widget-orb-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 2;
  color: rgba(255, 255, 255, 0.96);
  text-shadow: 0 0 14px rgba(255, 255, 255, 0.32);
  pointer-events: none;
}

.widget-orb-overlay--glyph {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.widget-orb-overlay--icon svg {
  width: 1.05rem;
  height: 1.05rem;
}

.widget-icon svg {
  width: calc(28px * var(--widget-scale));
  height: calc(28px * var(--widget-scale));
  display: block;
}

.status-dot {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #10b981;
}

@keyframes orbOverlaySpin {
  from {
    transform: rotate(0deg) scale(1);
  }
  50% {
    transform: rotate(180deg) scale(1.04);
  }
  to {
    transform: rotate(360deg) scale(1);
  }
}

@keyframes orbPulse {
  0%,
  100% {
    filter: saturate(1) brightness(1);
  }
  50% {
    filter: saturate(1.15) brightness(1.1);
  }
}

@keyframes orbColorShift {
  0%,
  100% {
    filter: hue-rotate(0deg) saturate(1.02) brightness(1);
  }
  50% {
    filter: hue-rotate(30deg) saturate(1.2) brightness(1.12);
  }
}

@keyframes orbSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.border-none {
  border: none !important;
}

.border-solid {
  border: 2px solid var(--chat-border, #dbe2ea) !important;
}

.border-rounded {
  border: 2px solid var(--chat-border, #dbe2ea) !important;
  border-radius: 12px !important;
}

.border-shadow {
  border: none !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.shadow-none {
  box-shadow: none !important;
}

.shadow-light {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

.shadow-medium {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
}

.shadow-heavy {
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16) !important;
}

.animation-none {
  animation: none !important;
}

.animation-bounce {
  animation: bounce 2s infinite;
}

.animation-fade {
  animation: fadeIn 0.3s ease-in-out;
}

.animation-slide {
  animation: slideIn 0.3s ease-out;
}

.size-small {
  --widget-scale: 0.88;
}

.size-medium {
  --widget-scale: 1;
}

.size-large {
  --widget-scale: 1.08;
}

.messages-bubble .message {
  padding: 8px 12px !important;
  border-radius: 18px !important;
}

.messages-flat .message {
  padding: 10px !important;
  border-radius: 4px !important;
}

.messages-card .message {
  padding: 12px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  background: #fff !important;
  color: #1f2937 !important;
}

.input-flat input {
  border: none !important;
  border-bottom: 2px solid var(--chat-border, #dbe2ea) !important;
  border-radius: 0 !important;
}

.input-rounded input {
  border: 2px solid var(--chat-border, #dbe2ea) !important;
  border-radius: 20px !important;
}

.input-outlined input {
  border: 2px solid var(--chat-border, #dbe2ea) !important;
  border-radius: 8px !important;
}

.theme-modern {
  --chat-primary: #3b82f6;
  --chat-secondary: #1e40af;
  --chat-bg: #ffffff;
  --chat-text: #1f2937;
  --chat-border: #e5e7eb;
}

.theme-chilling {
  --chat-primary: #10b981;
  --chat-secondary: #047857;
  --chat-bg: #f0fdf4;
  --chat-text: #064e3b;
  --chat-border: #bbf7d0;
}

.theme-corporate {
  --chat-primary: #6b7280;
  --chat-secondary: #374151;
  --chat-bg: #f9fafb;
  --chat-text: #111827;
  --chat-border: #d1d5db;
}

.theme-luxury {
  --chat-primary: #7c3aed;
  --chat-secondary: #5b21b6;
  --chat-bg: #faf5ff;
  --chat-text: #4c1d95;
  --chat-border: #e9d5ff;
}

.theme-modern .chat-widget,
.theme-chilling .chat-widget,
.theme-corporate .chat-widget,
.theme-luxury .chat-widget {
  background-color: var(--chat-bg);
  color: var(--chat-text);
  border-color: var(--chat-border);
}

.theme-modern .chat-header,
.theme-chilling .chat-header,
.theme-corporate .chat-header,
.theme-luxury .chat-header {
  background-color: var(--chat-primary);
  color: #fff;
}

.theme-modern .chat-footer,
.theme-chilling .chat-footer,
.theme-corporate .chat-footer,
.theme-luxury .chat-footer {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

.theme-modern .chat-footer input,
.theme-chilling .chat-footer input,
.theme-corporate .chat-footer input,
.theme-luxury .chat-footer input {
  background-color: var(--chat-bg);
  color: var(--chat-text);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
}

.theme-modern .message.message-bot,
.theme-chilling .message.message-bot,
.theme-corporate .message.message-bot,
.theme-luxury .message.message-bot {
  background-color: #eef2ff;
  color: var(--chat-text);
}

.theme-modern .message.message-support,
.theme-chilling .message.message-support,
.theme-corporate .message.message-support,
.theme-luxury .message.message-support {
  background: #dcfce7;
  color: #14532d;
}

.theme-modern .message.message-system,
.theme-chilling .message.message-system,
.theme-corporate .message.message-system,
.theme-luxury .message.message-system {
  background: transparent;
  color: #64748b;
}

.theme-modern .message.message-user,
.theme-chilling .message.message-user,
.theme-corporate .message.message-user,
.theme-luxury .message.message-user {
  background: linear-gradient(135deg, var(--chat-primary), var(--chat-secondary));
  color: #fff;
}

.theme-modern .widget-icon,
.theme-chilling .widget-icon,
.theme-corporate .widget-icon,
.theme-luxury .widget-icon {
  background: linear-gradient(135deg, #3b82f6, #7c3aed);
}

.vintra-debug {
  position: fixed;
  left: 16px;
  bottom: 16px;
  max-width: 320px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  font: 12px/1.45 Inter, Arial, sans-serif;
  white-space: pre-wrap;
  z-index: 2147483001;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .vintra-root {
    inset: auto 12px 12px auto;
  }

  .vintra-root.position-bottom-left {
    inset: auto auto 12px 12px;
  }

  .vintra-stack {
    width: min(390px, calc(100vw - 24px));
  }

  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-footer {
    flex-direction: column;
  }

  .chat-footer button {
    width: 100%;
  }
}
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
  var WIDGET_KEY = ${JSON.stringify(widgetKey)};
  var ORIGIN = ${JSON.stringify(origin)};
  var DEBUG_MODE = ${debugMode ? 'true' : 'false'};
  var FORCE_OPEN = ${forceOpen ? 'true' : 'false'};
  var GLOBAL_KEY = '__vintraWidgetLoaded__' + WIDGET_KEY;
  var SESSION_STORAGE_KEY = '__vintraWidgetSession__' + WIDGET_KEY;

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

  setDebug('Script loaded');

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

  var state = {
    open: FORCE_OPEN,
    sessionId: readStoredSessionId(),
    sending: false,
    inputValue: '',
    error: '',
    assistantEnabled: true,
    config: null,
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
    orbInactiveActive: false,
    orbCycleTick: 0,
    orbTicker: null,
    orbInactivityTimer: null,
    orbInactiveHoldTimer: null
  };

  var icons = {
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"></path></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"></path></svg>',
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
      var label = msg.role === 'assistant'
        ? 'AI assistant'
        : msg.role === 'support'
          ? 'Human support'
          : msg.role === 'system'
            ? 'System'
            : 'You';

      if (msg.role === 'system') {
        return (
          '<div class="' + classes(['message', roleClass]) + '">' +
            escapeHtml(msg.text) +
          '</div>'
        );
      }

      return (
        '<div class="' + classes(['message', roleClass]) + '">' +
          '<span class="message-label">' + escapeHtml(label) + '</span>' +
          escapeHtml(msg.text) +
          (bodyStyle.showTimestamps ? '<span class="message-time">' + escapeHtml(formatTime(msg.createdAt)) + '</span>' : '') +
          (bodyStyle.showReadReceipts && msg.role === 'user' ? '<span class="message-read">Read</span>' : '') +
        '</div>'
      );
    }).join('');
  }

  var supportPollTimer = null;

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
        { mode: 'cors' }
      );

      if (response.status === 404) {
        stopSupportPolling();
        clearSupportState();
        render();
        return;
      }

      var json = await response.json();

      if (!response.ok) {
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

  function render() {
    var config = state.config || {};
    var bubbleStyle = config.bubbleStyle || {};
    var headerStyle = config.headerStyle || {};
    var bodyStyle = config.bodyStyle || {};
    var footerStyle = config.footerStyle || {};
    var theme = getThemeName(config);
    var position = getPosition(config);
    var iconChoice = bubbleStyle.iconChoice || 'chat';
    var orbStyle = getOrbStyle(config);
    var bubbleIcon = icons[iconChoice] || icons.chat;
    var shouldAnimateBubble =
      bubbleStyle.animationType &&
      bubbleStyle.animationType !== 'none' &&
      (!state.hasOpenedOnce || (!state.open && state.hasUnreadWhileClosed));
    var headerAvatar = getLogo(config)
      ? '<img src="' + escapeHtml(getLogo(config)) + '" alt="logo" />'
      : icons.message;
    var orbPhase = iconChoice === 'orb' ? getOrbPhase(orbStyle) : 'none';
    var orbGlyphList = iconChoice === 'orb' ? getOrbGlyphList(orbStyle, orbPhase) : [];
    var orbGlyph = orbGlyphList.length ? orbGlyphList[state.orbCycleTick % orbGlyphList.length] : '';

    syncOrbTicker(orbStyle, orbPhase, orbGlyphList);
    syncOrbInactivity(orbStyle, orbPhase);

    mount.className = 'vintra-root position-' + position;
    var shouldShowWidget = state.configLoaded && state.open;
    mount.innerHTML =
      '<div class="vintra-stack theme-' + theme + '">' +
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
              (headerStyle.showAvatar !== false ? '<div class="avatar">' + headerAvatar + '</div>' : '') +
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
          '<div class="' + classes([
            'chat-footer',
            'border-' + (footerStyle.borderType || 'none'),
            'shadow-' + (footerStyle.shadowType || 'none'),
            'input-' + (footerStyle.inputStyle || 'flat')
          ]) + '">' +
            '<input type="text" ' +
              ((state.sending || (state.supportStatus === 'needs-human' && !state.awaitingVisitorName)) ? 'disabled ' : '') +
              'value="' + escapeHtml(state.inputValue) + '" ' +
              'placeholder="' + escapeHtml(footerStyle.showPlaceholder === false ? '' : (state.awaitingVisitorName ? 'Write your name to contact human support...' : (state.supportStatus === 'needs-human' ? 'Waiting for human support...' : 'Write a message...'))) + '" />' +
            (footerStyle.showSendButton === false ? '' : '<button type="button" class="send-btn" ' + ((state.sending || (state.supportStatus === 'needs-human' && !state.awaitingVisitorName)) ? 'disabled' : '') + '>' + icons.send + '</button>') +
          '</div>' +
          (state.awaitingVisitorName ? '<div class="name-request-hint">Please write your name to connect with human support.</div>' : '') +
          (state.error ? '<div class="widget-inline-error">' + escapeHtml(state.error) + '</div>' : '') +
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
          (iconChoice === 'orb' ? '<span class="widget-orb-avatar"></span>' : '') +
          (iconChoice === 'orb' && orbGlyph ? '<span class="widget-orb-overlay widget-orb-overlay--glyph widget-orb-overlay--' + orbPhase + '">' + escapeHtml(orbGlyph) + '</span>' : bubbleIcon) +
          (bubbleStyle.showStatus ? '<span class="status-dot"></span>' : '') +
        '</button>' +
      '</div>';

    var bubbleButton = mount.querySelector('.widget-icon');
    var closeButton = mount.querySelector('.close-btn');
    var input = mount.querySelector('input');
    var sendButton = mount.querySelector('.send-btn');
    var body = mount.querySelector('.chat-body');

    if (body) {
      body.scrollTop = body.scrollHeight;
    }

    if (bubbleButton) {
      bubbleButton.addEventListener('mouseenter', function () {
        state.hovered = true;
        render();
      });

      bubbleButton.addEventListener('mouseleave', function () {
        state.hovered = false;
        render();
      });

      bubbleButton.addEventListener('click', function () {
        state.open = !state.open;
        if (state.open) {
          state.hasOpenedOnce = true;
          state.hasUnreadWhileClosed = false;
        }
        render();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        state.open = false;
        render();
      });
    }

    if (input) {
      input.addEventListener('input', function (event) {
        state.inputValue = event.target.value;
        markOrbActivity();
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          sendMessage();
        }
      });
    }

    if (sendButton) {
      sendButton.addEventListener('click', function () {
        markOrbActivity();
        sendMessage();
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
      var response = await fetch(ORIGIN + '/api/widget/config?key=' + encodeURIComponent(WIDGET_KEY), {
        mode: 'cors'
      });
      var json = await response.json();

      if (!response.ok) {
        throw new Error(json && (json.details || json.error) ? (json.details || json.error) : 'Failed to load widget config');
      }

      state.config = json.widgetConfig || null;
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

      render();
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Failed to load widget config';
      render();
      setDebug('Script loaded\\nconfig failed\\n' + state.error);
    }
  }

  async function sendMessage() {
    var text = String(state.inputValue || '').trim();
    if (!text || state.sending) return;

    markOrbActivity();

    if (state.awaitingVisitorName) {
      state.sending = true;
      state.error = '';
      render();

      try {
        var humanSupportResponse = await fetch(ORIGIN + '/api/widget/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
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
        headers: {
          'Content-Type': 'application/json'
        },
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

  render();
  loadConfig();
})();`

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
