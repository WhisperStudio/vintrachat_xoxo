'use client'

import { FiDollarSign, FiChevronDown, FiChevronUp, FiLogIn } from 'react-icons/fi'

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
  onToggleBreakdown
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
        <button 
          type="button"
          className="breakdown-toggle"
          onClick={onToggleBreakdown}
        >
          <span>Plan breakdown</span>
          {showBreakdown ? <FiChevronUp /> : <FiChevronDown />}
        </button>
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
          <strong>Custom Design</strong>
        </div>
        <div className="summary-row">
          <span>Header style</span>
          <strong>Custom Design</strong>
        </div>
        <div className="summary-row">
          <span>Body style</span>
          <strong>Custom Design</strong>
        </div>
        <div className="summary-row">
          <span>Footer style</span>
          <strong>Custom Design</strong>
        </div>
      </div>

      <button className="continue-btn" type="button">
        <FiLogIn /> Continue to login
      </button>
    </div>
  )
}
