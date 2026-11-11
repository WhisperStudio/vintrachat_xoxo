import { cleanImportedKnowledge, canonicalKnowledgeUrls } from './website-knowledge.mjs';
export function hasAssistantKnowledge(config) {
  return Boolean(config?.businessContext?.trim() || config?.knowledgeBase?.manualNotes?.trim()
    || ['offerings', 'pricing', 'trialInfo', 'bookingInfo', 'policies', 'openingHours', 'contactInfo', 'addresses'].some(key => config?.knowledgeBase?.[key]?.trim())
    || config?.knowledgeBase?.uploadedDocuments?.some(doc => doc.text?.trim()));
}

export function needsStudioSetup(business, userId) {
  return Boolean(business && userId && business.ownerId === userId
    && !business.onboarding?.widgetSetupCompletedAt
    && !hasAssistantKnowledge(business.chatAssistantConfig)
    && !business.chatWidgets?.some(widget => hasAssistantKnowledge(widget.assistantConfig)));
}

// A website supplies facts, never opt-ins, personality or permission to hand off.
export function mergeWebsiteKnowledge(current, result) {
  const profile = result.autofill?.businessProfile || {};
  const knowledge = result.autofill?.knowledgeBase || {};
  const allowedProfile = {};
  for (const key of ['businessName', 'industry', 'shortDescription', 'fallbackContact']) {
    if (typeof profile[key] === 'string' && profile[key].trim()) allowedProfile[key] = profile[key];
  }
  const field = (key) => cleanImportedKnowledge(Object.hasOwn(knowledge, key) ? knowledge[key] : current.knowledgeBase?.[key] || '');
  const contactEnabled = current.contactSharing?.enabled === true || current.humanSupportEnabled === true;
  if (!contactEnabled) delete allowedProfile.fallbackContact;
  const hasStructuredFacts = ['offerings', 'pricing', 'openingHours', 'contactInfo', 'policies'].some(key => knowledge[key]);
  return {
    ...current,
    startCard: {
      enabled: current.startCard?.enabled ?? false,
      text: current.startCard?.text?.trim() || (current.startCard?.enabled ? [
        profile.businessName ? `Hei! Velkommen til ${profile.businessName}.` : 'Hei! Velkommen.',
        profile.shortDescription || '', 'Hva kan vi hjelpe deg med?',
      ].filter(Boolean).join(' ').slice(0, 350) : ''),
    },
    conversationCards: current.conversationCardsEnabled && !current.conversationCards?.length && Array.isArray(result.setup?.widgetDefaults?.conversationCards) ? result.setup.widgetDefaults.conversationCards : current.conversationCards || [],
    businessProfile: { ...current.businessProfile, ...allowedProfile },
    businessContext: hasStructuredFacts ? cleanImportedKnowledge(profile.shortDescription || '') : cleanImportedKnowledge(result.businessContext || current.businessContext || ''),
    knowledgeBase: {
      ...current.knowledgeBase,
      offerings: field('offerings'),
      notOffered: current.knowledgeBase?.notOffered || '',
      pricing: field('pricing'),
      trialInfo: field('trialInfo'),
      bookingInfo: current.integrations?.bookMeetings ? field('bookingInfo') : current.knowledgeBase?.bookingInfo || '',
      policies: field('policies'),
      manualNotes: current.knowledgeBase?.manualNotes?.trim() === current.businessContext?.trim()
        ? '' : current.knowledgeBase?.manualNotes || '',
      websiteUrls: canonicalKnowledgeUrls(knowledge.websiteUrls || current.knowledgeBase?.websiteUrls || []),
      openingHours: field('openingHours'),
      contactInfo: contactEnabled ? field('contactInfo') : current.knowledgeBase?.contactInfo || '',
      addresses: field('addresses'),
      keyFAQs: current.faqSuggestionsEnabled && Array.isArray(result.faqSuggestions) ? result.faqSuggestions : current.knowledgeBase?.keyFAQs || [],
    },
    faqSuggestions: current.faqSuggestionsEnabled && Array.isArray(result.faqSuggestions) ? result.faqSuggestions : current.faqSuggestions || [],
  };
}

export function setupDecisionsComplete(decisions) {
  return typeof decisions.languages === 'boolean' && typeof decisions.startCard === 'boolean' && typeof decisions.ai === 'boolean' && typeof decisions.reviews === 'boolean'
    && typeof decisions.contact === 'boolean' && typeof decisions.tickets === 'boolean' && ['off', 'on-demand', 'always'].includes(decisions.support);
}
