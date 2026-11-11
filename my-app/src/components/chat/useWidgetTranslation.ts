'use client'
import { useCallback, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import type { WidgetLanguage } from '@/types/database'

export function useWidgetTranslation(language: WidgetLanguage, copy: string[], widgetKey?: string, embedToken?: string, enabled = true, fingerprint?: string) {
  const [result, setResult] = useState<{ language: string; copyKey: string; translations: Record<string, string> } | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const copyKey = JSON.stringify(copy)
  useEffect(() => {
    if (!enabled || (widgetKey && !embedToken)) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setError(false)
      void (async () => {
        const token = !widgetKey && auth.currentUser ? await auth.currentUser.getIdToken() : ''
        const response = await fetch('/api/widget/translate', {
          method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(embedToken ? { 'X-Vintra-Embed-Token': embedToken } : {}), ...(fingerprint ? { 'X-Vintra-Fingerprint': fingerprint } : {}) },
          body: JSON.stringify({ language, ...(widgetKey ? { widgetKey } : { copy: JSON.parse(copyKey) }) }),
        })
        if (!response.ok) throw new Error('Translation unavailable')
        const data = await response.json()
        if (!controller.signal.aborted) setResult({ language, copyKey, translations: data.translations })
      })().catch(() => { if (!controller.signal.aborted) setError(true) })
    }, 450)
    return () => { clearTimeout(timer); controller.abort() }
  }, [language, copyKey, widgetKey, embedToken, retry, enabled, fingerprint])
  const translations = result?.language === language && result.copyKey === copyKey ? result.translations : null
  const t = useCallback((text: string, norwegian?: string) => translations?.[text] || (language === 'no' && norwegian ? norwegian : text), [translations, language])
  return { t, error: enabled && error, loading: enabled && !translations && !error, retry: () => setRetry(value => value + 1) }
}
