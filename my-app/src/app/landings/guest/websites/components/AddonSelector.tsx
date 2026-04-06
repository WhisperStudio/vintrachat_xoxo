'use client'

import { FiPackage, FiZap, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { InputsState } from '../types'
import './AddonSelector.css'

interface AddonSelectorProps {
  inputs: Pick<InputsState, 'ecommerce' | 'seo' | 'carePlan'>
  isOpen: boolean
  onToggle: () => void
  onInputChange: (key: keyof InputsState, value: boolean) => void
}

export default function AddonSelector({
  inputs,
  isOpen,
  onToggle,
  onInputChange
}: AddonSelectorProps) {
  return (
    <div className="addon-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Add-ons</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`toggle-grid dropdown-content ${isOpen ? 'open' : ''}`}>
        <label className={`toggle ${inputs.ecommerce ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.ecommerce}
            onChange={(e) => onInputChange('ecommerce', e.target.checked)}
          />
          <span className="toggle-title">
            E-commerce <FiPackage />
          </span>
          <span className="toggle-desc">Sell products or services online.</span>
        </label>

        <label className={`toggle ${inputs.seo ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.seo}
            onChange={(e) => onInputChange('seo', e.target.checked)}
          />
          <span className="toggle-title">
            SEO & Analytics <FiZap />
          </span>
          <span className="toggle-desc">Get found on Google and track performance.</span>
        </label>

        <label className={`toggle ${inputs.carePlan ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.carePlan}
            onChange={(e) => onInputChange('carePlan', e.target.checked)}
          />
          <span className="toggle-title">
            Care & Maintenance <FiCheck />
          </span>
          <span className="toggle-desc">Monthly updates and support.</span>
        </label>
      </div>
    </div>
  )
}
