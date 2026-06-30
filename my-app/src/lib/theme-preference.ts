'use client'

export type AppThemeMode = 'light' | 'dark'

export const APP_THEME_STORAGE_KEY = 'vintra-app-theme'
export const APP_THEME_EVENT = 'vintra:app-theme'

export function readAppThemePreference(): AppThemeMode | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(APP_THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : null
}

export function resolveAppThemePreference(): AppThemeMode {
  const stored = readAppThemePreference()
  if (stored) return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyAppThemeToDocument(mode: AppThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
  document.body.dataset.theme = mode
}

export function writeAppThemePreference(mode: AppThemeMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_THEME_STORAGE_KEY, mode)
  applyAppThemeToDocument(mode)
  window.dispatchEvent(new CustomEvent<AppThemeMode>(APP_THEME_EVENT, { detail: mode }))
}
