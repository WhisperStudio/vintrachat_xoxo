'use client'

import { useEffect, useRef, useState } from 'react'
import { normalizeSiteSeason, type SiteSeason } from '@/lib/seasonal-theme'
import styles from './LoadingAnimation.module.css'

let seasonRequest: Promise<SiteSeason> | undefined
let requestedAt = 0
function getSeason() {
  if (Date.now() - requestedAt > 15_000) { seasonRequest = undefined; requestedAt = Date.now() }
  return seasonRequest ??= fetch('/api/vintra-admin/season')
    .then(async response => response.ok ? normalizeSiteSeason((await response.json()).season) : 'standard' as const)
    .catch(() => 'standard' as const)
}

function SeasonToken({ season }: { season: SiteSeason }) {
  return <svg viewBox="0 0 32 32" fill="none">
    {season === 'easter' ? <><path d="M26 20c0 7-5 10-10 10S6 27 6 20 12 2 16 2s10 11 10 18Z" fill="#f4deb3" /><path d="m7 18 5-3 4 3 4-3 5 3M8 24h16" stroke="#b681a4" strokeWidth="2" /><circle cx="16" cy="9" r="2" fill="#a1bbb2" /></>
    : season === 'winter' ? <><circle cx="16" cy="16" r="13" fill="#e7f3fa" stroke="#a5c4d8" /><path d="m9 10 4-3m-5 9 2-2m9 10 4-3" stroke="#b5d3e4" strokeWidth="2" strokeLinecap="round" /><path d="M9 22a9 9 0 0 0 15-7" stroke="#c9dfe9" strokeWidth="2" /></>
    : season === 'summer' ? <><circle cx="16" cy="16" r="13" fill="#fff5d9" stroke="#d6bf94" /><path d="M16 16 6 8a13 13 0 0 1 17-3Z" fill="#df8d7c" /><path d="m16 16 12-5a13 13 0 0 1-7 17Z" fill="#70a6b7" /><path d="m16 16-2 13A13 13 0 0 1 3 17Z" fill="#e8c572" /><circle cx="16" cy="16" r="3" fill="#fff5d9" /></>
    : season === 'halloween' ? <><circle cx="16" cy="15" r="12" fill="#f4ece7" stroke="#a9828a" /><path d="m7 10 6 4m12-4-6 4M10 24v4m11-5v6" stroke="#b65764" strokeWidth="2" strokeLinecap="round" /><circle cx="16" cy="15" r="6" fill="#9a5361" /><circle cx="16" cy="15" r="3" fill="#273d4c" /><circle cx="18" cy="13" r="1.5" fill="white" /></>
    : <><path d="m5 8 10 18a2 2 0 0 0 3 0L28 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17" cy="8" r="3" fill="currentColor" opacity=".45" /></>}
  </svg>
}

export default function LoadingAnimation({ label = 'Laster…', compact = false }: { label?: string; compact?: boolean }) {
  const [season, setSeason] = useState<SiteSeason>('standard')
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const parent = ref.current?.parentElement?.closest<HTMLElement>('[data-season]')
    if (parent) {
      const sync = () => setSeason(normalizeSiteSeason(parent.dataset.season))
      sync()
      const observer = new MutationObserver(sync)
      observer.observe(parent, { attributes: true, attributeFilter: ['data-season'] })
      return () => observer.disconnect()
    }
    let active = true
    void getSeason().then(value => { if (active) setSeason(value) })
    return () => { active = false }
  }, [])
  return (
    <span ref={ref} className={`${styles.loader} ${compact ? styles.compact : ''}`} role="status" aria-label={label}>
      <span className={styles.scene} aria-hidden="true" data-season={season}>
        <svg className={styles.landscape} viewBox="0 0 100 100" fill="none">
          <path d="M8 70C22 70 30 54 42 37c10 11 11 28 25 26 8-1 13-11 17-16 3 9 6 20 12 23" fill="currentColor" opacity=".12" />
          <path d="M8 70C22 70 30 54 42 37c10 11 11 28 25 26 8-1 13-11 17-16 3 9 6 20 12 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="m35 47 7-10 5 10-5-3Z" fill="currentColor" opacity=".35" />
          <path d="M15 79c20-8 48 9 71-2" stroke="currentColor" opacity=".25" strokeLinecap="round" />
        </svg>
        <span className={styles.track} />
        <span className={styles.orbit}><span className={styles.token}><SeasonToken season={season} /></span></span>
        <span className={styles.secondOrbit}><span className={styles.token}><SeasonToken season={season} /></span></span>
      </span>
    </span>
  )
}
