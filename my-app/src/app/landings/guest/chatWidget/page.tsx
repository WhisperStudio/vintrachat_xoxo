'use client'

import { useMemo, useState } from 'react'
import {
  FiDollarSign,
  FiSliders,
  FiRefreshCw,
  FiMessageCircle,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiCheck,
  FiX,
  FiLogIn,
} from 'react-icons/fi'
import { FaInfinity } from 'react-icons/fa'
import './ChatWidget.css'
import Header from '@/components/header'

type Plan = 'free' | 'pro' | 'business'
type BillingCycle = 'monthly' | 'yearly'
type BubbleStyle = 'rounded' | 'soft' | 'sharp'
type HeaderStyle = 'minimal' | 'gradient' | 'dark'
type BodyStyle = 'clean' | 'cards' | 'airy'
type FooterStyle = 'simple' | 'glass' | 'bordered'

type InputsState = {
  plan: Plan
  billingCycle: BillingCycle
  bubbleStyle: BubbleStyle
  headerStyle: HeaderStyle
  bodyStyle: BodyStyle
  footerStyle: FooterStyle
}

const planPrices: Record<Plan, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 29, yearly: 29 * 12 },
  business: { monthly: 59, yearly: 59 * 12 },
}

const planFeatures: Record<Plan, Array<{ label: string; status: 'included' | 'excluded' | 'highlight' }>> = {
  free: [
    { label: '100 conversations/month', status: 'included' },
    { label: '1 team member', status: 'included' },
    { label: 'Basic AI responses', status: 'included' },
    { label: 'Remove branding', status: 'excluded' },
    { label: 'Email support', status: 'excluded' },
    { label: 'Extended design options', status: 'excluded' },
  ],
  pro: [
    { label: 'Unlimited conversations', status: 'highlight' },
    { label: '5 team members', status: 'included' },
    { label: 'Advanced AI responses', status: 'included' },
    { label: 'Remove branding', status: 'included' },
    { label: 'Email support', status: 'included' },
    { label: 'Extended design options', status: 'included' },
  ],
  business: [
    { label: 'Everything in Pro', status: 'included' },
    { label: 'Unlimited team members', status: 'highlight' },
    { label: 'API access', status: 'included' },
    { label: 'SLA guarantee', status: 'included' },
  ],
}

