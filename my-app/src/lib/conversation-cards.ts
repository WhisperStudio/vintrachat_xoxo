import type { AssistantConversationCard } from '@/types/database'

const DEFAULT_CARD_OPTIONS = [
  { label: 'Opening hours', prompt: 'What are your opening hours?' },
  { label: 'Prices', prompt: 'Can you tell me your prices?' },
  { label: 'Contact', prompt: 'How can I contact you?' },
]

export const defaultConversationCards: AssistantConversationCard[] = [
  {
    id: 'faq',
    title: 'Vanlige spørsmål',
    description: 'Svar på ofte stilte spørsmål om det viktigste.',
    icon: '❔',
    options: DEFAULT_CARD_OPTIONS,
  },
  {
    id: 'services',
    title: 'Produkter og tjenester',
    description: 'Vis frem det du tilbyr på en enkel måte.',
    icon: '🧰',
    options: [
      { label: 'See services', prompt: 'What services do you offer?' },
      { label: 'Product help', prompt: 'Can you help me find the right product?' },
      { label: 'Compare options', prompt: 'Which option should I choose?' },
    ],
  },
  {
    id: 'booking',
    title: 'Bestilling og booking',
    description: 'La kunder booke tid eller spørre om tilgjengelighet.',
    icon: '🗓️',
    options: [
      { label: 'Book a time', prompt: 'I want to book an appointment.' },
      { label: 'Availability', prompt: 'When are you available?' },
      { label: 'Reschedule', prompt: 'Can I change my booking?' },
    ],
  },
  {
    id: 'support',
    title: 'Kundeservice',
    description: 'Hjelp med ordre, levering og oppfølging.',
    icon: '🎧',
    options: [
      { label: 'Order status', prompt: 'Can you check my order status?' },
      { label: 'Delivery', prompt: 'How does delivery work?' },
      { label: 'Return', prompt: 'What is your return policy?' },
    ],
  },
  {
    id: 'contact',
    title: 'Kontakt oss',
    description: 'Rett folk til riktig kanal eller avdeling.',
    icon: '✉️',
    options: [
      { label: 'Email', prompt: 'What is the best email to reach you?' },
      { label: 'Phone', prompt: 'What is your phone number?' },
      { label: 'Human', prompt: 'I want to talk to a human.' },
    ],
  },
  {
    id: 'more',
    title: 'Annet',
    description: 'For alt som ikke passer i de andre kategoriene.',
    icon: '⋯',
    options: [
      { label: 'More info', prompt: 'Can you tell me more?' },
      { label: 'Something else', prompt: 'I have another question.' },
      { label: 'General help', prompt: 'Can you help me with something else?' },
    ],
  },
]

export function normalizeConversationCards(
  cards: AssistantConversationCard[] | null | undefined
): AssistantConversationCard[] {
  const cleaned = (Array.isArray(cards) ? cards : [])
    .map((card, index) => {
      const options = Array.isArray(card.options)
        ? card.options
            .map((option, optionIndex) => ({
              label: String(option?.label || '').trim(),
              prompt: String(option?.prompt || '').trim(),
              description: String(option?.description || '').trim() || undefined,
              id: `${card.id || index}-${optionIndex}`,
            }))
            .filter((option) => option.label || option.prompt)
            .map(({ id: _id, ...option }) => option)
        : []

      return {
        id: String(card.id || `card-${index}`).trim(),
        title: String(card.title || '').trim(),
        description: String(card.description || '').trim(),
        icon: String(card.icon || '').trim() || undefined,
        image: String(card.image || '').trim() || undefined,
        options,
      }
    })
    .filter((card) => card.title || card.description || card.options.length > 0)

  return cleaned.length ? cleaned : []
}

export function getPreviewConversationCards(cards: AssistantConversationCard[] | null | undefined): AssistantConversationCard[] {
  const cleaned = normalizeConversationCards(cards)
  return cleaned.length ? cleaned : defaultConversationCards
}
