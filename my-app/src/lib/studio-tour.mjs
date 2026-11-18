export const createStudioTourProgress = () => ({ completed: [], moduleId: null, designChanged: false });

export function isStudioTourChoiceAllowed(category, id) {
  return ({ features: 'support', knowledge: 'company', personality: 'personality', design: 'bubble' })[category] === id;
}

export function getStudioTourSaveAdvance(step, id) {
  if (step === 2 && id === 'support') return 3;
  if (step === 3 && id === 'company') return 4;
  if (step === 4 && id === 'personality') return 5;
  if (step === 5 && id === 'bubble') return 6;
  return null;
}

export function canContinueStudioTour(step, progress) {
  return step === 0 || step === 6 || progress.completed.includes(step);
}

export function recordStudioTourAction(progress, step, action, moduleId) {
  if (step === 5 && action === 'change-design') return { ...progress, designChanged: true };
  const matches = (step === 1 && action === 'add-module' && moduleId === 'support')
    || (step === 2 && action === 'save-module' && moduleId === progress.moduleId)
    || (step === 3 && action === 'save-module' && moduleId === 'company')
    || (step === 4 && action === 'save-module' && moduleId === 'personality')
    || (step === 5 && action === 'save-design' && moduleId === 'bubble' && progress.designChanged);
  if (!matches || progress.completed.includes(step)) return progress;
  return {
    ...progress,
    completed: [...progress.completed, step],
    moduleId: step === 1 ? moduleId : progress.moduleId,
  };
}
