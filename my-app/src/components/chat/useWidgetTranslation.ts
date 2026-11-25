'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getBuiltinWidgetTranslations } from '@/lib/widget-builtin-translations.mjs'
import { auth } from '@/lib/firebase'
import type { WidgetLanguage } from '@/types/database'

export function useWidgetTranslation(language: WidgetLanguage, copy: string[], widgetKey?: string, embedToken?: string, enabled = true, fingerprint?: string, sourceLanguage: WidgetLanguage = 'no') {
  const cache = useRef<Record<string, Record<string, string>>>({})
  const [result, setResult] = useState<{ key: string; translations: Record<string, string> } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const copyKey = JSON.stringify([...new Set(copy)].sort())
  const scope = widgetKey || 'preview'
  const cacheKey = JSON.stringify([scope, language, sourceLanguage, copyKey])
  // Standard Norwegian/English copy is bundled; authored copy is already in its source language.
  const needsTranslation = enabled && (language !== sourceLanguage || !['no', 'en'].includes(language))
  useEffect(() => {
    const cached = cache.current[cacheKey]
    if (cached) setResult({ key: cacheKey, translations: cached })
    if (!needsTranslation || cached || (widgetKey && !embedToken)) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setFailedKey(null)
      void (async () => {
        const token = !widgetKey && auth.currentUser ? await auth.currentUser.getIdToken() : ''
        const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(embedToken ? { 'X-Vintra-Embed-Token': embedToken } : {}), ...(fingerprint ? { 'X-Vintra-Fingerprint': fingerprint } : {}) }
        const body = JSON.stringify({ language, sourceLanguage, ...(widgetKey ? { widgetKey } : { copy: JSON.parse(copyKey) }) })
        const request = () => fetch('/api/widget/translate', { method: 'POST', signal: controller.signal, headers, body })
        let response = await request()
        // Language changes can happen after the initial widget token has expired.
        if (response.status === 403 && widgetKey) {
          const renewed = await fetch(`/api/widget/embed-token?key=${encodeURIComponent(widgetKey)}`, {
            signal: controller.signal, headers: fingerprint ? { 'X-Vintra-Fingerprint': fingerprint } : {},
          })
          if (renewed.ok) {
            const data = await renewed.json()
            if (typeof data.token === 'string' && data.token) {
              headers['X-Vintra-Embed-Token'] = data.token
              response = await request()
            }
          }
        }
        if (!response.ok) throw new Error('Translation unavailable')
        const data = await response.json()
        if (!controller.signal.aborted) {
          cache.current[cacheKey] = { ...cache.current[cacheKey], ...data.translations }
          setResult({ key: cacheKey, translations: cache.current[cacheKey] })
        }
      })().catch(() => { if (!controller.signal.aborted) setFailedKey(cacheKey) })
    }, 450)
    return () => { clearTimeout(timer); controller.abort() }
  }, [language, copyKey, widgetKey, embedToken, retry, needsTranslation, fingerprint, scope, cacheKey, sourceLanguage])
  const translations = result?.key === cacheKey ? result.translations : cache.current[cacheKey] || null
  const builtin = useMemo(() => getBuiltinWidgetTranslations(language), [language])
  const t = useCallback((text: string, norwegian?: string) => builtin[text] || translations?.[text] || (language === 'no' && norwegian ? norwegian : text), [translations, language, builtin])
  const error = needsTranslation && failedKey === cacheKey
  return { t, error, loading: needsTranslation && Boolean(!widgetKey || embedToken) && !translations && !error, retry: () => { setFailedKey(null); setRetry(value => value + 1) } }
}
