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
  assert.equal(setupDecisionsComplete({ languages: false, startCard: false, ai: false, support: 'off', tickets: false, reviews: false, contact: false }), true);
  assert.equal(setupDecisionsComplete({ languages: true, startCard: true, ai: true, support: 'always', tickets: true, reviews: true, contact: true }), true);
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

test('autofill keeps one readable price per offer across pages and www aliases', () => {
  const lines = [
    '[Our company] Pro monthly 299 NOK | Page: Our company | Source: https://www.example.com/',
    '[Our company] Pro monthly 299 NOK | Page: Our company | Source: https://example.com/landings/main',
    'Pro yearly 2990 NOK | Page: Prices | Source: https://example.com/prices',
  ].join('\n');
  const result = mergeWebsiteKnowledge({}, { businessContext: 'Long source dump', autofill: { businessProfile: { shortDescription: 'We build websites.' }, knowledgeBase: { pricing: lines, websiteUrls: ['https://www.example.com/prices', 'https://example.com/prices/'] } } });
  assert.equal(result.knowledgeBase.pricing, 'Pro monthly 299 NOK\n\nPro yearly 2990 NOK');
  assert.equal(result.knowledgeBase.websiteUrls.length, 1);
  assert.equal(result.businessContext, 'We build websites.');
  assert.equal(hasAssistantKnowledge({ knowledgeBase: { pricing: result.knowledgeBase.pricing } }), true);
});

test('autofill fills enabled features without enabling or populating disabled features', () => {
  const result = { autofill: { businessProfile: { businessName: 'Shop' }, knowledgeBase: { bookingInfo: 'https://example.com/book', contactInfo: 'hello@example.com' } }, faqSuggestions: ['What do you sell?'], setup: { widgetDefaults: { conversationCards: [{ title: 'Services' }] } } };
  const off = mergeWebsiteKnowledge({ startCard: { enabled: false, text: '' }, integrations: { bookMeetings: false }, faqSuggestionsEnabled: false, conversationCardsEnabled: false }, result);
  assert.equal(off.startCard.text, '');
  assert.equal(off.knowledgeBase.bookingInfo, '');
  assert.equal(off.knowledgeBase.contactInfo, '');
  assert.deepEqual(off.faqSuggestions, []);
  assert.deepEqual(off.conversationCards, []);
  const on = mergeWebsiteKnowledge({ startCard: { enabled: true, text: '' }, integrations: { bookMeetings: true }, contactSharing: { enabled: true }, faqSuggestionsEnabled: true, conversationCardsEnabled: true }, result);
  assert.match(on.startCard.text, /Shop/);
  assert.equal(on.knowledgeBase.bookingInfo, 'https://example.com/book');
  assert.equal(on.knowledgeBase.contactInfo, 'hello@example.com');
  assert.deepEqual(on.faqSuggestions, result.faqSuggestions);
  assert.deepEqual(on.conversationCards, result.setup.widgetDefaults.conversationCards);
  assert.equal(on.knowledgeBase.pricing, '');
});
