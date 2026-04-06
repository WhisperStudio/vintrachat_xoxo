'use client'

import { FiShield, FiDatabase, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi'
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
  return (
    <div className="configuration-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Core configuration</span>
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
            Admin Panel <FiShield />
          </span>
          <span className="toggle-desc">Manage content, data and users.</span>
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
            Database <FiDatabase />
          </span>
          <span className="toggle-desc">
            {inputs.ecommerce ? 'Required for e-commerce.' : 'Store and manage dynamic data.'}
          </span>
        </label>

        <label className={`toggle ${inputs.ai ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={inputs.ai}
            onChange={(e) => onInputChange('ai', e.target.checked)}
          />
          <span className="toggle-title">
            AI Assistant <FiZap />
          </span>
          <span className="toggle-desc">Smart chatbot and simple automation.</span>
        </label>
      </div>
    </div>
  )
}
