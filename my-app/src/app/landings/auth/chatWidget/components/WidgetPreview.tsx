'use client'

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { FiCheckCircle, FiCpu, FiLifeBuoy, FiMessageCircle, FiMessageSquare, FiPhone, FiSend } from 'react-icons/fi'
import GlassOrbAvatar from '../../../../../svgs/GlassOrbAvatar'
import './WidgetPreview.css'
import type { BubbleIconChoice, OrbStyleConfig } from '@/types/database'

const OrbAvatar = GlassOrbAvatar as ComponentType<
  SVGProps<SVGSVGElement> & { glyph?: string; orbMode?: 'spin' | 'hover' | 'reply' | 'inactive' }
>

interface WidgetPreviewProps {
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
  colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury'
  customBranding: {
    title?: string
    description?: string
    logo?: string
  }
  initialOpen?: boolean
  variant?: 'default' | 'embedded'
  enablePreviewChat?: boolean
  previewReply?: string
  messagesOverride?: Message[]
  inputValueOverride?: string
  onInputValueChange?: (value: string) => void
  onSendMessage?: () => void
  openOverride?: boolean
  onToggleOpen?: () => void
  errorMessage?: string | null
  statusText?: string
  disableInput?: boolean
  bubbleActivityState?: 'idle' | 'replying'
}

interface Message {
  id: string
  text: string
  isBot: boolean
}

