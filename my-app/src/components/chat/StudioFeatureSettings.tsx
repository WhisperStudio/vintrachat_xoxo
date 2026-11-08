'use client'

import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'
import WidgetFlowSettings from './WidgetFlowSettings'

export type StudioDecisions = { ai?: boolean; support?: 'off' | 'on-demand' | 'always'; reviews?: boolean; tickets?: boolean }

export default function StudioFeatureSettings({ assistant, settings, onAssistantChange, onSettingsChange, no, setup, decisions, onDecision }: {
  assistant: ChatAssistantConfig; settings: ChatWidgetConfig['settings']; no: boolean; setup: boolean; decisions: StudioDecisions;
  onAssistantChange: (value: ChatAssistantConfig) => void; onSettingsChange: (value: ChatWidgetConfig['settings']) => void;
  onDecision: (value: StudioDecisions) => void;
}) {
  const mode = setup && !decisions.support ? '' : settings.ticket?.mode || (assistant.humanSupportEnabled ? 'on-demand' : 'off')
  const choose = (key: 'ai' | 'reviews' | 'tickets', value: boolean) => {
    onDecision({ ...decisions, [key]: value })
    if (key === 'ai') onAssistantChange({ ...assistant, enabled: value })
    if (key === 'reviews') onSettingsChange({ ...settings, reviewsEnabled: value })
    if (key === 'tickets') onSettingsChange({ ...settings, tasksEnabled: mode !== 'off', ticket: { ...settings.ticket, mode: mode || 'on-demand', allowVisitorCreation: value } })
  }
  const yesNo = (key: 'ai' | 'reviews' | 'tickets', title: string, description: string, current: boolean) => {
    const selected = setup ? decisions[key] : current
    return <fieldset className="studioFeatureChoice"><legend>{title}</legend><p>{description}</p><div className="studioChoiceButtons" role="group" aria-label={title}>
      <button type="button" aria-pressed={selected === true} onClick={() => choose(key, true)}>{no ? 'Ja' : 'Yes'}</button>
      <button type="button" aria-pressed={selected === false} onClick={() => choose(key, false)}>{no ? 'Nei' : 'No'}</button>
    </div></fieldset>
  }
  return <div className="widgetFlowSettings studioFeatureSettings">
    <div className="studioSectionIntro"><span className="studioEyebrow">{no ? 'FUNKSJONER' : 'FEATURES'}</span><h2>{no ? 'Velg hva chatten skal kunne gjøre' : 'Choose what your chat can do'}</h2><p>{no ? 'Disse valgene tar du selv. Nettsideskanningen slår ikke på funksjoner for deg.' : 'These are your choices. Importing a website never enables features for you.'}</p></div>
    {yesNo('ai', no ? 'Automatiske AI-svar' : 'Automatic AI replies', no ? 'La assistenten svare på spørsmål med bedriftsinformasjonen din.' : 'Let the assistant answer questions using your business information.', assistant.enabled)}
    <fieldset><legend>{no ? 'Menneskelig support' : 'Human support'}</legend><p>{no ? 'Velg om kunden skal kunne få hjelp av teamet, og når ticketoversikten skal vises.' : 'Choose whether visitors can reach your team and when the ticket page is visible.'}</p>
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
  </div>
}
