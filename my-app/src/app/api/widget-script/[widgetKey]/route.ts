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
  height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--chat-bg, #ffffff);
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

.widget-icon {
  position: relative;
  width: 58px;
  height: 58px;
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

.widget-icon svg {
  width: 28px;
  height: 28px;
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

  var state = {
    open: FORCE_OPEN,
    sessionId: '',
    sending: false,
    inputValue: '',
    error: '',
    assistantEnabled: true,
    config: null,
    messages: [
      {
        id: 'welcome',
        text: 'Hey! Welcome to our website. How can we help you today?',
        isBot: true,
        createdAt: new Date().toISOString()
      }
    ]
  };

  var icons = {
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"></path></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8A8.5 8.5 0 0 1 12.5 20a8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z"></path></svg>',
    support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10a6 6 0 1 0-12 0v4a2 2 0 0 0 2 2h1v-5H6"></path><path d="M18 10v6a4 4 0 0 1-4 4h-2"></path><path d="M15 16h1a2 2 0 0 0 2-2v-4"></path></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.34 1.77.67 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.33a2 2 0 0 1 2.11-.45c.84.33 1.72.55 2.61.67A2 2 0 0 1 22 16.92Z"></path></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3"></path><path d="M15 1v3"></path><path d="M9 20v3"></path><path d="M15 20v3"></path><path d="M20 9h3"></path><path d="M20 14h3"></path><path d="M1 9h3"></path><path d="M1 14h3"></path></svg>',
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

  function getMessagesMarkup(config) {
    var bodyStyle = (config && config.bodyStyle) || {};
    return state.messages.map(function (msg) {
      return (
        '<div class="' + classes(['message', msg.isBot ? 'message-bot' : 'message-user']) + '">' +
          escapeHtml(msg.text) +
          (bodyStyle.showTimestamps ? '<span class="message-time">' + escapeHtml(formatTime(msg.createdAt)) + '</span>' : '') +
          (bodyStyle.showReadReceipts && !msg.isBot ? '<span class="message-read">Read</span>' : '') +
        '</div>'
      );
    }).join('');
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
    var bubbleIcon = icons[iconChoice] || icons.chat;
    var headerAvatar = getLogo(config)
      ? '<img src="' + escapeHtml(getLogo(config)) + '" alt="logo" />'
      : icons.message;

    mount.className = 'vintra-root position-' + position;
    mount.innerHTML =
      '<div class="vintra-stack theme-' + theme + '">' +
        '<div class="' + classes([
          'chat-widget',
          state.open ? 'open' : '',
          'border-' + (headerStyle.borderType || 'none'),
          'shadow-' + (headerStyle.shadowType || 'none'),
          'messages-' + (bodyStyle.messageStyle || 'bubble')
        ]) + '">' +
          '<div class="chat-header">' +
            '<div class="chat-header-left">' +
              (headerStyle.showAvatar !== false ? '<div class="avatar">' + headerAvatar + '</div>' : '') +
              '<div class="chat-header-copy">' +
                (headerStyle.showTitle !== false ? '<h3>' + escapeHtml(getTitle(config)) + '</h3>' : '') +
                '<p>' + escapeHtml(getDescription(config)) + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="chat-header-actions">' +
              (headerStyle.showStatus ? '<span class="status-pill">' + icons.check + ' ' + (state.assistantEnabled ? 'AI live' : 'Offline') + '</span>' : '') +
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
              (state.sending ? 'disabled ' : '') +
              'value="' + escapeHtml(state.inputValue) + '" ' +
              'placeholder="' + escapeHtml(footerStyle.showPlaceholder === false ? '' : 'Write a message...') + '" />' +
            (footerStyle.showSendButton === false ? '' : '<button type="button" class="send-btn" ' + (state.sending ? 'disabled' : '') + '>' + icons.send + '</button>') +
          '</div>' +
          (state.error ? '<div class="widget-inline-error">' + escapeHtml(state.error) + '</div>' : '') +
        '</div>' +
        '<button type="button" class="' + classes([
          'widget-icon',
          'border-' + (bubbleStyle.borderType || 'none'),
          'shadow-' + (bubbleStyle.shadowType || 'none'),
          'animation-' + (bubbleStyle.animationType || 'none'),
          'size-' + (bubbleStyle.sizeType || 'medium')
        ]) + '" aria-label="Open chat">' +
          bubbleIcon +
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
      bubbleButton.addEventListener('click', function () {
        state.open = !state.open;
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
        sendMessage();
      });
    }

    setDebug(
      'Script loaded\\n' +
      'shadow root mounted\\n' +
      'config ' + (state.config ? 'loaded' : 'pending') + '\\n' +
      'position: ' + position + '\\n' +
      'state: ' + (state.open ? 'open' : 'closed')
    );
  }

  async function loadConfig() {
    try {
      var response = await fetch(ORIGIN + '/api/widget/config?key=' + encodeURIComponent(WIDGET_KEY), {
        credentials: 'same-origin'
      });
      var json = await response.json();

      if (!response.ok) {
        throw new Error(json && (json.details || json.error) ? (json.details || json.error) : 'Failed to load widget config');
      }

      state.config = json.widgetConfig || null;
      state.assistantEnabled = json.assistantEnabled !== false;

      if (FORCE_OPEN || (state.config && state.config.settings && state.config.settings.autoOpen)) {
        state.open = true;
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

    state.messages = state.messages.concat([
      {
        id: 'user-' + Date.now(),
        text: text,
        isBot: false,
        createdAt: new Date().toISOString()
      }
    ]);
    state.inputValue = '';
    state.error = '';
    state.sending = true;
    render();

    try {
      var response = await fetch(ORIGIN + '/api/widget/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          widgetKey: WIDGET_KEY,
          sessionId: state.sessionId || undefined,
          message: text,
          history: state.messages.map(function (msg) {
            return {
              id: msg.id,
              role: msg.isBot ? 'assistant' : 'user',
              text: msg.text,
              createdAt: msg.createdAt
            };
          }),
          pageTitle: document.title,
          pageUrl: window.location.href
        })
      });

      var json = await response.json();

      if (!response.ok) {
        throw new Error(json && json.error ? json.error : 'Failed to process chat');
      }

      state.sessionId = json.sessionId || state.sessionId;
      state.messages = state.messages.concat([
        {
          id: 'assistant-' + Date.now(),
          text: String(json.reply || 'I could not generate a reply.'),
          isBot: true,
          createdAt: new Date().toISOString()
        }
      ]);
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