export default function WidgetPreview({
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  position,
  colorTheme,
  customBranding,
  initialOpen = false,
  variant = 'default',
  enablePreviewChat = false,
  previewReply = 'hi, this is only a test',
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
}: WidgetPreviewProps) {
  const [internalIsChatOpen, setInternalIsChatOpen] = useState(initialOpen)
  const [internalIsReplying, setInternalIsReplying] = useState(false)
  const [internalIsOrbHovered, setInternalIsOrbHovered] = useState(false)
  const [orbInactiveActive, setOrbInactiveActive] = useState(false)
  const [orbCycleIndex, setOrbCycleIndex] = useState(0)
  const [orbPersistentGlyph, setOrbPersistentGlyph] = useState('')
  const [orbActivityNonce, setOrbActivityNonce] = useState(0)
  const orbInactivityTimerRef = useRef<number | null>(null)
  const orbInactiveHoldTimerRef = useRef<number | null>(null)
  const [internalMessages, setInternalMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      text: 'Hey! Welcome to our website. How can we help you today?',
      isBot: true,
    },
  ])
  const [internalInputValue, setInternalInputValue] = useState('')

  const isChatOpen = openOverride ?? internalIsChatOpen
  const messages = messagesOverride ?? internalMessages
  const inputValue = inputValueOverride ?? internalInputValue
  const isReplying = bubbleActivityState === 'replying' || internalIsReplying

  const setIsChatOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (onToggleOpen) {
      onToggleOpen()
      return
    }

    setInternalIsChatOpen(value)
  }

  const setInputValue = (value: string) => {
    if (onInputValueChange) {
      onInputValueChange(value)
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      return
    }

    setInternalInputValue(value)
    setOrbInactiveActive(false)
    setOrbActivityNonce((current) => current + 1)
  }

  useEffect(() => {
    if (isChatOpen) {
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
    }
  }, [isChatOpen])

  const handleSend = () => {
    if (!inputValue.trim()) return

    if (onSendMessage) {
      setOrbInactiveActive(false)
      setOrbActivityNonce((current) => current + 1)
      onSendMessage()
      return
    }

    const nextText = inputValue.trim()
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
      setInternalIsReplying(false)
    }, enablePreviewChat ? 850 : 180)
  }

  const bubbleClasses = [
    `border-${bubbleStyle.borderType}`,
    `shadow-${bubbleStyle.shadowType}`,
    `animation-${bubbleStyle.animationType}`,
    `size-${bubbleStyle.sizeType}`,
  ].join(' ')

  const bodyClasses = [
    'chat-body',
    `border-${bodyStyle.borderType}`,
    `shadow-${bodyStyle.shadowType}`,
    `messages-${bodyStyle.messageStyle}`,
  ].join(' ')

  const footerClasses = [
    'chat-footer',
    `border-${footerStyle.borderType}`,
    `shadow-${footerStyle.shadowType}`,
    `input-${footerStyle.inputStyle}`,
  ].join(' ')

  const title = customBranding.title || 'Support Chat'
  const description = customBranding.description || 'Usually replies in a few minutes'
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
      : internalIsOrbHovered && orbSettings.hoverEnabled
        ? 'hover'
        : isReplying && orbSettings.replyEnabled
          ? 'reply'
          : orbInactiveActive && orbSettings.inactiveEnabled
            ? 'inactive'
            : 'spin'

  const orbGlyphs = (() => {
    if (orbPhase === 'hover') {
      return orbSettings.hoverEnabled ? [orbSettings.hoverGlyph.slice(0, 1).toUpperCase()] : []
    }

    if (orbPhase === 'reply') {
      return orbSettings.replyEnabled
        ? orbSettings.replyGlyphs
            .split('')
            .map((char) => char.toUpperCase())
            .slice(0, 3)
        : []
    }

    if (orbPhase === 'inactive') {
      return orbSettings.inactiveEnabled
        ? orbSettings.inactiveGlyphs
            .split('')
            .map((char) => char.toUpperCase())
            .slice(0, 5)
        : []
    }

    return []
  })()

  const orbGlyph = orbGlyphs.length ? orbGlyphs[orbCycleIndex % orbGlyphs.length] : ''

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && bubbleStyle.iconChoice === 'orb') {
      console.debug('[WidgetPreview] orb phase', {
        orbPhase,
        hovered: internalIsOrbHovered,
        replying: isReplying,
        inactive: orbInactiveActive,
        glyph: orbGlyph,
      })
    }
  }, [bubbleStyle.iconChoice, orbPhase, internalIsOrbHovered, isReplying, orbInactiveActive, orbGlyph])

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb') {
      setOrbPersistentGlyph('')
      return
    }

    if (orbPhase !== 'spin' && orbGlyph) {
      setOrbPersistentGlyph(orbGlyph)
    }
  }, [bubbleStyle.iconChoice, orbPhase, orbGlyph])

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb' || !orbSettings.inactiveEnabled) {
      setOrbInactiveActive(false)
      return
    }

    if (internalIsOrbHovered || isReplying) {
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
    internalIsOrbHovered,
    isReplying,
    orbInactiveActive,
    orbActivityNonce,
  ])

  useEffect(() => {
    if (bubbleStyle.iconChoice !== 'orb') {
      setOrbCycleIndex(0)
      return
    }

    if (orbPhase === 'hover') {
      setOrbCycleIndex(0)
      return
    }

    if (orbGlyphs.length <= 1) {
      setOrbCycleIndex(0)
      return
    }

    const timer = window.setInterval(() => {
      setOrbCycleIndex((current) => (current + 1) % orbGlyphs.length)
    }, 650)

    return () => window.clearInterval(timer)
  }, [bubbleStyle.iconChoice, orbPhase, orbGlyphs.length])

  const previewContent = (
    <div
      className={`widget-viewport ${variant === 'embedded' ? 'widget-viewport-embedded' : ''} position-${position}`}
    >
      <div className={`floating-chat-preview theme-${colorTheme}`}>
        <div className="widgetcontainer">
          <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
            <div className="chat-header">
              <div className="chat-header-left">
                {headerStyle.showAvatar && (
                  <div className="avatar">
                    {customBranding.logo ? (
                      <img src={customBranding.logo} alt="logo" className="avatar-image" />
                    ) : (
                      <FiMessageCircle />
                    )}
                  </div>
                )}

                <div>
                  {headerStyle.showTitle && <h3>{title}</h3>}
                  <p>{description}</p>
                </div>
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

              <div className={bodyClasses}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${msg.isBot ? 'message-bot' : 'message-user'}`}
                >
                  {msg.text}
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
              ))}
            </div>

            <div className={footerClasses}>
              <input
                type="text"
                placeholder={footerStyle.showPlaceholder ? 'Write a message...' : ''}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={disableInput}
              />

              {footerStyle.showSendButton && (
                <button type="button" onClick={handleSend} disabled={disableInput}>
                  <FiSend />
                </button>
              )}
            </div>

            {errorMessage && <div className="widget-inline-error">{errorMessage}</div>}
          </div>

          <div
            className={`widget-icon ${bubbleClasses} ${bubbleStyle.iconChoice === 'orb' ? 'widget-icon--orb' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'hover' ? 'widget-icon--orb-hover' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'reply' ? 'widget-icon--orb-replying' : ''} ${bubbleStyle.iconChoice === 'orb' && orbPhase === 'inactive' ? 'widget-icon--orb-idle' : ''}`}
            onClick={() => setIsChatOpen((prev) => !prev)}
            onPointerEnter={() => {
              if (process.env.NODE_ENV !== 'production') {
                console.debug('[WidgetPreview] orb hover enter', {
                  orbPhase,
                  glyph: orbGlyph,
                })
              }
              setInternalIsOrbHovered(true)
            }}
            onPointerLeave={() => {
              if (process.env.NODE_ENV !== 'production') {
                console.debug('[WidgetPreview] orb hover leave', {
                  orbPhase,
                  glyph: orbGlyph,
                })
              }
              setInternalIsOrbHovered(false)
            }}
            role="button"
            tabIndex={0}
          >
            {bubbleStyle.iconChoice === 'chat' && <FiMessageCircle />}
            {bubbleStyle.iconChoice === 'phone' && <FiPhone />}
            {bubbleStyle.iconChoice === 'cpu' && <FiCpu />}
            {bubbleStyle.iconChoice === 'message' && <FiMessageSquare />}
            {bubbleStyle.iconChoice === 'support' && <FiLifeBuoy />}
            {bubbleStyle.iconChoice === 'orb' && (
              <OrbAvatar
                className="widget-orb-avatar"
                aria-hidden="true"
                glyph={orbPhase === 'spin' ? orbPersistentGlyph : orbGlyph}
                orbMode={orbPhase === 'spin' || orbPhase === 'none' ? 'spin' : orbPhase}
              />
            )}
            {bubbleStyle.showStatus && <span className="status-dot" />}
          </div>
        </div>
      </div>
    </div>
  )

  if (variant === 'embedded') {
    return previewContent
  }

  return (
    <div className="widget-preview-shell glass">
      <div className="viewport-label">Widget preview</div>
      {previewContent}
    </div>
  )
}
