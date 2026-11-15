'use client'

import { useEffect, useRef, useState } from 'react'
import { FiDownloadCloud, FiPlus, FiSave, FiTrash2, FiX } from 'react-icons/fi'
import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'
import { useAuth } from '@/context/AuthContext'
import { enableStudioModule, getStudioModuleState, getStudioModuleStatus, markStudioModuleConfigured, removeStudioModule, mergeStudioModuleImport, STUDIO_MODULES } from '@/lib/studio-modules.mjs'
import { normalizeLocalization, WIDGET_LANGUAGES } from '@/lib/widget-localization'
import PersonalitySettings from './PersonalitySettings'
import WidgetLanguageSettings from './WidgetLanguageSettings'
import WidgetFlowSettings from './WidgetFlowSettings'
import { StudioToggle } from './StudioControls'
import ConfirmStudioAction from './ConfirmStudioAction'
import StudioModuleIcon from './StudioModuleIcon'
import HelpCardsEditor from './HelpCardsEditor'

type Settings = ChatWidgetConfig['settings']
type Module = (typeof STUDIO_MODULES)[number]
type KnowledgeKey = 'offerings' | 'pricing' | 'trialInfo' | 'policies' | 'notOffered' | 'addresses' | 'openingHours' | 'contactInfo' | 'bookingInfo' | 'manualNotes'
const fieldLabels: Record<string, [string, string]> = {
  businessName: ['Bedriftsnavn', 'Business name'], industry: ['Bransje', 'Industry'], businessDescription: ['Beskrivelse eller produkter og tjenester', 'Description or products and services'],
  responseStyle: ['Svarstil', 'Response style'], systemPrompt: ['Grunninstruksjon', 'Base instruction'], restrictions: ['Begrensninger', 'Restrictions'], extraInstructions: ['Ekstra instruksjoner', 'Additional instructions'],
  pricing: ['Priser', 'Prices'], trialInfo: ['Prøveperiode', 'Trial'], policies: ['Kundevilkår', 'Customer terms'], shortDescription: ['Kort beskrivelse', 'Short description'], website: ['Nettside', 'Website'],
  addresses: ['Adresser', 'Addresses'], openingHours: ['Åpningstider', 'Opening hours'], documents: ['Et dokument eller godkjente notater', 'A document or approved notes'], welcome: ['Starthilsen', 'Welcome message'],
  suggestions: ['Minst ett spørsmålsforslag', 'At least one suggested question'], cards: ['Minst ett hjelpekort', 'At least one help card'], cardQuestions: ['Tittel og spørsmål på hvert hjelpekort', 'Title and question on each help card'],
  extraLanguage: ['Minst ett ekstra språk', 'At least one extra language'], handoffMessage: ['Melding ved overføring', 'Handoff message'], contactInfo: ['Kontaktinformasjon', 'Contact information'], bookingInfo: ['Bookinginformasjon', 'Booking information'], actions: ['Minst én handling', 'At least one action'],
}

export function studioFieldLabel(key: string, no: boolean) { return fieldLabels[key]?.[no ? 0 : 1] || key }

