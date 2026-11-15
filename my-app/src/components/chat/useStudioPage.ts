'use client'
import { useEffect, useState } from 'react'

export type StudioPage = { kind: 'module' | 'design'; id: string } | null
function readPage(): StudioPage {
  const raw = new URL(window.location.href).searchParams.get('studioPage')
  const match = raw?.match(/^(module|design):([a-zA-Z][a-zA-Z0-9-]*)$/)
  return match ? { kind: match[1] as 'module' | 'design', id: match[2] } : null
}
export default function useStudioPage() {
  const [page, setPage] = useState<StudioPage>(null)
  useEffect(() => {
    const sync = () => setPage(readPage())
    sync(); window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])
  const open = (kind: 'module' | 'design', id: string, widgetKey?: string) => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('studioPage') === `${kind}:${id}`) { setPage({ kind, id }); return }
    url.searchParams.set('studioPage', `${kind}:${id}`)
    if (widgetKey) url.searchParams.set('studioWidget', widgetKey)
    if (url.pathname.startsWith('/admin')) url.searchParams.set('section', 'widgets')
    window.history.pushState({ ...window.history.state, vintraStudioFocus: true }, '', url)
    setPage({ kind, id })
    window.scrollTo(0, 0)
  }
  const back = () => {
    if (window.history.state?.vintraStudioFocus) { window.history.back(); return }
    const url = new URL(window.location.href)
    if (page?.kind === 'design' && page.id !== 'overview') {
      url.searchParams.set('studioPage', 'design:overview')
      window.history.replaceState(window.history.state, '', url); setPage({ kind: 'design', id: 'overview' })
    } else {
      url.searchParams.delete('studioPage'); url.searchParams.delete('studioWidget')
      window.history.replaceState(window.history.state, '', url); setPage(null)
    }
  }
  return { page, open, back }
}
