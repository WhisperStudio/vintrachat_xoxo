'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useStudioCopy } from '@/components/chat/studio-copy'
import { useVintraLanguage } from '@/lib/i18n'
import { getWidgetIconOption, renderWidgetIcon, searchWidgetIcons } from '@/lib/widget-icons'

type IconPickerBubbleProps = {
  label: string
  value?: string
  onChange: (nextValue: string) => void
  placeholder?: string
  helperText?: string
  className?: string
  disabled?: boolean
}

export default function IconPickerBubble({
  label,
  value = '',
  onChange,
  placeholder = 'Choose an icon',
  helperText,
  className = '',
  disabled = false,
}: IconPickerBubbleProps) {
  const copy = useStudioCopy()
  const { language } = useVintraLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)

  const selected = getWidgetIconOption(value)
  const allIcons = useMemo(() => searchWidgetIcons(''), [])
  const recommendedKeys = useMemo(
    () => new Set(['ColorChatIcon', 'FiMessageCircle', 'FiLifeBuoy', 'FiCpu', 'FiUser', 'FiPhone', 'FiShield', 'FiGlobe']),
    []
  )

  const filteredIcons = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (query) {
      const matches = new Set(searchWidgetIcons(search).map(option => option.key))
      return allIcons.filter(option => matches.has(option.key) || copy(option.label).toLowerCase().includes(query))
    }
    return showAll ? allIcons : allIcons.filter(option => recommendedKeys.has(option.key))
  }, [allIcons, copy, recommendedKeys, search, showAll])

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (shellRef.current?.contains(target)) return
      setOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={shellRef} className={`widget-icon-picker ${className}`.trim()}>
      <div className="widget-icon-picker__label">{label}</div>
      <div className="widget-icon-picker__row">
        <button
          type="button"
          className="widget-icon-picker__trigger"
          onClick={() => setOpen((prev) => !prev)}
          disabled={disabled}
          aria-expanded={open}
        >
          <span className="widget-icon-picker__preview" aria-hidden="true">
            {renderWidgetIcon(value, { 'aria-hidden': true })}
          </span>
          <span className="widget-icon-picker__text">
            <strong>{copy(selected?.label || placeholder)}</strong>
            <small>{selected?.key || copy('Empty')}</small>
          </span>
        </button>

        <button
          type="button"
          className="widget-icon-picker__clear"
          onClick={() => onChange('')}
          disabled={disabled || !value}
          aria-label={`${language === 'no' ? 'Fjern' : 'Clear'} ${label}`}
        >
          <FiX />
        </button>
      </div>

      {helperText ? <p className="widget-icon-picker__helper">{helperText}</p> : null}

      {open ? (
        <div className="widget-icon-picker__bubble" role="dialog" aria-label={`${label} – ${language === 'no' ? 'ikongalleri' : 'icon gallery'}`}>
          <div className="widget-icon-picker__search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy('Search icons...')}
              aria-label={copy('Search icons...')}
            />
          </div>

          <div className="widget-icon-picker__grid">
            <button
              type="button"
              className={`widget-icon-picker__option ${!value ? 'active' : ''}`}
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              <span className="widget-icon-picker__option-icon" aria-hidden="true" />
              <span>{copy('None')}</span>
            </button>

            {filteredIcons.map((option) => {
              const active = option.key === value
              const Icon = option.icon

              return (
                <button
                  key={option.key}
                  type="button"
                  className={`widget-icon-picker__option ${active ? 'active' : ''}`}
                  onClick={() => {
                    onChange(option.key)
                    setOpen(false)
                  }}
                >
                  <span className="widget-icon-picker__option-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span>{copy(option.label)}</span>
                </button>
              )
            })}
          </div>
          {!search.trim() ? (
            <button
              type="button"
              className="widget-icon-picker__show-all"
              onClick={() => setShowAll((previous) => !previous)}
            >
              {showAll
                ? (language === 'no' ? 'Vis anbefalte ikoner' : 'Show recommended icons')
                : (language === 'no' ? 'Vis alle ikoner' : 'Show all icons')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
