'use client'

import { useState } from 'react'
import { FiMessageCircle, FiCheckCircle, FiSend } from 'react-icons/fi'
import '@/app/landings/auth/chatWidget/ChatWidget.css'

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
  colorTheme
}: WidgetPreviewProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages] = useState<Message[]>([
    { text: 'Hey! Welcome to our website. How can we help you today?', isBot: true },
  ])
  const [inputValue, setInputValue] = useState('')

  const handleSend = () => {
    if (inputValue.trim()) {
      // In preview, just clear input
      setInputValue('')
    }
  }

  // Generate dynamic classes based on design options
  const getBubbleClasses = () => {
    const classes = ['chat-bubble']
    classes.push(`border-${bubbleStyle.borderType}`)
    classes.push(`shadow-${bubbleStyle.shadowType}`)
    classes.push(`animation-${bubbleStyle.animationType}`)
    classes.push(`size-${bubbleStyle.sizeType}`)
    return classes.join(' ')
  }

  const getHeaderClasses = () => {
    const classes = ['chat-header']
    classes.push(`border-${headerStyle.borderType}`)
    classes.push(`shadow-${headerStyle.shadowType}`)
    return classes.join(' ')
  }

  const getBodyClasses = () => {
    const classes = ['chat-body']
    classes.push(`border-${bodyStyle.borderType}`)
    classes.push(`shadow-${bodyStyle.shadowType}`)
    classes.push(`messages-${bodyStyle.messageStyle}`)
    return classes.join(' ')
  }

  const getFooterClasses = () => {
    const classes = ['chat-footer']
    classes.push(`border-${footerStyle.borderType}`)
    classes.push(`shadow-${footerStyle.shadowType}`)
    classes.push(`input-${footerStyle.inputStyle}`)
    return classes.join(' ')
  }

  return (
    <div className="widget-preview-shell glass">
      <div className="viewport-label">Widget preview</div>

      <div className={`widget-viewport position-${position}`}>
        <div className={`floating-chat-preview theme-${colorTheme}`}>
          <div className="widgetcontainer">                  
          <div className={`chat-widget ${isChatOpen ? 'open' : ''}`}>
            <div className={getHeaderClasses()}>
              <div className="chat-header-left">
                {headerStyle.showAvatar && (
                  <div className="avatar">
                    <FiMessageCircle />
                  </div>
                )}
                <div>
                  {headerStyle.showTitle && <h3>Support Chat</h3>}
                  <p>Usually replies in a few minutes</p>
                </div>
              </div>
              {headerStyle.showStatus && (
                <span className="status-pill">
                  <FiCheckCircle /> Online
                </span>
              )}
              {headerStyle.showCloseButton && (
                <button className="close-btn" onClick={() => setIsChatOpen(false)}>
                  ×
                </button>
              )}
            </div>

            <div className={getBodyClasses()}>
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.isBot ? 'message-bot' : 'message-user'} ${getBubbleClasses()}`}>
                  {msg.text}
                  {bodyStyle.showTimestamps && <span className="timestamp">{new Date().toLocaleTimeString()}</span>}
                  {bodyStyle.showReadReceipts && msg.isBot && <span className="read-receipt">✓✓</span>}
                </div>
              ))}
            </div>

            <div className={getFooterClasses()}>
              {footerStyle.showPlaceholder && (
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
              )}
              {footerStyle.showSendButton && (
                <button type="button" onClick={handleSend}>
                  <FiSend />
                </button>
              )}
            </div>
          </div>
          <button 
            className={`widget-icon ${getBubbleClasses()}`} 
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <FiMessageCircle />
            {bubbleStyle.showStatus && (
              <span className="status-dot"></span>
            )}
            {bubbleStyle.showCloseButton && isChatOpen && (
              <button className="close-btn" onClick={() => setIsChatOpen(false)}>
                ×
              </button>
            )}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
