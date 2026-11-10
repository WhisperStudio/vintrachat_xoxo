'use client'

import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'
import { FiCpu, FiLifeBuoy, FiMail, FiSliders, FiStar, FiTag } from 'react-icons/fi'
import WidgetFlowSettings from './WidgetFlowSettings'

export type StudioDecisions = { ai?: boolean; support?: 'off' | 'on-demand' | 'always'; reviews?: boolean; tickets?: boolean; contact?: boolean }

export default function StudioFeatureSettings({ assistant, settings, onAssistantChange, onSettingsChange, no, setup, decisions, onDecision }: {
  assistant: ChatAssistantConfig; settings: ChatWidgetConfig['settings']; no: boolean; setup: boolean; decisions: StudioDecisions;
  onAssistantChange: (value: ChatAssistantConfig) => void; onSettingsChange: (value: ChatWidgetConfig['settings']) => void;
  onDecision: (value: StudioDecisions) => void;
}) {
  const mode = setup && !decisions.support ? '' : settings.ticket?.mode || (assistant.humanSupportEnabled ? 'on-demand' : 'off')
  const choose = (key: 'ai' | 'reviews' | 'tickets' | 'contact', value: boolean) => {
    onDecision({ ...decisions, [key]: value })
    if (key === 'ai') onAssistantChange({ ...assistant, enabled: value })
    if (key === 'reviews') onSettingsChange({ ...settings, reviewsEnabled: value })
    if (key === 'contact') onAssistantChange({ ...assistant, contactSharing: { ...assistant.contactSharing, enabled: value } })
    if (key === 'tickets') {
      onSettingsChange({ ...settings, tasksEnabled: mode !== 'off', ticket: { ...settings.ticket, mode: mode || 'on-demand', allowVisitorCreation: value } })
      onAssistantChange({ ...assistant, integrations: { ...assistant.integrations!, createSupportTickets: value && mode !== 'off' } })
    }
  }
  const yesNo = (key: 'ai' | 'reviews' | 'tickets' | 'contact', title: string, description: string, current: boolean) => {
    const selected = setup ? decisions[key] : current
    const Icon = { ai: FiCpu, tickets: FiTag, reviews: FiStar, contact: FiMail }[key]
    return <fieldset className="studioFeatureChoice"><legend><Icon aria-hidden="true" />{title}</legend><p>{description}</p><div className="studioChoiceButtons" role="group" aria-label={title}>
      <button type="button" aria-pressed={selected === true} onClick={() => choose(key, true)}>{no ? 'Ja' : 'Yes'}</button>
      <button type="button" aria-pressed={selected === false} onClick={() => choose(key, false)}>{no ? 'Nei' : 'No'}</button>
    </div></fieldset>
  }
  return <div className="widgetFlowSettings studioFeatureSettings">
    <div className="studioSectionIntro"><span className="studioSectionSymbol"><FiSliders aria-hidden="true" /></span><span className="studioEyebrow">{no ? 'FUNKSJONER' : 'FEATURES'}</span><h2>{no ? 'Velg hva chatten skal kunne gjøre' : 'Choose what your chat can do'}</h2><p>{no ? 'Disse valgene tar du selv. Nettsideskanningen slår ikke på funksjoner for deg.' : 'These are your choices. Importing a website never enables features for you.'}</p></div>
    {yesNo('ai', no ? 'Automatiske AI-svar' : 'Automatic AI replies', no ? 'La assistenten svare på spørsmål med bedriftsinformasjonen din.' : 'Let the assistant answer questions using your business information.', assistant.enabled)}
    {yesNo('contact', no ? 'Botten kan dele bedriftens kontaktinfo' : 'The bot can share business contact details', no ? 'Del godkjent e-post og telefon når kunden spør. Dette er et eget valg, uavhengig av menneskelig support. Du kan ha begge, bare én eller ingen.' : 'Share approved email and phone when the visitor asks. This is separate from human support. Enable both, either one, or neither.', assistant.contactSharing?.enabled === true)}
    <fieldset><legend><FiMail aria-hidden="true" />{no ? 'Kontaktinfo botten har funnet' : 'Contact details found by the bot'}</legend><p>{no ? 'Kontroller og rediger opplysningene her. De deles ikke hvis valget over er av.' : 'Review and edit the details here. They will not be shared while the option above is off.'}</p><label className="widgetFlowField"><span>{no ? 'Godkjent offentlig kontaktinformasjon' : 'Approved public contact information'}</span><textarea rows={3} value={assistant.knowledgeBase?.contactInfo || assistant.businessProfile?.fallbackContact || ''} placeholder={no ? 'Ingen kontaktinfo funnet. Legg inn e-post, telefon eller kontaktlenke selv.' : 'No contact details found. Add email, phone or a contact URL.'} onChange={e => onAssistantChange({ ...assistant, knowledgeBase: { ...assistant.knowledgeBase!, contactInfo: e.target.value }, businessProfile: { ...assistant.businessProfile!, fallbackContact: '' } })} /></label>
      {assistant.contactSharing?.enabled && <label className="widgetFlowToggle"><span>{no ? 'Tillat også kontaktforslag ved reelt kompliserte, uavklarte spørsmål' : 'Also allow contact suggestions for genuinely complex unresolved questions'}</span><input type="checkbox" checked={assistant.contactSharing.allowOnUncertainty === true} onChange={e => onAssistantChange({ ...assistant, contactSharing: { enabled: true, allowOnUncertainty: e.target.checked } })} /></label>}
    </fieldset>
    <fieldset><legend><FiLifeBuoy aria-hidden="true" />{no ? 'Menneskelig support' : 'Human support'}</legend><p>{no ? 'Velg om kunden skal kunne få hjelp av teamet, og når ticketoversikten skal vises.' : 'Choose whether visitors can reach your team and when the ticket page is visible.'}</p>
      <label className="widgetFlowField"><span>{no ? 'Supportmodus' : 'Support mode'}</span><select value={mode} onChange={e => {
        const support = e.target.value as NonNullable<StudioDecisions['support']>
        onDecision({ ...decisions, support })
        onAssistantChange({ ...assistant, humanSupportEnabled: support !== 'off', integrations: { ...assistant.integrations!, handoffToHuman: support !== 'off' } })
        onSettingsChange({ ...settings, tasksEnabled: support !== 'off', ticket: { ...settings.ticket, mode: support } })
      }}><option value="" disabled>{no ? 'Ta et valg' : 'Choose an option'}</option><option value="off">{no ? 'Ingen menneskelig support' : 'No human support'}</option><option value="on-demand">{no ? 'Support og tickets ved behov' : 'Support and tickets on demand'}</option><option value="always">{no ? 'Vis chat og tickets hele tiden' : 'Always show chat and tickets'}</option></select></label>
    </fieldset>
    {yesNo('tickets', no ? 'Kunden kan opprette tickets selv' : 'Visitors can create tickets', no ? 'Kunden får en knapp for å sende en oppgave til bedriften. Krever at menneskelig support er på.' : 'Visitors get a button to send a task to your business. Requires human support.', settings.ticket?.allowVisitorCreation !== false)}
    {yesNo('reviews', no ? 'Anmeldelser etter samtalen' : 'Reviews after the conversation', no ? 'Botten kan spørre når kunden virker ferdig. Skjemaet åpnes først når kunden ønsker det.' : 'The bot can ask when the visitor seems finished. The form opens only if the visitor wants it.', settings.reviewsEnabled === true)}
    {settings.reviewsEnabled && <label className="widgetFlowToggle"><span>{no ? 'La botten spørre om anmeldelse ved avslutning' : 'Let the bot ask for a review near the end'}</span><input type="checkbox" checked={settings.reviewPage?.autoAsk !== false} onChange={e => onSettingsChange({ ...settings, reviewPage: { ...settings.reviewPage, autoAsk: e.target.checked } })} /></label>}
    {mode && mode !== 'off' && <details className="studioDetails"><summary>{no ? 'Kontaktfelter før innsending' : 'Contact fields before submission'}</summary><WidgetFlowSettings settings={settings} section="contact" mode="rules" no={no} onChange={onSettingsChange} /></details>}
    <details className="studioDetails"><summary><FiSliders aria-hidden="true" />{no ? 'Flere handlinger og supportregler' : 'More actions and support rules'}</summary><div className="widgetFlowSettings">
      {(['collectLeads', 'bookMeetings', 'routeToPages', 'fetchOrderStatus'] as const).map(key => <label className="widgetFlowToggle" key={key}><span>{{ collectLeads: no ? 'Hjelp med kundehenvendelser' : 'Help with leads', bookMeetings: no ? 'Veiled om booking' : 'Guide visitors to booking', routeToPages: no ? 'Vis vei til relevante sider' : 'Guide visitors to relevant pages', fetchOrderStatus: no ? 'Veiled om ordrestatus' : 'Guide visitors about order status' }[key]}</span><input type="checkbox" checked={assistant.integrations?.[key] === true} onChange={e => onAssistantChange({ ...assistant, integrations: { ...assistant.integrations!, [key]: e.target.checked } })} /></label>)}
      <p>{no ? 'Handlingene bruker opplysningene du har lagt inn. Booking og ordreoppslag krever en tilgjengelig lenke eller tilkoblet løsning.' : 'Actions use the information you provide. Booking and order lookups require an available link or connected service.'}</p>
      {mode !== 'off' && <>
        <label className="widgetFlowField"><span>{no ? 'Ord som skal foreslå menneskelig hjelp' : 'Phrases that suggest human help'}</span><textarea rows={3} value={assistant.supportTriggerKeywords.join('\n')} onChange={e => onAssistantChange({ ...assistant, supportTriggerKeywords: e.target.value.split('\n') })} /></label>
        <label className="widgetFlowField"><span>{no ? 'Melding ved overføring til teamet' : 'Message when handing off to the team'}</span><textarea rows={3} value={assistant.handoffMessage} onChange={e => onAssistantChange({ ...assistant, handoffMessage: e.target.value })} /></label>
      </>}
    </div></details>
  </div>
}
