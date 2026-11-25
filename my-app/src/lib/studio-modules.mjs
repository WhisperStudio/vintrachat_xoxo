import { mergeWebsiteKnowledge } from './studio-onboarding.mjs';

export const STUDIO_MODULES = [
  { id: 'company', category: 'knowledge', mandatory: true, no: 'Min bedrift', en: 'My business', hintNo: 'Navn, bransje og hva dere tilbyr.', hintEn: 'Name, industry and what you offer.', infoNo: 'Oppgi bedriftsnavn, bransje og en beskrivelse av hva dere tilbyr. Dette er grunnlaget for at assistenten skal forstå bedriften. Resten av feltene er valgfrie.', infoEn: 'Add your business name, industry and what you offer. This helps the assistant understand your business. The remaining fields are optional.', autofill: true },
  { id: 'chat', category: 'features', mandatory: true, no: 'Chat og språk', en: 'Chat and language', hintNo: 'AI-svar og standardspråk i chatten.', hintEn: 'AI replies and default chat language.', infoNo: 'Velg om assistenten skal svare automatisk, og hvilket språk knapper og faste tekster skal bruke. Ekstra språk legges til som egen modul.', infoEn: 'Choose automatic replies and the default interface language. Add extra languages as a separate module.' },
  { id: 'personality', category: 'personality', mandatory: true, no: 'Svarstil og regler', en: 'Response style and rules', hintNo: 'Personlighet, tone og grenser for svarene.', hintEn: 'Personality, tone and answer boundaries.', infoNo: 'Velg hvordan assistenten skal møte kundene, og hvilke regler den skal følge. En god standard er allerede lagt inn. Tilpass den til bedriften og lagre når du er fornøyd.', infoEn: 'Choose how the assistant greets visitors and which rules it follows. Review the supplied defaults and adjust them to your business.' },
  { id: 'pricing', category: 'knowledge', no: 'Priser og prøveperioder', en: 'Pricing and trials', hintNo: 'Bekreftede priser og eventuelle prøveperioder.', hintEn: 'Confirmed prices and optional trials.', infoNo: 'Legg inn bekreftede priser per produkt eller tjeneste. Oppgi valuta og faktureringsperiode. Informasjon om prøveperioder er valgfri.', infoEn: 'Add confirmed prices for each product or service, including currency and billing interval. Trial information is optional.', autofill: true },
  { id: 'terms', category: 'knowledge', no: 'Kundevilkår', en: 'Customer terms', hintNo: 'Levering, retur, avbestilling og garanti.', hintEn: 'Delivery, returns, cancellation and guarantees.', infoNo: 'Legg inn vilkår kundene trenger å kjenne til. Ta bare med bekreftede regler som gjelder bedriftens tjenester eller produkter.', infoEn: 'Add confirmed customer terms relevant to your products and services.', autofill: true },
  { id: 'locations', category: 'knowledge', no: 'Avdelinger og lokasjoner', en: 'Branches and locations', hintNo: 'Adresser og åpningstider per avdeling.', hintEn: 'Addresses and opening hours by branch.', infoNo: 'Knytt hver adresse og åpningstid til riktig avdeling. Assistenten skal spørre hvilken avdeling kunden mener når dette er uklart.', infoEn: 'Keep each address and schedule with the correct branch. The assistant asks which branch a visitor means when needed.', autofill: true },
  { id: 'documents', category: 'knowledge', no: 'Kunnskapsdokumenter', en: 'Knowledge documents', hintNo: 'Tekstfiler, kilder og egne notater.', hintEn: 'Text files, sources and notes.', infoNo: 'Last opp tekstfiler eller skriv godkjente notater. Kontroller innholdet før lagring. Nettsidelenker dokumenterer kildene; de er ikke alene et ferdig kunnskapsgrunnlag.', infoEn: 'Upload text files or add approved notes. Review their content. Source links alone are not a complete knowledge base.' },
  { id: 'languages', category: 'features', no: 'Ekstra språk', en: 'Extra languages', hintNo: 'La kundene velge mellom flere språk.', hintEn: 'Let visitors choose between languages.', infoNo: 'Velg minst ett språk i tillegg til standardspråket. Standardspråket er alltid tillatt.', infoEn: 'Select at least one additional language. The default language is always allowed.', design: 'header' },
  { id: 'welcome', category: 'features', no: 'Starthilsen', en: 'Welcome message', hintNo: 'En kort hilsen ved chatknappen.', hintEn: 'A short greeting by the chat button.', infoNo: 'Skriv en kort og relevant hilsen som vises før chatten åpnes. Autofyll kan foreslå tekst fra bedriftens nettside.', infoEn: 'Write a short greeting shown before chat opens. Autofill can suggest text from your website.', autofill: true, design: 'bubble' },
  { id: 'suggestions', category: 'features', no: 'Spørsmålsforslag', en: 'Suggested questions', hintNo: 'Gode spørsmål kunden kan starte med.', hintEn: 'Questions visitors can start with.', infoNo: 'Legg inn ett ekte kundespørsmål per linje. Forslagene hjelper kunden å komme i gang.', infoEn: 'Add one genuine customer question per line to help visitors start.', autofill: true, design: 'body' },
  { id: 'cards', category: 'features', no: 'Hjelpekort', en: 'Help cards', hintNo: 'Temaer og snarveier i velkomsten.', hintEn: 'Topics and welcome shortcuts.', infoNo: 'Gi kortene relevante titler og spørsmål. Du kan tilpasse ikoner, bilder og hele kortoppsettet under Design → Chatmeldinger.', infoEn: 'Add useful titles and questions. Edit icons, images and the full card layout under Design → Messages.', autofill: true, design: 'body' },
  { id: 'support', category: 'features', no: 'Menneskelig support', en: 'Human support', hintNo: 'La kunden få hjelp av teamet.', hintEn: 'Let visitors ask your team for help.', infoNo: 'Velg når support skal vises og hva kunden får beskjed om ved overføring. Henvendelsene går til teamets eksisterende innboks. Offentlig kontaktinfo er valgfritt.', infoEn: 'Choose when support appears and what visitors are told during handoff. Requests go to your team inbox. Public contact details are optional.', autofill: true, design: 'tickets' },
  { id: 'contact', category: 'features', no: 'Deling av kontaktinfo', en: 'Contact sharing', hintNo: 'Godkjent e-post, telefon og kontaktlenker.', hintEn: 'Approved email, phone and contact links.', infoNo: 'Legg inn kontaktinformasjon botten kan dele når kunden spør. Dette er uavhengig av menneskelig support og overfører ikke samtalen.', infoEn: 'Add contact information the bot can share when asked. This is separate from human support and does not transfer conversations.', autofill: true },
  { id: 'reviews', category: 'features', no: 'Anmeldelser', en: 'Reviews', hintNo: 'Frivillig tilbakemelding etter samtalen.', hintEn: 'Optional feedback after conversations.', infoNo: 'Velg om botten skal spørre om en anmeldelse. Skjemaet åpnes først når kunden ønsker det. Se over skjemaets utseende under Design.', infoEn: 'Choose whether the bot asks for a review. The form opens only when the visitor wants it. Review its appearance under Design.', design: 'reviews' },
  { id: 'booking', category: 'features', no: 'Booking og bestilling', en: 'Booking and ordering', hintNo: 'Vis vei til riktig bestillingsløsning.', hintEn: 'Guide visitors to the booking service.', infoNo: 'Legg inn bekreftet bookinglenke og fremgangsmåte. En lenke gir ikke botten tilgang til kalenderen og betyr ikke at den kan bestille selv.', infoEn: 'Add the confirmed booking link and instructions. A link does not give the bot access to a calendar or let it make bookings.', autofill: true },
  { id: 'actions', category: 'features', no: 'Flere handlinger', en: 'More actions', hintNo: 'Kundehenvendelser, sider og ordreveiledning.', hintEn: 'Leads, relevant pages and order guidance.', infoNo: 'Aktiver handlingene dere ønsker. De bruker godkjent informasjon; ordreoppslag krever en tilgjengelig, tilkoblet løsning.', infoEn: 'Enable the actions you need. They use approved information; order lookups require a connected service.' },
];
const ids = new Set(STUDIO_MODULES.map(item => item.id));
export const MANDATORY_STUDIO_MODULES = STUDIO_MODULES.filter(item => item.mandatory).map(item => item.id);
const cleanIds = value => [...new Set(Array.isArray(value) ? value.filter(id => typeof id === 'string' && ids.has(id)) : [])];
const filled = value => typeof value === 'string' ? Boolean(value.trim()) : Array.isArray(value) ? value.some(filled) : Boolean(value);

