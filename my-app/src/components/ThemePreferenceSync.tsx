'use client'

import { useEffect } from 'react'
import {
  APP_THEME_EVENT,
  APP_THEME_STORAGE_KEY,
  applyAppThemeToDocument,
  readAppThemePreference,
  resolveAppThemePreference,
} from '@/lib/theme-preference'

export default function ThemePreferenceSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = () => {
      applyAppThemeToDocument(resolveAppThemePreference())
    }

    const syncThemeFromStorage = (event: StorageEvent) => {
      if (!event.key || event.key === APP_THEME_STORAGE_KEY) {
        syncTheme()
      }
    }

    const syncThemeFromEvent = () => {
      syncTheme()
    }

    if (!readAppThemePreference()) {
      syncTheme()
    } else {
      applyAppThemeToDocument(resolveAppThemePreference())
    }

    media.addEventListener?.('change', syncTheme)
    window.addEventListener('storage', syncThemeFromStorage)
    window.addEventListener(APP_THEME_EVENT, syncThemeFromEvent)

    return () => {
      media.removeEventListener?.('change', syncTheme)
      window.removeEventListener('storage', syncThemeFromStorage)
      window.removeEventListener(APP_THEME_EVENT, syncThemeFromEvent)
    }
  }, [])

  return null
}
