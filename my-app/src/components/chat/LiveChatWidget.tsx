'use client'

import { useEffect, useMemo, useState } from 'react'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
import './LiveChatWidget.css'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'

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
  assistantConfig?: ChatAssistantConfig | null
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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [rateLimitUntil, setRateLimitUntil] = useState(0)
  const [captchaToken, setCaptchaToken] = useState('')

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

  const fingerprintLight = useMemo(() => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    const screenRef = typeof window !== 'undefined' ? window.screen : undefined

    return [
      nav?.userAgent || 'ua:unknown',
      nav?.language || 'lang:unknown',
      nav?.platform || 'platform:unknown',
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'tz:unknown',
      screenRef?.width || 0,
      screenRef?.height || 0,
      screenRef?.colorDepth || 0,
      nav?.hardwareConcurrency || 0,
      nav?.maxTouchPoints || 0,
    ].join('|')
  }, [])

  useEffect(() => {
    if (!rateLimitUntil) return

    const timer = window.setInterval(() => {
      if (Date.now() >= rateLimitUntil) {
        setRateLimitUntil(0)
        window.clearInterval(timer)
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [rateLimitUntil])

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
    const existingCaptchaToken = window.sessionStorage.getItem(`vintra-widget-captcha:${widgetKey}`)
    if (existingCaptchaToken) {
      setCaptchaToken(existingCaptchaToken)
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

  const handleToggle = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
  }

  const isRateLimited = rateLimitUntil > Date.now()
  const cooldownSeconds = isRateLimited ? Math.max(1, Math.ceil((rateLimitUntil - Date.now()) / 1000)) : 0

  const handleSend = async (messageOverride?: string) => {
    const text = String(messageOverride ?? inputValue).trim()
    if (!text || isSending || isRateLimited) return

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
          'X-Vintra-Fingerprint': fingerprintLight,
          ...(captchaToken ? { 'X-Vintra-Captcha-Token': captchaToken } : {}),
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
        if (response.status === 429 && data.captchaRequired && data.captchaQuestion && data.captchaToken) {
          setMessages((prev) => prev.filter((message) => message.id !== userMessage.id))
          setInputValue(text)

          const answer = window.prompt(`${data.captchaQuestion}\n\nEnter the answer to continue:`)
          if (!answer) {
            throw new Error('Verification cancelled.')
          }

          const verifyResponse = await fetch('/api/widget/captcha/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Vintra-Fingerprint': fingerprintLight,
            },
            body: JSON.stringify({
              widgetKey,
              sessionId: sessionId || '',
              fingerprint: fingerprintLight,
              challengeToken: data.captchaToken,
              answer,
            }),
          })

          const verifyJson = await verifyResponse.json()
          if (!verifyResponse.ok) {
            throw new Error(verifyJson.error || 'Failed to verify captcha')
          }

          const nextCaptchaToken = String(verifyJson.captchaToken || '')
          setCaptchaToken(nextCaptchaToken)
          window.sessionStorage.setItem(`vintra-widget-captcha:${widgetKey}`, nextCaptchaToken)

          setMessages((prev) => prev.filter((message) => message.id !== userMessage.id))
          setInputValue(text)
          window.setTimeout(() => {
            void handleSend(text)
          }, 0)
          return
        }

        if (response.status === 429 && data.retryAfterSeconds) {
          setRateLimitUntil(Date.now() + Number(data.retryAfterSeconds) * 1000)
          setError(null)
          throw new Error(`You're sending messages too quickly. Try again in ${data.retryAfterSeconds}s.`)
        }
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

      if (data.feedbackFormRequested) {
        setFeedbackOpen(true)
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''
      if (!message.toLowerCase().includes('too quickly')) {
        setError('The assistant could not reply right now.')
      }
      setMessages((prev) => prev.filter((message) => message.id !== userMessage.id))
      setInputValue(text)
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmitFeedback = async () => {
    if (!sessionId || feedbackSubmitting || !feedbackText.trim() || isRateLimited) return

    setFeedbackSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/widget/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Vintra-Fingerprint': fingerprintLight,
          ...(captchaToken ? { 'X-Vintra-Captcha-Token': captchaToken } : {}),
        },
        body: JSON.stringify({
          widgetKey,
          sessionId,
          rating: feedbackRating,
          text: feedbackText,
          pageTitle: document.title,
          pageUrl: window.location.href,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        if (response.status === 429 && data.captchaRequired && data.captchaQuestion && data.captchaToken) {
          const answer = window.prompt(`${data.captchaQuestion}\n\nEnter the answer to continue:`)
          if (!answer) {
            throw new Error('Verification cancelled.')
          }

          const verifyResponse = await fetch('/api/widget/captcha/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Vintra-Fingerprint': fingerprintLight,
            },
            body: JSON.stringify({
              widgetKey,
              sessionId,
              fingerprint: fingerprintLight,
              challengeToken: data.captchaToken,
              answer,
            }),
          })

          const verifyJson = await verifyResponse.json()
          if (!verifyResponse.ok) {
            throw new Error(verifyJson.error || 'Failed to verify captcha')
          }

          const nextCaptchaToken = String(verifyJson.captchaToken || '')
          setCaptchaToken(nextCaptchaToken)
          window.sessionStorage.setItem(`vintra-widget-captcha:${widgetKey}`, nextCaptchaToken)

          window.setTimeout(() => {
            void handleSubmitFeedback()
          }, 0)
          return
        }

        if (response.status === 429 && data.retryAfterSeconds) {
          setRateLimitUntil(Date.now() + Number(data.retryAfterSeconds) * 1000)
          setError(null)
          throw new Error(`You're sending messages too quickly. Try again in ${data.retryAfterSeconds}s.`)
        }
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setFeedbackOpen(false)
      setFeedbackText('')
      setFeedbackRating(5)
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''
      if (!message.toLowerCase().includes('too quickly')) {
        setError('The feedback form could not be submitted right now.')
      }
    } finally {
      setFeedbackSubmitting(false)
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
          logoStyle: config.customBranding?.logoStyle,
        }}
        variant="embedded"
        messagesOverride={widgetMessages}
        inputValueOverride={inputValue}
        onInputValueChange={setInputValue}
        onSendMessage={handleSend}
        faqSuggestionsEnabled={Boolean(configResponse?.assistantConfig?.faqSuggestionsEnabled)}
        faqSuggestions={configResponse?.assistantConfig?.faqSuggestions || []}
        openOverride={isOpen}
        onToggleOpen={handleToggle}
        statusText={configResponse?.assistantEnabled ? 'AI live' : 'AI off'}
        disableInput={isSending || feedbackOpen || isRateLimited}
        bubbleActivityState={isSending ? 'replying' : 'idle'}
        feedbackOverlay={{
          open: feedbackOpen,
          rating: feedbackRating,
          text: feedbackText,
          submitting: feedbackSubmitting,
          onRatingChange: setFeedbackRating,
          onTextChange: setFeedbackText,
          onSubmit: handleSubmitFeedback,
          onClose: () => {
            setFeedbackOpen(false)
            setFeedbackText('')
            setFeedbackRating(5)
          },
        }}
        errorMessage={
          isRateLimited
            ? `Please wait ${cooldownSeconds}s before sending another message.`
            : error
        }
      />
    </div>
  )
}
