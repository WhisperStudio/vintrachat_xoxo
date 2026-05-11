'use client'

import { FiShield, FiDatabase, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useLanguage } from '@/context/LanguageContext'
import type { InputsState } from '../types'
import './ConfigurationSelector.css'

interface ConfigurationSelectorProps {
  inputs: Pick<InputsState, 'admin' | 'database' | 'ai' | 'ecommerce'>
  isOpen: boolean
  onToggle: () => void
  onInputChange: (key: keyof InputsState, value: boolean) => void
}

export default function ConfigurationSelector({
  inputs,
  isOpen,
  onToggle,
  onInputChange
}: ConfigurationSelectorProps) {
  const { language } = useLanguage()
  const text = language === 'no'
    ? {
        configuration: 'Grunnoppsett',
        admin: 'Adminpanel',
        adminDesc: 'Administrer innhold, data og brukere.',
        database: 'Database',
        databaseDesc: 'Lagre og administrer dynamiske data.',
        databaseRequired: 'Påkrevd for nettbutikk.',
        ai: 'AI-assistent',
        aiDesc: 'Smart chatbot og enkel automasjon.',
      }
    : {
        configuration: 'Core configuration',
        admin: 'Admin Panel',
        adminDesc: 'Manage content, data and users.',
        database: 'Database',
        databaseDesc: 'Store and manage dynamic data.',
        databaseRequired: 'Required for e-commerce.',
        ai: 'AI Assistant',
        aiDesc: 'Smart chatbot and simple automation.',
      }

  return (
    <div className="configuration-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">{text.configuration}</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`toggle-grid dropdown-content ${isOpen ? 'open' : ''}`}>
        <label className={`toggle ${inputs.admin ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.admin}
            onChange={(e) => onInputChange('admin', e.target.checked)}
          />
          <span className="toggle-title">
            {text.admin} <FiShield />
          </span>
          <span className="toggle-desc">{text.adminDesc}</span>
        </label>

        <label
          className={`toggle ${inputs.database ? 'checked' : ''} ${
            inputs.ecommerce ? 'disabled' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={inputs.database}
            disabled={inputs.ecommerce}
            onChange={(e) => onInputChange('database', e.target.checked)}
          />
          <span className="toggle-title">
            {text.database} <FiDatabase />
          </span>
          <span className="toggle-desc">
            {inputs.ecommerce ? text.databaseRequired : text.databaseDesc}
          </span>
        </label>

        <label className={`toggle ${inputs.ai ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.ai}
            onChange={(e) => onInputChange('ai', e.target.checked)}
          />
          <span className="toggle-title">
            {text.ai} <FiZap />
          </span>
          <span className="toggle-desc">{text.aiDesc}</span>
        </label>
      </div>
    </div>
  )
}
