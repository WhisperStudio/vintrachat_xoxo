'use client'

import { useEffect, useState } from 'react'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
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
  const forceOpen =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('open') === '1'
  const [configResponse, setConfigResponse] = useState<WidgetConfigResponse | null>(null)
  const [messages, setMessages] = useState<WidgetMessage[]>(emptyMessages)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(forceOpen)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.parent.postMessage(
      {
        type: 'vintra-widget-debug',
        widgetKey,
        status: 'frame mounted',
      },
      '*'
    )
  }, [widgetKey])

  useEffect(() => {
    let active = true

    async function loadConfig() {
      try {
        const response = await fetch(`/api/widget/config?key=${encodeURIComponent(widgetKey)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to load widget config')
        }

        if (!active) return

        setConfigResponse(data)
        window.parent.postMessage(
          {
            type: 'vintra-widget-debug',
            widgetKey,
            status: 'config loaded',
            details: `assistantEnabled=${String(data.assistantEnabled)}`,
          },
          '*'
        )

        const shouldAutoOpen = data.widgetConfig?.settings?.autoOpen
        const delayMs = Number(data.widgetConfig?.settings?.delayMs || 0)

        if (shouldAutoOpen) {
          window.setTimeout(() => setIsOpen(true), delayMs)
        }
      } catch (err) {
        if (!active) return
        console.error(err)
        setError('Could not load the chat widget.')
        window.parent.postMessage(
          {
            type: 'vintra-widget-debug',
            widgetKey,
            status: 'config failed',
            details: err instanceof Error ? err.message : 'unknown config error',
          },
          '*'
        )
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
    const openWidth = 460
    const openHeight = 760
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
    window.parent.postMessage(
      {
        type: 'vintra-widget-debug',
        widgetKey,
        status: 'layout posted',
        details: `${position} ${isOpen ? 'open' : 'closed'}`,
      },
      '*'
    )
  }, [configResponse, isOpen, widgetKey])

  const config = configResponse?.widgetConfig

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

  const widgetMessages = messages.length
    ? messages.map((message) => ({
        id: message.id,
        text: message.text,
        isBot: message.role === 'assistant',
      }))
    : [
        {
          id: 'initial-runtime-message',
          text: `Ask a question to start chatting with ${configResponse?.businessName || 'us'}.`,
          isBot: true,
        },
      ]

  return (
    <div className="widget-frame-shell">
      <WidgetPreview
        bubbleStyle={config.bubbleStyle}
        headerStyle={config.headerStyle}
        bodyStyle={config.bodyStyle}
        footerStyle={config.footerStyle}
        position={config.position}
        colorTheme={config.colorTheme}
        customBranding={{
          title,
          description,
          logo: config.customBranding?.logo,
        }}
        variant="embedded"
        messagesOverride={widgetMessages}
        inputValueOverride={inputValue}
        onInputValueChange={setInputValue}
        onSendMessage={handleSend}
        openOverride={isOpen}
        onToggleOpen={handleToggle}
        errorMessage={error}
        statusText={configResponse?.assistantEnabled ? 'AI live' : 'AI off'}
        disableInput={isSending}
      />
    </div>
  )
}
