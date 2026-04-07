'use client'

import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi'
import { FaInfinity } from 'react-icons/fa'
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

const planFeatures: Record<Plan, PlanFeature[]> = {
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

export default function PlanSelector({
  plan,
  billingCycle,
  onPlanChange,
  onBillingCycleChange,
  isOpen,
  onToggle,
}: PlanSelectorProps) {
  return (
    <div className="group">
      <button type="button" className={`dropbtn ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span className="label">Subscription</span>
        <span className="dropbtn-icon">
          <FiChevronDown />
        </span>
      </button>

      <div className={`option-grid option-grid-3 dropdown-content ${isOpen ? 'open' : ''}`}>
        {([
          ['free', 'Free', '$0 / month', 'Basic widget access'],
          ['pro', 'Pro', '$29 / month', 'Better styling and business use'],
          ['business', 'Enterprise', '$59 / month', 'Premium widget setup'],
        ] as const).map(([value, title, price, desc]) => (
          <label key={value} className={`option-card ${plan === value ? 'checked' : ''}`}>
            <input type="radio" name="plan" checked={plan === value} onChange={() => onPlanChange(value)} />

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

        <div className="billing-cycle-toggle">
          <label className={`billing-option ${billingCycle === 'monthly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="billingCycle"
              checked={billingCycle === 'monthly'}
              onChange={() => onBillingCycleChange('monthly')}
            />
            <span>Monthly</span>
          </label>

          <label className={`billing-option ${billingCycle === 'yearly' ? 'active' : ''}`}>
            <input
              type="radio"
              name="billingCycle"
              checked={billingCycle === 'yearly'}
              onChange={() => onBillingCycleChange('yearly')}
            />
            <span>Yearly</span>
          </label>
        </div>
      </div>
    </div>
  )
}