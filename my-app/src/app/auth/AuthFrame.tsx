'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { FiArrowLeft, FiArrowUpRight, FiEye, FiEyeOff, FiMoon, FiSun } from 'react-icons/fi'
import { useVintraLanguage } from '@/lib/i18n'
import { resolveAppThemePreference, writeAppThemePreference } from '@/lib/theme-preference'
import AuthLandscape from '@/svgs/AuthLandscape'
import { normalizeSiteSeason, type SiteSeason } from '@/lib/seasonal-theme'
import SeasonSnowfall from '@/components/SeasonSnowfall'
import NordicTrees from '@/svgs/NordicTrees'
import GlobeSwitcher from '@/components/langSwitch'
import './auth-design.css'

export default function AuthFrame({ children, signup = false, recovery = false }: { children: ReactNode; signup?: boolean; recovery?: boolean }) {
  const { language } = useVintraLanguage()
  const no = language === 'no'
  const [season, setSeason] = useState<SiteSeason>('standard')
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/vintra-admin/season', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        if (!response.ok) return
        const payload = await response.json() as { season?: unknown }
        setSeason(normalizeSiteSeason(payload.season))
      })
      .catch(() => { /* Keep the standard landscape when the request is unavailable. */ })
    return () => controller.abort()
  }, [])

  return (
    <div className="nordicAuth" data-season={season}>
      <header className="nordicAuthHeader">
        <Link href="/" className="nordicAuthBrand" aria-label={no ? 'Vintra – til forsiden' : 'Vintra – home'}>
          <img src="/image/logo.png" width="48" height="48" alt="" aria-hidden="true" />
          <span>vintra<span className="nordicAuthBrandCaption">NORDIC</span></span>
        </Link>
        <div className="nordicAuthTools">
          <GlobeSwitcher size={42} glass />
          <button className="nordicAuthTheme" type="button" onClick={() => writeAppThemePreference(resolveAppThemePreference() === 'dark' ? 'light' : 'dark')}>
            <FiMoon className="nordicAuthMoon" aria-hidden="true" /><FiSun className="nordicAuthSun" aria-hidden="true" />
            <span className="nordicAuthSrOnly">{no ? 'Bytt mellom lys og mørk modus' : 'Switch between light and dark mode'}</span>
          </button>
        </div>
      </header>

      <main className="nordicAuthMain">
        <aside className="nordicAuthStory" aria-label={no ? 'Velkommen til Vintra' : 'Welcome to Vintra'}>
          <div className="nordicAuthStoryCopy">
            <h2>{recovery ? (no ? 'Få tilgang til' : 'Access') : (no ? 'Kundesamtaler.' : 'Customer conversations.')}<br /><em>{recovery ? (no ? 'kontoen din.' : 'your account.') : (no ? 'Samlet på ett sted.' : 'All in one place.')}</em></h2>
            <p>{recovery ? (no ? 'Tilbakestill passordet for å få tilgang til arbeidsområdet ditt igjen.' : 'Reset your password to access your workspace again.') : signup ? (no ? 'Opprett et arbeidsområde for bedriften eller bli med i teamet ditt. Sett opp chatten, svar på henvendelser og følg opp kundene i Vintra.' : 'Create a business workspace or join your team. Set up your chat, reply to enquiries and follow up with customers in Vintra.') : (no ? 'Logg inn for å svare på henvendelser, administrere chatten og følge opp teamets oppgaver.' : 'Sign in to reply to enquiries, manage your chat and follow up on your team’s tasks.')}</p>
          </div>
          <div className="nordicAuthLandscape" aria-hidden="true"><div className="nordicAuthSunDisc" /><AuthLandscape className="nordicAuthMountains" /><NordicTrees className="nordicAuthTrees" />{season === 'winter' && <SeasonSnowfall />}</div>
        </aside>

        <section className="nordicAuthFormPanel" aria-labelledby="auth-title">
          <div className="nordicAuthFormTop"><Link href="/"><FiArrowLeft aria-hidden="true" />{no ? 'Til forsiden' : 'Back to home'}</Link></div>
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
