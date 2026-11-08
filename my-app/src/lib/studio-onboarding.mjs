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
  for (const key of ['businessName', 'industry', 'shortDescription', 'language', 'fallbackContact']) {
    if (typeof profile[key] === 'string' && profile[key].trim()) allowedProfile[key] = profile[key];
  }
  return {
    ...current,
    businessProfile: { ...current.businessProfile, ...allowedProfile },
    businessContext: String(result.businessContext || current.businessContext || ''),
    knowledgeBase: {
      ...current.knowledgeBase,
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
    && typeof decisions.tickets === 'boolean' && ['off', 'on-demand', 'always'].includes(decisions.support);
}