/** @returns {{version: 1, added: string[], configured: string[], designReviewed: string[]}} */
export function normalizeStudioModules(state) {
  return { version: 1, added: cleanIds(state?.added), configured: cleanIds(state?.configured), designReviewed: cleanIds(state?.designReviewed) };
}

export function getActiveStudioModules(assistant, settings = {}) {
  if (assistant.studio?.version === 1) return [...new Set([...MANDATORY_STUDIO_MODULES, ...cleanIds(assistant.studio.added)])];
  const knowledge = assistant.knowledgeBase || {};
  const inferred = {
    pricing: filled(knowledge.pricing || knowledge.trialInfo), terms: filled(knowledge.policies),
    locations: filled(knowledge.addresses || knowledge.openingHours),
    documents: filled(knowledge.manualNotes) || knowledge.uploadedDocuments?.length > 0,
    languages: assistant.localization?.enabled, welcome: assistant.startCard?.enabled,
    suggestions: assistant.faqSuggestionsEnabled, cards: assistant.conversationCardsEnabled,
    support: assistant.humanSupportEnabled, contact: assistant.contactSharing?.enabled,
    reviews: settings.reviewsEnabled, booking: assistant.integrations?.bookMeetings,
    actions: ['collectLeads', 'routeToPages', 'fetchOrderStatus'].some(key => assistant.integrations?.[key]),
  };
  return [...MANDATORY_STUDIO_MODULES, ...Object.keys(inferred).filter(key => inferred[key])];
}

