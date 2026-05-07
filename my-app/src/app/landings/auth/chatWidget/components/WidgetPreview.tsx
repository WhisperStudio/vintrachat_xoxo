'use client'

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type SVGProps } from 'react'
import { FiCheckCircle, FiCpu, FiLifeBuoy, FiMessageCircle, FiMessageSquare, FiPhone, FiSend } from 'react-icons/fi'
import GlassOrbAvatar from '../../../../../svgs/GlassOrbAvatar'
import { getWidgetThemeClass, getWidgetThemeStyle, joinWidgetClasses } from '@/components/chat/widgetDesign'
import FeedbackFormOverlay from '@/components/chat/FeedbackFormOverlay'
import './WidgetPreview.css'
import type { BubbleIconChoice, OrbStyleConfig } from '@/types/database'

const OrbAvatar = GlassOrbAvatar as ComponentType<
  SVGProps<SVGSVGElement> & { glyph?: string; orbMode?: 'spin' | 'hover' | 'reply' | 'inactive' }
>

interface WidgetPreviewProps {
  total?: number
  billingCycle?: 'monthly' | 'yearly'
  plan?: 'free' | 'pro' | 'business'
  bubbleStyle: {
    showStatus: boolean
    iconChoice: BubbleIconChoice
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    animationType: 'none' | 'bounce' | 'fade' | 'slide'
    sizeType: 'small' | 'medium' | 'large'
    orbStyle?: OrbStyleConfig
  }
  headerStyle: {
    showStatus: boolean
    showCloseButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    showAvatar: boolean
    showTitle: boolean
  }
  bodyStyle: {
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    messageStyle: 'bubble' | 'flat' | 'card'
    showTimestamps: boolean
    showReadReceipts: boolean
  }
  footerStyle: {
    showSendButton: boolean
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    inputStyle: 'flat' | 'rounded' | 'outlined'
    showPlaceholder: boolean
  }
  position: 'bottom-right' | 'bottom-left'
  colorTheme:
    | 'modern'
    | 'chilling'
    | 'corporate'
    | 'luxury'
    | 'pink-blast'
    | 'red-velvet'
    | 'deep-blue'
    | 'banana-bonanza'
  customBranding: {
    title?: string
    description?: string
    logo?: string
    logoStyle?: {
      zoom: number
      focusX: number
      focusY: number
    }
  }
  initialOpen?: boolean
  variant?: 'default' | 'embedded'
  previewMode?: 'desktop' | 'mobile'
  enablePreviewChat?: boolean
  previewReply?: string
  keyboardOffset?: number
  faqSuggestionsEnabled?: boolean
  faqSuggestions?: string[]
  messagesOverride?: Message[]
  inputValueOverride?: string
  onInputValueChange?: (value: string) => void
  onSendMessage?: (message?: string) => void
  openOverride?: boolean
  onToggleOpen?: (open: boolean) => void
  errorMessage?: string | null
  statusText?: string
  disableInput?: boolean
  bubbleActivityState?: 'idle' | 'replying'
  feedbackOverlay?: {
    open: boolean
    title?: string
    description?: string
    rating: number
    text: string
    submitting?: boolean
    onRatingChange: (rating: number) => void
    onTextChange: (text: string) => void
    onSubmit: () => void
    onClose: () => void
  }
}

