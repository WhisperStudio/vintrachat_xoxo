'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { DesignLevel } from '../types'
import './DesignLevelSelector.css'

interface DesignLevelSelectorProps {
  designLevel: DesignLevel
  isOpen: boolean
  onToggle: () => void
  onDesignLevelChange: (level: DesignLevel) => void
}

const designDescriptions: Record<DesignLevel, string> = {
  standard: 'Simple and clean. Minimal effects and straightforward layout.',
  premium: 'Balanced and polished. Better shadows, nicer spacing and moderate animation.',
  elite: 'High-end presentation. Rich layout, stronger animation and premium visual energy.',
}

export default function DesignLevelSelector({
  designLevel,
  isOpen,
  onToggle,
  onDesignLevelChange
}: DesignLevelSelectorProps) {
  return (
    <div className="design-level-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Design level</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`toggle-grid toggle-grid-3 dropdown-content ${isOpen ? 'open' : ''}`}>
        {(['standard', 'premium', 'elite'] as DesignLevel[]).map((level) => (
          <label
            key={level}
            className={`toggle ${designLevel === level ? 'checked' : ''}`}
          >
            <input
              type="checkbox"
              checked={designLevel === level}
              onChange={() => onDesignLevelChange(level)}
            />
            <span className="toggle-title design-level-title">{level}</span>
            <span className="toggle-desc">{designDescriptions[level]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
