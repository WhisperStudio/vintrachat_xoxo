'use client'

import { useEffect, useRef } from 'react'
import type { WidgetLanguage } from '@/types/database'
import { WIDGET_LANGUAGES } from '@/lib/widget-localization'

export default function WidgetLanguagePicker({ language, languages, label, onChange }: {
  language: WidgetLanguage; languages: WidgetLanguage[]; label: string; onChange: (language: WidgetLanguage) => void
}) {
  const menu = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (menu.current && !event.composedPath().includes(menu.current)) menu.current.open = false
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])
  const close = () => {
    if (!menu.current) return
    menu.current.open = false
    menu.current.querySelector('summary')?.focus()
  }
  return (
    <details ref={menu} className="widget-language-picker" onKeyDown={event => {
      if (event.key === 'Escape' && menu.current?.open) { event.preventDefault(); event.stopPropagation(); close() }
    }}>
      <summary className="widget-language-trigger" aria-label={label} title={label}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 6 6m-7 0 6-6 2-3M2 5h12M7 2h1m14 20-5-11-5 11m2-4h6" /></svg>
      </summary>
      <div className="widget-language-menu" aria-label={label}>
        <span className="widget-language-heading">{label}</span>
        {languages.map(code => <button key={code} type="button" className="widget-language-option" aria-pressed={code === language} lang={code === 'no' ? 'nb' : code} onClick={() => { onChange(code); close() }}>
          <span className="widget-language-code" aria-hidden="true">{code === 'no' ? 'NO' : code.toUpperCase()}</span>
          <span>{WIDGET_LANGUAGES[code]}</span>
          {code === language && <svg className="widget-language-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
        </button>)}
      </div>
    </details>
  )
}
