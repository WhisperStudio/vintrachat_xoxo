'use client'

import type { ChatAssistantConfig, ChatWidgetConfig } from '@/types/database'
import WidgetFlowSettings from './WidgetFlowSettings'
import WidgetLanguageSettings from './WidgetLanguageSettings'
import { StudioGroup, StudioToggle } from './StudioControls'

export default function StudioFeatureSettings({ assistant, settings, onAssistantChange, onSettingsChange, no }: {
  assistant: ChatAssistantConfig; settings: ChatWidgetConfig['settings']; no: boolean;
  onAssistantChange: (value: ChatAssistantConfig) => void; onSettingsChange: (value: ChatWidgetConfig['settings']) => void;
}) {
  const supportEnabled = assistant.humanSupportEnabled
  const mode = supportEnabled ? (settings.ticket?.mode === 'always' ? 'always' : 'on-demand') : 'off'
  const setSupport = (enabled: boolean) => {
    onAssistantChange({ ...assistant, humanSupportEnabled: enabled, integrations: { ...assistant.integrations!, handoffToHuman: enabled, createSupportTickets: enabled && settings.ticket?.allowVisitorCreation !== false } })
    onSettingsChange({ ...settings, tasksEnabled: enabled, ticket: { ...settings.ticket, mode: enabled ? 'on-demand' : 'off' } })
  }
  return <div className="widgetFlowSettings studioFeatureSettings">
    <div className="studioSectionIntro"><span className="studioEyebrow">{no ? 'FUNKSJONER' : 'FEATURES'}</span><h2>{no ? 'Hva skal chatten hjelpe med?' : 'What should your chat help with?'}</h2><p>{no ? 'Slå på det dere trenger. Tilhørende innstillinger vises underveis, og alle valg kan endres senere.' : 'Enable what you need. Related settings appear as you go, and every choice can be changed later.'}</p></div>
    <StudioGroup title={no ? 'Chat og språk' : 'Chat and languages'} description={no ? 'AI-svar, språk og den første kontakten.' : 'AI replies, languages and first impressions.'} defaultOpen>
      <StudioToggle title={no ? 'Automatiske AI-svar' : 'Automatic AI replies'} description={no ? 'Svar på spørsmål med bedriftens godkjente informasjon.' : 'Answer questions using approved business information.'} checked={assistant.enabled} onChange={enabled => onAssistantChange({ ...assistant, enabled })} />
      {assistant.enabled && <p className="studioInlineHint">{no ? 'Legg til og kontroller kunnskapen under Bedriften. Velg tone under Svarstil.' : 'Add and review knowledge under Business. Choose a tone under Response style.'}</p>}
      <WidgetLanguageSettings value={assistant} onChange={onAssistantChange} no={no} showFeatureToggles={false} showWelcomeMessage={false} />
      <StudioToggle title={no ? 'Starthilsen ved chatknappen' : 'Welcome message by the chat button'} description={no ? 'Vis en kort hilsen før kunden åpner chatten.' : 'Show a short greeting before the visitor opens chat.'} checked={assistant.startCard?.enabled === true} onChange={enabled => onAssistantChange({ ...assistant, startCard: { text: assistant.startCard?.text || '', enabled } })} />
      <StudioToggle title={no ? 'Spørsmålsforslag' : 'Suggested questions'} description={no ? 'Gi kunden noen enkle spørsmål å starte med.' : 'Give visitors a few questions to start with.'} checked={assistant.faqSuggestionsEnabled} onChange={enabled => onAssistantChange({ ...assistant, faqSuggestionsEnabled: enabled })} />
      {(assistant.startCard?.enabled || assistant.faqSuggestionsEnabled) && <p className="studioInlineHint">{no ? 'Tekstene kan autofylles og redigeres under Bedriften → Hilsener og spørsmålsforslag.' : 'Autofill and edit these texts under Business → Greetings and suggested questions.'}</p>}
      <StudioToggle title={no ? 'Hjelpekort i velkomsten' : 'Welcome help cards'} description={no ? 'Snarveier til vanlige spørsmål. Tilpass kortene under Design → Meldinger.' : 'Shortcuts to common questions. Edit cards under Design → Messages.'} checked={assistant.conversationCardsEnabled} onChange={enabled => onAssistantChange({ ...assistant, conversationCardsEnabled: enabled })} />
    </StudioGroup>
    <StudioGroup title={no ? 'Kontakt og kundeservice' : 'Contact and customer service'} description={no ? 'Kontaktinfo, hjelp fra teamet og anmeldelser.' : 'Contact details, team support and reviews.'}>
      <StudioToggle title={no ? 'Botten kan dele kontaktinfo' : 'The bot can share contact details'} description={no ? 'Del godkjent e-post og telefon når kunden spør.' : 'Share approved email and phone details when asked.'} checked={assistant.contactSharing?.enabled === true} onChange={enabled => onAssistantChange({ ...assistant, contactSharing: { ...assistant.contactSharing, enabled } })} />
      {assistant.contactSharing?.enabled && <div className="studioDependent"><StudioToggle title={no ? 'Foreslå kontakt når botten ikke kan svare' : 'Suggest contact when the bot cannot answer'} description={no ? 'Tilby kontaktinfo ved kompliserte, uløste spørsmål. Samtalen overføres ikke automatisk.' : 'Offer contact details for complex unresolved questions without transferring the conversation.'} checked={assistant.contactSharing.allowOnUncertainty === true} onChange={allowOnUncertainty => onAssistantChange({ ...assistant, contactSharing: { ...assistant.contactSharing!, allowOnUncertainty } })} /></div>}
      <StudioToggle title={no ? 'Menneskelig support' : 'Human support'} description={no ? 'La kunden be om hjelp fra teamet, uavhengig av deling av kontaktinfo.' : 'Let visitors ask your team for help, independently of contact sharing.'} checked={supportEnabled} onChange={setSupport} />
      {supportEnabled && <div className="studioDependent widgetFlowSettings">
        <label className="widgetFlowField"><span>{no ? 'Når skal kontaktknappen vises?' : 'When should the contact shortcut appear?'}</span><select value={mode} onChange={event => onSettingsChange({ ...settings, ticket: { ...settings.ticket, mode: event.target.value as 'on-demand' | 'always' } })}><option value="on-demand">{no ? 'Ved behov' : 'On demand'}</option><option value="always">{no ? 'Hele tiden' : 'Always'}</option></select></label>
        <StudioToggle title={no ? 'Kunden kan kontakte teamet' : 'Visitors can contact the team'} description={no ? 'Vis en knapp for å sende en henvendelse til bedriften.' : 'Show a button for submitting a request to your business.'} checked={settings.ticket?.allowVisitorCreation !== false} onChange={enabled => {
          onSettingsChange({ ...settings, tasksEnabled: true, ticket: { ...settings.ticket, allowVisitorCreation: enabled } })
          onAssistantChange({ ...assistant, integrations: { ...assistant.integrations!, createSupportTickets: enabled } })
        }} />
        <StudioGroup title={no ? 'Kontaktfelter før innsending' : 'Contact fields before submission'} description={no ? 'Velg hvilke opplysninger kunden skal oppgi.' : 'Choose which details visitors provide.'}><WidgetFlowSettings settings={settings} section="contact" mode="rules" no={no} onChange={onSettingsChange} /></StudioGroup>
        <StudioGroup title={no ? 'Regler for overføring' : 'Handoff rules'}>
          <label className="widgetFlowField"><span>{no ? 'Ord som skal foreslå menneskelig hjelp' : 'Phrases that suggest human help'}</span><textarea rows={3} value={assistant.supportTriggerKeywords.join('\n')} onChange={e => onAssistantChange({ ...assistant, supportTriggerKeywords: e.target.value.split('\n') })} /></label>
          <label className="widgetFlowField"><span>{no ? 'Melding ved overføring til teamet' : 'Message when handing off to the team'}</span><textarea rows={3} value={assistant.handoffMessage} onChange={e => onAssistantChange({ ...assistant, handoffMessage: e.target.value })} /></label>
        </StudioGroup>
      </div>}
      <StudioToggle title={no ? 'Anmeldelser etter samtalen' : 'Reviews after the conversation'} description={no ? 'La kunden gi en frivillig tilbakemelding.' : 'Let visitors leave optional feedback.'} checked={settings.reviewsEnabled === true} onChange={enabled => onSettingsChange({ ...settings, reviewsEnabled: enabled })} />
      {settings.reviewsEnabled && <div className="studioDependent"><StudioToggle title={no ? 'La botten spørre om anmeldelse ved avslutning' : 'Let the bot ask for a review near the end'} checked={settings.reviewPage?.autoAsk !== false} onChange={autoAsk => onSettingsChange({ ...settings, reviewPage: { ...settings.reviewPage, autoAsk } })} /></div>}
    </StudioGroup>
    <StudioGroup title={no ? 'Flere handlinger' : 'More actions'} description={no ? 'Veiledning om booking, bestilling og relevante sider.' : 'Guidance on booking, orders and relevant pages.'}>
      {(['collectLeads', 'bookMeetings', 'routeToPages', 'fetchOrderStatus'] as const).map(key => <StudioToggle key={key} title={{ collectLeads: no ? 'Hjelp med kundehenvendelser' : 'Help with leads', bookMeetings: no ? 'Veiled om booking' : 'Guide visitors to booking', routeToPages: no ? 'Vis vei til relevante sider' : 'Guide visitors to relevant pages', fetchOrderStatus: no ? 'Veiled om ordrestatus' : 'Guide visitors about order status' }[key]} checked={assistant.integrations?.[key] === true} onChange={enabled => onAssistantChange({ ...assistant, integrations: { ...assistant.integrations!, [key]: enabled } })} />)}
      <p>{no ? 'Handlingene bruker opplysningene du har lagt inn. Booking og ordreoppslag krever en tilgjengelig lenke eller tilkoblet løsning.' : 'Actions use the information you provide. Booking and order lookups require an available link or connected service.'}</p>
    </StudioGroup>
  </div>
}