export default function StudioModuleEditor({ module, assistant, settings, no, saving, onClose, onSave }: {
  module: Module; assistant: ChatAssistantConfig; settings: Settings; no: boolean; saving: boolean;
  onClose: () => void; onSave: (assistant: ChatAssistantConfig, settings: Settings) => Promise<boolean>;
}) {
  const { firebaseUser } = useAuth()
  const [draft, setDraft] = useState(() => (getStudioModuleState(assistant, settings).configured.includes(module.id) ? { assistant, settings } : enableStudioModule(assistant, settings, module.id)) as { assistant: ChatAssistantConfig; settings: Settings })
  const [url, setUrl] = useState(assistant.knowledgeBase?.websiteUrls?.[0] || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imported, setImported] = useState(false)
  const [pendingImport, setPendingImport] = useState<ChatAssistantConfig | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const a = draft.assistant, s = draft.settings
  const status = getStudioModuleStatus(module.id, a, s, { editing: true })
  useEffect(() => () => requestRef.current?.abort(), [])
  const updateAssistant = (value: ChatAssistantConfig) => { setDraft(previous => ({ ...previous, assistant: value })); setImported(false) }
  const updateSettings = (value: Settings) => setDraft(previous => ({ ...previous, settings: value }))
  const knowledgeField = (key: KnowledgeKey, label: string, required: boolean | string = false, hint?: string) => <label className="widgetFlowField"><span>{label}<small>{required ? (typeof required === 'string' ? required : no ? 'Påkrevd' : 'Required') : (no ? 'Valgfritt' : 'Optional')}</small></span><textarea rows={key === 'pricing' || key === 'offerings' ? 4 : 3} maxLength={24000} value={a.knowledgeBase?.[key] || ''} onChange={event => updateAssistant({ ...a, knowledgeBase: { ...a.knowledgeBase!, [key]: event.target.value } })} />{hint && <small>{hint}</small>}</label>
  const scan = async () => {
    if (!firebaseUser) { setError(no ? 'Logg inn for å bruke autofyll.' : 'Sign in to use autofill.'); return }
    const controller = new AbortController()
    requestRef.current?.abort(); requestRef.current = controller
    setBusy(true); setError(''); setPendingImport(null)
    try {
      const response = await fetch('/api/scan-website', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await firebaseUser.getIdToken() }, body: JSON.stringify({ url }) })
      const result = await response.json()
      if (!response.ok || !result.success || !result.result) throw new Error(result.error || (no ? 'Kunne ikke hente informasjon.' : 'Unable to import information.'))
      if (!controller.signal.aborted) setPendingImport(mergeStudioModuleImport(a, result.result, module.id) as ChatAssistantConfig)
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to import information.') }
    finally { if (!controller.signal.aborted) setBusy(false) }
  }
  const save = async () => {
    if (status.required.length) { setError((no ? 'Fyll ut: ' : 'Complete: ') + status.required.map(key => studioFieldLabel(key, no)).join(', ')); return }
    setError('')
    const next = markStudioModuleConfigured(a, s, module.id) as ChatAssistantConfig
    if (await onSave(next, s)) onClose()
    else setError(no ? 'Kunne ikke lagre. Endringene dine er fortsatt her. Prøv igjen.' : 'Unable to save. Your changes are still here. Try again.')
  }
  return <section className="studioModulePage" aria-labelledby="studio-module-title">
    <header className="studioModuleDialogHeader"><StudioModuleIcon id={module.id} /><div><span className="studioEyebrow">{module.mandatory ? (no ? 'OBLIGATORISK DEL' : 'REQUIRED MODULE') : (no ? 'VALGFRI MODUL' : 'OPTIONAL MODULE')}</span><h1 id="studio-module-title">{no ? module.no : module.en}</h1></div></header>
    <div className="studioModuleDialogBody widgetFlowSettings">
      <p className="studioModuleIntroduction">{no ? module.infoNo : module.infoEn}</p>
      {module.autofill && <div className="studioModuleAutofill"><label className="widgetFlowField"><span>{no ? 'Bedriftens nettside' : 'Business website'}</span><input type="url" value={url} placeholder="https://din-bedrift.no" disabled={busy || saving} onChange={event => setUrl(event.target.value)} /></label><button type="button" disabled={!url.trim() || busy || saving} onClick={() => void scan()}><FiDownloadCloud aria-hidden="true" />{busy ? (no ? 'Henter…' : 'Importing…') : (no ? 'Autofyll denne delen' : 'Autofill this module')}</button><small>{no ? 'Foreslår bare innhold til denne modulen. Du ser over utkastet før du bruker det.' : 'Suggests content only for this module. Review the draft before applying it.'}</small></div>}
      {pendingImport && <div className="studioModuleImportPreview"><strong>{no ? 'Se over forslaget' : 'Review the suggestion'}</strong><pre>{module.id === 'company' ? [pendingImport.businessProfile?.businessName, pendingImport.businessProfile?.industry, pendingImport.businessProfile?.shortDescription, pendingImport.knowledgeBase?.offerings, pendingImport.businessContext].filter(Boolean).join('\n\n') : module.id === 'welcome' ? pendingImport.startCard?.text : module.id === 'suggestions' ? pendingImport.faqSuggestions.join('\n') : module.id === 'cards' ? pendingImport.conversationCards.map(card => card.title + ': ' + card.options?.map(option => option.prompt).join(' · ')).join('\n') : ({ pricing: ['pricing', 'trialInfo'], terms: ['policies'], locations: ['addresses', 'openingHours'], support: ['contactInfo'], contact: ['contactInfo'], booking: ['bookingInfo'] }[module.id] || []).map(key => (pendingImport.knowledgeBase as unknown as Record<string, string>)?.[key]).filter(Boolean).join('\n\n')}</pre><p>{no ? 'Forslaget erstatter feltene som autofyll kan fylle i denne modulen. Andre moduler beholdes.' : 'This replaces autofill fields in this module. Other modules are preserved.'}</p><div><button type="button" onClick={() => { updateAssistant(pendingImport); setPendingImport(null); setImported(true) }}>{no ? 'Bruk utkast' : 'Use draft'}</button><button type="button" onClick={() => setPendingImport(null)}>{no ? 'Behold teksten min' : 'Keep my text'}</button></div></div>}
      {imported && <p className="studioModuleImportStatus" role="status">{no ? 'Autofylt utkast. Kontroller informasjonen før du lagrer.' : 'Draft imported. Review the information before saving.'}</p>}
      <fieldset className="studioModuleFields" disabled={busy || saving}>
      {module.id === 'company' && <div className="widgetFlowSettings">
        <div className="studioFieldColumns">{(['businessName', 'industry'] as const).map(key => <label className="widgetFlowField" key={key}><span>{studioFieldLabel(key, no)}<small>{no ? 'Påkrevd' : 'Required'}</small></span><input value={a.businessProfile?.[key] || ''} onChange={event => updateAssistant({ ...a, businessProfile: { ...a.businessProfile!, [key]: event.target.value } })} /></label>)}</div>
        {knowledgeField('offerings', no ? 'Produkter og tjenester' : 'Products and services', no ? 'Dette eller beskrivelsen under' : 'This or the description below', no ? 'Fyll ut dette eller beskriv bedriften i feltet under.' : 'Complete this field or describe your business below.')}
        <label className="widgetFlowField"><span>{no ? 'Beskrivelse og godkjente svar' : 'Description and approved answers'}</span><textarea rows={4} value={a.businessContext} onChange={event => updateAssistant({ ...a, businessContext: event.target.value })} /></label>
        <label className="widgetFlowField"><span>{no ? 'Kort beskrivelse' : 'Short description'}<small>{no ? 'Valgfritt' : 'Optional'}</small></span><input value={a.businessProfile?.shortDescription || ''} onChange={event => updateAssistant({ ...a, businessProfile: { ...a.businessProfile!, shortDescription: event.target.value } })} /></label>
        <label className="widgetFlowField"><span>{no ? 'Nettside / kilde' : 'Website / source'}<small>{no ? 'Valgfritt' : 'Optional'}</small></span><input type="url" value={a.knowledgeBase?.websiteUrls?.[0] || ''} onChange={event => updateAssistant({ ...a, knowledgeBase: { ...a.knowledgeBase!, websiteUrls: [event.target.value, ...(a.knowledgeBase?.websiteUrls?.slice(1) || [])].filter(Boolean) } })} /></label>
      </div>}
      {module.id === 'chat' && <div className="widgetFlowSettings"><StudioToggle title={no ? 'Automatiske AI-svar' : 'Automatic AI replies'} checked={a.enabled} onChange={enabled => updateAssistant({ ...a, enabled })} /><label className="widgetFlowField"><span>{no ? 'Standardspråk i chatten' : 'Default chat language'}</span><select value={a.localization?.defaultLanguage || 'no'} onChange={event => updateAssistant({ ...a, localization: normalizeLocalization({ ...a.localization, defaultLanguage: event.target.value as NonNullable<ChatAssistantConfig['localization']>['defaultLanguage'] }) })}>{Object.entries(WIDGET_LANGUAGES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label></div>}
      {module.id === 'personality' && <div className="widgetFlowSettings"><PersonalitySettings value={a} onChange={updateAssistant} no={no} />{knowledgeField('notOffered', no ? 'Tjenester og handlinger dere ikke tilbyr' : 'Services and actions you do not offer')}</div>}
      {module.id === 'pricing' && <div className="widgetFlowSettings">{knowledgeField('pricing', no ? 'Priser per produkt eller tjeneste' : 'Prices by product or service', true)}{knowledgeField('trialInfo', no ? 'Gratisplan, prøveperiode og binding' : 'Free plan, trial and commitments')}</div>}
      {module.id === 'terms' && knowledgeField('policies', no ? 'Bekreftede kundevilkår' : 'Confirmed customer terms', true)}
      {module.id === 'locations' && <div className="widgetFlowSettings">{knowledgeField('addresses', no ? 'Avdelinger og adresser' : 'Branches and addresses', true)}{knowledgeField('openingHours', no ? 'Åpningstider per avdeling' : 'Opening hours by branch')}</div>}
      {module.id === 'documents' && <div className="widgetFlowSettings">
        {knowledgeField('manualNotes', no ? 'Godkjente notater' : 'Approved notes')}
        <label className="widgetFlowField"><span>{no ? 'Kildelenker – én per linje' : 'Source links – one per line'}</span><textarea rows={2} value={a.knowledgeBase?.websiteUrls?.join('\n') || ''} onChange={event => updateAssistant({ ...a, knowledgeBase: { ...a.knowledgeBase!, websiteUrls: event.target.value.split('\n').map(line => line.trim()).filter(Boolean) } })} /></label>
        <label className="studioFileUpload"><span>{no ? 'Last opp tekstfiler (.txt, .md, .csv, .json)' : 'Upload text files (.txt, .md, .csv, .json)'}</span><input type="file" accept=".txt,.md,.csv,.json" multiple onChange={async event => {
          const files = Array.from(event.target.files || [])
          setBusy(true)
          try { const documents = await Promise.all(files.map(async file => ({ name: file.name, type: file.type || 'text/plain', status: 'ready' as const, text: (await file.text()).slice(0, 15000) }))); setDraft(previous => ({ ...previous, assistant: { ...previous.assistant, knowledgeBase: { ...previous.assistant.knowledgeBase!, uploadedDocuments: [...(previous.assistant.knowledgeBase?.uploadedDocuments || []), ...documents] } } })) }
          catch { setError(no ? 'Kunne ikke lese filen.' : 'Unable to read file.') } finally { setBusy(false) }
        }} /></label>
        {(a.knowledgeBase?.uploadedDocuments || []).map((document, index) => <div className="studioDocument" key={document.name + index}><label className="widgetFlowField"><span>{document.name}</span><textarea rows={3} value={document.text || ''} onChange={event => updateAssistant({ ...a, knowledgeBase: { ...a.knowledgeBase!, uploadedDocuments: a.knowledgeBase!.uploadedDocuments.map((item, i) => i === index ? { ...item, text: event.target.value } : item) } })} /></label><ConfirmStudioAction no={no} contextKey={document.name + index + document.text} type="button" onConfirm={() => updateAssistant({ ...a, knowledgeBase: { ...a.knowledgeBase!, uploadedDocuments: a.knowledgeBase!.uploadedDocuments.filter((_, i) => i !== index) } })}>{no ? 'Fjern dokument' : 'Remove document'}</ConfirmStudioAction></div>)}
      </div>}
      {module.id === 'languages' && <WidgetLanguageSettings value={a} onChange={updateAssistant} no={no} showFeatureToggles={false} showWelcomeMessage={false} />}
      {module.id === 'welcome' && <label className="widgetFlowField"><span>{no ? 'Din starthilsen' : 'Your welcome message'}<small>{no ? 'Påkrevd' : 'Required'}</small></span><textarea rows={3} maxLength={350} value={a.startCard?.text || ''} onChange={event => updateAssistant({ ...a, startCard: { enabled: true, text: event.target.value } })} /></label>}
      {module.id === 'suggestions' && <label className="widgetFlowField"><span>{no ? 'Spørsmålsforslag – ett per linje' : 'Suggested questions – one per line'}<small>{no ? 'Påkrevd' : 'Required'}</small></span><textarea rows={5} value={a.faqSuggestions.join('\n')} onChange={event => updateAssistant({ ...a, faqSuggestions: event.target.value.split('\n') })} /></label>}
      {module.id === 'cards' && <HelpCardsEditor cards={a.conversationCards} limit={a.conversationCardsLimit} no={no} onChange={conversationCards => updateAssistant({ ...a, conversationCards })} onLimitChange={conversationCardsLimit => updateAssistant({ ...a, conversationCardsLimit })} />}
      {module.id === 'support' && <div className="widgetFlowSettings">
        <label className="widgetFlowField"><span>{no ? 'Når skal support vises?' : 'When should support appear?'}</span><select value={s.ticket?.mode === 'always' ? 'always' : 'on-demand'} onChange={event => updateSettings({ ...s, ticket: { ...s.ticket, mode: event.target.value as 'always' | 'on-demand' } })}><option value="on-demand">{no ? 'Ved behov' : 'On demand'}</option><option value="always">{no ? 'Hele tiden' : 'Always'}</option></select></label>
        <label className="widgetFlowField"><span>{no ? 'Melding ved overføring' : 'Handoff message'}<small>{no ? 'Påkrevd' : 'Required'}</small></span><textarea rows={3} value={a.handoffMessage} onChange={event => updateAssistant({ ...a, handoffMessage: event.target.value })} /></label>
        <label className="widgetFlowField"><span>{no ? 'Ord som skal foreslå menneskelig hjelp – ett per linje' : 'Handoff phrases – one per line'}</span><textarea rows={2} value={a.supportTriggerKeywords.join('\n')} onChange={event => updateAssistant({ ...a, supportTriggerKeywords: event.target.value.split('\n') })} /></label>
        {knowledgeField('contactInfo', no ? 'Offentlig kontaktinfo' : 'Public contact information')}
        <StudioToggle title={no ? 'Kunden kan opprette tickets selv' : 'Visitors can create tickets'} checked={s.ticket?.allowVisitorCreation !== false} onChange={enabled => { updateSettings({ ...s, ticket: { ...s.ticket, allowVisitorCreation: enabled } }); updateAssistant({ ...a, integrations: { ...a.integrations!, createSupportTickets: enabled } }) }} />
        <StudioToggle title={no ? 'Vis ticket-fanen hele tiden' : 'Always show the tickets tab'} checked={s.ticket?.showTabAlways ?? s.ticket?.mode === 'always'} onChange={showTabAlways => updateSettings({ ...s, ticket: { ...s.ticket, showTabAlways } })} />
        <StudioToggle title={no ? 'Vis tickets teamet oppretter for kunden' : 'Show tickets the team creates for visitors'} checked={s.ticket?.showTeamTasksToVisitors === true} onChange={showTeamTasksToVisitors => updateSettings({ ...s, ticket: { ...s.ticket, showTeamTasksToVisitors } })} />
        <WidgetFlowSettings settings={s} section="contact" mode="rules" no={no} onChange={updateSettings} />
      </div>}
      {module.id === 'contact' && <div className="widgetFlowSettings">{knowledgeField('contactInfo', no ? 'Godkjent kontaktinformasjon' : 'Approved contact information', true)}<StudioToggle title={no ? 'Foreslå kontakt når botten ikke kan svare' : 'Suggest contact when the bot cannot answer'} checked={a.contactSharing?.allowOnUncertainty === true} onChange={allowOnUncertainty => updateAssistant({ ...a, contactSharing: { enabled: true, allowOnUncertainty } })} /></div>}
      {module.id === 'reviews' && <WidgetFlowSettings settings={s} section="reviews" mode="rules" no={no} onChange={updateSettings} />}
      {module.id === 'booking' && knowledgeField('bookingInfo', no ? 'Bookinglenke og fremgangsmåte' : 'Booking link and instructions', true)}
      {module.id === 'actions' && <div className="widgetFlowSettings">{(['collectLeads', 'routeToPages', 'fetchOrderStatus'] as const).map((key, index) => <StudioToggle key={key} title={(no ? ['Hjelp med kundehenvendelser', 'Vis relevante sider', 'Veiled om ordrestatus'] : ['Help with leads', 'Show relevant pages', 'Guide visitors about orders'])[index]} checked={a.integrations?.[key] === true} onChange={enabled => updateAssistant({ ...a, integrations: { ...a.integrations!, [key]: enabled } })} />)}</div>}
      </fieldset>
      {error && <p className="studioModuleError" role="alert">{error}</p>}
      {!status.required.length && status.optional.length > 0 && <p className="studioModuleWarning">{no ? 'Dette er klart til bruk. Valgfrie felt som fortsatt er tomme: ' : 'Ready to use. Optional fields still empty: '}{status.optional.map(key => studioFieldLabel(key, no)).join(', ')}.</p>}
    </div>
    <footer className="studioModuleDialogFooter">{!module.mandatory && <ConfirmStudioAction className="studioModuleRemove" no={no} contextKey={module.id} disabled={saving || busy} confirmLabel={no ? 'Fjern modulen' : 'Remove module'} message={no ? 'Er du sikker på at du vil fjerne denne modulen? Funksjonen slås av, og innhold i kunnskapsmoduler fjernes.' : 'Are you sure you want to remove this module? The feature is disabled and knowledge-module content is removed.'} onConfirm={async () => { const next = removeStudioModule(a, s, module.id); const saved = await onSave(next.assistant as ChatAssistantConfig, next.settings); if (saved) onClose(); return saved }}><FiTrash2 aria-hidden="true" />{no ? 'Fjern modul' : 'Remove module'}</ConfirmStudioAction>}<button type="button" className="studioSecondaryButton" disabled={saving} onClick={onClose}>{no ? 'Avbryt' : 'Cancel'}</button><button type="button" className="save-btn" disabled={busy || saving} onClick={() => void save()}><FiSave aria-hidden="true" />{saving ? (no ? 'Lagrer…' : 'Saving…') : firebaseUser ? (no ? 'Lagre denne delen' : 'Save this module') : (no ? 'Lagre i utkast' : 'Save to draft')}</button></footer>
  </section>
}
