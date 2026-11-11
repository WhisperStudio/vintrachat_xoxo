'use client'
import { useVintraLanguage } from '@/lib/i18n'
import './compact-language-switch.css'

export default function CompactLanguageSwitch() {
  const { language, setLanguage } = useVintraLanguage()
  return <div className="compactLanguageSwitch" role="group" aria-label={language === 'no' ? 'Språk' : 'Language'}>
    <button type="button" lang="nb" aria-label="Norsk" aria-pressed={language === 'no'} onClick={() => setLanguage('no')}>NO</button>
    <span aria-hidden="true">/</span>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
  </div>
}
