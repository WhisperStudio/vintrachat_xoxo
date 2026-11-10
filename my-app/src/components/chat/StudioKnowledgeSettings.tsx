'use client'

import { useEffect, useRef, useState } from 'react'
import { FiBookOpen, FiBriefcase, FiDownloadCloud, FiLink, FiShield, FiSliders } from 'react-icons/fi'
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
  const requestRef = useRef<AbortController | null>(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const [pendingScan, setPendingScan] = useState<Parameters<typeof mergeWebsiteKnowledge>[1] | null>(null)
  const applyScan = (result: Parameters<typeof mergeWebsiteKnowledge>[1]) => {
    onChange(mergeWebsiteKnowledge(value, result))
    setPendingScan(null)
    setScanned(true)
  }
  const scan = async () => {
    requestRef.current?.abort()
    const request = new AbortController()
    requestRef.current = request
    setBusy(true); setError(''); setScanned(false)
    try {
      if (!firebaseUser) throw new Error(no ? 'Logg inn for å hente informasjon fra nettsiden.' : 'Sign in to import your website.')
      const response = await fetch('/api/scan-website', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await firebaseUser.getIdToken() },
        body: JSON.stringify({ url }), signal: request.signal,
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.result) throw new Error(result.error || (no ? 'Kunne ikke lese nettsiden.' : 'Unable to read website.'))
      if (value.businessContext.trim()) setPendingScan(result.result)
      else applyScan(result.result)
    } catch (error) { if (!request.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to read website.') }
    finally { setBusy(false) }
  }
  return <div className="studioKnowledge widgetFlowSettings">
    <div className="studioSectionIntro"><span className="studioSectionSymbol"><FiBookOpen aria-hidden="true" /></span><span className="studioEyebrow">{no ? 'BEDRIFTEN' : 'BUSINESS'}</span><h2>{no ? 'Hva skal assistenten vite?' : 'What should your assistant know?'}</h2><p>{no ? 'Hent et utkast fra nettsiden din, eller skriv selv. Kontroller alltid opplysningene før du lagrer.' : 'Import a draft from your website, or write it yourself. Check the information before saving.'}</p></div>
    <div className="studioWebsiteImport">
      <label className="widgetFlowField"><span><FiLink aria-hidden="true" />{no ? 'Lenke til bedriften' : 'Business website'}</span><input type="url" placeholder="https://din-bedrift.no" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} /></label>
      <button type="button" disabled={busy || !url.trim()} onClick={() => void scan()}><FiDownloadCloud aria-hidden="true" />{busy ? (no ? 'Leser nettsiden…' : 'Reading website…') : (no ? 'Hent informasjon' : 'Import information')}</button>
      {error && <p role="alert">{error}</p>}
      {scanned && <p role="status">{no ? 'Informasjonen er hentet. Gå gjennom utkastet under. Funksjoner og svarstil er ikke valgt for deg.' : 'Information imported. Review the draft below. Features and response style remain your choices.'}</p>}
      {scanned && !value.knowledgeBase?.pricing?.trim() && <p role="status">{no ? 'Fant ingen sikre priser per produkt. Fyll ut prisfeltet under, eller legg til lenken til prislisten som kilde. Botten skal ikke gjette manglende priser.' : 'No reliable per-product prices were found. Fill in the pricing field below or add your price-list URL. The bot must not guess missing prices.'}</p>}
      {pendingScan && <div role="status"><p>{no ? 'Du har allerede skrevet bedriftsinformasjon. Vil du erstatte den med det nye utkastet?' : 'You already have business information. Replace it with the imported draft?'}</p><button type="button" onClick={() => applyScan(pendingScan)}>{no ? 'Bruk nytt utkast' : 'Use new draft'}</button><button type="button" onClick={() => setPendingScan(null)}>{no ? 'Behold teksten min' : 'Keep my text'}</button></div>}
    </div>
    <label className="widgetFlowField"><span><FiBriefcase aria-hidden="true" />{no ? 'Bedriftsnavn' : 'Business name'}</span><input value={value.businessProfile?.businessName || ''} onChange={e => onChange({ ...value, businessProfile: { ...value.businessProfile!, businessName: e.target.value } })} /></label>
    <label className="widgetFlowField"><span>{no ? 'Bransje og hvem dere hjelper' : 'Industry and who you help'}</span><input value={value.businessProfile?.industry || ''} placeholder={no ? 'For eksempel frisørsalong – klipp og hårpleie for privatkunder' : 'For example hair salon – haircuts and hair care'} onChange={e => onChange({ ...value, businessProfile: { ...value.businessProfile!, industry: e.target.value } })} /></label>
    {([
      { key: 'offerings', no: 'Produkter og tjenester dere faktisk tilbyr', en: 'Products and services you actually offer', hintNo: 'Beskriv hvert produkt separat. Hva inngår, hvem passer det for, og hvilke behov løser det?', hintEn: 'Describe each offer separately: what is included, who it is for and which needs it solves.' },
      { key: 'pricing', no: 'Priser per produkt eller tjeneste', en: 'Prices by product or service', hintNo: 'Én plan/tjeneste per avsnitt. Ta med navn, beløp, valuta, per måned/år eller engangspris, oppstart, mva. og hva som inngår. Ikke bland nettsidepris og chatbotpris.', hintEn: 'One offer per paragraph. Include name, amount, currency, monthly/yearly/one-off interval, setup costs, tax and inclusions. Keep website and chatbot prices separate.' },
      { key: 'trialInfo', no: 'Gratisplan, prøveperiode og binding', en: 'Free plan, trial and commitments', hintNo: 'Har dere en gratisplan, en tidsbegrenset prøveperiode eller ingen av delene? Oppgi varighet, grenser og eventuelle krav.', hintEn: 'Is there a free plan, a time-limited trial, or neither? State duration, limits and requirements.' },
      { key: 'bookingInfo', no: 'Bestilling og hva botten kan utføre', en: 'Ordering and what the bot can actually do', hintNo: 'Lenke og fremgangsmåte for bestilling. Skill mellom å vise en bookinglenke og faktisk bestille en time.', hintEn: 'Booking link and ordering steps. Distinguish sharing a link from actually booking an appointment.' },
      { key: 'notOffered', no: 'Begrensninger – dette tilbyr dere ikke', en: 'Limitations – what you do not offer', hintNo: 'Valgfritt: viktige unntak, områder dere ikke dekker eller handlinger botten ikke kan utføre.', hintEn: 'Optional: important exclusions, areas you do not cover and actions the bot cannot perform.' },
      { key: 'policies', no: 'Viktige vilkår', en: 'Important terms', hintNo: 'For eksempel levering, avbestilling, retur, garanti og åpningstider. Bare bekreftede opplysninger.', hintEn: 'For example delivery, cancellation, returns, guarantees and opening hours. Confirmed information only.' },
    ] as const).map(field => <label className="widgetFlowField" key={field.key}><span><FiBookOpen aria-hidden="true" />{no ? field.no : field.en}</span><textarea rows={field.key === 'pricing' ? 5 : 3} value={value.knowledgeBase?.[field.key] || ''} maxLength={24000} onChange={e => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, [field.key]: e.target.value } })} /><small>{no ? field.hintNo : field.hintEn}</small></label>)}
    <label className="widgetFlowField"><span>{no ? 'Bedriftsinformasjon og godkjente svar' : 'Business information and approved answers'}</span><textarea rows={9} value={value.businessContext} onChange={e => onChange({ ...value, businessContext: e.target.value })} placeholder={no ? 'Hva tilbyr dere? Hvilke spørsmål skal assistenten kunne svare på?' : 'What do you offer? Which questions should the assistant answer?'} /></label>
    <label className="widgetFlowToggle"><span>{no ? 'Svar bare ut fra opplysningene jeg har gitt' : 'Answer only from the information I provide'}</span><input type="checkbox" checked={value.strictContextOnly} onChange={e => onChange({ ...value, strictContextOnly: e.target.checked })} /></label>
    <label className="widgetFlowField"><span><FiShield aria-hidden="true" />{no ? 'Hva skal assistenten unngå?' : 'What should the assistant avoid?'}</span><textarea rows={3} value={value.restrictions} onChange={e => onChange({ ...value, restrictions: e.target.value })} /></label>
    <details className="studioDetails"><summary><FiSliders aria-hidden="true" />{no ? 'Flere kunnskapsfelt og instruksjoner' : 'More knowledge fields and instructions'}</summary><div className="widgetFlowSettings">
      {(['shortDescription', 'mainGoal'] as const).map(key => <label className="widgetFlowField" key={key}><span>{{ shortDescription: no ? 'Kort beskrivelse' : 'Short description', mainGoal: no ? 'Hva skal assistenten hjelpe med?' : 'What should the assistant help with?' }[key]}</span><input value={value.businessProfile?.[key] || ''} onChange={e => onChange({ ...value, businessProfile: { ...value.businessProfile!, [key]: e.target.value } })} /></label>)}
      <label className="widgetFlowField"><span>{no ? 'Nettsider som kunnskapskilder' : 'Website knowledge sources'}</span><textarea rows={2} value={(value.knowledgeBase?.websiteUrls || []).join('\n')} onChange={e => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, websiteUrls: e.target.value.split('\n').map(line => line.trim()).filter(Boolean) } })} /></label>
      {(['openingHours', 'addresses', 'manualNotes'] as const).map(key => <label className="widgetFlowField" key={key}><span>{{ openingHours: no ? 'Åpningstider' : 'Opening hours', addresses: no ? 'Adresser' : 'Addresses', manualNotes: no ? 'Tilleggsinformasjon' : 'Additional knowledge' }[key]}</span><textarea rows={2} value={value.knowledgeBase?.[key] || ''} onChange={e => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, [key]: e.target.value } })} /></label>)}
      {(['systemPrompt', 'extraInstructions'] as const).map(key => <label className="widgetFlowField" key={key}><span>{key === 'systemPrompt' ? (no ? 'Assistentens grunninstruksjon' : 'Assistant base instruction') : (no ? 'Ekstra instruksjoner' : 'Extra instructions')}</span><textarea rows={3} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} /></label>)}
      <label className="widgetFlowToggle"><span>{no ? 'Vis forslag til spørsmål i chatten' : 'Show suggested questions in chat'}</span><input type="checkbox" checked={value.faqSuggestionsEnabled} onChange={e => onChange({ ...value, faqSuggestionsEnabled: e.target.checked })} /></label>
      <label className="widgetFlowField"><span>{no ? 'Spørsmålsforslag – ett per linje' : 'Suggested questions – one per line'}</span><textarea rows={4} value={value.faqSuggestions.join('\n')} onChange={e => onChange({ ...value, faqSuggestions: e.target.value.split('\n') })} /></label>
      <fieldset><legend>{no ? 'Egne kunnskapsdokumenter' : 'Your knowledge documents'}</legend><p>{no ? 'Last opp tekstfiler (.txt, .md, .csv eller .json). Kontroller teksten før lagring.' : 'Upload text files (.txt, .md, .csv or .json). Review the text before saving.'}</p><input type="file" accept=".txt,.md,.csv,.json" multiple aria-label={no ? 'Last opp kunnskapsdokumenter' : 'Upload knowledge documents'} onChange={async e => {
        const files = Array.from(e.target.files || [])
        const documents = await Promise.all(files.map(async file => ({ name: file.name, type: file.type || 'text/plain', status: 'ready' as const, text: (await file.text()).slice(0, 15000) })))
        onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, uploadedDocuments: [...(value.knowledgeBase?.uploadedDocuments || []), ...documents] } })
      }} />{(value.knowledgeBase?.uploadedDocuments || []).map((document, index) => <label className="widgetFlowField" key={`${document.name}-${index}`}><span>{document.name}</span><textarea rows={3} value={document.text || ''} placeholder={no ? 'Lim inn dokumentteksten her hvis den mangler.' : 'Paste the document text here if missing.'} onChange={e => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, uploadedDocuments: value.knowledgeBase!.uploadedDocuments.map((item, position) => position === index ? { ...item, text: e.target.value, status: 'ready' } : item) } })} /><button type="button" onClick={() => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, uploadedDocuments: value.knowledgeBase!.uploadedDocuments.filter((_, position) => position !== index) } })}>{no ? 'Fjern dokument' : 'Remove document'}</button></label>)}</fieldset>
      <p>{no ? 'AI-modell' : 'AI model'}: {value.model} · {no ? 'Administreres av Vintra' : 'Managed by Vintra'}</p>
      <label className="widgetFlowToggle"><span>{no ? 'Bruk bare valgt AI-modell, uten reservemodell' : 'Use only the selected AI model, without fallback'}</span><input type="checkbox" checked={value.forceSelectedModelOnly} onChange={e => onChange({ ...value, forceSelectedModelOnly: e.target.checked })} /></label>
    </div></details>
  </div>
}
