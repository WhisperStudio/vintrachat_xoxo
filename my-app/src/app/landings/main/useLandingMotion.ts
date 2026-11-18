'use client'

import { useEffect, type RefObject } from 'react'

/** Gentle wheel inertia while keeping touch, keyboard and nested widgets native. */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    const host = root?.querySelector<HTMLElement>('.storyHeroHost')
    if (!root || !host) return
    document.documentElement.classList.add('vintra-story-scroll')
    let frame = 0
    const update = () => {
      frame = 0
      const rect = host.getBoundingClientRect()
      const start = Math.max(rect.height * .2, 100)
      const progress = window.scrollY < 8 ? 0 : Math.min(Math.max((start - rect.top) / Math.max(rect.height * .85, 180), 0), 1)
      root.style.setProperty('--host-dissolve', String(progress))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.classList.remove('vintra-story-scroll')
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [rootRef])

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let current = window.scrollY
    let target = current
    let lastWritten = current
    let lastTime = 0
    const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
      current = target = lastWritten = window.scrollY
    }
    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000 || .016, .05)
      lastTime = time
      target = Math.min(Math.max(target, 0), maxScroll())
      // Time-based damping gives the same soft braking at 60 and 120 Hz.
      current += (target - current) * (1 - Math.exp(-delta / .19))
      if (Math.abs(target - current) < .5) current = target
      lastWritten = current
      window.scrollTo({ top: current, behavior: 'instant' })
      if (Math.abs(target - current) >= .5) frame = requestAnimationFrame(animate)
      else frame = 0
    }
    const wheel = (event: WheelEvent) => {
      if (!finePointer.matches || reduced.matches || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.cancelable) return
      const element = event.target instanceof Element ? event.target : null
      if (element?.closest('.vintra-widget, [data-vintra-widget-key], dialog, [role="dialog"], textarea, select, input')) return
      for (let parent = element; parent && parent !== document.body; parent = parent.parentElement) {
        if (parent.scrollHeight <= parent.clientHeight + 1) continue
        if (!/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) continue
        if ((event.deltaY > 0 && parent.scrollTop + parent.clientHeight < parent.scrollHeight - 1) || (event.deltaY < 0 && parent.scrollTop > 1)) return
      }
      const distance = event.deltaY * (event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? window.innerHeight : 1)
      if (!distance) return
      if (!frame) current = target = lastWritten = window.scrollY
      const next = Math.min(Math.max(target + distance, 0), maxScroll())
      if (next === target && !frame) return
      event.preventDefault()
      target = next
      if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(animate) }
    }
    const externalScroll = () => { if (frame && Math.abs(window.scrollY - lastWritten) > 2) stop() }
    const keyDown = (event: KeyboardEvent) => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)) stop() }
    window.addEventListener('wheel', wheel, { passive: false })
    window.addEventListener('scroll', externalScroll, { passive: true })
    window.addEventListener('pointerdown', stop, { passive: true })
    window.addEventListener('touchstart', stop, { passive: true })
    window.addEventListener('keydown', keyDown)
    reduced.addEventListener('change', stop)
    return () => {
      stop()
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('scroll', externalScroll)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('keydown', keyDown)
      reduced.removeEventListener('change', stop)
    }
  }, [])

  // Keep the site chat available without its welcome card covering small screens.
  useEffect(() => {
    let responsiveStyle: HTMLStyleElement | null = null
    const install = () => {
      const shadow = document.querySelector('[data-vintra-widget-key="GIN6CPbnBnbTOoEPU3wctBqr"]')?.shadowRoot
      if (!shadow || responsiveStyle) return
      responsiveStyle = document.createElement('style')
      responsiveStyle.dataset.vintraLandingResponsive = 'true'
      responsiveStyle.textContent = '@media (max-width: 600px), (max-height: 560px) { .widget-start-card { display: none !important; } }'
      shadow.appendChild(responsiveStyle)
      observer.disconnect()
    }
    const observer = new MutationObserver(install)
    observer.observe(document.body, { childList: true })
    install()
    return () => { observer.disconnect(); responsiveStyle?.remove() }
  }, [])

}
