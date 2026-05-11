'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useLanguage } from '@/context/LanguageContext'
import type { DesignLevel } from '../types'
import './DesignLevelSelector.css'

interface DesignLevelSelectorProps {
  designLevel: DesignLevel
  isOpen: boolean
  onToggle: () => void
  onDesignLevelChange: (level: DesignLevel) => void
}

const designCopy = {
  en: {
    label: 'Design level',
    names: {
      standard: 'standard',
      premium: 'premium',
      elite: 'elite',
    },
    descriptions: {
      standard: 'Simple and clean. Minimal effects and straightforward layout.',
      premium: 'Balanced and polished. Better shadows, nicer spacing and moderate animation.',
      elite: 'High-end presentation. Rich layout, stronger animation and premium visual energy.',
    },
  },
  no: {
    label: 'Designnivå',
    names: {
      standard: 'standard',
      premium: 'premium',
      elite: 'elite',
    },
    descriptions: {
      standard: 'Enkelt og ryddig. Minimale effekter og tydelig layout.',
      premium: 'Balansert og polert. Bedre skygger, spacing og moderat animasjon.',
      elite: 'Eksklusiv presentasjon. Rikere layout, sterkere animasjon og mer premium uttrykk.',
    },
  },
}

export default function DesignLevelSelector({
  designLevel,
  isOpen,
  onToggle,
  onDesignLevelChange
}: DesignLevelSelectorProps) {
  const { language } = useLanguage()
  const text = designCopy[language]

  return (
    <div className="design-level-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">{text.label}</span>
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
            <span className="toggle-title design-level-title">{text.names[level]}</span>
            <span className="toggle-desc">{text.descriptions[level]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
