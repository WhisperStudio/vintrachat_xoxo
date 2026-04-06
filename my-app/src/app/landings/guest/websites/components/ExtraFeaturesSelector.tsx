'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { InputsState } from '../types'
import './ExtraFeaturesSelector.css'

interface ExtraFeaturesSelectorProps {
  inputs: Pick<InputsState, 'gallery' | 'viewer3D' | 'customDesign' | 'contactForm' | 'blog' | 'booking'>
  isOpen: boolean
  onToggle: () => void
  onInputChange: (key: keyof InputsState, value: boolean) => void
}

export default function ExtraFeaturesSelector({
  inputs,
  isOpen,
  onToggle,
  onInputChange
}: ExtraFeaturesSelectorProps) {
  const features = [
    ['gallery', 'Gallery', 'Image gallery with categories and zoom.'],
    ['viewer3D', '3D Viewer', 'Interactive 3D product or model preview.'],
    ['customDesign', 'Custom Design', 'Tailored visuals and creative layout ideas.'],
    ['contactForm', 'Contact Form', 'Professional lead and contact form.'],
    ['blog', 'Blog', 'CMS-powered blog section.'],
    ['booking', 'Booking System', 'Appointments and calendar booking.'],
  ] as const

  return (
    <div className="extra-features-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Extra features</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`toggle-grid dropdown-content ${isOpen ? 'open' : ''}`}>
        {features.map(([key, title, desc]) => {
          const checked = Boolean(inputs[key as keyof typeof inputs])

          return (
            <label key={key} className={`toggle ${checked ? 'checked' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  onInputChange(key as keyof InputsState, e.target.checked)
                }
              />
              <span className="toggle-title">{title}</span>
              <span className="toggle-desc">{desc}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
