'use client'

import { FiChevronDown, FiLogIn, FiSave } from 'react-icons/fi'
import { FaMoneyBillWave } from "react-icons/fa";
import { MdMoneyOff, MdAttachMoney } from "react-icons/md";
import { chatWidgetPricingI18n, useVintraLanguage } from '@/lib/i18n'
import './PricingPanel.css'

interface PricingPanelProps {
  total: number
  billingCycle: 'monthly' | 'yearly'
  plan: 'free' | 'pro' | 'business'
  bubbleStyle: {
    showStatus: boolean
    iconChoice: 'chat' | 'phone' | 'cpu' | 'message' | 'support' | 'orb'
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
  const { language } = useVintraLanguage()
  const text = chatWidgetPricingI18n[language]
  const formattedTotal =
    language === 'no'
      ? `${new Intl.NumberFormat('nb-NO').format(total)} kr`
      : `$${total}`
  const period = billingCycle === 'monthly' ? text.month : text.year

  return (
    <div className="price-panel glass sticky">
      <h2 className="section-title">
        {plan === 'free' && <MdMoneyOff />}
        {plan === 'pro' && <><MdAttachMoney /><MdAttachMoney /></>}
        {plan === 'business' && <><MdAttachMoney /><MdAttachMoney /><MdAttachMoney /></>}
        {text.total}
      </h2>

      <div className="total-box">
        <p className="total-label"><FaMoneyBillWave/>{text.subscriptionTotal}</p>
        <h3 className="total-price">
          {formattedTotal}
          <span>/{period}</span>
        </h3>
      </div>

      <div className="breakdown-section">
        <button type="button" className={`breakdown-toggle ${showBreakdown ? 'open' : ''}`} onClick={onToggleBreakdown}>
          <span>{text.planBreakdown}</span>
          <span className="dropbtn-icon">
            <FiChevronDown />
          </span>
        </button>

        {showBreakdown && (
          <div className="breakdown-content">
            <h4>{plan.charAt(0).toUpperCase() + plan.slice(1)} plan</h4>

            <div className="summary-list compact">
              <div className="summary-row">
                <span>{text.bubble}</span>
                <strong>
                  {bubbleStyle.sizeType}, {bubbleStyle.animationType}
                </strong>
              </div>
              <div className="summary-row">
                <span>{text.header}</span>
                <strong>{headerStyle.showAvatar ? text.avatar : text.minimal}</strong>
              </div>
              <div className="summary-row">
                <span>{text.body}</span>
                <strong>{bodyStyle.messageStyle}</strong>
              </div>
              <div className="summary-row">
                <span>{text.footer}</span>
                <strong>{footerStyle.inputStyle}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="summary-list">
        <div className="summary-row">
          <span>{text.plan}</span>
          <strong>{plan}</strong>
        </div>
        <div className="summary-row">
          <span>{text.billingCycle}</span>
          <strong>{billingCycle}</strong>
        </div>
        <div className="summary-row">
          <span>{text.bubbleStyle}</span>
          <strong>{bubbleStyle.borderType}</strong>
        </div>
        <div className="summary-row">
          <span>{text.headerStyle}</span>
          <strong>{headerStyle.borderType}</strong>
        </div>
        <div className="summary-row">
          <span>{text.bodyStyle}</span>
          <strong>{bodyStyle.messageStyle}</strong>
        </div>
        <div className="summary-row">
          <span>{text.footerStyle}</span>
          <strong>{footerStyle.inputStyle}</strong>
        </div>
      </div>

      {isAuthenticated ? (
        <button className="continue-btn" type="button" onClick={onSave} disabled={isSaving}>
          <FiSave /> {isSaving ? text.saving : text.saveConfiguration}
        </button>
      ) : (
        <button className="continue-btn" type="button" onClick={onContinue}>
          <FiLogIn /> {text.continueToLogin}
        </button>
      )}
    </div>
  )
}