export default function ChatWidgetBuilder() {
  const [inputs, setInputs] = useState<InputsState>({
    plan: 'pro',
    billingCycle: 'monthly',
    bubbleStyle: 'soft',
    headerStyle: 'gradient',
    bodyStyle: 'cards',
    footerStyle: 'glass',
  })

  const [openSections, setOpenSections] = useState({
    plan: false,
    bubble: false,
    header: false,
    body: false,
    footer: false,
  })

  const [showBreakdown, setShowBreakdown] = useState(false)

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { text: 'Hey! Welcome to our website. How can we help you today?', isBot: true },
  ])
  const [inputValue, setInputValue] = useState('')

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages((prev) => [...prev, { text: inputValue.trim(), isBot: false }])
      setInputValue('')
    }
  }

  const total = useMemo(() => planPrices[inputs.plan][inputs.billingCycle], [inputs.plan, inputs.billingCycle])

  const updateInput = <K extends keyof InputsState>(key: K, value: InputsState[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const resetBuilder = () => {
    setInputs({
      plan: 'pro',
      billingCycle: 'monthly',
      bubbleStyle: 'soft',
      headerStyle: 'gradient',
      bodyStyle: 'cards',
      footerStyle: 'glass',
    })
  }

  const bubbleClass = `bubble-${inputs.bubbleStyle}`
  const headerClass = `header-${inputs.headerStyle}`
  const bodyClass = `body-${inputs.bodyStyle}`
  const footerClass = `footer-${inputs.footerStyle}`

  return (
    <div className="chatbuilder-page">
      <Header />
      <main className="chatbuilder-content">
        <section className="chatbuilder-hero">
          <h1>Chat Widget Builder</h1>
          <p>
            Configure a simple chat widget preview. Choose a subscription and customize
            the chat bubble, header, body and footer styles.
          </p>
        </section>

        <div className="chatbuilder-grid">
          <div className="builder-panel glass">
            <h2 className="section-title">
              <FiSliders /> Configure widget
            </h2>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.plan ? 'open' : ''}`}
                onClick={() => toggleSection('plan')}
              >
                <span className="label">Subscription</span>
                <span className="dropbtn-icon">
                  {openSections.plan ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid option-grid-3 dropdown-content ${openSections.plan ? 'open' : ''}`}>
                {([
                  ['free', 'Free', '$0 / month', 'Basic widget access'],
                  ['pro', 'Pro', '$29 / month', 'Better styling and business use'],
                  ['business', 'Enterprise', '$59 / month', 'Premium widget setup'],
                ] as const).map(([value, title, price, desc]) => (
                  <label
                    key={value}
                    className={`option-card ${inputs.plan === value ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      checked={inputs.plan === value}
                      onChange={() => updateInput('plan', value)}
                    />

                    <div className="option-main">
                      <span className="option-title">{title}</span>
                      <span className="option-price">{price}</span>
                      <span className="option-desc">{desc}</span>
                    </div>

                    <ul className="option-feature-list">
                      {planFeatures[value].map((feature) => (
                        <li key={feature.label} className={`feature-item ${feature.status}`}>
                          <span className="feature-dot" />
                          <span className="feature-label">{feature.label}</span>
                          {feature.status === 'included' && <FiCheck className="feature-icon" />}
                          {feature.status === 'excluded' && <FiX className="feature-icon" />}
                          {feature.status === 'highlight' && <FaInfinity className="feature-icon highlight" />}
                        </li>
                      ))}
                    </ul>
                  </label>
                ))}
              </div>
            </div>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.bubble ? 'open' : ''}`}
                onClick={() => toggleSection('bubble')}
              >
                <span className="label">Billing cycle</span>
                <span className="dropbtn-icon">
                  {openSections.bubble ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid option-grid-2 dropdown-content`}>
                {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                  <label
                    key={cycle}
                    className={`option-card ${inputs.billingCycle === cycle ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="billingCycle"
                      checked={inputs.billingCycle === cycle}
                      onChange={() => updateInput('billingCycle', cycle)}
                    />
                    <span className="option-title">{cycle === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                    <span className="option-desc">{cycle === 'monthly' ? 'Billed every month' : 'Billed once a year'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.bubble ? 'open' : ''}`}
                onClick={() => toggleSection('bubble')}
              >
                <span className="label">Chat bubble style</span>
                <span className="dropbtn-icon">
                  {openSections.bubble ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid dropdown-content ${openSections.bubble ? 'open' : ''}`}>
                {(['rounded', 'soft', 'sharp'] as BubbleStyle[]).map((style) => (
                  <label
                    key={style}
                    className={`option-card ${inputs.bubbleStyle === style ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="bubbleStyle"
                      checked={inputs.bubbleStyle === style}
                      onChange={() => updateInput('bubbleStyle', style)}
                    />
                    <span className="option-title">{style}</span>
                    <span className="option-desc">Controls the message bubble appearance.</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.header ? 'open' : ''}`}
                onClick={() => toggleSection('header')}
              >
                <span className="label">Header design</span>
                <span className="dropbtn-icon">
                  {openSections.header ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid dropdown-content ${openSections.header ? 'open' : ''}`}>
                {(['minimal', 'gradient', 'dark'] as HeaderStyle[]).map((style) => (
                  <label
                    key={style}
                    className={`option-card ${inputs.headerStyle === style ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="headerStyle"
                      checked={inputs.headerStyle === style}
                      onChange={() => updateInput('headerStyle', style)}
                    />
                    <span className="option-title">{style}</span>
                    <span className="option-desc">Changes the top area of the widget.</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.body ? 'open' : ''}`}
                onClick={() => toggleSection('body')}
              >
                <span className="label">Chat body design</span>
                <span className="dropbtn-icon">
                  {openSections.body ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid dropdown-content ${openSections.body ? 'open' : ''}`}>
                {(['clean', 'cards', 'airy'] as BodyStyle[]).map((style) => (
                  <label
                    key={style}
                    className={`option-card ${inputs.bodyStyle === style ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="bodyStyle"
                      checked={inputs.bodyStyle === style}
                      onChange={() => updateInput('bodyStyle', style)}
                    />
                    <span className="option-title">{style}</span>
                    <span className="option-desc">Changes spacing and message area styling.</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="group">
              <button
                type="button"
                className={`dropbtn ${openSections.footer ? 'open' : ''}`}
                onClick={() => toggleSection('footer')}
              >
                <span className="label">Footer design</span>
                <span className="dropbtn-icon">
                  {openSections.footer ? <FiChevronUp /> : <FiChevronDown />}
                </span>
              </button>

              <div className={`option-grid dropdown-content ${openSections.footer ? 'open' : ''}`}>
                {(['simple', 'glass', 'bordered'] as FooterStyle[]).map((style) => (
                  <label
                    key={style}
                    className={`option-card ${inputs.footerStyle === style ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="footerStyle"
                      checked={inputs.footerStyle === style}
                      onChange={() => updateInput('footerStyle', style)}
                    />
                    <span className="option-title">{style}</span>
                    <span className="option-desc">Changes the input area at the bottom.</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="reset-btn" onClick={resetBuilder} type="button">
              <FiRefreshCw /> Reset
            </button>
          </div>

          <div className="preview-panel">
            <div className="widget-preview-shell glass">
              <div className="viewport-label">Widget preview</div>

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
                          <h3>Support Chat</h3>
                          <p>Usually replies in a few minutes</p>
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
                      <button type="button" onClick={handleSend}>Send</button>
                    </div>
                  </div>
                  <button className="widget-icon" onClick={() => setIsChatOpen(!isChatOpen)}>
                    <FiMessageCircle />
                  </button>
                </div>
                </div>
              </div>
            </div>

            <div className="price-panel glass sticky">
              <h2 className="section-title">
                <FiDollarSign /> Total
              </h2>

              <div className="total-box">
                <p className="total-label">Subscription total</p>
                <h3 className="total-price">
                  ${total}
                  <span>/{inputs.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                </h3>
                {inputs.billingCycle === 'monthly' && (
                  <p className="yearly-note">Yearly: ${planPrices[inputs.plan].yearly} / year</p>
                )}
              </div>

              <div className="breakdown-section">
                <button 
                  type="button"
                  className="breakdown-toggle"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                >
                  <span>Plan breakdown</span>
                  {showBreakdown ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                
                {showBreakdown && (
                  <div className="breakdown-content">
                    <h4>{inputs.plan.charAt(0).toUpperCase() + inputs.plan.slice(1)} Plan</h4>
                    <ul className="breakdown-list">
                      {planFeatures[inputs.plan].map((feature) => (
                        <li key={feature.label} className={`breakdown-item ${feature.status}`}>
                          <span className="breakdown-feature">{feature.label}</span>
                          <span className="breakdown-status">
                            {feature.status === 'included' && <FiCheck className="breakdown-icon" />}
                            {feature.status === 'excluded' && <FiX className="breakdown-icon" />}
                            {feature.status === 'highlight' && <FaInfinity className="breakdown-icon highlight" />}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Plan</span>
                  <strong>{inputs.plan}</strong>
                </div>
                <div className="summary-row">
                  <span>Billing cycle</span>
                  <strong>{inputs.billingCycle}</strong>
                </div>
                <div className="summary-row">
                  <span>Bubble style</span>
                  <strong>{inputs.bubbleStyle}</strong>
                </div>
                <div className="summary-row">
                  <span>Header style</span>
                  <strong>{inputs.headerStyle}</strong>
                </div>
                <div className="summary-row">
                  <span>Body style</span>
                  <strong>{inputs.bodyStyle}</strong>
                </div>
                <div className="summary-row">
                  <span>Footer style</span>
                  <strong>{inputs.footerStyle}</strong>
                </div>
              </div>

              <button className="continue-btn" type="button">
                <FiLogIn /> Continue to login
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
