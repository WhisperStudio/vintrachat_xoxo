'use client'

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

const query = '(max-width: 1100px)'
const subscribe = (callback: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
const getSnapshot = () => window.matchMedia(query).matches
const getServerSnapshot = () => false

export default function StudioPreviewPanel({ open, onClose, no, compact, children }: {
  open: boolean; onClose: () => void; no: boolean; compact: boolean; children: ReactNode
}) {
  const mobile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !mobile) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [mobile, open])
  const label = no ? 'Forhåndsvisning av chatwidget' : 'Chat widget preview'
  if (mobile) return <dialog ref={ref} className="preview-panel studioPreviewDialog" id="studio-preview" aria-label={label} onClose={onClose} onCancel={onClose} onKeyDown={event => {
    if (event.key !== 'Tab') return
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }}>
    <div className="studioPreviewDialogBar"><strong>{no ? 'Forhåndsvisning' : 'Preview'}</strong><button type="button" onClick={onClose} aria-label={no ? 'Lukk forhåndsvisning' : 'Close preview'}><FiX aria-hidden="true" /></button></div>
    {children}
  </dialog>
  return <section className={'preview-panel' + (compact ? ' studioPreviewCompact' : '')} id="studio-preview" aria-label={label}>{children}</section>
}
