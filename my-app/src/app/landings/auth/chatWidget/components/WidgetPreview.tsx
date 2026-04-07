'use client'

import { useState } from 'react'
import { FiCheckCircle, FiMessageCircle, FiSend } from 'react-icons/fi'
import './WidgetPreview.css'

interface WidgetPreviewProps {
  bubbleStyle: {
    showStatus: boolean
    showCloseButton: boolean
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
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury'
  customBranding: {
    title?: string
    description?: string
    logo?: string
  }
}

interface Message {
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
}: WidgetPreviewProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages] = useState<Message[]>([
    { text: 'Hey! Welcome to our website. How can we help you today?', isBot: true },
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (inputValue.trim()) {
      setInputValue('')
    }
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

  return (
    <div className="widget-preview-shell glass">
      <div className="viewport-label">Widget preview</div>

      <div className={`widget-viewport position-${position}`}>
        <div className={`floating-chat-preview theme-${colorTheme}`}>
          <div className="widgetcontainer">
            <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
              <div className="chat-header">
                <div className="chat-header-left">
                  {headerStyle.showAvatar && (
                    <div className="avatar">
                      {customBranding.logo ? <img src={customBranding.logo} alt="logo" className="avatar-image" /> : <FiMessageCircle />}
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
                      <FiCheckCircle /> Online
                    </span>
                  )}

                  {headerStyle.showCloseButton && isChatOpen && (
                    <button type="button" className="close-btn" onClick={() => setIsChatOpen(false)}>
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className={bodyClasses}>
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.isBot ? 'message-bot' : 'message-user'} ${bubbleClasses}`}>
                    {msg.text}
                    {bodyStyle.showTimestamps && <span className="timestamp">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    {bodyStyle.showReadReceipts && !msg.isBot && <span className="read-receipt">✓✓</span>}
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
                />

                {footerStyle.showSendButton && (
                  <button type="button" onClick={handleSend}>
                    <FiSend />
                  </button>
                )}
              </div>
            </div>

            <div className={`widget-icon ${bubbleClasses}`} onClick={() => setIsChatOpen((prev) => !prev)} role="button" tabIndex={0}>
              <FiMessageCircle />
              {bubbleStyle.showStatus && <span className="status-dot" />}
              {bubbleStyle.showCloseButton && isChatOpen && (
                <span
                  className="close-btn close-btn-floating"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsChatOpen(false)
                  }}
                >
                  ×
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}