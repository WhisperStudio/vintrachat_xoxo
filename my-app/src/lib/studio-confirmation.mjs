export const STUDIO_CONFIRMATION_DELAY_MS = 5000;
export function confirmationSecondsRemaining(startedAt, now) {
  return Math.max(0, Math.ceil((STUDIO_CONFIRMATION_DELAY_MS - (now - startedAt)) / 1000));
}
export function canConfirmStudioAction(startedAt, now, requireCheck = false, checked = false) {
  return startedAt !== null && confirmationSecondsRemaining(startedAt, now) === 0 && (!requireCheck || checked);
}
