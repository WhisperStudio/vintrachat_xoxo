'use client'

import { useEffect, useRef, useState } from 'react'
import { FiBookOpen, FiBriefcase, FiDownloadCloud, FiLink, FiSliders } from 'react-icons/fi'
import type { ChatAssistantConfig } from '@/types/database'
import { mergeWebsiteKnowledge } from '@/lib/studio-onboarding.mjs'
import { useAuth } from '@/context/AuthContext'
import './WidgetFlowSettings.css'
import { StudioGroup } from './StudioControls'
import { hasAssistantKnowledge } from '@/lib/studio-onboarding.mjs'

export default function StudioKnowledgeSettings({ value, onChange, no }: {
  value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no: boolean
}) {
  const { firebaseUser } = useAuth()
  const [url, setUrl] = useState(value.knowledgeBase?.websiteUrls?.[0] || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scanned, setScanned] = useState(false)
  const [importedDraft, setImportedDraft] = useState<ChatAssistantConfig | null>(null)
  const valueRef = useRef(value)
  useEffect(() => { valueRef.current = value }, [value])
  const missingHint = (text: string | undefined) => scanned && !text?.trim() ? <small className="studioMissingFact">{no ? 'Autofyll fant ikke noe som passet her. La feltet stå tomt hvis det ikke er relevant.' : 'Autofill found no matching information. Leave this blank if it is irrelevant.'}</small> : null
  const requestRef = useRef<AbortController | null>(null)
  useEffect(() => () => requestRef.current?.abort(), [])
  const [pendingScan, setPendingScan] = useState<Parameters<typeof mergeWebsiteKnowledge>[1] | null>(null)
  const applyScan = (result: Parameters<typeof mergeWebsiteKnowledge>[1]) => {
    const merged = mergeWebsiteKnowledge(valueRef.current, result)
    onChange(merged)
    setImportedDraft(merged)
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
      if (hasAssistantKnowledge(valueRef.current)) setPendingScan(result.result)
      else applyScan(result.result)
    } catch (error) { if (!request.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to read website.') }
    finally { setBusy(false) }
  }
  const status = (text: string | undefined, imported?: string) => <small className={'studioFieldStatus' + (text?.trim() ? ' hasValue' : '')}>{!text?.trim() ? (no ? 'Valgfritt' : 'Optional') : imported !== undefined && text === imported ? (no ? 'Autofylt · kontroller' : 'Imported · review') : imported !== undefined ? (no ? 'Redigert' : 'Edited') : (no ? 'Utfylt' : 'Filled in')}</small>
  const profileField = (key: 'businessName' | 'industry' | 'shortDescription', title: string) => <label className="widgetFlowField"><span>{title}{status(value.businessProfile?.[key], importedDraft?.businessProfile?.[key])}</span><input value={value.businessProfile?.[key] || ''} onChange={event => onChange({ ...value, businessProfile: { ...value.businessProfile!, [key]: event.target.value } })} /></label>
  const knowledgeField = (key: 'offerings' | 'pricing' | 'trialInfo' | 'bookingInfo' | 'notOffered' | 'policies' | 'contactInfo' | 'openingHours' | 'addresses' | 'manualNotes', title: string, hint?: string) => <label className="widgetFlowField"><span>{title}{status(value.knowledgeBase?.[key], importedDraft?.knowledgeBase?.[key])}</span><textarea rows={key === 'pricing' || key === 'offerings' ? 4 : 3} value={value.knowledgeBase?.[key] || ''} maxLength={24000} onChange={event => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, [key]: event.target.value } })} />{hint && <small>{hint}</small>}{missingHint(value.knowledgeBase?.[key])}</label>
  return <div className="studioKnowledge widgetFlowSettings">
    <div className="studioSectionIntro"><span className="studioEyebrow">{no ? 'BEDRIFTEN OG KUNNSKAPEN' : 'BUSINESS AND KNOWLEDGE'}</span><h2>{no ? 'Gi assistenten et godt grunnlag' : 'Give your assistant a solid foundation'}</h2><p>{no ? 'Hent et utkast fra nettsiden eller skriv selv. Kontroller innholdet før bruk. Bare informasjon som er relevant for bedriften trenger å fylles ut.' : 'Import a draft or write it yourself. Review it before use. Fill in only the information relevant to your business.'}</p></div>
    <div className="studioWebsiteImport" aria-busy={busy}>
      <label className="widgetFlowField"><span><FiLink aria-hidden="true" />{no ? 'Autofyll fra nettsiden' : 'Autofill from your website'}</span><input type="url" placeholder="https://din-bedrift.no" value={url} onChange={e => setUrl(e.target.value)} disabled={busy} /></label>
      <button type="button" disabled={busy || !url.trim()} onClick={() => void scan()}><FiDownloadCloud aria-hidden="true" />{busy ? (no ? 'Leser nettsiden…' : 'Reading website…') : (no ? 'Autofyll' : 'Autofill')}</button>
      <p>{no ? 'Henter et redigerbart utkast. Funksjoner og svarstil velger du selv.' : 'Imports an editable draft. Features and response style remain your choices.'}</p>
      {error && <p role="alert">{error}</p>}
      {scanned && <p role="status">{no ? 'Utkastet er hentet. Åpne gruppene under og kontroller funnene, særlig priser og vilkår.' : 'Draft imported. Open the groups below and review the results, especially prices and terms.'}</p>}
      {scanned && !value.knowledgeBase?.pricing?.trim() && <p>{no ? 'Fant ingen sikre priser. Legg inn bekreftede priser hvis botten skal svare på dette.' : 'No reliable prices found. Add confirmed prices if the bot should answer pricing questions.'}</p>}
      {pendingScan && <div className="studioImportDecision" role="status"><p>{no ? 'Du har allerede bedriftsinformasjon. Erstatt den med det nye utkastet?' : 'Business information already exists. Replace it with the new draft?'}</p><button type="button" onClick={() => applyScan(pendingScan)}>{no ? 'Bruk nytt utkast' : 'Use new draft'}</button><button type="button" onClick={() => setPendingScan(null)}>{no ? 'Behold innholdet mitt' : 'Keep my content'}</button></div>}
    </div>
    <StudioGroup title={no ? 'Bedriftsinformasjon' : 'Business information'} description={no ? 'Hvem dere er, og hva dere tilbyr.' : 'Who you are and what you offer.'} status={value.businessProfile?.businessName ? (no ? 'Navn utfylt' : 'Name added') : (no ? 'Legg til navn' : 'Add a name')} defaultOpen>
      <div className="studioFieldColumns">{profileField('businessName', no ? 'Bedriftsnavn' : 'Business name')}{profileField('industry', no ? 'Bransje og hvem dere hjelper' : 'Industry and who you help')}</div>
      {profileField('shortDescription', no ? 'Kort beskrivelse' : 'Short description')}
      {knowledgeField('offerings', no ? 'Produkter og tjenester' : 'Products and services', no ? 'Beskriv hvert tilbud separat: hva inngår, hvem passer det for, og hvilke behov løser det?' : 'Describe each offer separately: what is included, who it is for and which needs it solves.')}
      <label className="widgetFlowField"><span>{no ? 'Bedriftsinformasjon og godkjente svar' : 'Business information and approved answers'}{value.enabled && !hasAssistantKnowledge(value) && <small className="studioFieldStatus">{no ? 'Kunnskap kreves for AI-svar' : 'Knowledge required for AI replies'}</small>}</span><textarea rows={4} value={value.businessContext} onChange={event => onChange({ ...value, businessContext: event.target.value })} placeholder={no ? 'Hva bør assistenten vite om bedriften?' : 'What should the assistant know about your business?'} /></label>
    </StudioGroup>
    {(value.startCard?.enabled || value.faqSuggestionsEnabled) && <StudioGroup title={no ? 'Hilsener og spørsmålsforslag' : 'Greetings and suggested questions'} description={no ? 'Tekster som kan foreslås av autofyll.' : 'Texts that autofill can suggest.'}>
      {value.startCard?.enabled && <label className="widgetFlowField"><span>{no ? 'Din starthilsen' : 'Your welcome message'}{status(value.startCard.text, importedDraft?.startCard?.text)}</span><textarea rows={3} maxLength={350} value={value.startCard.text || ''} onChange={event => onChange({ ...value, startCard: { ...value.startCard!, text: event.target.value } })} /><small>{no ? 'Autofyll foreslår en tekst dersom feltet er tomt. Du kan alltid endre den.' : 'Autofill suggests copy if this field is empty. You can always edit it.'}</small></label>}
      {value.faqSuggestionsEnabled && <label className="widgetFlowField"><span>{no ? 'Spørsmålsforslag – ett per linje' : 'Suggested questions – one per line'}</span><textarea rows={3} value={value.faqSuggestions.join('\n')} onChange={event => onChange({ ...value, faqSuggestions: event.target.value.split('\n') })} /></label>}
    </StudioGroup>}
    <StudioGroup title={no ? 'Priser og bestilling' : 'Pricing and ordering'} description={no ? 'Priser, prøveperioder, bestilling og kundevilkår. Valgfritt.' : 'Prices, trials, ordering and customer terms. Optional.'} status={value.knowledgeBase?.pricing ? (no ? 'Priser utfylt' : 'Prices added') : (no ? 'Valgfritt' : 'Optional')}>
      {knowledgeField('pricing', no ? 'Priser per produkt eller tjeneste' : 'Prices by product or service', no ? 'Ta med navn, beløp, valuta, faktureringsperiode, oppstart, mva. og hva som inngår.' : 'Include name, amount, currency, billing interval, setup costs, tax and inclusions.')}
      {knowledgeField('trialInfo', no ? 'Gratisplan, prøveperiode og binding' : 'Free plan, trial and commitments')}
      {value.integrations?.bookMeetings && knowledgeField('bookingInfo', no ? 'Bestilling og hva botten kan utføre' : 'Ordering and what the bot can actually do', no ? 'En bookinglenke er ikke det samme som å kunne bestille en time.' : 'Sharing a booking link is not the same as making an appointment.')}
      {knowledgeField('policies', no ? 'Viktige kundevilkår' : 'Important customer terms', no ? 'For eksempel levering, avbestilling, retur og garanti.' : 'For example delivery, cancellation, returns and guarantees.')}
      {knowledgeField('notOffered', no ? 'Begrensninger – dette tilbyr dere ikke' : 'Limitations – what you do not offer')}
    </StudioGroup>
    <StudioGroup title={no ? 'Kontakt og lokasjoner' : 'Contact and locations'} description={no ? 'Kontaktinfo, avdelinger, adresser og åpningstider.' : 'Contact details, branches, addresses and opening hours.'}>
      {(value.contactSharing?.enabled || value.humanSupportEnabled) && knowledgeField('contactInfo', no ? 'Offentlig kontaktinfo og avdelinger' : 'Public contact details and branches', no ? 'Behold avdelingsnavn sammen med riktig telefonnummer og e-post.' : 'Keep each branch name with its own phone number and email.')}
      {knowledgeField('addresses', no ? 'Adresser per avdeling' : 'Addresses by branch')}
      {knowledgeField('openingHours', no ? 'Åpningstider per avdeling' : 'Opening hours by branch', no ? 'Oppgi hvilken avdeling tidene gjelder. La ukjente tider stå tomme.' : 'Specify which branch each schedule applies to. Leave unknown hours blank.')}
    </StudioGroup>
    <StudioGroup title={no ? 'Kunnskapsbase og dokumenter' : 'Knowledge base and documents'} description={no ? 'Kilder, opplastede dokumenter og egne notater.' : 'Sources, uploaded documents and your own notes.'} status={(value.knowledgeBase?.uploadedDocuments?.length || 0) + (no ? ' dokumenter' : ' documents')}>
      <label className="widgetFlowField"><span>{no ? 'Nettsider som kunnskapskilder' : 'Website knowledge sources'}</span><textarea rows={2} value={(value.knowledgeBase?.websiteUrls || []).join('\n')} onChange={event => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, websiteUrls: event.target.value.split('\n').map(line => line.trim()).filter(Boolean) } })} /></label>
      {knowledgeField('manualNotes', no ? 'Tilleggsinformasjon' : 'Additional knowledge')}
      <label className="studioFileUpload"><FiBookOpen aria-hidden="true" /><span><strong>{no ? 'Legg til kunnskapsdokumenter' : 'Add knowledge documents'}</strong><small>.txt, .md, .csv, .json</small></span><input type="file" accept=".txt,.md,.csv,.json" multiple aria-label={no ? 'Last opp kunnskapsdokumenter' : 'Upload knowledge documents'} onChange={async event => {
        const files = Array.from(event.target.files || [])
        try {
          const documents = await Promise.all(files.map(async file => ({ name: file.name, type: file.type || 'text/plain', status: 'ready' as const, text: (await file.text()).slice(0, 15000) })))
          const latest = valueRef.current
          onChange({ ...latest, knowledgeBase: { ...latest.knowledgeBase!, uploadedDocuments: [...(latest.knowledgeBase?.uploadedDocuments || []), ...documents] } })
        } catch { setError(no ? 'Kunne ikke lese dokumentet. Prøv en annen tekstfil.' : 'Unable to read the document. Try another text file.') }
      }} /></label>
      {(value.knowledgeBase?.uploadedDocuments || []).map((document, index) => <div className="studioDocument" key={document.name + '-' + index}><label className="widgetFlowField"><span>{document.name}</span><textarea rows={3} value={document.text || ''} onChange={event => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, uploadedDocuments: value.knowledgeBase!.uploadedDocuments.map((item, position) => position === index ? { ...item, text: event.target.value, status: 'ready' } : item) } })} /></label><button type="button" onClick={() => onChange({ ...value, knowledgeBase: { ...value.knowledgeBase!, uploadedDocuments: value.knowledgeBase!.uploadedDocuments.filter((_, position) => position !== index) } })}>{no ? 'Fjern dokument' : 'Remove document'}</button></div>)}
    </StudioGroup>
  </div>
}
