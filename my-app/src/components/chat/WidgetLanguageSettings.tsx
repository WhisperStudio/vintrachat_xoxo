'use client'
import type { ChatAssistantConfig } from '@/types/database'
import { normalizeLocalization, WIDGET_LANGUAGES } from '@/lib/widget-localization'

export default function WidgetLanguageSettings({ value, onChange, no }: {
  value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no: boolean
}) {
  const localization = normalizeLocalization(value.localization)
  return <section className="widgetFlowSettings">
    <h3>{no ? 'Språk og starthilsen' : 'Language and welcome card'}</h3>
    <label className="widgetFlowField"><span>{no ? 'Standardspråk i chatten' : 'Default interface language'}</span>
      <select value={localization.defaultLanguage} onChange={event => onChange({ ...value, localization: normalizeLocalization({ ...localization, defaultLanguage: event.target.value as typeof localization.defaultLanguage }) })}>
        {Object.entries(WIDGET_LANGUAGES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
    <label className="widgetFlowToggle"><span>{no ? 'Vis språkknapp – la besøkende bytte språk' : 'Show language selector – let visitors switch languages'}</span><input type="checkbox" checked={localization.enabled} onChange={event => onChange({ ...value, localization: { ...localization, enabled: event.target.checked } })} /></label>
    <fieldset><legend>{no ? 'Tillatte språk' : 'Allowed languages'}</legend>
      {Object.entries(WIDGET_LANGUAGES).map(([code, label]) => <label className="widgetFlowToggle" key={code}><span>{label}</span><input type="checkbox" checked={localization.allowedLanguages.includes(code as typeof localization.defaultLanguage)} disabled={code === localization.defaultLanguage} onChange={event => onChange({ ...value, localization: normalizeLocalization({ ...localization, allowedLanguages: event.target.checked ? [...localization.allowedLanguages, code as typeof localization.defaultLanguage] : localization.allowedLanguages.filter(item => item !== code) }) })} /></label>)}
    </fieldset>
    {localization.enabled && localization.allowedLanguages.length < 2 && <p role="status">{no ? 'Bare ett språk er tillatt. Legg til flere språk hvis besøkende skal kunne bytte språk og få innholdet oversatt.' : 'Only one language is allowed. Add more languages to let visitors switch and translate the interface.'}</p>}
    <p>{no ? 'Valget gjelder knapper, faste tekster og egne hjelpekort. AI-en svarer på språket besøkeren skriver.' : 'This controls buttons, interface text and your help cards. The AI replies in the visitor’s language.'}</p>
    <label className="widgetFlowToggle"><span>{no ? 'Vis startkort før chatten åpnes' : 'Show welcome card before opening chat'}</span><input type="checkbox" checked={value.startCard?.enabled ?? false} onChange={event => onChange({ ...value, startCard: { text: value.startCard?.text || '', enabled: event.target.checked } })} /></label>
    <label className="widgetFlowField"><span>{no ? 'Din starthilsen' : 'Your welcome message'}</span><textarea rows={3} maxLength={350} value={value.startCard?.text || ''} placeholder={no ? 'Hei! Hva kan vi hjelpe deg med?' : 'Hi! How can we help you?'} onChange={event => onChange({ ...value, startCard: { enabled: value.startCard?.enabled ?? false, text: event.target.value } })} /><small>{no ? 'Nettsideimporten foreslår en tekst dersom feltet er tomt. Du kan alltid endre den.' : 'Website import suggests copy if this field is empty. You can always edit it.'}</small></label>
  </section>
}
