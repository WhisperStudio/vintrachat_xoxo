'use client'

import { useState } from 'react'
import { FiArrowLeft, FiChevronRight, FiMessageCircle, FiPlus, FiTrash2 } from 'react-icons/fi'
import type { AssistantConversationCard } from '@/types/database'
import { renderWidgetIcon } from '@/lib/widget-icons'
import { getConversationCardAction } from '@/lib/conversation-cards'
import ConfirmStudioAction from './ConfirmStudioAction'
import InlineEditableText from './InlineEditableText'

export default function HelpCardsEditor({ cards, limit, no, onChange, onLimitChange }: {
  cards: AssistantConversationCard[]; limit: number; no: boolean
  onChange: (cards: AssistantConversationCard[]) => void; onLimitChange: (limit: number) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = cards.find(card => card.id === selectedId)
  const selectedAction = selected ? getConversationCardAction(selected) : null
  const patch = (next: AssistantConversationCard) => onChange(cards.map(card => card.id === next.id ? next : card))
  const addCard = () => {
    const id = crypto.randomUUID()
    onChange([...cards, { id, title: '', description: '', icon: 'FiMessageCircle', options: [] }])
    setSelectedId(id)
  }
  return <div className="starterCardsPanel helpCardsContent">
    <div className="starterCardsPanel__header"><div><strong>{no ? 'Hjelpekort' : 'Help cards'}</strong><p>{no ? 'Velg et kort for å endre tekst og valg. Ikoner og layout tilpasser du under Design → Chatmeldinger.' : 'Choose a card to edit its text and options. Customize icons and layout under Design → Chat messages.'}</p></div></div>
    {selected ? <div className="starterCardsPanel__detail">
      <button type="button" className="starterCardsPanel__back" onClick={() => setSelectedId(null)}><FiArrowLeft aria-hidden="true" />{no ? 'Tilbake til kortene' : 'Back to cards'}</button>
      <article className="starterCardEditor helpCardDetail">
        <InlineEditableText no={no} label={no ? 'Kortets tittel' : 'Card title'} value={selected.title} onChange={title => patch({ ...selected, title })} />
        <InlineEditableText no={no} label={no ? 'Kort beskrivelse' : 'Short description'} value={selected.description || ''} onChange={description => patch({ ...selected, description })} />
        <p className="helpCardBehavior">{selectedAction?.type === 'menu' ? (no ? 'Dette kortet åpner valgene du har lagt inn nedenfor.' : 'This card opens the choices you configured below.') : selected.options.length ? (no ? 'Dette kortet sender meldingen nedenfor direkte til assistenten.' : 'This card sends the message below directly to the assistant.') : (no ? 'Dette kortet sender tittelen som spørsmål direkte til assistenten. Legg til ett valg for å bruke en annen melding, eller flere valg for å lage en undermeny.' : 'This card sends its title directly to the assistant. Add one option to use a different message, or multiple options to create a submenu.')}</p>
        <div className="starterOptionsEditor"><div className="starterOptionsEditor__header"><div><strong>{no ? 'Valg under kortet' : 'Options under this card'}</strong><p>{no ? 'Knappeteksten vises til kunden. Meldingen sendes til assistenten når kunden velger den.' : 'The button label is shown to the customer. The message is sent to the assistant when they choose it.'}</p></div></div>
        {selected.options.map((option, index) => {
          const patchOption = (value: Partial<typeof option>) => patch({ ...selected, options: selected.options.map((item, i) => i === index ? { ...item, ...value } : item) })
          return <div className="starterOptionRow" key={index}><span className="starterOptionRow__branch" aria-hidden="true" /><div className="starterOptionRow__fields">
            <InlineEditableText no={no} label={(no ? 'Knappetekst' : 'Button label') + ' ' + (index + 1)} value={option.label} onChange={label => patchOption({ label })} />
            <InlineEditableText no={no} label={no ? 'Melding til assistenten' : 'Message sent to the assistant'} value={option.prompt} multiline onChange={prompt => patchOption({ prompt })} />
            <InlineEditableText no={no} label={no ? 'Beskrivelse (valgfritt)' : 'Description (optional)'} value={option.description || ''} onChange={description => patchOption({ description })} />
            </div><ConfirmStudioAction no={no} contextKey={selected.id + index} type="button" className="starterOptionRow__remove" aria-label={no ? 'Fjern valg' : 'Remove option'} onConfirm={() => patch({ ...selected, options: selected.options.filter((_, i) => i !== index) })}><FiTrash2 aria-hidden="true" /></ConfirmStudioAction>
          </div>
        })}
        <button type="button" className="studioSecondaryButton" onClick={() => patch({ ...selected, options: [...selected.options, { label: '', prompt: '', description: '' }] })}><FiPlus aria-hidden="true" />{no ? 'Legg til valg' : 'Add option'}</button>
        </div><ConfirmStudioAction no={no} contextKey={selected.id} type="button" className="studioSecondaryButton" onConfirm={() => { onChange(cards.filter(card => card.id !== selected.id)); setSelectedId(null) }}><FiTrash2 aria-hidden="true" />{no ? 'Fjern kort' : 'Remove card'}</ConfirmStudioAction>
      </article>
    </div> : <>
      <div className="starterCardsPanel__controls"><label className="widgetFlowField studioEditableField"><span>{no ? 'Antall synlige kort' : 'Cards shown'}</span><input type="number" min={1} max={12} value={limit} onChange={event => onLimitChange(Math.max(1, Math.min(12, Number(event.target.value) || 1)))} /></label><div className="starterCardsPanel__actions"><button type="button" className="studioSecondaryButton" onClick={addCard}><FiPlus aria-hidden="true" />{no ? 'Legg til kort' : 'Add card'}</button><ConfirmStudioAction no={no} type="button" className="studioSecondaryButton" onConfirm={() => { onChange([]); setSelectedId(null) }}>{no ? 'Fjern alle kort' : 'Remove all cards'}</ConfirmStudioAction></div></div>
      <div className="starterCardsTree" role="group" aria-label={no ? 'Hjelpekort' : 'Help cards'}>{cards.map((card, index) => <button key={card.id} type="button" className="starterCardsTree__card" onClick={() => setSelectedId(card.id)}><span className="starterCardsTree__line" aria-hidden="true" /><span className="starterCardsTree__icon">{renderWidgetIcon(card.icon, { 'aria-hidden': true }) || <FiMessageCircle aria-hidden="true" />}</span><span className="starterCardsTree__copy"><span className="starterCardsTree__eyebrow">{no ? 'Kort' : 'Card'} {index + 1}</span><strong>{card.title || (no ? 'Kort uten tittel' : 'Untitled card')}</strong><span>{card.description}</span></span><span className="starterCardsTree__meta">{card.options.length > 1 ? `${card.options.length} ${no ? 'valg' : 'options'}` : (no ? 'Direkte spørsmål' : 'Direct question')}</span><FiChevronRight aria-hidden="true" /></button>)}<button type="button" className="starterCardsTree__add" onClick={addCard}><FiPlus aria-hidden="true" />{no ? 'Legg til et kort' : 'Add another card'}</button></div>
    </>}
  </div>
}
