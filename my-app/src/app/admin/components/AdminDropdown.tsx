'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export type AdminDropdownOption = {
  value: string
  label: string
  description?: string
}

type AdminDropdownProps = {
  value: string
  options: AdminDropdownOption[]
  onChange: (value: string) => void
  className?: string
  buttonClassName?: string
  menuClassName?: string
  disabled?: boolean
  placeholder?: string
}

export default function AdminDropdown({
  value,
  options,
  onChange,
  className,
  buttonClassName,
  menuClassName,
  disabled,
  placeholder,
}: AdminDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={['adminDropdown', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={['adminDropdownButton', open ? 'open' : '', buttonClassName].filter(Boolean).join(' ')}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
      >
        <span className="adminDropdownButtonLabel">{selected?.label || placeholder || 'Select'}</span>
        <FiChevronDown className={`adminDropdownChevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className={['adminDropdownMenu', menuClassName].filter(Boolean).join(' ')} role="listbox">
          {options.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                className={`adminDropdownOption ${active ? 'active' : ''}`}
                role="option"
                aria-selected={active}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {option.description ? <small>{option.description}</small> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
