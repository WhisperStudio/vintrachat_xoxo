'use client'

import { FiPackage, FiZap, FiCheck, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useLanguage } from '@/context/LanguageContext'
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
  const { language } = useLanguage()
  const text = language === 'no'
    ? {
        addons: 'Tillegg',
        ecommerce: 'Nettbutikk',
        ecommerceDesc: 'Selg produkter eller tjenester på nett.',
        seo: 'SEO og analyse',
        seoDesc: 'Bli funnet på Google og mål resultatene.',
        care: 'Drift og vedlikehold',
        careDesc: 'Månedlige oppdateringer og support.',
      }
    : {
        addons: 'Add-ons',
        ecommerce: 'E-commerce',
        ecommerceDesc: 'Sell products or services online.',
        seo: 'SEO & Analytics',
        seoDesc: 'Get found on Google and track performance.',
        care: 'Care & Maintenance',
        careDesc: 'Monthly updates and support.',
      }

  return (
    <div className="addon-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">{text.addons}</span>
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
            {text.ecommerce} <FiPackage />
          </span>
          <span className="toggle-desc">{text.ecommerceDesc}</span>
        </label>

        <label className={`toggle ${inputs.seo ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.seo}
            onChange={(e) => onInputChange('seo', e.target.checked)}
          />
          <span className="toggle-title">
            {text.seo} <FiZap />
          </span>
          <span className="toggle-desc">{text.seoDesc}</span>
        </label>

        <label className={`toggle ${inputs.carePlan ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.carePlan}
            onChange={(e) => onInputChange('carePlan', e.target.checked)}
          />
          <span className="toggle-title">
            {text.care} <FiCheck />
          </span>
          <span className="toggle-desc">{text.careDesc}</span>
        </label>
      </div>
    </div>
  )
}
