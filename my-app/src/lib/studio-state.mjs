import { hasAssistantKnowledge } from './studio-onboarding.mjs';
import { getActiveStudioModules, getPendingStudioDesign, getStudioModuleStatus, STUDIO_MODULES } from './studio-modules.mjs';

// Compare actual editable values, including restored defaults, instead of treating
// every interaction or category change as an unsaved edit.
export function createStudioSnapshot(inputs, assistant) {
  return JSON.stringify({ inputs, assistant }, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
    }
    return value;
  });
}

export function getStudioReadiness(assistant, { isSetup = false, knowledgeReviewed = false, settings = {} } = {}) {
  if (assistant.studio?.version === 1) {
    const active = getActiveStudioModules(assistant, settings);
    const categories = {};
    for (const category of ['features', 'knowledge', 'personality']) {
      const levels = STUDIO_MODULES.filter(item => item.category === category && active.includes(item.id)).map(item => getStudioModuleStatus(item.id, assistant, settings).level);
      categories[category] = levels.includes('error') ? 'missing' : levels.includes('warning') ? 'warning' : 'ready';
    }
    return { features: categories.features, knowledge: categories.knowledge, personality: categories.personality, design: getPendingStudioDesign(assistant, settings).length ? 'review' : 'ready' };
  }
  const knowledge = hasAssistantKnowledge(assistant);
  return {
    features: 'ready',
    knowledge: !assistant.enabled ? 'optional' : !knowledge ? 'missing' : isSetup && !knowledgeReviewed ? 'review' : 'ready',
    personality: assistant.responseStyle?.trim() ? 'ready' : 'optional',
    design: 'ready',
  };
}
