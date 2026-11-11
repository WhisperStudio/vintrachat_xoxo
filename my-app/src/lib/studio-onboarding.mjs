export function hasAssistantKnowledge(config) {
  return Boolean(config?.businessContext?.trim() || config?.knowledgeBase?.manualNotes?.trim()
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
  return {
    ...current,
    startCard: {
      enabled: current.startCard?.enabled ?? false,
      text: current.startCard?.text?.trim() || [
        profile.businessName ? `Hei! Velkommen til ${profile.businessName}.` : 'Hei! Velkommen.',
        profile.shortDescription || '', 'Hva kan vi hjelpe deg med?',
      ].filter(Boolean).join(' ').slice(0, 350),
    },
    businessProfile: { ...current.businessProfile, ...allowedProfile },
    businessContext: String(result.businessContext || current.businessContext || ''),
    knowledgeBase: {
      ...current.knowledgeBase,
      offerings: knowledge.offerings || current.knowledgeBase?.offerings || '',
      notOffered: current.knowledgeBase?.notOffered || '',
      pricing: knowledge.pricing || current.knowledgeBase?.pricing || '',
      trialInfo: knowledge.trialInfo || current.knowledgeBase?.trialInfo || '',
      bookingInfo: knowledge.bookingInfo || current.knowledgeBase?.bookingInfo || '',
      policies: knowledge.policies || current.knowledgeBase?.policies || '',
      manualNotes: current.knowledgeBase?.manualNotes?.trim() === current.businessContext?.trim()
        ? '' : current.knowledgeBase?.manualNotes || '',
      websiteUrls: Array.isArray(knowledge.websiteUrls) ? knowledge.websiteUrls : current.knowledgeBase?.websiteUrls || [],
      openingHours: knowledge.openingHours || current.knowledgeBase?.openingHours || '',
      contactInfo: knowledge.contactInfo || current.knowledgeBase?.contactInfo || '',
      addresses: knowledge.addresses || current.knowledgeBase?.addresses || '',
      keyFAQs: Array.isArray(result.faqSuggestions) ? result.faqSuggestions : current.knowledgeBase?.keyFAQs || [],
    },
    faqSuggestions: Array.isArray(result.faqSuggestions) ? result.faqSuggestions : current.faqSuggestions || [],
  };
}

export function setupDecisionsComplete(decisions) {
  return typeof decisions.ai === 'boolean' && typeof decisions.reviews === 'boolean'
    && typeof decisions.contact === 'boolean' && typeof decisions.tickets === 'boolean' && ['off', 'on-demand', 'always'].includes(decisions.support);
}
