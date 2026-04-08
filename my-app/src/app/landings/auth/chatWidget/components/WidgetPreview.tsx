'use client'

import { useState } from 'react'
import { FiCheckCircle, FiCpu, FiMessageCircle, FiPhone, FiSend } from 'react-icons/fi'
import './WidgetPreview.css'

interface WidgetPreviewProps {
  bubbleStyle: {
    showStatus: boolean
    iconChoice: 'chat' | 'phone' | 'cpu' | 'message' | 'support'
    borderType: 'none' | 'solid' | 'rounded' | 'shadow'
    shadowType: 'none' | 'light' | 'medium' | 'heavy'
    animationType: 'none' | 'bounce' | 'fade' | 'slide'
    sizeType: 'small' | 'medium' | 'large'
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
}: WidgetPreviewProps) {
  const [internalIsChatOpen, setInternalIsChatOpen] = useState(initialOpen)
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
      return
    }

    setInternalInputValue(value)
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    if (onSendMessage) {
      onSendMessage()
      return
    }

    const nextText = inputValue.trim()

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
            className={`widget-icon ${bubbleClasses}`}
            onClick={() => setIsChatOpen((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            {bubbleStyle.iconChoice === 'chat' && <FiMessageCircle />}
            {bubbleStyle.iconChoice === 'phone' && <FiPhone />}
            {bubbleStyle.iconChoice === 'cpu' && <FiCpu />}
            {bubbleStyle.iconChoice === 'message' && <FiMessageCircle />}
            {bubbleStyle.iconChoice === 'support' && <FiMessageCircle />}
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
