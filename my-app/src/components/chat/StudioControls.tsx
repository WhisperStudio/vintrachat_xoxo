'use client'

import { useState, type ReactNode } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export function StudioGroup({ title, description, status, defaultOpen = false, children }: {
  title: string; description?: string; status?: string; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return <details className="studioGroup" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary><span className="studioGroupCopy"><strong>{title}</strong>{description && <small>{description}</small>}</span>{status && <span className="studioGroupStatus">{status}</span>}<FiChevronDown aria-hidden="true" /></summary>
    <div className="studioGroupBody">{children}</div>
  </details>
}

export function StudioToggle({ title, description, checked, onChange, disabled = false }: {
  title: string; description?: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean
}) {
  return <label className={`studioToggle${disabled ? ' studioToggleDisabled' : ''}`}>
    <span><strong>{title}</strong>{description && <small>{description}</small>}</span>
    <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
  </label>
}
