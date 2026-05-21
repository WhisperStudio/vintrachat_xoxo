'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { getWidgetIconOption, renderWidgetIcon, searchWidgetIcons } from '@/lib/widget-icons'

type IconPickerBubbleProps = {
  label: string
  value?: string
  onChange: (nextValue: string) => void
  placeholder?: string
  helperText?: string
  className?: string
}

export default function IconPickerBubble({
  label,
  value = '',
  onChange,
  placeholder = 'Choose an icon',
  helperText,
  className = '',
}: IconPickerBubbleProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const shellRef = useRef<HTMLDivElement | null>(null)

  const selected = getWidgetIconOption(value)

  const filteredIcons = useMemo(() => searchWidgetIcons(search), [search])

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
          aria-expanded={open}
        >
          <span className="widget-icon-picker__preview" aria-hidden="true">
            {renderWidgetIcon(value, { 'aria-hidden': true })}
          </span>
          <span className="widget-icon-picker__text">
            <strong>{selected?.label || placeholder}</strong>
            <small>{selected?.key || 'Empty'}</small>
          </span>
        </button>

        <button
          type="button"
          className="widget-icon-picker__clear"
          onClick={() => onChange('')}
          disabled={!value}
          aria-label={`Clear ${label}`}
        >
          <FiX />
        </button>
      </div>

      {helperText ? <p className="widget-icon-picker__helper">{helperText}</p> : null}

      {open ? (
        <div className="widget-icon-picker__bubble" role="dialog" aria-label={`${label} icon gallery`}>
          <div className="widget-icon-picker__search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search icons..."
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
              <span>None</span>
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
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
