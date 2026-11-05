'use client'

import { useState } from 'react'
import Link from 'next/link'
import './conversation-demo.css'

export default function ConversationDemo({ language }: { language: 'no' | 'en' }) {
  const no = language === 'no'
  const [scenario, setScenario] = useState<'support' | 'choice' | 'design'>('choice')
  const [manualStep, setManualStep] = useState(0)
  const examples = {
    support: { label: no ? 'Kundeservice' : 'Support', question: no ? 'Hvor finner jeg åpningstidene deres?' : 'Where can I find your opening hours?', answer: no ? 'Jeg kan hjelpe deg med det. Botten bruker informasjonen bedriften har lagt inn, slik at kundene finner svar uten å lete gjennom hele nettsiden.' : 'I can help with that. The bot uses information provided by the business so customers can find answers without searching the whole website.' },
    choice: { label: no ? 'Hjelp til å velge' : 'Help choosing', question: no ? 'Kan jeg bruke chatboten på nettsiden jeg allerede har?' : 'Can I use the chatbot on my existing website?', answer: no ? 'Ja! Du kan bruke chatbotløsningen uten å bestille en ny nettside fra oss. Tilpass botten, legg inn bedriftsinformasjonen din og installer widgeten på nettsiden.' : 'Yes! You can use the chatbot without ordering a new website from us. Customize your bot, add your business information and install the widget on your site.' },
    design: { label: no ? 'Eget uttrykk' : 'Your own style', question: no ? 'Kan botten se ut og snakke som bedriften vår?' : 'Can the bot look and sound like our business?', answer: no ? 'Ja. Velg farger, former, ikoner og animasjoner, og bestem om tonen skal være jovial eller seriøs. Forhåndsvisningen viser endringene mens du jobber.' : 'Yes. Choose colors, shapes, icons and animations, then decide whether the tone should be friendly or professional. The preview shows your changes as you work.' },
  }
  const example = examples[scenario]
  return <div className="conversationDemo" data-manual-step={manualStep}>
    <div className="conversationDemoNotice">{no ? 'SIMULERT SAMTALE · INGEN MELDINGER SENDES' : 'SIMULATED CONVERSATION · NO MESSAGES ARE SENT'}</div>
    <div className="conversationDemoTopics" role="group" aria-label={no ? 'Velg et eksempel' : 'Choose an example'}>
      {(Object.keys(examples) as Array<keyof typeof examples>).map((key) => <button key={key} type="button" aria-pressed={scenario === key} onClick={() => { setScenario(key); setManualStep(2) }}>{examples[key].label}</button>)}
    </div>
    <div className="conversationDemoThread" aria-label={no ? 'Eksempel på kundedialog' : 'Example customer conversation'}>
      <div className="conversationDemoMessage conversationDemoMessage--user" data-step="1"><small>{no ? 'Kunde' : 'Customer'}</small><p>{example.question}</p></div>
      <div className="conversationDemoTyping" aria-label={no ? 'Eksempel: botten skriver' : 'Example: the bot is typing'}><span /><span /><span /></div>
      <div className="conversationDemoMessage" data-step="2"><small>VintraChat</small><p>{example.answer}</p></div>
      <div className="conversationDemoMessage conversationDemoMessage--user" data-step="3"><small>{no ? 'Kunde' : 'Customer'}</small><p>{no ? 'Jeg vil gjerne snakke med en person også.' : 'I would like to speak to a person as well.'}</p></div>
      <div className="conversationDemoMessage conversationDemoMessage--handoff" data-step="4"><small>{no ? 'Menneskelig oppfølging' : 'Human follow-up'}</small><p>{no ? 'Selvfølgelig. Samtalen kan merkes for oppfølging av teamet, med konteksten fra dialogen. Bedriften velger hvordan kunden blir kontaktet.' : 'Of course. The conversation can be flagged for your team to follow up, with the context from the chat. The business chooses how to contact the customer.'}</p></div>
    </div>
    <div className="conversationDemoActions">
      <button type="button" onClick={() => setManualStep(4)}>{no ? 'Vis overgang til support' : 'Show support handoff'}</button>
      <Link href="/landings/auth/chatWidget">{no ? 'Tilpass din egen bot →' : 'Customize your bot →'}</Link>
    </div>
  </div>
}
