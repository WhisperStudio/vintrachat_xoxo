// Shared by the server, React preview and exported shadow-DOM widget.
export function resolveWidgetFlow(settings = {}, assistant = {}) {
  const ticket = settings.ticket || {};
  const contact = settings.contactForm || {};
  const review = settings.reviewPage || {};
  const mode = ['off', 'on-demand', 'always'].includes(ticket.mode) ? ticket.mode : 'on-demand';
  const supportEnabled = mode !== 'off' && assistant.humanSupportEnabled !== false;
  const ticketsEnabled = supportEnabled && (settings.tasksEnabled === true || ticket.mode === 'always' || ticket.mode === 'on-demand');
  return {
    supportEnabled,
    ticketsEnabled,
    allowVisitorCreation: ticketsEnabled && ticket.allowVisitorCreation !== false,
    alwaysShowTickets: ticketsEnabled && (ticket.showTabAlways === true || (ticket.showTabAlways !== false && mode === 'always')),
    showTeamTasksToVisitors: ticket.showTeamTasksToVisitors === true,
    ticketTitle: String(ticket.title || 'Support tickets').slice(0, 100),
    ticketDescription: String(ticket.description || 'Send a request to the team and track it here.').slice(0, 500),
    ticketLayout: ticket.layout === 'compact' ? 'compact' : 'cards',
    reviewsEnabled: settings.reviewsEnabled === true,
    autoAskReview: settings.reviewsEnabled === true && review.autoAsk !== false,
    reviewHeaderButton: settings.reviewsEnabled === true && review.showHeaderButton === true,
    reviewTitle: String(review.title || 'Leave feedback').slice(0, 100),
    reviewDescription: String(review.description || 'How was your experience?').slice(0, 500),
    contactTitle: String(contact.title || 'Contact information').slice(0, 100),
    contactDescription: String(contact.description || 'How can the team reach you?').slice(0, 500),
    showEmail: contact.requireEmail === true || contact.showEmail !== false,
    showPhone: contact.requirePhone === true || contact.showPhone !== false,
    requireEmail: contact.requireEmail === true,
    requirePhone: contact.requirePhone === true,
    formStyle: contact.style === 'compact' ? 'compact' : 'comfortable',
  };
}

export function getContextualWidgetSuggestions(query, candidates = [], fallback = []) {
  const normalize = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const topicGroups = [
    ['opening', 'hours', 'open', 'opening hours', 'opening time', 'apningstid', 'apningstider', 'apningstidene', 'nar apner', 'nar stenger'],
    ['price', 'prices', 'pricing', 'cost', 'costs', 'how much', 'pris', 'priser', 'kostnad', 'koster'],
    ['contact', 'email', 'phone', 'contact info', 'kontakt', 'epost', 'telefon'],
  ]
  const text = normalize(query).trim()
  const items = (Array.isArray(candidates) ? candidates : [])
    .map((item) => ({
      prompt: String(item?.prompt || item?.label || '').trim(),
      context: normalize(`${item?.label || ''} ${item?.context || ''} ${item?.prompt || ''}`),
    }))
    .filter((item) => item.prompt)
  if (!text) return (Array.isArray(fallback) ? fallback : []).map(String).filter(Boolean).slice(0, 3)
  if (!items.length) return []

  const stopWords = new Set(['how', 'what', 'are', 'your', 'can', 'you', 'does', 'tell', 'me', 'my', 'the', 'is', 'a', 'to', 'do', 'please', 'hva', 'er', 'jeg', 'kan', 'dere', 'om'])
  const queryTokens = text.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 2 && !stopWords.has(token))
  const matchingTopics = topicGroups.filter((group) => group.some((term) => text.includes(normalize(term))))
  const ranked = items.map((item, index) => {
    let score = queryTokens.reduce((total, token) => total + (item.context.includes(token) ? 2 : 0), 0)
    for (const group of matchingTopics) {
      if (group.some((term) => item.context.includes(normalize(term)))) score += 4
    }
    return { ...item, score, index }
  }).filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
  return ranked.slice(0, 3).map((item) => item.prompt)
}

export function validateWidgetContact(flow, contact = {}) {
  if (!String(contact.name || '').trim()) return 'Please enter your name.';
  const email = String(contact.email || '').trim();
  const phone = String(contact.phone || '').trim();
  if (flow.requireEmail && !email) return 'Please enter your email address.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (flow.requirePhone && !phone) return 'Please enter your phone number.';
  return '';
}
