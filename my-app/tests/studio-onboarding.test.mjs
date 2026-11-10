import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAssistantKnowledge, needsStudioSetup, mergeWebsiteKnowledge, setupDecisionsComplete } from '../src/lib/studio-onboarding.mjs';

test('a new owner needs setup; existing assistants and team members are preserved', () => {
  assert.equal(needsStudioSetup({ ownerId: 'owner' }, 'owner'), true);
  assert.equal(needsStudioSetup({ ownerId: 'owner' }, 'staff'), false);
  assert.equal(needsStudioSetup({ ownerId: 'owner', onboarding: { widgetSetupCompletedAt: new Date() } }, 'owner'), false);
  assert.equal(needsStudioSetup({ ownerId: 'owner', chatAssistantConfig: { businessContext: 'Approved knowledge' } }, 'owner'), false);
  assert.equal(hasAssistantKnowledge({ knowledgeBase: { uploadedDocuments: [{ text: 'Our opening hours' }] } }), true);
});

test('website import changes facts while preserving personality, instructions and explicit feature choices', () => {
  const current = { enabled: false, humanSupportEnabled: false, restrictions: 'Never promise refunds', responseStyle: 'Concise', startLanguage: 'Norwegian', integrations: { collectLeads: false, handoffToHuman: false }, businessProfile: { toneOfVoice: 'warm', multilingual: false }, knowledgeBase: { uploadedDocuments: [{ name: 'terms.txt', text: 'Approved terms' }] } };
  const next = mergeWebsiteKnowledge(current, { businessContext: 'Imported facts', autofill: { businessProfile: { businessName: 'Shop', toneOfVoice: 'selling', multilingual: true }, knowledgeBase: { websiteUrls: ['https://example.com'] } }, integrations: { handoffToHuman: true }, faqSuggestions: ['Opening hours?'] });
  assert.equal(next.businessContext, 'Imported facts');
  assert.equal(next.businessProfile.businessName, 'Shop');
  assert.equal(next.businessProfile.toneOfVoice, 'warm');
  assert.equal(next.enabled, false);
  assert.equal(next.humanSupportEnabled, false);
  assert.deepEqual(next.integrations, current.integrations);
  assert.equal(next.responseStyle, 'Concise');
  assert.equal(next.restrictions, current.restrictions);
  assert.deepEqual(next.knowledgeBase.uploadedDocuments, current.knowledgeBase.uploadedDocuments);
});

test('setup requires explicit decisions, including when every feature is declined', () => {
  assert.equal(setupDecisionsComplete({}), false);
  assert.equal(setupDecisionsComplete({ ai: true, support: 'always', reviews: false }), false);
  assert.equal(setupDecisionsComplete({ ai: false, support: 'off', tickets: false, reviews: false, contact: false }), true);
  assert.equal(setupDecisionsComplete({ ai: true, support: 'always', tickets: true, reviews: true, contact: true }), true);
});

test('a new import removes duplicated legacy context but preserves separate manual notes and language choices', () => {
  const current = { businessContext: 'Old scan', startLanguage: 'Norwegian', businessProfile: { language: 'Norwegian' }, knowledgeBase: { manualNotes: 'Old scan' } };
  const result = { businessContext: 'New scan', autofill: { businessProfile: { language: 'English' } } };
  const next = mergeWebsiteKnowledge(current, result);
  assert.equal(next.knowledgeBase.manualNotes, '');
  assert.equal(next.startLanguage, 'Norwegian');
  assert.equal(next.businessProfile.language, 'Norwegian');
  assert.equal(mergeWebsiteKnowledge({ ...current, knowledgeBase: { manualNotes: 'Approved internal rules' } }, result).knowledgeBase.manualNotes, 'Approved internal rules');
});
