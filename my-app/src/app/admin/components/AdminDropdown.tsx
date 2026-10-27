'use client'

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export type AdminDropdownOption = {
  value: string
  label: string
  description?: string
  accent?: string
  accentSoft?: string
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
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const listId = useId()

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value])

  const selectedStyle = useMemo<CSSProperties | undefined>(() => {
    if (!selected?.accent) return undefined

    return {
      '--dropdown-accent': selected.accent,
      '--dropdown-accent-border': selected.accent,
      '--dropdown-accent-soft': selected.accentSoft || selected.accent,
    } as CSSProperties
  }, [selected?.accent, selected?.accentSoft])

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

  useEffect(() => {
    if (open) {
      const root = rootRef.current
      const selected = root?.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]')
      ;(selected || root?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus()
    }
  }, [open])

  const handleKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (!open) { setOpen(true); return }
    const options = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') || [])
    if (!options.length) return
    const current = options.indexOf(document.activeElement as HTMLButtonElement)
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 :
      (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
    options[index]?.focus()
  }

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} onKeyDown={handleKeys} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }} className={['adminDropdown', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        ref={triggerRef}
        aria-controls={open ? listId : undefined}
        className={['adminDropdownButton', open ? 'open' : '', buttonClassName].filter(Boolean).join(' ')}
        style={selectedStyle}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
      >
        <span className="adminDropdownButtonLabel">{selected?.label || placeholder || 'Select'}</span>
        <FiChevronDown className={`adminDropdownChevron ${open ? 'open' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className={['adminDropdownMenu', menuClassName].filter(Boolean).join(' ')} role="listbox" id={listId} aria-label={placeholder || selected?.label || 'Options'}>
          {options.map((option) => {
            const active = option.value === value
            const optionStyle = option.accent
              ? ({
                  '--dropdown-accent': option.accent,
                  '--dropdown-accent-border': option.accent,
                  '--dropdown-accent-soft': option.accentSoft || option.accent,
                } as CSSProperties)
              : undefined

            return (
              <button
                key={option.value}
                type="button"
                className={`adminDropdownOption ${active ? 'active' : ''}`}
                role="option"
                tabIndex={-1}
                aria-selected={active}
                style={optionStyle}
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
