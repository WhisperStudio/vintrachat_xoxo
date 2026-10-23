// Keep this release off until production ownership/membership has been reviewed.
// This code gate also protects deployment when Vercel environment access is unavailable.
export const accessReviewComplete = false;
export const deliveryEnabled = (environmentValue) =>
  accessReviewComplete && environmentValue === 'true';
