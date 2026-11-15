'use client'

import { useId, useRef, useState } from 'react'
import { FiEdit3 } from 'react-icons/fi'

export default function InlineEditableText({ label, value, onChange, multiline = false, no }: {
  label: string; value: string; onChange: (value: string) => void; multiline?: boolean; no: boolean
}) {
  const id = useId()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const cancelled = useRef(false)
  const finish = () => { if (!cancelled.current) onChange(draft); setEditing(false) }
  const props = {
    id, autoFocus: true, value: draft,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(event.target.value),
    onBlur: finish,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); cancelled.current = true; setEditing(false) }
      else if (event.key === 'Enter' && !multiline) { event.preventDefault(); finish() }
    },
  }
  return <div className="widgetFlowField studioInlineEditable">
    <span id={`${id}-label`} className="studioInlineLabel">{label}</span>
    {editing ? multiline ? <textarea {...props} rows={2} aria-labelledby={`${id}-label`} /> : <input {...props} aria-labelledby={`${id}-label`} /> :
      <button type="button" className="studioInlineText" aria-labelledby={`${id}-label ${id}-value`} title={no ? 'Klikk for å redigere' : 'Click to edit'} onClick={() => { cancelled.current = false; setDraft(value); setEditing(true) }}>
        <span id={`${id}-value`}>{value || (no ? 'Klikk for å skrive…' : 'Click to write…')}</span><FiEdit3 aria-hidden="true" />
      </button>}
  </div>
}
