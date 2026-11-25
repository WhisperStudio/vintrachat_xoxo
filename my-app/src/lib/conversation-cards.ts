import type { AssistantConversationCard } from '@/types/database'

// Starting or resetting a widget must not publish sample customer content.
export const defaultConversationCards: AssistantConversationCard[] = []

export function normalizeConversationCards(
  cards: AssistantConversationCard[] | null | undefined
): AssistantConversationCard[] {
  // Exact signatures of the old generated examples. Edited options are preserved.
  const legacyOptions = [
    [['Opening hours', 'What are your opening hours?'], ['Prices', 'Can you tell me your prices?'], ['Contact', 'How can I contact you?']],
    [['See services', 'What services do you offer?'], ['Product help', 'Can you help me find the right product?'], ['Compare options', 'Which option should I choose?']],
    [['Book a time', 'I want to book an appointment.'], ['Availability', 'When are you available?'], ['Reschedule', 'Can I change my booking?']],
    [['Order status', 'Can you check my order status?'], ['Delivery', 'How does delivery work?'], ['Return', 'What is your return policy?']],
  ]
  const legacyDescriptions: Record<string, string> = {
    faq: 'Svar på ofte stilte spørsmål om det viktigste.',
    services: 'Vis frem det du tilbyr på en enkel måte.',
    booking: 'La kunder booke tid eller spørre om tilgjengelighet.',
    support: 'Hjelp med ordre, levering og oppfølging.',
  }
  return (Array.isArray(cards) ? cards : [])
    .filter(card => card && typeof card === 'object')
    .map((card, index) => {
      let options = (Array.isArray(card.options) ? card.options : [])
        .filter(option => option && typeof option === 'object')
        .map(option => {
          const label = String(option.label || '').trim()
          const prompt = String(option.prompt || '').trim()
          return { label: label || prompt, prompt: prompt || label, description: String(option.description || '').trim() || undefined }
        })
        .filter(option => option.label && option.prompt)
      let description = String(card.description || '').trim()
      const oldExampleContext = description === 'Common' || description === legacyDescriptions[card.id]
      const untouchedExamples = oldExampleContext && legacyOptions.some(group =>
        group.length === options.length && group.every(([label, prompt], i) =>
          options[i].label === label && options[i].prompt === prompt && !options[i].description))
      if (untouchedExamples) {
        options = []
        description = ''
      }
      return {
        id: String(card.id || `card-${index}`).trim(),
        title: String(card.title || '').trim() || options[0]?.label || description,
        description,
        icon: String(card.icon || '').trim() || undefined,
        image: String(card.image || '').trim() || undefined,
        options,
      }
    })
    .filter(card => card.title)
}

// A submenu is useful only when the owner has configured multiple choices.
export function getConversationCardAction(card: AssistantConversationCard): { type: 'message'; prompt: string } | { type: 'menu' } {
  if (card.options.length > 1) return { type: 'menu' }
  return { type: 'message', prompt: card.options[0]?.prompt || card.title }
}

export function getPreviewConversationCards(cards: AssistantConversationCard[] | null | undefined): AssistantConversationCard[] {
  return normalizeConversationCards(cards)
}