export function getStudioModuleState(assistant, settings = {}) {
  if (assistant.studio?.version === 1) return normalizeStudioModules(assistant.studio);
  const active = getActiveStudioModules(assistant, settings);
  return { version: 1, added: active.filter(id => !MANDATORY_STUDIO_MODULES.includes(id)), configured: active, designReviewed: active.filter(id => STUDIO_MODULES.find(item => item.id === id)?.design) };
}

/** @template {Record<string, any>} T @param {T} assistant */
export function createFreshStudioAssistant(assistant) {
  return {
    ...assistant, setupCompleted: false, studio: normalizeStudioModules(null),
    humanSupportEnabled: false, contactSharing: { ...assistant.contactSharing, enabled: false },
    localization: { defaultLanguage: 'no', allowedLanguages: ['no'], ...assistant.localization, enabled: false },
    startCard: { ...assistant.startCard, text: '', enabled: false },
    faqSuggestionsEnabled: false, faqSuggestions: [], conversationCardsEnabled: false, conversationCards: [],
    integrations: { ...assistant.integrations, collectLeads: false, routeToPages: false, bookMeetings: false, fetchOrderStatus: false, createSupportTickets: false, handoffToHuman: false },
    knowledgeBase: { ...assistant.knowledgeBase, pricing: '', trialInfo: '', policies: '', openingHours: '', addresses: '', contactInfo: '', manualNotes: '', uploadedDocuments: [], keyFAQs: [] },
  };
}

// Adding a row does not activate an unconfigured feature in the live chat.
export function addStudioModule(assistant, settings, id) {
  if (!ids.has(id)) return assistant;
  const state = getStudioModuleState(assistant, settings);
  return { ...assistant, studio: { ...state, added: [...new Set([...state.added, id])], configured: state.configured.filter(item => item !== id), designReviewed: state.designReviewed.filter(item => item !== id) } };
}

