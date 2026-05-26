'use client'

import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi'
import { FaInfinity, FaMoneyBillWave, FaRegCreditCard } from 'react-icons/fa'
import { MdMoneyOff, MdAttachMoney } from "react-icons/md";
import { chatWidgetBuilderExtraI18n, chatWidgetPlanI18n, useVintraLanguage } from '@/lib/i18n'
import './PlanSelector.css'

type Plan = 'free' | 'pro' | 'business'
type BillingCycle = 'monthly' | 'yearly'

interface PlanFeature {
  label: string
  status: 'included' | 'excluded' | 'highlight'
}

interface PlanSelectorProps {
  plan: Plan
  billingCycle: BillingCycle
  onPlanChange: (plan: Plan) => void
  onBillingCycleChange: (cycle: BillingCycle) => void
  isOpen: boolean
  onToggle: () => void
}

const planFeatureStatuses: Record<Plan, Array<PlanFeature['status']>> = {
  free: [
    'included',
    'included',
    'included',
    'excluded',
    'excluded',
    'excluded',
    'excluded',
  ],
  pro: [
    'highlight',
    'included',
    'included',
    'included',
    'included',
    'included',
    'included',
  ],
  business: [
    'included',
    'highlight',
    'included',
    'included',
    'included',
  ],
}

function formatPlanPrice(amount: number, language: 'no' | 'en', period: string) {
  if (language === 'no') {
    return `${new Intl.NumberFormat('nb-NO').format(amount)} kr / ${period}`
  }

  return `$${amount} / ${period}`
}

export default function PlanSelector({
  plan,
  billingCycle,
  onPlanChange,
  onBillingCycleChange,
  isOpen,
  onToggle,
}: PlanSelectorProps) {
  const { language } = useVintraLanguage()
  const text = chatWidgetPlanI18n[language]
  const extraText = chatWidgetBuilderExtraI18n[language]
  const planFeatures: Record<Plan, PlanFeature[]> = {
    free: text.features.free.map((label, index) => ({
      label,
      status: planFeatureStatuses.free[index] || 'included',
    })),
    pro: text.features.pro.map((label, index) => ({
      label,
      status: planFeatureStatuses.pro[index] || 'included',
    })),
    business: text.features.business.map((label, index) => ({
      label,
      status: planFeatureStatuses.business[index] || 'included',
    })),
  }

  return (
    <div className="group">
      <button type="button" className={`dropbtn ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span className="label section-label">
          <span className="section-label-icon section-label-icon--green" aria-hidden="true">
            <FaRegCreditCard />
          </span>
          <span>{text.subscription}</span>
        </span>
        <span className="dropbtn-icon">
          <FiChevronDown />
        </span>
      </button>

      <div className={`option-grid option-grid-3 dropdown-content ${isOpen ? 'open' : ''}`}>
        {([
          ['free', text.plans.free.title, formatPlanPrice(extraText.prices.free[billingCycle], language, billingCycle === 'monthly' ? text.month : text.year), text.plans.free.description],
          ['pro', text.plans.pro.title, formatPlanPrice(extraText.prices.pro[billingCycle], language, billingCycle === 'monthly' ? text.month : text.year), text.plans.pro.description],
          ['business', text.plans.business.title, formatPlanPrice(extraText.prices.business[billingCycle], language, billingCycle === 'monthly' ? text.month : text.year), text.plans.business.description],
        ] as const).map(([value, title, price, desc]) => (
          <label key={value} className={`option-card ${plan === value ? 'checked' : ''}`}>
            <input type="radio" name="plan" checked={plan === value} onChange={() => onPlanChange(value)} />

            <div className="option-main">
               <span className="option-price">
                <span className="option-title">{title}</span>
                {value === 'free' && <MdMoneyOff className="money-icon" />}
                {value === 'pro' && <><MdAttachMoney className="money-icon" /><MdAttachMoney className="money-icon" /></>}
                {value === 'business' && <><MdAttachMoney className="money-icon" /><MdAttachMoney className="money-icon" /><MdAttachMoney className="money-icon" /></>}
              
             </span>
                <span className="price-text">{price}</span>
              
              <span className="option-desc">{desc}</span>
            </div>

            <ul className="option-feature-list">
              {planFeatures[value].map((feature) => (
                <li key={feature.label} className={`feature-item ${feature.status}`}>
                  <span className="feature-dot" />
                  <span className="feature-label">{feature.label}</span>
                  {feature.status === 'included' && <FiCheck className="feature-icon included" />}
                  {feature.status === 'excluded' && <FiX className="feature-icon excluded" />}
                  {feature.status === 'highlight' && <FaInfinity className="feature-icon highlight" />}
                </li>
              ))}
            </ul>
          </label>
        ))}

        <div className="billing-cycle-toggle">
          <label className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="billingCycle"
              checked={billingCycle === 'monthly'}
              onChange={() => onBillingCycleChange('monthly')}
            />
            <span>{text.monthly}</span>
          </label>

          <label className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="billingCycle"
              checked={billingCycle === 'yearly'}
              onChange={() => onBillingCycleChange('yearly')}
            />
            <span>{text.yearly}</span>
          </label>
        </div>
      </div>
    </div>
  )
}
