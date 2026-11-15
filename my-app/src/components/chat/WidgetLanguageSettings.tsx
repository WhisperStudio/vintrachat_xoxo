'use client'
import type { ChatAssistantConfig } from '@/types/database'
import { normalizeLocalization, WIDGET_LANGUAGES } from '@/lib/widget-localization'
import { StudioToggle } from './StudioControls'

export default function WidgetLanguageSettings({ value, onChange, no, showFeatureToggles = true, showWelcomeMessage = true }: {
  value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no: boolean; showFeatureToggles?: boolean; showWelcomeMessage?: boolean
}) {
  const localization = normalizeLocalization(value.localization)
  return <section className="widgetFlowSettings studioLanguageSettings" aria-label={no ? 'Språk' : 'Languages'}>
    {showWelcomeMessage && <h3>{no ? 'Språk og starthilsen' : 'Language and welcome card'}</h3>}
    <label className="widgetFlowField"><span>{no ? 'Standardspråk i chatten' : 'Default interface language'}</span>
      <select value={localization.defaultLanguage} onChange={event => onChange({ ...value, localization: normalizeLocalization({ ...localization, defaultLanguage: event.target.value as typeof localization.defaultLanguage }) })}>
        {Object.entries(WIDGET_LANGUAGES).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
    <StudioToggle title={no ? 'Vil du ha mulighet til flere språk?' : 'Would you like to offer more languages?'} checked={localization.enabled} onChange={enabled => onChange({ ...value, localization: { ...localization, enabled } })} />
    {localization.enabled && <fieldset className="studioLanguageChoices"><legend>{no ? 'Tillatte språk' : 'Allowed languages'}</legend>
      {Object.entries(WIDGET_LANGUAGES).map(([code, label]) => <label key={code}><input type="checkbox" checked={localization.allowedLanguages.includes(code as typeof localization.defaultLanguage)} disabled={code === localization.defaultLanguage} onChange={event => onChange({ ...value, localization: normalizeLocalization({ ...localization, allowedLanguages: event.target.checked ? [...localization.allowedLanguages, code as typeof localization.defaultLanguage] : localization.allowedLanguages.filter(item => item !== code) }) })} /><span>{label}{code === localization.defaultLanguage && <small>{no ? ' · standard' : ' · default'}</small>}</span></label>)}
    </fieldset>}
    {localization.enabled && localization.allowedLanguages.length < 2 && <p role="status">{no ? 'Bare ett språk er tillatt. Legg til flere språk hvis besøkende skal kunne bytte språk og få innholdet oversatt.' : 'Only one language is allowed. Add more languages to let visitors switch and translate the interface.'}</p>}
    <details className="studioDetails"><summary>{no ? 'ⓘ Mangler du et språk?' : 'ⓘ Missing a language?'}</summary><p>{no ? 'Mangler du noen språk? Send oss en e-post på ' : 'Missing a language? Email us at '}<a href="mailto:vintrastudio@gmail.com">vintrastudio@gmail.com</a>{no ? ', eller henvend deg til botten for å sende inn en forespørsel.' : ', or ask the bot to submit a request.'}</p></details>
    <p>{no ? 'Valget gjelder knapper, faste tekster og egne hjelpekort. AI-en svarer på språket besøkeren skriver.' : 'This controls buttons, interface text and your help cards. The AI replies in the visitor’s language.'}</p>
    {showFeatureToggles && <label className="widgetFlowToggle"><span>{no ? 'Vis startkort før chatten åpnes' : 'Show welcome card before opening chat'}</span><input type="checkbox" checked={value.startCard?.enabled ?? false} onChange={event => onChange({ ...value, startCard: { text: value.startCard?.text || '', enabled: event.target.checked } })} /></label>}
    {showWelcomeMessage && value.startCard?.enabled && <label className="widgetFlowField"><span>{no ? 'Din starthilsen' : 'Your welcome message'}</span><textarea rows={3} maxLength={350} value={value.startCard?.text || ''} placeholder={no ? 'Hei! Hva kan vi hjelpe deg med?' : 'Hi! How can we help you?'} onChange={event => onChange({ ...value, startCard: { enabled: value.startCard?.enabled ?? false, text: event.target.value } })} /><small>{no ? 'Nettsideimporten foreslår en tekst dersom feltet er tomt. Du kan alltid endre den.' : 'Website import suggests copy if this field is empty. You can always edit it.'}</small></label>}
  </section>
}
