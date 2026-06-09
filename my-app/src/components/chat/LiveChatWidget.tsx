'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import WidgetPreview from '@/app/landings/auth/chatWidget/components/WidgetPreview'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
import './LiveChatWidget.css'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'

type WidgetMessage = {
  id: string
  role: 'user' | 'assistant' | 'support' | 'system'
  text: string
  createdAt: string
}

type SupportChatState = 'none' | 'needs-human' | 'open' | 'ai-active' | 'closed'

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

function draftStorageKey(widgetKey: string) {
  return `vintra-widget-draft:${widgetKey}`
}

function messageId() {
  return crypto.randomUUID()
}

function stableMessageId(message: {
  id?: string
  role?: 'user' | 'assistant' | 'support' | 'system'
  text: string
  createdAt: string
}) {
  if (message.id) return message.id
  return `${message.role || 'user'}:${message.createdAt}:${message.text}`
}

function toWidgetMessage(message: {
  id?: string
  role?: 'user' | 'assistant' | 'support' | 'system'
  text: string
  createdAt: string
}): WidgetMessage {
  return {
    id: stableMessageId(message),
    role: message.role || 'user',
    text: message.text,
    createdAt: message.createdAt,
  }
}

function dedupeMessages(messages: WidgetMessage[]) {
  const seen = new Set<string>()
  return messages.filter((message) => {
    if (seen.has(message.id)) return false
    seen.add(message.id)
    return true
  })
}