export function removeStudioModule(assistant, settings, id) {
  if (MANDATORY_STUDIO_MODULES.includes(id) || !ids.has(id)) return { assistant, settings };
  const state = getStudioModuleState(assistant, settings);
  const next = { ...assistant, studio: { ...state, added: state.added.filter(item => item !== id), configured: state.configured.filter(item => item !== id), designReviewed: state.designReviewed.filter(item => item !== id) } };
  let nextSettings = settings;
  if (id === 'support') { next.humanSupportEnabled = false; next.integrations = { ...next.integrations, handoffToHuman: false, createSupportTickets: false }; nextSettings = { ...settings, tasksEnabled: false, ticket: { ...settings.ticket, mode: 'off' } }; }
  if (id === 'reviews') nextSettings = { ...settings, reviewsEnabled: false };
  if (id === 'contact') next.contactSharing = { ...next.contactSharing, enabled: false };
  if (id === 'languages') next.localization = { ...next.localization, enabled: false };
  if (id === 'welcome') next.startCard = { ...next.startCard, enabled: false };
  if (id === 'suggestions') next.faqSuggestionsEnabled = false;
  if (id === 'cards') next.conversationCardsEnabled = false;
  if (id === 'booking') next.integrations = { ...next.integrations, bookMeetings: false };
  if (id === 'actions') next.integrations = { ...next.integrations, collectLeads: false, routeToPages: false, fetchOrderStatus: false };
  const fields = { pricing: ['pricing', 'trialInfo'], terms: ['policies'], locations: ['addresses', 'openingHours'], documents: ['manualNotes'], booking: ['bookingInfo'] }[id] || [];
  if (fields.length) { next.knowledgeBase = { ...next.knowledgeBase }; for (const key of fields) next.knowledgeBase[key] = ''; }
  if (id === 'documents') next.knowledgeBase.uploadedDocuments = [];
  return { assistant: next, settings: nextSettings };
}

export function enableStudioModule(assistant, settings, id) {
  const next = { ...assistant };
  let nextSettings = settings;
  if (id === 'support') {
    next.humanSupportEnabled = true;
    next.integrations = { ...next.integrations, handoffToHuman: true, createSupportTickets: settings.ticket?.allowVisitorCreation !== false };
    nextSettings = { ...settings, tasksEnabled: true, ticket: { ...settings.ticket, mode: settings.ticket?.mode === 'always' ? 'always' : 'on-demand' } };
  }
  if (id === 'contact') next.contactSharing = { ...next.contactSharing, enabled: true };
  if (id === 'welcome') next.startCard = { text: next.startCard?.text || '', enabled: true };
  if (id === 'languages') next.localization = { defaultLanguage: 'no', allowedLanguages: ['no'], ...next.localization, enabled: true };
  if (id === 'suggestions') next.faqSuggestionsEnabled = true;
  if (id === 'cards') next.conversationCardsEnabled = true;
  if (id === 'reviews') nextSettings = { ...settings, reviewsEnabled: true };
  if (id === 'booking') next.integrations = { ...next.integrations, bookMeetings: true };
  return { assistant: next, settings: nextSettings };
}

export function markStudioModuleConfigured(assistant, settings, id) {
  const state = getStudioModuleState(assistant, settings);
  return { ...assistant, studio: { ...state, configured: [...new Set([...state.configured, id])] } };
}

export function markStudioDesignReviewed(assistant, settings, section) {
  const state = getStudioModuleState(assistant, settings);
  const matching = STUDIO_MODULES.filter(item => item.design === section && getActiveStudioModules(assistant, settings).includes(item.id)).map(item => item.id);
  return { ...assistant, studio: { ...state, designReviewed: [...new Set([...state.designReviewed, ...matching])] } };
}

export function getPendingStudioDesign(assistant, settings = {}) {
  const state = getStudioModuleState(assistant, settings);
  const active = getActiveStudioModules(assistant, settings);
  return STUDIO_MODULES.filter(item => item.design && active.includes(item.id) && !state.designReviewed.includes(item.id));
}

