'use client'
import type { ChatAssistantConfig } from '@/types/database'
import { CHAT_PERSONALITIES } from '@/lib/chat-personality'
import './PersonalitySettings.css'
type Props = { value: ChatAssistantConfig; onChange: (value: ChatAssistantConfig) => void; no?: boolean }
export default function PersonalitySettings({ value, onChange, no = false }: Props) {
 const selected = CHAT_PERSONALITIES.find((item) => item.style === value.responseStyle)
 return <section className="personality-settings" aria-label={no ? 'Chatbotens personlighet' : 'Chatbot personality'}>
 <div className="personality-heading"><span>{no ? 'STEMMEN DIN UTAD' : 'YOUR CUSTOMER-FACING VOICE'}</span><h3>{no ? 'Hvem skal kundene møte?' : 'Who will your customers meet?'}</h3><p>{no ? 'Velg et utgangspunkt, eller skriv din egen svarstil. Personlighet velges uavhengig av fargetema.' : 'Choose a starting point or write your own response style. Personality is independent of your color theme.'}</p></div>
 <div className="personality-options">{CHAT_PERSONALITIES.map((item) => <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => onChange({ ...value, responseStyle: item.style, businessProfile: { ...value.businessProfile!, toneOfVoice: item.tone } })}><strong>{no ? item.no : item.en}</strong><span>{no ? ({ friendly: 'Varm, uformell og imøtekommende.', professional: 'Saklig, rolig og presis.', warm: 'Tålmodig, lyttende og trygg.', playful: 'Energisk og personlig.' }[item.id]) : item.description}</span></button>)}</div>
 <label className="personality-field"><span>{no ? 'Svarstil og detaljnivå' : 'Response style and level of detail'}</span><textarea rows={2} maxLength={1500} value={value.responseStyle} onChange={(event) => onChange({ ...value, responseStyle: event.target.value })} placeholder={no ? 'F.eks. korte, saklige svar uten emojis. Still ett spørsmål om gangen.' : 'For example: concise, factual answers without emojis. Ask one question at a time.'} /></label>
 <label className="personality-language"><input type="checkbox" checked={value.replyInUserLanguage} onChange={(event) => onChange({ ...value, replyInUserLanguage: event.target.checked, businessProfile: { ...value.businessProfile!, multilingual: event.target.checked } })} /><span>{no ? 'Svar på språket kunden bruker' : 'Reply in the customer’s language'}</span></label>
 {selected && <div className="personality-example"><small>{no ? 'EKSEMPEL PÅ TONE · IKKE ET AI-SVAR' : 'TONE EXAMPLE · NOT AN AI RESPONSE'}</small><p>{no ? selected.sampleNo : selected.sampleEn}</p></div>}
 </section>
}
