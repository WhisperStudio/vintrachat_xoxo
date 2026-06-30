import {
  APP_THEME_EVENT,
  readAppThemePreference,
  resolveAppThemePreference,
  writeAppThemePreference,
} from '@/lib/theme-preference'

export type MainLandingThemeMode = 'night' | 'day'

export const MAIN_LANDING_THEME_STORAGE_KEY = 'vintra-app-theme'
export const MAIN_LANDING_THEME_EVENT = APP_THEME_EVENT

export function readMainLandingThemePreference(): MainLandingThemeMode | null {
  const stored = readAppThemePreference()
  if (!stored) return null
  return stored === 'dark' ? 'night' : 'day'
}

export function resolveMainLandingThemePreference(): MainLandingThemeMode {
  return resolveAppThemePreference() === 'dark' ? 'night' : 'day'
}

export function writeMainLandingThemePreference(mode: MainLandingThemeMode) {
  writeAppThemePreference(mode === 'night' ? 'dark' : 'light')
}
