'use client'

import { useState, useEffect } from 'react'
import { FiMessageCircle, FiCheckCircle, FiSend } from 'react-icons/fi'
import '@/app/landings/auth/chatWidget/ChatWidget.css'
import './WidgetAdmin.css'
import { useAuth } from '@/context/AuthContext'
import { getBusinessInfo } from '@/lib/auth.service'

interface ChatWidgetConfig {
  plan: 'free' | 'pro' | 'business'
  billingCycle: 'monthly' | 'yearly'
  colorTheme: 'modern' | 'chilling' | 'corporate' | 'luxury'
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  customBranding: {
    title?: string
    description?: string
    logo?: string
  }
  settings: {
    autoOpen: boolean
    delayMs: number
  }
}

interface Message {
  text: string
  isBot: boolean
}

export default function WidgetAdminPage() {
  const { business, dbUser, loading } = useAuth()
  const [config, setConfig] = useState<ChatWidgetConfig | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages] = useState<Message[]>([
    { text: 'Hey! Welcome to our website. How can we help you today?', isBot: true },
  ])
  const [inputValue, setInputValue] = useState('')

  // Load widget config from database
  useEffect(() => {
    if (business?.chatWidgetConfig) {
      setConfig(business.chatWidgetConfig as ChatWidgetConfig)
    }
  }, [business])

  const handleSend = () => {
    if (inputValue.trim()) {
      // In preview, just clear input
      setInputValue('')
    }
  }

  if (loading) {
    return (
      <div className="widget-admin-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading widget configuration...</p>
        </div>
      </div>
    )
  }

  if (!dbUser || !business) {
    return (
      <div className="widget-admin-page">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>You must be logged in to view widget configuration.</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="widget-admin-page">
        <div className="error-container">
          <h2>No Widget Configuration</h2>
          <p>No widget configuration found. Please configure your widget first.</p>
        </div>
      </div>
    )
  }

  const bubbleClass = `bubble-${config.colorTheme}`
  const headerClass = `header-${config.colorTheme}`
  const bodyClass = `body-${config.colorTheme}`
  const footerClass = `footer-${config.colorTheme}`

  return (
    <div className="widget-admin-page">
      <div className="widget-admin-container">
        <div className="widget-admin-header">
          <h1>Widget Preview</h1>
          <p>Preview of your configured chat widget</p>
          <div className="widget-info">
            <div className="info-item">
              <span className="info-label">Widget Key:</span>
              <span className="info-value">{business.chatWidgetKey}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Plan:</span>
              <span className="info-value">{config.plan}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Billing Cycle:</span>
              <span className="info-value">{config.billingCycle}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Color Theme:</span>
              <span className="info-value">{config.colorTheme}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Position:</span>
              <span className="info-value">{config.position}</span>
            </div>
          </div>
        </div>

        <div className="widget-preview-container glass">
          <div className="preview-label">Live Preview</div>
          
          <div className="widget-viewport">
            <div className="floating-chat-preview">
              <div className="widgetcontainer">                  
                <div className={`chat-widget ${headerClass} ${bodyClass} ${footerClass} ${isChatOpen ? 'open' : ''}`}>
                  <div className="chat-header">
                    <div className="chat-header-left">
                      <div className="avatar">
                        <FiMessageCircle />
                      </div>
                      <div>
                        <h3>{config.customBranding?.title || 'Support Chat'}</h3>
                        <p>{config.customBranding?.description || 'Usually replies in a few minutes'}</p>
                      </div>
                    </div>
                    <span className="status-pill">
                      <FiCheckCircle /> Online
                    </span>
                  </div>

                  <div className="chat-body">
                    {messages.map((msg, index) => (
                      <div key={index} className={`message ${msg.isBot ? 'message-bot' : 'message-user'} ${bubbleClass}`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  <div className="chat-footer">
                    <input
                      type="text"
                      placeholder="Write a message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button type="button" onClick={handleSend}>
                      <FiSend />
                    </button>
                  </div>
                </div>
              </div>
              <button className="widget-icon" onClick={() => setIsChatOpen(!isChatOpen)}>
                <FiMessageCircle />
              </button>
            </div>
          </div>
        </div>

        <div className="widget-code-section glass">
          <h3>Embed Code</h3>
          <p>Copy this code to embed the widget on your website:</p>
          <div className="code-block">
            <code>
              {`<!-- Chat Widget -->\n<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget/${business.chatWidgetKey}.js"></script>\n<!-- End Chat Widget -->`}
            </code>
            <button 
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(`<!-- Chat Widget -->\n<script src="${process.env.NEXT_PUBLIC_APP_URL}/widget/${business.chatWidgetKey}.js"></script>\n<!-- End Chat Widget -->`)}
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
