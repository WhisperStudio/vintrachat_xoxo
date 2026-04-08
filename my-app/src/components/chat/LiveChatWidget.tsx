'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiMessageCircle, FiSend, FiX } from 'react-icons/fi'
import '@/app/landings/auth/chatWidget/components/WidgetPreview.css'
import './LiveChatWidget.css'
import type { ChatWidgetConfig } from '@/types/database'

type WidgetMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

type WidgetConfigResponse = {
  businessName: string
  widgetKey: string
  widgetConfig: ChatWidgetConfig
  assistantEnabled: boolean
}

const emptyMessages: WidgetMessage[] = []

function sessionStorageKey(widgetKey: string) {
  return `vintra-widget-session:${widgetKey}`
}

function messageId() {
  return crypto.randomUUID()
}

export default function LiveChatWidget({ widgetKey }: { widgetKey: string }) {
  const [configResponse, setConfigResponse] = useState<WidgetConfigResponse | null>(null)
  const [messages, setMessages] = useState<WidgetMessage[]>(emptyMessages)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadConfig() {
      try {
        const response = await fetch(`/api/widget/config?key=${encodeURIComponent(widgetKey)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load widget config')
        }

        if (!active) return

        setConfigResponse(data)

        const shouldAutoOpen = data.widgetConfig?.settings?.autoOpen
        const delayMs = Number(data.widgetConfig?.settings?.delayMs || 0)

        if (shouldAutoOpen) {
          window.setTimeout(() => setIsOpen(true), delayMs)
        }
      } catch (err) {
        if (!active) return
        console.error(err)
        setError('Could not load the chat widget.')
      }
    }

    loadConfig()

    return () => {
      active = false
    }
  }, [widgetKey])

  useEffect(() => {
    const existingSessionId = window.localStorage.getItem(sessionStorageKey(widgetKey))
    if (existingSessionId) {
      setSessionId(existingSessionId)
    }
  }, [widgetKey])

  useEffect(() => {
    if (!configResponse) return

    const position = configResponse.widgetConfig.position
    const openWidth = 420
    const openHeight = 720
    const closedWidth = 84
    const closedHeight = 84

    window.parent.postMessage(
      {
        type: 'vintra-widget-layout',
        widgetKey,
        position,
        width: isOpen ? openWidth : closedWidth,
        height: isOpen ? openHeight : closedHeight,
      },
      '*'
    )
  }, [configResponse, isOpen, widgetKey])

  const config = configResponse?.widgetConfig
  const themeClass = useMemo(() => {
    return config ? `theme-${config.colorTheme}` : 'theme-modern'
  }, [config])

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isSending) return

    const userMessage: WidgetMessage = {
      id: messageId(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInputValue('')
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetKey,
          sessionId,
          message: text,
          history: messages,
          pageTitle: document.title,
          pageUrl: window.location.href,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      const nextSessionId = String(data.sessionId || sessionId || messageId())
      setSessionId(nextSessionId)
      window.localStorage.setItem(sessionStorageKey(widgetKey), nextSessionId)

      setMessages((prev) => [
        ...prev,
        {
          id: messageId(),
          role: 'assistant',
          text: String(data.reply || ''),
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (err) {
      console.error(err)
      setError('The assistant could not reply right now.')
      setMessages((prev) => prev.filter((message) => message.id !== userMessage.id))
      setInputValue(text)
    } finally {
      setIsSending(false)
    }
  }

  if (!config) {
    return (
      <div className="widget-frame-shell">
        <div className="widget-frame-fallback">{error || 'Loading widget...'}</div>
      </div>
    )
  }

  const title = config.customBranding?.title || configResponse?.businessName || 'Support Chat'
  const description =
    config.customBranding?.description || 'Ask a question and we will help you.'

  return (
    <div className="widget-frame-shell">
      <div className={`widget-frame-root ${themeClass} position-${config.position}`}>
        <div className="floating-chat-preview widget-frame-preview">
          <div className="widgetcontainer">
            <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
              <div className="chat-header">
                <div className="chat-header-left">
                  <div className="avatar">
                    {config.customBranding?.logo ? (
                      <img src={config.customBranding.logo} alt="logo" className="avatar-image" />
                    ) : (
                      <FiMessageCircle />
                    )}
                  </div>

                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <span className="status-pill">
                    <FiCheckCircle /> {configResponse?.assistantEnabled ? 'AI live' : 'AI off'}
                  </span>
                  <button type="button" className="close-btn" onClick={() => setIsOpen(false)}>
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="chat-body">
                {messages.length === 0 && (
                  <div className="message message-bot">
                    Ask a question to start chatting with {configResponse?.businessName || 'us'}.
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${
                      message.role === 'assistant' ? 'message-bot' : 'message-user'
                    }`}
                  >
                    {message.text}
                  </div>
                ))}

                {error && <div className="widget-inline-error">{error}</div>}
              </div>

              <div className="chat-footer">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSend()}
                  disabled={isSending}
                />
                <button type="button" onClick={handleSend} disabled={isSending}>
                  <FiSend />
                </button>
              </div>
            </div>

            <button type="button" className="widget-icon" onClick={handleToggle}>
              <FiMessageCircle />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
