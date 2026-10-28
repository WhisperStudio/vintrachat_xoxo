'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiArrowUpRight, FiEye, FiEyeOff, FiGlobe, FiMoon, FiSun } from 'react-icons/fi'
import { useVintraLanguage } from '@/lib/i18n'
import { resolveAppThemePreference, writeAppThemePreference } from '@/lib/theme-preference'
import MountainBackground from '@/svgs/MountainBackground'
import './auth-design.css'

export default function AuthFrame({ children, signup = false, recovery = false }: { children: ReactNode; signup?: boolean; recovery?: boolean }) {
  const { language, setLanguage } = useVintraLanguage()
  const no = language === 'no'

  return (
    <div className="nordicAuth">
      <header className="nordicAuthHeader">
        <Link href="/" className="nordicAuthBrand" aria-label={no ? 'Vintra – til forsiden' : 'Vintra – home'}>
          <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="m5 9 13 23L31 9h-8l-5 10-5-10H5Z" fill="currentColor" /></svg>
          <span>vintra<span className="nordicAuthBrandCaption">NORDIC</span></span>
        </Link>
        <div className="nordicAuthTools">
          <label className="nordicAuthLanguage">
            <FiGlobe aria-hidden="true" />
            <select aria-label={no ? 'Språk' : 'Language'} value={language} onChange={(event) => setLanguage(event.target.value as 'no' | 'en')}>
              <option value="no">Norsk</option><option value="en">English</option>
            </select>
          </label>
          <button className="nordicAuthTheme" type="button" onClick={() => writeAppThemePreference(resolveAppThemePreference() === 'dark' ? 'light' : 'dark')}>
            <FiMoon className="nordicAuthMoon" aria-hidden="true" /><FiSun className="nordicAuthSun" aria-hidden="true" />
            <span className="nordicAuthSrOnly">{no ? 'Bytt mellom lys og mørk modus' : 'Switch between light and dark mode'}</span>
          </button>
        </div>
      </header>

      <main className="nordicAuthMain">
        <aside className="nordicAuthStory" aria-label={no ? 'Velkommen til Vintra' : 'Welcome to Vintra'}>
          <div className="nordicAuthStoryCopy">
            <span className="nordicAuthEyebrow"><span />{no ? 'NÆRMERE KUNDENE DINE' : 'CLOSER TO YOUR CUSTOMERS'}</span>
            <h2>{recovery ? (no ? 'Tilbake til' : 'Back to') : (no ? 'God dialog.' : 'Great conversations.')}<br /><em>{recovery ? (no ? 'det som teller.' : 'what matters.') : (no ? 'Starter her.' : 'Start here.')}</em></h2>
            <p>{recovery ? (no ? 'Glemt passordet? Vi hjelper deg tilbake til samtalene, kundene og teamet ditt.' : 'Forgot your password? Let’s get you back to your conversations, customers and team.') : (no ? 'Et roligere sted å samle samtaler, følge opp kunder og få oversikt. Laget for deg og teamet ditt.' : 'A calmer place to bring conversations together, support your customers and see the bigger picture. Built for you and your team.')}</p>
            <div className="nordicAuthStoryTags"><span>{no ? 'Samtaler' : 'Conversations'}</span><i /><span>{no ? 'Samarbeid' : 'Collaboration'}</span><i /><span>{no ? 'Oversikt' : 'Insights'}</span></div>
          </div>
          <div className="nordicAuthLandscape" aria-hidden="true"><div className="nordicAuthSunDisc" /><MountainBackground className="nordicAuthMountains" /></div>
          <div className="nordicAuthStoryFooter"><span>{no ? 'Nordisk ro. Digital flyt.' : 'Nordic calm. Digital flow.'}</span><span>VINTRA ®</span></div>
        </aside>

        <section className="nordicAuthFormPanel" aria-labelledby="auth-title">
          <div className="nordicAuthFormTop"><Link href="/"><FiArrowLeft aria-hidden="true" />{no ? 'Til forsiden' : 'Back to home'}</Link><span>{recovery ? (no ? 'KONTOHJELP' : 'ACCOUNT RECOVERY') : signup ? (no ? 'KOM I GANG' : 'GET STARTED') : (no ? 'DITT ARBEIDSOMRÅDE' : 'YOUR WORKSPACE')}</span></div>
          <div className="nordicAuthFormContent">{children}</div>
          <div className="nordicAuthFormFooter"><span>Vintra Nordic</span><Link href="/">{no ? 'Bli kjent med Vintra' : 'Discover Vintra'}<FiArrowUpRight aria-hidden="true" /></Link></div>
        </section>
      </main>
    </div>
  )
}

export function PasswordField({ id, label, placeholder, value, onChange, autoComplete = 'new-password', minLength, hint }: {
  id: string; label: string; placeholder: string; value: string; onChange: (value: string) => void;
  autoComplete?: 'current-password' | 'new-password'; minLength?: number; hint?: string;
}) {
  const [visible, setVisible] = useState(false)
  const { language } = useVintraLanguage()
  return (
    <div className="nordicAuthField">
      <label htmlFor={id}>{label}</label>
      <div className="nordicAuthPassword">
        <input id={id} name={id} type={visible ? 'text' : 'password'} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} required minLength={minLength} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button type="button" aria-label={`${visible ? (language === 'no' ? 'Skjul' : 'Hide') : (language === 'no' ? 'Vis' : 'Show')} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible((current) => !current)}>{visible ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}</button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  )
}
