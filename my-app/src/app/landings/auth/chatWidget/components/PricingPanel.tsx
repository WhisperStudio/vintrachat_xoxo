'use client'

import { FiChevronDown, FiDollarSign, FiLogIn, FiSave } from 'react-icons/fi'
import './PricingPanel.css'

interface PricingPanelProps {
  total: number
  billingCycle: 'monthly' | 'yearly'
  plan: 'free' | 'pro' | 'business'
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
  showBreakdown: boolean
  onToggleBreakdown: () => void
  isAuthenticated: boolean
  onContinue: () => void
  onSave: () => void
  isSaving: boolean
}

export default function PricingPanel({
  total,
  billingCycle,
  plan,
  bubbleStyle,
  headerStyle,
  bodyStyle,
  footerStyle,
  showBreakdown,
  onToggleBreakdown,
  isAuthenticated,
  onContinue,
  onSave,
  isSaving,
}: PricingPanelProps) {
  return (
    <div className="price-panel glass sticky">
      <h2 className="section-title">
        <FiDollarSign /> Total
      </h2>

      <div className="total-box">
        <p className="total-label">Subscription total</p>
        <h3 className="total-price">
          ${total}
          <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
        </h3>
      </div>

      <div className="breakdown-section">
        <button type="button" className={`breakdown-toggle ${showBreakdown ? 'open' : ''}`} onClick={onToggleBreakdown}>
          <span>Plan breakdown</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        {showBreakdown && (
          <div className="breakdown-content">
            <h4>{plan.charAt(0).toUpperCase() + plan.slice(1)} plan</h4>

            <div className="summary-list compact">
              <div className="summary-row">
                <span>Bubble</span>
                <strong>
                  {bubbleStyle.sizeType}, {bubbleStyle.animationType}
                </strong>
              </div>
              <div className="summary-row">
                <span>Header</span>
                <strong>{headerStyle.showAvatar ? 'avatar' : 'minimal'}</strong>
              </div>
              <div className="summary-row">
                <span>Body</span>
                <strong>{bodyStyle.messageStyle}</strong>
              </div>
              <div className="summary-row">
                <span>Footer</span>
                <strong>{footerStyle.inputStyle}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="summary-list">
        <div className="summary-row">
          <span>Plan</span>
          <strong>{plan}</strong>
        </div>
        <div className="summary-row">
          <span>Billing cycle</span>
          <strong>{billingCycle}</strong>
        </div>
        <div className="summary-row">
          <span>Bubble style</span>
          <strong>{bubbleStyle.borderType}</strong>
        </div>
        <div className="summary-row">
          <span>Header style</span>
          <strong>{headerStyle.borderType}</strong>
        </div>
        <div className="summary-row">
          <span>Body style</span>
          <strong>{bodyStyle.messageStyle}</strong>
        </div>
        <div className="summary-row">
          <span>Footer style</span>
          <strong>{footerStyle.inputStyle}</strong>
        </div>
      </div>

      {isAuthenticated ? (
        <button className="continue-btn" type="button" onClick={onSave} disabled={isSaving}>
          <FiSave /> {isSaving ? 'Saving...' : 'Save configuration'}
        </button>
      ) : (
        <button className="continue-btn" type="button" onClick={onContinue}>
          <FiLogIn /> Continue to login
        </button>
      )}
    </div>
  )
}