export function getStudioModuleStatus(id, assistant, settings = {}, { editing = false } = {}) {
  const profile = assistant.businessProfile || {}, knowledge = assistant.knowledgeBase || {};
  const required = [], optional = [];
  const check = (list, label, value) => { if (!filled(value)) list.push(label); };
  if (id === 'company') {
    check(required, 'businessName', profile.businessName); check(required, 'industry', profile.industry);
    check(required, 'businessDescription', knowledge.offerings || assistant.businessContext);
    check(optional, 'shortDescription', profile.shortDescription); check(optional, 'website', knowledge.websiteUrls);
  }
  if (id === 'personality') { check(required, 'responseStyle', assistant.responseStyle); check(required, 'systemPrompt', assistant.systemPrompt); check(optional, 'restrictions', assistant.restrictions); check(optional, 'extraInstructions', assistant.extraInstructions); }
  if (id === 'pricing') { check(required, 'pricing', knowledge.pricing); check(optional, 'trialInfo', knowledge.trialInfo); }
  if (id === 'terms') check(required, 'policies', knowledge.policies);
  if (id === 'locations') { check(required, 'addresses', knowledge.addresses); check(optional, 'openingHours', knowledge.openingHours); }
  if (id === 'documents') check(required, 'documents', knowledge.manualNotes || knowledge.uploadedDocuments?.some(document => filled(document.text)));
  if (id === 'welcome') check(required, 'welcome', assistant.startCard?.text);
  if (id === 'suggestions') check(required, 'suggestions', assistant.faqSuggestions);
  if (id === 'cards') {
    check(required, 'cards', assistant.conversationCards?.length);
    if (assistant.conversationCards?.some(card => !filled(card.title) || card.options?.some(option => !filled(option.label) && !filled(option.prompt)))) required.push('cardQuestions');
  }
  if (id === 'languages') check(required, 'extraLanguage', assistant.localization?.allowedLanguages?.some(code => code !== (assistant.localization?.defaultLanguage || 'no')));
  if (id === 'support') { check(required, 'handoffMessage', assistant.handoffMessage); check(optional, 'contactInfo', knowledge.contactInfo); }
  if (id === 'contact') check(required, 'contactInfo', knowledge.contactInfo);
  if (id === 'booking') check(required, 'bookingInfo', knowledge.bookingInfo);
  if (id === 'actions') check(required, 'actions', ['collectLeads', 'routeToPages', 'fetchOrderStatus'].some(key => assistant.integrations?.[key]));
  const state = getStudioModuleState(assistant, settings);
  const unconfigured = !state.configured.includes(id);
  const mandatory = MANDATORY_STUDIO_MODULES.includes(id);
  const level = required.length || (!editing && unconfigured && !mandatory) ? 'error' : optional.length || (!editing && unconfigured) ? 'warning' : 'complete';
  return { level, required, optional, unconfigured };
}

export function mergeStudioModuleImport(current, result, id) {
  const imported = mergeWebsiteKnowledge(id === 'welcome' ? { ...current, startCard: { ...current.startCard, text: '' } } : current, result);
  const next = { ...current, knowledgeBase: { ...current.knowledgeBase } };
  const keys = { company: ['offerings'], pricing: ['pricing', 'trialInfo'], terms: ['policies'], locations: ['addresses', 'openingHours'], support: ['contactInfo'], contact: ['contactInfo'], booking: ['bookingInfo'] }[id] || [];
  for (const key of keys) next.knowledgeBase[key] = imported.knowledgeBase?.[key] || '';
  if (id === 'company') { next.businessProfile = { ...current.businessProfile, ...Object.fromEntries(['businessName', 'industry', 'shortDescription'].map(key => [key, imported.businessProfile?.[key] || ''])) }; next.businessContext = imported.businessContext; }
  if (id === 'welcome') next.startCard = imported.startCard;
  if (id === 'suggestions') next.faqSuggestions = imported.faqSuggestions;
  if (id === 'cards') next.conversationCards = Array.isArray(result.setup?.widgetDefaults?.conversationCards) ? result.setup.widgetDefaults.conversationCards : imported.conversationCards;
  if (imported.knowledgeBase?.websiteUrls?.length) next.knowledgeBase.websiteUrls = imported.knowledgeBase.websiteUrls;
  return next;
}
