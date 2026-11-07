'use client'

import Link from 'next/link'
import { FiChevronDown } from 'react-icons/fi'
import { FaRegCreditCard } from 'react-icons/fa'
import { useVintraLanguage } from '@/lib/i18n'
import { PLANS } from '@/lib/billing/catalog.mjs'
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
  lockedPlan?: Plan
  onPlanChange: (plan: Plan) => void
  onBillingCycleChange: (cycle: BillingCycle) => void
  isOpen: boolean
  onToggle: () => void
}

export default function PlanSelector({ plan, lockedPlan, billingCycle, isOpen, onToggle }: PlanSelectorProps) {
  const { language } = useVintraLanguage()
  const info = PLANS[lockedPlan || plan]
  const no = language === 'no'
  return <div className="group">
    <button type="button" className={`dropbtn ${isOpen ? 'open' : ''}`} onClick={onToggle} aria-expanded={isOpen}>
      <span className="label section-label"><FaRegCreditCard /> {no ? 'Abonnement' : 'Subscription'}</span><FiChevronDown />
    </button>
    {isOpen && <div className="plan-locked-note">
      <strong>{info.name} · {new Intl.NumberFormat('nb-NO').format(info[billingCycle] / 100)} NOK / {billingCycle === 'yearly' ? (no ? 'år' : 'year') : (no ? 'mnd' : 'month')}</strong>
      <p>{info.conversations} {no ? 'samtaler/dag' : 'conversations/day'} · {info.widgets} {no ? 'widgeter' : 'widgets'} · {info.members} {no ? 'teammedlemmer' : 'team members'}</p>
      <Link href="/priser">{no ? 'Se priser og endre abonnement →' : 'View pricing and manage subscription →'}</Link>
    </div>}
  </div>
}
