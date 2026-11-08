'use client'

import { useState } from 'react'
import type { ChatAssistantConfig } from '@/types/database'
import { mergeWebsiteKnowledge } from '@/lib/studio-onboarding.mjs'
import { useAuth } from '@/context/AuthContext'
import './WidgetFlowSettings.css'

export default function StudioKnowledgeSettings({ value, onChange, no }: {
  value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no: boolean
}) {
  const { firebaseUser } = useAuth()
  const [url, setUrl] = useState(value.knowledgeBase?.websiteUrls?.[0] || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scanned, setScanned] = useState(false)
  const [pendingScan, setPendingScan] = useState<Parameters<typeof mergeWebsiteKnowledge>[1] | null>(null)
  const applyScan = (result: Parameters<typeof mergeWebsiteKnowledge>[1]) => {
    onChange(mergeWebsiteKnowledge(value, result))
    setPendingScan(null)
    setScanned(true)
  }
  const scan = async () => {
    setBusy(true); setError(''); setScanned(false)
    try {
      if (!firebaseUser) throw new Error(no ? 'Logg inn for å hente informasjon fra nettsiden.' : 'Sign in to import your website.')
      const response = await fetch('/api/scan-website', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await firebaseUser.getIdToken() },
        body: JSON.stringify({ url }),
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.result) throw new Error(result.error || (no ? 'Kunne ikke lese nettsiden.' : 'Unable to read website.'))
      if (value.businessContext.trim()) setPendingScan(result.result)
      else applyScan(result.result)
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to read website.') }
    finally { setBusy(false) }
  }
  return <div className="studioKnowledge widgetFlowSettings">
    <div className="studioSectionIntro"><span className="studioEyebrow">{no ? 'BEDRIFTEN' : 'BUSINESS'}</span><h2>{no ? 'Hva skal assistenten vite?' : 'What should your assistant know?'}</h2><p>{no ? 'Hent et utkast fra nettsiden din, eller skriv selv. Kontroller alltid opplysningene før du lagrer.' : 'Import a draft from your website, or write it yourself. Check the information before saving.'}</p></div>
    <div className="studioWebsiteImport">
      <label className="widgetFlowField"><span>{no ? 'Lenke til bedriften' : 'Business website'}</span><input type="url" placeholder="https://din-bedrift.no" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} /></label>
      <button type="button" disabled={busy || !url.trim()} onClick={() => void scan()}>{busy ? (no ? 'Leser nettsiden…' : 'Reading website…') : (no ? 'Hent informasjon' : 'Import information')}</button>
      {error && <p role="alert">{error}</p>}
      {scanned && <p role="status">{no ? 'Informasjonen er hentet. Gå gjennom utkastet under. Funksjoner og svarstil er ikke valgt for deg.' : 'Information imported. Review the draft below. Features and response style remain your choices.'}</p>}
      {pendingScan && <div role="status"><p>{no ? 'Du har allerede skrevet bedriftsinformasjon. Vil du erstatte den med det nye utkastet?' : 'You already have business information. Replace it with the imported draft?'}</p><button type="button" onClick={() => applyScan(pendingScan)}>{no ? 'Bruk nytt utkast' : 'Use new draft'}</button><button type="button" onClick={() => setPendingScan(null)}>{no ? 'Behold teksten min' : 'Keep my text'}</button></div>}
    </div>
    <label className="widgetFlowField"><span>{no ? 'Bedriftsnavn' : 'Business name'}</span><input value={value.businessProfile?.businessName || ''} onChange={e => onChange({ ...value, businessProfile: { ...value.businessProfile!, businessName: e.target.value } })} /></label>
    <label className="widgetFlowField"><span>{no ? 'Bedriftsinformasjon og godkjente svar' : 'Business information and approved answers'}</span><textarea rows={9} value={value.businessContext} onChange={e => onChange({ ...value, businessContext: e.target.value })} placeholder={no ? 'Hva tilbyr dere? Hvilke spørsmål skal assistenten kunne svare på?' : 'What do you offer? Which questions should the assistant answer?'} /></label>
    <label className="widgetFlowToggle"><span>{no ? 'Svar bare ut fra opplysningene jeg har gitt' : 'Answer only from the information I provide'}</span><input type="checkbox" checked={value.strictContextOnly} onChange={e => onChange({ ...value, strictContextOnly: e.target.checked })} /></label>
    <label className="widgetFlowField"><span>{no ? 'Hva skal assistenten unngå?' : 'What should the assistant avoid?'}</span><textarea rows={3} value={value.restrictions} onChange={e => onChange({ ...value, restrictions: e.target.value })} /></label>
    <details className="studioDetails"><summary>{no ? 'Flere kunnskapsfelt og instruksjoner' : 'More knowledge fields and instructions'}</summary><div className="widgetFlowSettings">
      {(['openingHours', 'contactInfo', 'addresses', 'manualNotes'] as const).map(key => <label className="widgetFlowField" key={key}><span>{{ openingHours: no ? 'Åpningstider' : 'Opening hours', contactInfo: no ? 'Bedriftens kontaktinfo' : 'Business contact details', addresses: no ? 'Adresser' : 'Addresses', manualNotes: no ? 'Tilleggsinformasjon' : 'Additional knowledge' }[key]}</span><textarea rows={2} value={value.knowledgeBase?.[key] || ''} onChange={e => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, [key]: e.target.value } })} /></label>)}
      {(['systemPrompt', 'extraInstructions'] as const).map(key => <label className="widgetFlowField" key={key}><span>{key === 'systemPrompt' ? (no ? 'Assistentens grunninstruksjon' : 'Assistant base instruction') : (no ? 'Ekstra instruksjoner' : 'Extra instructions')}</span><textarea rows={3} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} /></label>)}
    </div></details>
  </div>
}