interface Message {
  id: string
  text: string
  isBot: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function countChars(text: string) {
  return Array.from(String(text || '')).length
}

function truncateToChars(text: string, maxChars: number) {
  return Array.from(String(text || '')).slice(0, maxChars).join('')
}

function normalizeLogoStyle(raw?: { zoom: number; focusX: number; focusY: number }) {
  return {
    zoom: clamp(Number(raw?.zoom || 100), 80, 180),
    focusX: clamp(Number(raw?.focusX || 50), 0, 100),
    focusY: clamp(Number(raw?.focusY || 50), 0, 100),
  }
}

export default function WidgetPreview({
  total,
  billingCycle,
  plan,
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  position,
  colorTheme,
  customBranding,
  initialOpen = false,
  variant = 'default',
  previewMode = 'desktop',
  enablePreviewChat = false,
  previewReply = 'hi, this is only a test',
  keyboardOffset = 0,
  faqSuggestionsEnabled = false,
  faqSuggestions = [],
  messagesOverride,
  inputValueOverride,
  onInputValueChange,
  onSendMessage,
  openOverride,
  onToggleOpen,
  errorMessage = null,
  statusText = 'Online',
  disableInput = false,
  bubbleActivityState = 'idle',
  feedbackOverlay,
}: WidgetPreviewProps) {
  const [internalIsChatOpen, setInternalIsChatOpen] = useState(initialOpen)
  const [internalIsReplying, setInternalIsReplying] = useState(false)
  const [internalIsOrbHovered, setInternalIsOrbHovered] = useState(false)
  const [orbInactiveActive, setOrbInactiveActive] = useState(false)
  const [orbActivityNonce, setOrbActivityNonce] = useState(0)
  const orbInactivityTimerRef = useRef<number | null>(null)
  const orbInactiveHoldTimerRef = useRef<number | null>(null)
  const chatBodyRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [internalMessages, setInternalMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      text: 'Hey! Welcome to our website. How can we help you today?',
      isBot: true,
    },
  ])
  const [internalInputValue, setInternalInputValue] = useState('')
  const [internalFeedbackOpen, setInternalFeedbackOpen] = useState(false)
  const [internalFeedbackRating, setInternalFeedbackRating] = useState(5)
  const [internalFeedbackText, setInternalFeedbackText] = useState('')
  const [internalFeedbackSubmitting, setInternalFeedbackSubmitting] = useState(false)
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | null>(null)
  const [faqSuggestionNonce, setFaqSuggestionNonce] = useState(0)
  const [isComposerFocused, setIsComposerFocused] = useState(false)

  const isChatOpen = openOverride ?? internalIsChatOpen
  const messages = messagesOverride ?? internalMessages
  const inputValue = inputValueOverride ?? internalInputValue
  const isReplying = bubbleActivityState === 'replying' || internalIsReplying
  const feedbackKeywords = ['feedback', 'review', 'rating', 'star', 'stars', 'vurdering', 'anmeldelse', 'tilbakemelding']
  const internalRequestedFeedback = (text: string) =>
    feedbackKeywords.some((keyword) => text.toLowerCase().includes(keyword))
  const activeFaqSuggestions = useMemo(() => {
    if (!faqSuggestionsEnabled) return []

    const cleaned = faqSuggestions
      .map((item) => item.trim())
      .filter(Boolean)

    if (!cleaned.length) return []

    const unique = Array.from(new Set(cleaned))
    const seeded = unique.map((item) => ({ item, sort: Math.random() }))
    seeded.sort((a, b) => a.sort - b.sort)
    return seeded.slice(0, 3).map((entry) => entry.item)
  }, [faqSuggestions, faqSuggestionsEnabled, faqSuggestionNonce])
  const activeFeedbackOverlay = feedbackOverlay || {
    open: internalFeedbackOpen,
    rating: internalFeedbackRating,
    text: internalFeedbackText,
    submitting: internalFeedbackSubmitting,
    onRatingChange: setInternalFeedbackRating,
    onTextChange: setInternalFeedbackText,
    onSubmit: () => {
      setInternalFeedbackSubmitting(true)
      window.setTimeout(() => {
        setInternalFeedbackSubmitting(false)
        setInternalFeedbackOpen(false)
        setInternalFeedbackText('')
        setInternalFeedbackRating(5)
      }, 450)
    },
    onClose: () => {
      setInternalFeedbackOpen(false)
      setInternalFeedbackText('')
      setInternalFeedbackRating(5)
    },
  }
  const showFaqSuggestions = isChatOpen && faqSuggestionsEnabled && activeFaqSuggestions.length > 0
  const showComposerSuggestions =
    showFaqSuggestions && countChars(String(inputValue ?? '').trim()) === 0
  const visibleErrorMessage = errorMessage || internalErrorMessage

  const setIsChatOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const nextValue = typeof value === 'function' ? value(isChatOpen) : value

    if (onToggleOpen) {
      onToggleOpen(nextValue)
      return
    }

    setInternalIsChatOpen(nextValue)
  }

  const setInputValue = (value: string) => {
    const nextValue = truncateToChars(value, 300)
    setInternalErrorMessage(null)
    if (onInputValueChange) {
      onInputValueChange(nextValue)
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      return
    }

    setInternalInputValue(nextValue)
    setOrbInactiveActive(false)
    setOrbActivityNonce((current) => current + 1)
  }

  useEffect(() => {
    if (isChatOpen) {
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      setFaqSuggestionNonce((current) => current + 1)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (!isChatOpen) return
    const node = chatBodyRef.current
    if (!node) return
    window.requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
  }, [messages, isChatOpen, showComposerSuggestions, keyboardOffset])

  useEffect(() => {
    const node = inputRef.current
    if (!node) return
    const baseHeight = 52

    if (!isComposerFocused) {
      node.style.height = `${baseHeight}px`
      return
    }

    node.style.height = 'auto'
    node.style.height = `${Math.max(baseHeight, node.scrollHeight)}px`
  }, [inputValue, isComposerFocused])

  const handleSend = (messageOverride?: string) => {
    const nextText = String(messageOverride ?? inputValue ?? '').trim()
    if (!nextText) return

    if (countChars(nextText) > 300) {
      setInternalErrorMessage('Message is too long. Max 300 characters.')
      return
    }

    if (!onSendMessage && internalRequestedFeedback(nextText)) {
      setInternalMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: nextText,
          isBot: false,
        },
        {
          id: crypto.randomUUID(),
          text: 'Absolutely. I opened a quick feedback form for you.',
          isBot: true,
        },
      ])
      setInputValue('')
      setInternalErrorMessage(null)
      setInternalFeedbackOpen(true)
      return
    }

    if (onSendMessage) {
      setInternalErrorMessage(null)
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      onSendMessage(nextText)
      return
    }

    setInternalIsReplying(true)
    setOrbInactiveActive(false)
    setOrbActivityNonce((current) => current + 1)

    window.setTimeout(() => {
      if (enablePreviewChat) {
        setInternalMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: nextText,
            isBot: false,
          },
          {
            id: crypto.randomUUID(),
            text: previewReply,
            isBot: true,
          },
        ])
      }

      setInputValue('')
      setInternalErrorMessage(null)
      setInternalIsReplying(false)
    }, enablePreviewChat ? 850 : 180)
  }

  const themeClass = getWidgetThemeClass(colorTheme)
  const themeVars = getWidgetThemeStyle(colorTheme)
  const bubbleClasses = joinWidgetClasses(
    `border-${bubbleStyle.borderType}`,
    `shadow-${bubbleStyle.shadowType}`,
    `animation-${bubbleStyle.animationType}`,
    `size-${bubbleStyle.sizeType}`
  )

  const bodyClasses = joinWidgetClasses(
    'chat-body',
    `border-${bodyStyle.borderType}`,
    `shadow-${bodyStyle.shadowType}`,
    `messages-${bodyStyle.messageStyle}`
  )

  const footerClasses = joinWidgetClasses(
    'chat-footer',
    `border-${footerStyle.borderType}`,
    `shadow-${footerStyle.shadowType}`,
    `input-${footerStyle.inputStyle}`
  )
  const title = customBranding.title || 'Support Chat'
  const description = customBranding.description || 'Usually replies in a few minutes'
  const logoStyle = normalizeLogoStyle(customBranding.logoStyle)
  const orbSettings = bubbleStyle.orbStyle || {
    hoverEnabled: true,
    hoverGlyph: 'A',
    replyEnabled: false,
    replyGlyphs: '',
    inactiveEnabled: false,
    inactiveGlyphs: '',
    inactivityMinMinutes: 2,
    inactivityMaxMinutes: 4,
  }
  const inactivityMinMinutes = Math.max(
    1,
    Math.min(orbSettings.inactivityMinMinutes || 2, orbSettings.inactivityMaxMinutes || 4)
  )
  const inactivityMaxMinutes = Math.max(
    inactivityMinMinutes,
    Math.max(orbSettings.inactivityMaxMinutes || 4, inactivityMinMinutes)
  )
  const orbPhase =
    bubbleStyle.iconChoice !== 'orb'
      ? 'none'
      : isReplying && orbSettings.replyEnabled
          ? 'reply'
          : orbInactiveActive && orbSettings.inactiveEnabled
            ? 'inactive'
            : internalIsOrbHovered && orbSettings.hoverEnabled
              ? 'hover'
            : 'spin'

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb' || !orbSettings.hoverEnabled) {
      setInternalIsOrbHovered(false)
    }
  }, [bubbleStyle.iconChoice, orbSettings.hoverEnabled])

  useEffect(() => {
    if (!isChatOpen) {
      setIsComposerFocused(false)
    }
  }, [isChatOpen])

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb' || !orbSettings.inactiveEnabled) {
      setOrbInactiveActive(false)
      return
    }

    if (isReplying) {
      setOrbInactiveActive(false)
      return
    }

    if (orbInactiveActive) {
      if (orbInactiveHoldTimerRef.current) {
        window.clearTimeout(orbInactiveHoldTimerRef.current)
      }

      orbInactiveHoldTimerRef.current = window.setTimeout(() => {
        setOrbInactiveActive(false)
        setOrbActivityNonce((current) => current + 1)
      }, 20_000)

      return () => {
        if (orbInactiveHoldTimerRef.current) {
          window.clearTimeout(orbInactiveHoldTimerRef.current)
          orbInactiveHoldTimerRef.current = null
        }
      }
    }

    if (orbInactivityTimerRef.current) {
      window.clearTimeout(orbInactivityTimerRef.current)
    }

    const minMs = inactivityMinMinutes * 60_000
    const maxMs = inactivityMaxMinutes * 60_000
    const delayMs = minMs >= maxMs ? minMs : minMs + Math.random() * (maxMs - minMs)

    orbInactivityTimerRef.current = window.setTimeout(() => {
      setOrbInactiveActive(true)
    }, delayMs)

    return () => {
      if (orbInactivityTimerRef.current) {
        window.clearTimeout(orbInactivityTimerRef.current)
        orbInactivityTimerRef.current = null
      }
    }
  }, [
    bubbleStyle.iconChoice,
    orbSettings.inactiveEnabled,
    orbSettings.inactivityMinMinutes,
    orbSettings.inactivityMaxMinutes,
    inactivityMinMinutes,
    inactivityMaxMinutes,
    isReplying,
    orbInactiveActive,
    orbActivityNonce,
  ])

  const previewContent = (
    <div
      className={`widget-viewport ${variant === 'embedded' ? 'widget-viewport-embedded' : ''} position-${position} preview-${previewMode}`}
      style={
        {
          '--widget-keyboard-offset': `${Math.max(0, keyboardOffset)}px`,
        } as CSSProperties
      }
    >
      <div className={`floating-chat-preview ${themeClass}`} style={themeVars as CSSProperties}>
        <div className="widgetcontainer">
          <div className={`chat-widget ${isChatOpen ? 'open' : ''}`} hidden={!isChatOpen} aria-hidden={!isChatOpen}>
            <div
              className="chat-widget-interaction-surface"
              onPointerDownCapture={(event) => {
                const target = event.target as HTMLElement | null
                if (!target) return
                if (target.closest('.chat-footer')) {
                  setIsComposerFocused(true)
                  return
                }
                if (target.closest('.widget-faq-suggestions')) {
                  return
                }
                setIsComposerFocused(false)
              }}
            >
            <div className="chat-header">
              <div className="chat-header-left">
                {headerStyle.showAvatar && (
                  <div className={`avatar ${customBranding.logo ? 'avatar--image' : ''}`}>
                    {customBranding.logo ? (
                      <div
                        className="avatar-image"
                        aria-hidden="true"
                        style={{
                          backgroundImage: `url(${customBranding.logo})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: `${logoStyle.zoom}% ${logoStyle.zoom}%`,
                          backgroundPosition: `${logoStyle.focusX}% ${logoStyle.focusY}%`,
                        }}
                      />
                    ) : (
                      <FiMessageCircle />
                    )}
                  </div>
                )}

                <div>
                  {headerStyle.showTitle && <h3>{title}</h3>}
                  <p>{description}</p>
                </div>

                {headerStyle.showStatus && <span className="header-status-dot" aria-hidden="true" />}
              </div>

              <div className="chat-header-actions">
                {headerStyle.showStatus && (
                  <span className="status-pill">
                    <FiCheckCircle /> {statusText}
                  </span>
                )}

                {headerStyle.showCloseButton && isChatOpen && (
                  <button type="button" className="close-btn" onClick={() => setIsChatOpen(false)}>
                    x
                  </button>
                )}
              </div>
            </div>

              <div className={bodyClasses} ref={chatBodyRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.isBot ? 'message-bot' : 'message-user'}`}
                >
                  <div className="message-content">{msg.text}</div>
                  {(bodyStyle.showTimestamps || (bodyStyle.showReadReceipts && !msg.isBot)) && (
                    <div className="message-meta">
                      {bodyStyle.showTimestamps && (
                        <span className="timestamp">
                          {new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {bodyStyle.showReadReceipts && !msg.isBot && (
                        <span className="read-receipt">Read</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {showComposerSuggestions && (
              <div className="widget-faq-suggestions" aria-label="Suggested questions">
                {activeFaqSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="widget-faq-chip"
                    onClick={() => handleSend(suggestion)}
                    disabled={disableInput}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div className={footerClasses}>
              <div className="chat-footer-row">
                <textarea
                  id="widget-message-input"
                  name="widget-message-input"
                  ref={inputRef}
                  placeholder={footerStyle.showPlaceholder ? 'Write a message...' : ''}
                  value={inputValue}
                  onFocus={() => setIsComposerFocused(true)}
                  onBlur={() => setIsComposerFocused(false)}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  disabled={disableInput}
                  rows={1}
                />

                {footerStyle.showSendButton && (
                  <button type="button" onClick={() => handleSend()} disabled={disableInput}>
                    <FiSend />
                  </button>
                )}
              </div>
            </div>

            {visibleErrorMessage && <div className="widget-inline-error">{visibleErrorMessage}</div>}
            <FeedbackFormOverlay
              open={Boolean(activeFeedbackOverlay.open)}
              title={feedbackOverlay?.title}
              description={feedbackOverlay?.description}
              rating={activeFeedbackOverlay.rating || 0}
              text={activeFeedbackOverlay.text || ''}
              submitting={activeFeedbackOverlay.submitting}
              onRatingChange={activeFeedbackOverlay.onRatingChange}
              onTextChange={activeFeedbackOverlay.onTextChange}
              onSubmit={activeFeedbackOverlay.onSubmit}
              onClose={activeFeedbackOverlay.onClose}
            />
            </div>
          </div>

          <div
            className={`widget-icon ${bubbleClasses} ${bubbleStyle.iconChoice === 'orb' ? 'widget-icon--orb' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'reply' ? 'widget-icon--orb-replying' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'inactive' ? 'widget-icon--orb-idle' : ''}`}
            onPointerEnter={() => {
              if (bubbleStyle.iconChoice === 'orb' && orbSettings.hoverEnabled) {
                setInternalIsOrbHovered(true)
              }
            }}
            onPointerLeave={() => {
              if (bubbleStyle.iconChoice === 'orb' && orbSettings.hoverEnabled) {
                setInternalIsOrbHovered(false)
              }
            }}
            onClick={() => setIsChatOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <span className="widget-icon-inner" aria-hidden="true">
              {bubbleStyle.iconChoice === 'chat' && <FiMessageCircle />}
              {bubbleStyle.iconChoice === 'phone' && <FiPhone />}
              {bubbleStyle.iconChoice === 'cpu' && <FiCpu />}
              {bubbleStyle.iconChoice === 'message' && <FiMessageSquare />}
              {bubbleStyle.iconChoice === 'support' && <FiLifeBuoy />}
              {bubbleStyle.iconChoice === 'orb' && (
                <OrbAvatar
                  className="widget-orb-avatar"
                  aria-hidden="true"
                  glyph={orbSettings.hoverEnabled ? orbSettings.hoverGlyph || '' : ''}
                  orbMode={orbPhase === 'spin' || orbPhase === 'none' ? 'spin' : orbPhase}
                />
              )}
              {bubbleStyle.showStatus && <span className="status-dot" />}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  if (variant === 'embedded') {
    return previewContent
  }

  return (
    <div className={`widget-preview-shell glass preview-shell-${previewMode}`}>
      {previewMode === 'mobile' ? (
        <div className="widget-preview-device-frame">
          <div className="widget-preview-device-shell">{previewContent}</div>
        </div>
      ) : (
        previewContent
      )}
      {typeof total === 'number' ? (
        <div className="widget-preview-total">
          <p className="widget-preview-total-label">Subscription total</p>
          <h3 className="widget-preview-total-price">
            ${total}
            <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
          </h3>
          <div className="widget-preview-total-meta">
            <span>{plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Plan'}</span>
            <span>{billingCycle || 'monthly'}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
