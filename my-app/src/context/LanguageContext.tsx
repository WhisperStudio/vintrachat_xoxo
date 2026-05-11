'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'no' | 'en'

export const languageLabels: Record<Language, string> = {
  no: 'Norsk',
  en: 'English',
}

const STORAGE_KEY = 'vintra-language'

function detectPreferredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem('vintra-main-language')
  if (savedLanguage === 'no' || savedLanguage === 'en') return savedLanguage

  const languages = window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language]
  const usesNorwegian = languages.some((language) => {
    const normalized = language?.toLowerCase() || ''
    return normalized.startsWith('no') || normalized.startsWith('nb') || normalized.startsWith('nn')
  })
  const isInNorwayTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Oslo'

  return usesNorwegian || isInNorwayTimeZone ? 'no' : 'en'
}

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    setLanguageState(detectPreferredLanguage())
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    window.localStorage.setItem(STORAGE_KEY, language)
    window.localStorage.setItem('vintra-main-language', language)
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
    }),
    [language]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }

  return context
}