export default function LiveChatWidget({ widgetKey }: { widgetKey: string }) {
  const forceOpen =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('open') === '1'
  const [configResponse, setConfigResponse] = useState<WidgetConfigResponse | null>(null)
  const [messages, setMessages] = useState<WidgetMessage[]>(emptyMessages)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(forceOpen)
  const [inputValue, setInputValue] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(draftStorageKey(widgetKey)) || ''
  })
  const [isSending, setIsSending] = useState(false)
  const [supportChatStatus, setSupportChatStatus] = useState<SupportChatState>('none')
  const [supportTypingAt, setSupportTypingAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [rateLimitUntil, setRateLimitUntil] = useState(0)
  const [captchaToken, setCaptchaToken] = useState('')
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const sendLockRef = useRef(false)

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
    window.localStorage.setItem(draftStorageKey(widgetKey), inputValue)
  }, [inputValue, widgetKey])

  useEffect(() => {
    const viewport = window.visualViewport

    const updateKeyboardOffset = () => {
      if (!viewport) {
        setKeyboardOffset(0)
        return
      }

      const overlap = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
      setKeyboardOffset(overlap)
    }

    updateKeyboardOffset()
    window.addEventListener('resize', updateKeyboardOffset)
    window.addEventListener('orientationchange', updateKeyboardOffset)
    viewport?.addEventListener('resize', updateKeyboardOffset)
    viewport?.addEventListener('scroll', updateKeyboardOffset)

    return () => {
      window.removeEventListener('resize', updateKeyboardOffset)
      window.removeEventListener('orientationchange', updateKeyboardOffset)
      viewport?.removeEventListener('resize', updateKeyboardOffset)
      viewport?.removeEventListener('scroll', updateKeyboardOffset)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return

    let active = true
    let pollTimer: number | null = null

    async function syncSupportChat() {
      try {
        const response = await fetch(
          `/api/widget/support?key=${encodeURIComponent(widgetKey)}&sessionId=${encodeURIComponent(sessionId || '')}`
        )
        const data = await response.json()

        if (!response.ok || !active) return

        const status = String(data.status || 'none') as SupportChatState
        setSupportChatStatus(status)
        setSupportTypingAt(data.supportTypingAt ? String(data.supportTypingAt) : null)

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages((prev) =>
            dedupeMessages([
              ...prev,
              ...data.messages.map((message: any) => toWidgetMessage(message)),
            ])
          )
        }
      } catch (err) {
        if (active) {
          console.error('Support sync error:', err)
        }
      }
    }

    void syncSupportChat()
    pollTimer = window.setInterval(syncSupportChat, 3500)

    return () => {
      active = false
      if (pollTimer) window.clearInterval(pollTimer)
    }
  }, [sessionId, widgetKey])

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
  const isHumanHandoffActive = supportChatStatus === 'needs-human' || supportChatStatus === 'open'
  const isSupportTyping =
    isHumanHandoffActive &&
    supportChatStatus === 'open' &&
    Boolean(supportTypingAt) &&
    Date.now() - new Date(supportTypingAt || 0).getTime() < 4500

  const handleToggle = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
  }

  const isRateLimited = rateLimitUntil > Date.now()
  const cooldownSeconds = isRateLimited ? Math.max(1, Math.ceil((rateLimitUntil - Date.now()) / 1000)) : 0

  const handleSend = async (messageOverride?: string) => {
    const text = String(messageOverride ?? inputValue).trim()
    if (!text || isSending || isRateLimited || sendLockRef.current) return

    sendLockRef.current = true

    const userMessage: WidgetMessage = {
      id: messageId(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    }

    try {
      setIsSending(true)
      setError(null)

      if (isHumanHandoffActive) {
        const response = await fetch('/api/widget/support', {
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
            countryCode: '',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 429 && data.captchaRequired && data.captchaQuestion && data.captchaToken) {
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
            window.setTimeout(() => {
              void handleSend(text)
            }, 0)
            return
          }

          if (response.status === 429 && data.retryAfterSeconds) {
            setRateLimitUntil(Date.now() + Number(data.retryAfterSeconds) * 1000)
            throw new Error(`You're sending messages too quickly. Try again in ${data.retryAfterSeconds}s.`)
          }
          throw new Error(data.error || 'Failed to send message')
        }

        const nextSessionId = String(data.sessionId || sessionId || messageId())
        setSessionId(nextSessionId)
        window.localStorage.setItem(sessionStorageKey(widgetKey), nextSessionId)
        setSupportChatStatus((String(data.status || 'needs-human') as SupportChatState) || 'needs-human')
        if (Array.isArray(data.messages)) {
          setMessages((prev) =>
            dedupeMessages([
              ...prev,
              ...data.messages.map((message: any) => toWidgetMessage(message)),
            ])
          )
        } else {
          setMessages((prev) =>
            dedupeMessages([
              ...prev,
              userMessage,
            ])
          )
        }
        setInputValue('')
        window.localStorage.removeItem(draftStorageKey(widgetKey))
      } else {
        setMessages((prev) =>
          dedupeMessages([
            ...prev,
            userMessage,
          ])
        )
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
            history: [...messages, userMessage],
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
            throw new Error(`You're sending messages too quickly. Try again in ${data.retryAfterSeconds}s.`)
          }
          throw new Error(data.error || 'Failed to send message')
        }

        const nextSessionId = String(data.sessionId || sessionId || messageId())
        setSessionId(nextSessionId)
        window.localStorage.setItem(sessionStorageKey(widgetKey), nextSessionId)

        if (data.supportRequested) {
          setSupportChatStatus('needs-human')
        }

        if (data.visitorNameRequired) {
          setInputValue(text)
        } else {
          setInputValue('')
          window.localStorage.removeItem(draftStorageKey(widgetKey))
        }

        if (data.supportRequested) {
          try {
            const supportResponse = await fetch(
              `/api/widget/support?key=${encodeURIComponent(widgetKey)}&sessionId=${encodeURIComponent(nextSessionId)}`
            )
            const supportData = await supportResponse.json()
            if (supportResponse.ok && Array.isArray(supportData.messages)) {
              setSupportChatStatus((String(supportData.status || data.status || 'needs-human') as SupportChatState) || 'needs-human')
              setSupportTypingAt(supportData.supportTypingAt ? String(supportData.supportTypingAt) : null)
              setMessages((prev) =>
                dedupeMessages([
                  ...prev,
                  ...supportData.messages.map((message: any) => toWidgetMessage(message)),
                ])
              )
            }
          } catch (err) {
            console.error('Support sync after handoff failed:', err)
          }
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: messageId(),
              role: 'assistant',
              text: String(data.reply || ''),
              createdAt: new Date().toISOString(),
            },
          ])
        }

        if (data.feedbackFormRequested) {
          setFeedbackOpen(true)
        }
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : ''
      if (!message.toLowerCase().includes('too quickly')) {
        setError(isHumanHandoffActive ? 'Support message could not be sent right now.' : 'The assistant could not reply right now.')
      }
      if (!isHumanHandoffActive) {
        setMessages((prev) => prev.filter((message) => message.id !== userMessage.id))
      }
      setInputValue(text)
    } finally {
      setIsSending(false)
      sendLockRef.current = false
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
        role: message.role,
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
        appearance={config.appearance}
        customBranding={{
          title,
          description,
          logo: config.customBranding?.logo,
          logoStyle: config.customBranding?.logoStyle,
        }}
        assistantIcons={configResponse?.assistantConfig?.widgetIcons}
        variant="embedded"
        keyboardOffset={keyboardOffset}
        messagesOverride={widgetMessages}
        inputValueOverride={inputValue}
        onInputValueChange={setInputValue}
        onSendMessage={handleSend}
        faqSuggestionsEnabled={Boolean(configResponse?.assistantConfig?.faqSuggestionsEnabled)}
        faqSuggestions={configResponse?.assistantConfig?.faqSuggestions || []}
        conversationCardsEnabled={Boolean(configResponse?.assistantConfig?.conversationCardsEnabled)}
        conversationCardsLimit={Number(configResponse?.assistantConfig?.conversationCardsLimit || 4)}
        conversationCards={configResponse?.assistantConfig?.conversationCards || []}
        openOverride={isOpen}
        onToggleOpen={handleToggle}
        statusText={configResponse?.assistantEnabled ? 'AI live' : 'AI off'}
        disableInput={isSending || feedbackOpen || isRateLimited}
        bubbleActivityState={isSending && !isHumanHandoffActive ? 'replying' : 'idle'}
        supportTypingIndicator={isSupportTyping}
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
