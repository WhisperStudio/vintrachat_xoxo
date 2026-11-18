import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudioTourProgress, canContinueStudioTour, recordStudioTourAction, getStudioTourSaveAdvance, isStudioTourChoiceAllowed } from '../src/lib/studio-tour.mjs';

test('action steps have no next button until the matching action is performed', () => {
  const progress = createStudioTourProgress();
  assert.equal(canContinueStudioTour(0, progress), true);
  for (const step of [1, 2, 3, 4, 5]) assert.equal(canContinueStudioTour(step, progress), false);
  assert.equal(recordStudioTourAction(progress, 1, 'open-module', 'chat'), progress);
});

test('the guided path accepts support and leaves unrelated modules locked', () => {
  const initial = createStudioTourProgress();
  for (const id of ['cards', 'welcome', 'languages']) {
    assert.equal(recordStudioTourAction(initial, 1, 'add-module', id), initial);
    assert.equal(isStudioTourChoiceAllowed('features', id), false);
  }
  const added = recordStudioTourAction(initial, 1, 'add-module', 'support');
  assert.equal(added.moduleId, 'support');
  assert.equal(canContinueStudioTour(1, added), true);
  assert.equal(canContinueStudioTour(2, added), false);
  assert.equal(recordStudioTourAction(added, 2, 'save-module', 'chat'), added);
  const saved = recordStudioTourAction(added, 2, 'save-module', 'support');
  assert.equal(canContinueStudioTour(2, saved), true);
  assert.equal(canContinueStudioTour(1, saved), true);
  assert.equal(isStudioTourChoiceAllowed('features', 'support'), true);
  assert.equal(isStudioTourChoiceAllowed('design', 'bubble'), true);
  assert.equal(isStudioTourChoiceAllowed('design', 'presets'), false);
  assert.equal(isStudioTourChoiceAllowed('design', 'header'), false);
});

test('business, personality and design require their own actions and preserve completed steps on revisit', () => {
  let progress = createStudioTourProgress();
  assert.equal(recordStudioTourAction(progress, 3, 'open-module', 'personality'), progress);
  assert.equal(recordStudioTourAction(progress, 3, 'open-module', 'company'), progress);
  progress = recordStudioTourAction(progress, 3, 'save-module', 'company');
  progress = recordStudioTourAction(progress, 4, 'save-module', 'personality');
  assert.equal(canContinueStudioTour(5, progress), false);
  assert.equal(recordStudioTourAction(progress, 5, 'save-design', 'bubble'), progress);
  progress = recordStudioTourAction(progress, 5, 'change-design');
  assert.equal(canContinueStudioTour(5, progress), false);
  assert.equal(recordStudioTourAction(progress, 5, 'save-design', 'header'), progress);
  progress = recordStudioTourAction(progress, 5, 'save-design', 'bubble');
  for (const step of [3, 4, 5, 6]) assert.equal(canContinueStudioTour(step, progress), true);
});

test('successful saves advance every action step directly to its next guide', () => {
  assert.equal(getStudioTourSaveAdvance(2, 'support'), 3);
  assert.equal(getStudioTourSaveAdvance(3, 'company'), 4);
  assert.equal(getStudioTourSaveAdvance(4, 'personality'), 5);
  assert.equal(getStudioTourSaveAdvance(5, 'bubble'), 6);
  assert.equal(getStudioTourSaveAdvance(2, 'company'), null);
  assert.equal(getStudioTourSaveAdvance(5, 'header'), null);
});
