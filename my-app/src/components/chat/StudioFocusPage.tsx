'use client'
import { useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FiArrowLeft } from 'react-icons/fi'

export default function StudioFocusPage({ title, no, onBack, backDisabled = false, aside, children }: { title: string; no: boolean; onBack: () => void; backDisabled?: boolean; aside?: ReactNode; children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const root = document.createElement('div')
    root.dataset.studioFocusRoot = 'true'
    const previousFocus = document.activeElement as HTMLElement | null
    const scroll = window.scrollY
    const titleBefore = document.title
    const focusBefore = document.body.dataset.studioFocus
    document.body.dataset.studioFocus = 'true'
    const previous = Array.from(document.body.children).filter((element): element is HTMLElement => element instanceof HTMLElement && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)).map(element => ({ element, display: element.style.display, inert: element.inert }))
    for (const item of previous) { item.element.style.display = 'none'; item.element.inert = true }
    document.body.appendChild(root); setHost(root); window.scrollTo(0, 0)
    return () => { root.remove(); for (const item of previous) { item.element.style.display = item.display; item.element.inert = item.inert }; if (focusBefore === undefined) delete document.body.dataset.studioFocus; else document.body.dataset.studioFocus = focusBefore; document.title = titleBefore; window.scrollTo(0, scroll); previousFocus?.focus() }
  }, [])
  useLayoutEffect(() => {
    if (!host) return
    document.title = `${title} · Widget Studio`
    host.querySelector<HTMLButtonElement>('.studioFocusBack')?.focus()
  }, [host, title])
  return host ? createPortal(<main className={'chatbuilder-page studioFocusPage'+(aside ? ' studioFocusWithPreview' : '')}><header className="studioFocusHeader"><button type="button" className="studioFocusBack" disabled={backDisabled} onClick={onBack}><FiArrowLeft aria-hidden="true" />{no ? 'Tilbake' : 'Back'}</button><span>{title}</span></header><div className="studioFocusLayout"><div className="studioFocusContent">{children}</div>{aside && <aside className="studioFocusPreview">{aside}</aside>}</div></main>, host) : null
}
