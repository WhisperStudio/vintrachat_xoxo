'use client'

import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { ColorTheme } from '../types'
import './ColorThemeSelector.css'

interface ThemePalette {
  name: string
  description: string
  colors: [string, string, string, string]
  surface: string
  softSurface: string
  text: string
  muted: string
  gradient: string
  button: string
  buttonText: string
  border: string
  glow: string
}

const themePalettes: Record<ColorTheme, ThemePalette> = {
  modern: {
    name: 'Modern',
    description: 'Strong, clean, vibrant colors for modern digital brands.',
    colors: ['#2563eb', '#7c3aed', '#ec4899', '#f8fafc'],
    surface: '#f8fbff',
    softSurface: '#eef4ff',
    text: '#14213d',
    muted: '#5b6b84',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 58%, #ec4899 100%)',
    button: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    buttonText: '#ffffff',
    border: 'rgba(37, 99, 235, 0.16)',
    glow: 'rgba(124, 58, 237, 0.22)',
  },
  chilling: {
    name: 'Chilling',
    description: 'Pastel and relaxing colors for softer, calmer websites.',
    colors: ['#8ecae6', '#b8c0ff', '#ffc8dd', '#fdfcfb'],
    surface: '#fcfcff',
    softSurface: '#f6f5ff',
    text: '#243447',
    muted: '#6b7a90',
    gradient: 'linear-gradient(135deg, #8ecae6 0%, #b8c0ff 55%, #ffc8dd 100%)',
    button: 'linear-gradient(135deg, #8ecae6, #b8c0ff)',
    buttonText: '#1f2937',
    border: 'rgba(184, 192, 255, 0.22)',
    glow: 'rgba(255, 200, 221, 0.24)',
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional and trustworthy tones for real business websites.',
    colors: ['#0f172a', '#1d4ed8', '#0f766e', '#f8fafc'],
    surface: '#f7fafc',
    softSurface: '#eef3f8',
    text: '#0f172a',
    muted: '#475569',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #0f766e 100%)',
    button: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
    buttonText: '#ffffff',
    border: 'rgba(15, 23, 42, 0.14)',
    glow: 'rgba(29, 78, 216, 0.2)',
  },
  luxury: {
    name: 'Luxury',
    description: 'Elegant premium tones for high-end brands and showcase pages.',
    colors: ['#111827', '#7c2d12', '#d4af37', '#f9f6ef'],
    surface: '#fffdf7',
    softSurface: '#f7f2e7',
    text: '#1f2937',
    muted: '#6b7280',
    gradient: 'linear-gradient(135deg, #111827 0%, #7c2d12 45%, #d4af37 100%)',
    button: 'linear-gradient(135deg, #111827, #d4af37)',
    buttonText: '#ffffff',
    border: 'rgba(212, 175, 55, 0.22)',
    glow: 'rgba(212, 175, 55, 0.22)',
  },
}

interface ColorThemeSelectorProps {
  colorTheme: ColorTheme
  isOpen: boolean
  onToggle: () => void
  onColorThemeChange: (theme: ColorTheme) => void
}

export default function ColorThemeSelector({
  colorTheme,
  isOpen,
  onToggle,
  onColorThemeChange
}: ColorThemeSelectorProps) {
  return (
    <div className="color-theme-group group">
      <button
        type="button"
        className={`dropbtn ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
      >
        <span className="label">Color style</span>
        <span className="dropbtn-icon">
          {isOpen ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </button>

      <div className={`theme-grid dropdown-content ${isOpen ? 'open' : ''}`}>
        {(Object.keys(themePalettes) as ColorTheme[]).map((themeKey) => {
          const theme = themePalettes[themeKey]
          const isActive = colorTheme === themeKey

          return (
            <button
              key={themeKey}
              type="button"
              className={`theme-card ${isActive ? 'active' : ''}`}
              onClick={() => onColorThemeChange(themeKey)}
            >
              <div className="theme-card-top">
                <div>
                  <h4>{theme.name}</h4>
                  <p>{theme.description}</p>
                </div>
              </div>

              <div className="theme-palette">
                {theme.colors.map((color) => (
                  <span
                    key={color}
                    className="theme-swatch"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
