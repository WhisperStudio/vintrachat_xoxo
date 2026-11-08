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
    alwaysShowTickets: ticketsEnabled && mode === 'always',
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

export function validateWidgetContact(flow, contact = {}) {
  if (!String(contact.name || '').trim()) return 'Please enter your name.';
  const email = String(contact.email || '').trim();
  const phone = String(contact.phone || '').trim();
  if (flow.requireEmail && !email) return 'Please enter your email address.';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  if (flow.requirePhone && !phone) return 'Please enter your phone number.';
  return '';
}
