'use client'

import type { ChatWidgetConfig } from '@/types/database'
import { resolveWidgetFlow } from '@/lib/widget-flow.mjs'
import './WidgetFlowSettings.css'

type Settings = ChatWidgetConfig['settings']
export type FlowSection = 'contact' | 'reviews' | 'tickets'

export default function WidgetFlowSettings({ settings, onChange, no = true, section, mode = 'all' }: {
  settings: Settings; onChange: (value: Settings) => void; no?: boolean; section?: FlowSection; mode?: 'design' | 'rules' | 'all'
}) {
  const flow = resolveWidgetFlow(settings)
  const rules = mode !== 'design'
  const design = mode !== 'rules'
  const patch = (key: 'contactForm' | 'reviewPage' | 'ticket', value: object) => onChange({ ...settings, [key]: { ...settings[key], ...value } })
  const toggle = (label: string, checked: boolean, change: (value: boolean) => void) => <label className="widgetFlowToggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={e => change(e.target.checked)} /></label>
  const text = (label: string, value: string, change: (value: string) => void, long = false) => <label className="widgetFlowField"><span>{label}</span>{long ? <textarea rows={3} maxLength={500} value={value} onChange={e => change(e.target.value)} /> : <input maxLength={100} value={value} onChange={e => change(e.target.value)} />}</label>
  return <div className="widgetFlowSettings">
    {(!section || section === 'contact') && <fieldset><legend>{no ? 'Kontaktinfo' : 'Contact information'}</legend>
      <p>{no ? 'Skjemaet kunden fyller ut før en forespørsel sendes til teamet. Navn er alltid påkrevd.' : 'The form visitors complete before sending a request to the team. Name is always required.'}</p>
      {rules && <>
        {toggle(no ? 'Vis e-postfelt' : 'Show email', flow.showEmail, value => patch('contactForm', { showEmail: value, ...(!value ? { requireEmail: false } : {}) }))}
        {toggle(no ? 'Krev e-post' : 'Require email', flow.requireEmail, value => patch('contactForm', { requireEmail: value, ...(value ? { showEmail: true } : {}) }))}
        {toggle(no ? 'Vis telefonfelt' : 'Show phone', flow.showPhone, value => patch('contactForm', { showPhone: value, ...(!value ? { requirePhone: false } : {}) }))}
        {toggle(no ? 'Krev telefon' : 'Require phone', flow.requirePhone, value => patch('contactForm', { requirePhone: value, ...(value ? { showPhone: true } : {}) }))}
      </>}
      {design && <>
        {text(no ? 'Tittel' : 'Title', flow.contactTitle, title => patch('contactForm', { title }))}
        {text(no ? 'Beskrivelse' : 'Description', flow.contactDescription, description => patch('contactForm', { description }), true)}
        <label className="widgetFlowField"><span>{no ? 'Avstand i skjema' : 'Form spacing'}</span><select value={flow.formStyle} onChange={e => patch('contactForm', { style: e.target.value })}><option value="comfortable">{no ? 'Luftig' : 'Comfortable'}</option><option value="compact">{no ? 'Kompakt' : 'Compact'}</option></select></label>
      </>}
    </fieldset>}
    {(!section || section === 'reviews') && <fieldset><legend>{no ? 'Anmeldelser' : 'Reviews'}</legend>
      {rules && <>
        {toggle(no ? 'Aktiver anmeldelser' : 'Enable reviews', flow.reviewsEnabled, reviewsEnabled => onChange({ ...settings, reviewsEnabled }))}
        {toggle(no ? 'La botten spørre ved avslutning' : 'Let the bot ask near the end', settings.reviewPage?.autoAsk !== false, autoAsk => patch('reviewPage', { autoAsk }))}
        <p>{no ? 'Botten spør én gang når kunden virker ferdig, for eksempel etter «takk» eller «ha det». Skjemaet åpnes først når kunden takker ja.' : 'The bot asks once when the visitor seems finished, for example after thanks or goodbye. The form opens only after the visitor agrees.'}</p>
      </>}
      {design && <>
        {toggle(no ? 'Vis anmeldelsesknapp i headeren' : 'Show review button in header', settings.reviewPage?.showHeaderButton === true, showHeaderButton => patch('reviewPage', { showHeaderButton }))}
        {text(no ? 'Tittel' : 'Title', flow.reviewTitle, title => patch('reviewPage', { title }))}
        {text(no ? 'Beskrivelse' : 'Description', flow.reviewDescription, description => patch('reviewPage', { description }), true)}
      </>}
    </fieldset>}
    {(!section || section === 'tickets') && <fieldset><legend>Tickets / support</legend>
      {rules && <>
        <label className="widgetFlowField"><span>{no ? 'Hvordan skal support fungere?' : 'How should support work?'}</span><select value={settings.ticket?.mode || (settings.tasksEnabled ? 'on-demand' : '')} onChange={e => onChange({ ...settings, tasksEnabled: e.target.value !== 'off', ticket: { ...settings.ticket, mode: e.target.value as 'off' | 'on-demand' | 'always' } })}>
          <option value="" disabled>{no ? 'Velg supportmodus' : 'Choose support mode'}</option>
          <option value="off">{no ? 'Av – ingen tickets eller menneskelig support' : 'Off – no tickets or human support'}</option>
          <option value="on-demand">{no ? 'Ved behov – åpnes på forespørsel eller når en ticket finnes' : 'On demand – on request or when a ticket exists'}</option>
          <option value="always">{no ? 'Vis chat og tickets hele tiden' : 'Always show chat and tickets'}</option>
        </select></label>
        {toggle(no ? 'Kunden kan opprette tickets selv' : 'Visitors can create tickets', settings.ticket?.allowVisitorCreation !== false, allowVisitorCreation => patch('ticket', { allowVisitorCreation }))}
        {toggle(no ? 'Vis ticket-fanen hele tiden' : 'Always show the tickets tab', settings.ticket?.showTabAlways ?? (settings.ticket?.mode === 'always'), showTabAlways => patch('ticket', { showTabAlways }))}
        {toggle(no ? 'Vis tickets teamet oppretter for kunden' : 'Show tickets the team creates for visitors', settings.ticket?.showTeamTasksToVisitors === true, showTeamTasksToVisitors => patch('ticket', { showTeamTasksToVisitors }))}
        <p>{no ? 'Innsendte tickets vises som oppgaver hos bedriften. Når support er av, blokkeres også innsending og overføring til et menneske.' : 'Submitted tickets appear as tasks for the business. Turning support off also blocks submission and human handoff.'}</p>
      </>}
      {design && <>
        <p>{no ? 'Forespørselsskjemaet bruker kontaktfeltene, tittelen og beskrivelsen fra Kontaktinfo.' : 'The request form uses the contact fields, title, and description from Contact information.'}</p>
        <label className="widgetFlowField"><span>{no ? 'Visning av ticketlisten' : 'Ticket list layout'}</span><select value={flow.ticketLayout} onChange={e => patch('ticket', { layout: e.target.value })}><option value="cards">{no ? 'Kort' : 'Cards'}</option><option value="compact">{no ? 'Kompakt liste' : 'Compact list'}</option></select></label>
      </>}
    </fieldset>}
  </div>
}
