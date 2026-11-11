'use client'
import type { ChatAssistantConfig } from '@/types/database'
import { FiMessageCircle } from 'react-icons/fi'
import { CHAT_PERSONALITIES } from '@/lib/chat-personality'
import './PersonalitySettings.css'
type Props = { value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no?: boolean }
export default function PersonalitySettings({ value, onChange, no = false }: Props) {
 const selected = CHAT_PERSONALITIES.find((item) => item.style === value.responseStyle)
 return <section className="personality-settings" aria-label={no ? 'Chatbotens personlighet' : 'Chatbot personality'}>
 <div className="personality-heading"><span className="studioSectionSymbol"><FiMessageCircle aria-hidden="true" /></span><span>{no ? 'SVARSTIL' : 'RESPONSE STYLE'}</span><h3>{no ? 'Hvem skal kundene møte?' : 'Who will your customers meet?'}</h3><p>{no ? 'Velg et utgangspunkt, eller skriv din egen svarstil. Dette er det eneste stedet du velger assistentens tone.' : 'Choose a starting point or write your own response style. This is the single place to set the assistant’s tone.'}</p></div>
 <div className="personality-options">{CHAT_PERSONALITIES.map((item) => <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => onChange({ ...value, responseStyle: item.style, businessProfile: { ...value.businessProfile!, toneOfVoice: item.tone } })}><strong>{no ? item.no : item.en}</strong><span>{no ? ({ friendly: 'Varm, uformell og imøtekommende.', professional: 'Saklig, rolig og presis.', warm: 'Tålmodig, lyttende og trygg.', playful: 'Energisk og personlig.' }[item.id]) : item.description}</span></button>)}</div>
 <label className="personality-field"><span>{no ? 'Svarstil og detaljnivå' : 'Response style and level of detail'}</span><textarea rows={2} maxLength={1500} value={value.responseStyle} onChange={(event) => onChange({ ...value, responseStyle: event.target.value, businessProfile: { ...value.businessProfile!, toneOfVoice: event.target.value } })} placeholder={no ? 'F.eks. korte, saklige svar uten emojis. Still ett spørsmål om gangen.' : 'For example: concise, factual answers without emojis. Ask one question at a time.'} /></label>
 <p>{no ? 'AI-en svarer p\u00e5 spr\u00e5ket kunden bruker. Spr\u00e5k for grensesnittet velges under Funksjoner.' : 'The AI replies in the visitor\'s language. Choose interface languages under Features.'}</p>
 <label className="widgetFlowField"><span>{no ? 'Hva skal assistenten prioritere?' : 'What should the assistant prioritize?'}</span><select value={value.strictness || 'balanced'} onChange={e => onChange({ ...value, strictness: e.target.value as ChatAssistantConfig['strictness'] })}><option value="balanced">{no ? 'Balansert hjelp' : 'Balanced help'}</option><option value="sales">{no ? 'Salg og veiledning' : 'Sales and guidance'}</option><option value="support">{no ? 'Kundeservice og problemløsing' : 'Support and problem solving'}</option></select></label>
 {selected && <div className="personality-example"><small>{no ? 'EKSEMPEL PÅ TONE · IKKE ET AI-SVAR' : 'TONE EXAMPLE · NOT AN AI RESPONSE'}</small><p>{no ? selected.sampleNo : selected.sampleEn}</p></div>}
 <details className="studioDetails widgetFlowSettings"><summary>{no ? 'Instruksjoner og grenser' : 'Instructions and boundaries'}</summary>
 <label className="widgetFlowToggle"><span>{no ? 'Svar bare ut fra opplysningene jeg har gitt' : 'Answer only from the information I provide'}</span><input type="checkbox" checked={value.strictContextOnly} onChange={e => onChange({ ...value, strictContextOnly: e.target.checked })} /></label>
 <label className="widgetFlowField"><span>{no ? 'Hva skal assistenten unngå?' : 'What should the assistant avoid?'}</span><textarea rows={3} value={value.restrictions} onChange={e => onChange({ ...value, restrictions: e.target.value })} /></label>
 {(['systemPrompt', 'extraInstructions'] as const).map(key => <label className="widgetFlowField" key={key}><span>{key === 'systemPrompt' ? (no ? 'Grunninstruksjon' : 'Base instruction') : (no ? 'Ekstra instruksjoner' : 'Additional instructions')}</span><textarea rows={3} value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} /></label>)}
 <label className="widgetFlowToggle"><span>{no ? 'Bruk bare valgt AI-modell, uten reservemodell' : 'Use only the selected AI model, without fallback'}</span><input type="checkbox" checked={value.forceSelectedModelOnly} onChange={e => onChange({ ...value, forceSelectedModelOnly: e.target.checked })} /></label>
 </details>
 </section>
}
