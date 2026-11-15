'use client'

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { canConfirmStudioAction, confirmationSecondsRemaining } from '@/lib/studio-confirmation.mjs'
import './StudioSafety.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  onConfirm: () => unknown | Promise<unknown>; no?: boolean; message?: string; confirmLabel?: string;
  requireCheck?: boolean; checkLabel?: string; contextKey?: string;
}
export default function ConfirmStudioAction({ onConfirm, no = true, message, confirmLabel, requireCheck = false, checkLabel, contextKey, disabled, children, ...buttonProps }: Props) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(5)
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const id = useId()
  const cancel = () => { setStartedAt(null); setChecked(false); setError('') }
  useEffect(() => { cancel() }, [contextKey])
  useEffect(() => {
    if (startedAt === null) return
    const timer = window.setInterval(() => setRemaining(confirmationSecondsRemaining(startedAt, performance.now())), 100)
    return () => window.clearInterval(timer)
  }, [startedAt])
  const click = async () => {
    if (disabled || inFlight.current) return
    if (startedAt === null) { setRemaining(5); setChecked(false); setStartedAt(performance.now()); return }
    if (!canConfirmStudioAction(startedAt, performance.now(), requireCheck, checked)) return
    inFlight.current = true; setPending(true); setError('')
    try {
      const result = await onConfirm()
      if (result === false) setError(no ? 'Handlingen kunne ikke fullføres. Prøv igjen.' : 'Unable to complete the action. Try again.')
      else cancel()
    } catch { setError(no ? 'Handlingen kunne ikke fullføres. Prøv igjen.' : 'Unable to complete the action. Try again.') }
    finally { inFlight.current = false; setPending(false) }
  }
  return <div className="studioConfirmAction" data-armed={startedAt !== null}>
    {startedAt !== null && <div className="studioConfirmWarning" id={id} role="alert"><p><FiAlertTriangle aria-hidden="true" />{message || (no ? 'Er du sikker på at du vil slette eller fjerne dette?' : 'Are you sure you want to delete or remove this?')}</p>{requireCheck && <label><input type="checkbox" checked={checked} disabled={pending} onChange={event => setChecked(event.target.checked)} /><span>{checkLabel || (no ? 'Jeg forstår at dette slettes permanent.' : 'I understand this is permanently deleted.')}</span></label>}</div>}
    <div className="studioConfirmActionControls"><button {...buttonProps} type="button" aria-describedby={startedAt !== null ? id : buttonProps['aria-describedby']} disabled={disabled || pending || (startedAt !== null && (remaining > 0 || (requireCheck && !checked)))} onClick={() => void click()}>{pending ? (no ? 'Utfører…' : 'Working…') : startedAt !== null ? <>{confirmLabel || (no ? 'Bekreft' : 'Confirm')}{remaining > 0 && ` (${remaining} s)`}</> : children}</button>{startedAt !== null && <button type="button" className="studioConfirmCancel" disabled={pending} onClick={cancel}>{no ? 'Avbryt' : 'Cancel'}</button>}</div>
    {error && <p className="studioConfirmError" role="alert">{error}</p>}
  </div>
}
