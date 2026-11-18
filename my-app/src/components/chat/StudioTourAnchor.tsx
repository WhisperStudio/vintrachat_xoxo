'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './StudioTourAnchor.css'

/** Keep the guide beside the current action, including inside focused module pages. */
export default function StudioTourAnchor({ selector, children, inline = false, nearTarget = false }: { selector: string; children: ReactNode; inline?: boolean; nearTarget?: boolean }) {
  return inline ? <InlineTourAnchor selector={selector} nearTarget={nearTarget}>{children}</InlineTourAnchor> : <FloatingTourAnchor selector={selector}>{children}</FloatingTourAnchor>
}

function InlineTourAnchor({ selector, children, nearTarget }: { selector: string; children: ReactNode; nearTarget: boolean }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    let target: HTMLElement | undefined
    let host: HTMLElement | null = null
    let frame = 0
    const sync = () => {
      frame = 0
      const next = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(element => element.getClientRects().length && !element.closest('[inert], .studioTourInlineSlot, .studioTourAnchor'))
      if (next === target && host?.isConnected) return
      target?.classList.remove('studioTourTarget')
      host?.remove()
      target = next
      if (!target) { host = null; setSlot(null); return }
      target.classList.add('studioTourTarget')
      const content = nearTarget ? target : target.closest('.studioModulePage, .studioModuleWorkspace, .studioDesignIndex, .studioFocusedDesign, .studioSaveBar, .billing-hero, .billing-cards, .billing-comparison, .billing-faq, .billing-account') || target.closest('nav') || target
      host = document.createElement('div')
      host.className = 'studioTourInlineSlot'
      content.before(host)
      setSlot(host)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync) }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'inert', 'aria-expanded'] })
    const onResize = () => { if (host) host.scrollIntoView({ block: 'start', behavior: 'instant' }) }
    window.addEventListener('resize', onResize)
    schedule()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', onResize); target?.classList.remove('studioTourTarget'); host?.remove() }
  }, [selector, nearTarget])
  useLayoutEffect(() => {
    if (!slot) return
    // Scroll after the portal has its real height, so browser scroll anchoring
    // cannot keep the target in place by pushing the guide above the viewport.
    const frame = requestAnimationFrame(() => slot.scrollIntoView({ block: 'start', behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [slot])
  return slot ? createPortal(<div className="studioTourInline">{children}</div>, slot) : null
}

function FloatingTourAnchor({ selector, children }: { selector: string; children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const scheduleRef = useRef<() => void>(() => {})
  const [placement, setPlacement] = useState<{ root: Element; left: number; top: number; side: string } | null>(null)

  useEffect(() => {
    let target: HTMLElement | undefined
    let frame = 0
    const update = () => {
      frame = 0
      const next = Array.from(document.querySelectorAll<HTMLElement>(selector)).find(element => element.getClientRects().length && !element.closest('[inert], .studioTourInlineSlot, .studioTourAnchor'))
      if (!next) {
        target?.classList.remove('studioTourTarget')
        target = undefined
        setPlacement(null)
        return
      }
      if (next !== target) {
        target?.classList.remove('studioTourTarget')
        target = next
        target.classList.add('studioTourTarget')
        target.scrollIntoView({ block: window.innerWidth < 1000 ? 'start' : 'center', behavior: 'instant' })
        if (window.innerWidth < 1000) window.scrollBy({ top: target.getBoundingClientRect().top - 110, behavior: 'instant' })
      }
      const rect = target.getBoundingClientRect()
      const width = Math.min(360, window.innerWidth - 24)
      const height = panelRef.current?.getBoundingClientRect().height || 260
      let side = 'below'
      let left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
      let top = rect.bottom + 16
      if (window.innerWidth >= 1000 && window.innerWidth - rect.right >= width + 32) {
        side = 'right'; left = rect.right + 18; top = rect.top
      } else if (window.innerWidth >= 1000 && rect.left >= width + 32) {
        side = 'left'; left = rect.left - width - 18; top = rect.top
      } else if (top + height > window.innerHeight - 12 && rect.top - height > 90) {
        side = 'above'; top = rect.top - height - 16
      } else if (top + height > window.innerHeight - 12) {
        side = 'bottom'; top = window.innerHeight - height - 12
      }
      top = Math.max(12, Math.min(top, window.innerHeight - height - 12))
      const root = target.closest('.chatbuilder-page') || document.body
      setPlacement(previous => previous?.root === root && previous.left === left && previous.top === top && previous.side === side ? previous : { root, left, top, side })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    scheduleRef.current = schedule
    const mutations = new MutationObserver(schedule)
    mutations.observe(document.body, { childList: true, subtree: true })
    schedule()
    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      mutations.disconnect()
      scheduleRef.current = () => {}
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      target?.classList.remove('studioTourTarget')
    }
  }, [selector])

  // The first portal mounts after the anchor is found; measure its real size next frame.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const resize = new ResizeObserver(() => scheduleRef.current())
    resize.observe(panel)
    return () => resize.disconnect()
  }, [placement?.root])

  return placement ? createPortal(<div ref={panelRef} className="studioTourAnchor" data-side={placement.side} style={{ left: placement.left, top: placement.top }}>{children}</div>, placement.root) : null
}
