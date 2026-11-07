// Shared by the UI, server enforcement and Stripe provisioning. Amounts are NOK øre.
export const PLANS = {
  free: { name: 'Gratis', monthly: 0, yearly: 0, conversations: 20, messages: 100, widgets: 1, members: 1 },
  pro: { name: 'Pro', monthly: 29900, yearly: 299000, conversations: 500, messages: 2500, widgets: 3, members: 5 },
  business: { name: 'Enterprise', monthly: 99900, yearly: 999000, conversations: 2000, messages: 10000, widgets: 10, members: 20 },
};
export const paidPlan = plan => plan === 'pro' || plan === 'business';
export const validCycle = cycle => cycle === 'monthly' || cycle === 'yearly';
export const priceKey = (plan, cycle) => `vintra_${plan}_${cycle}_nok_v1`;
export function effectivePlan(business, now = Date.now()) {
  const billing = business?.billing;
  // Existing manually granted plans remain supported until the business uses Stripe.
  if (!billing?.subscriptionId) {
    const plan = business?.chatWidgetConfig?.plan;
    return paidPlan(plan) ? plan : 'free';
  }
  return ['active', 'trialing'].includes(billing.status)
    && billing.currentPeriodEnd * 1000 > now && paidPlan(billing.plan) ? billing.plan : 'free';
}
export function subscriptionEntitlement(subscription, prices, now = Date.now()) {
  const item = subscription.items?.data?.[0];
  const match = prices.find(p => p.id === item?.price?.id);
  const currentPeriodEnd = item?.current_period_end || subscription.current_period_end || 0;
  const paid = subscription.items?.data?.length === 1 && item.quantity === 1 && match
    && ['active', 'trialing'].includes(subscription.status)
    && !subscription.pause_collection && currentPeriodEnd * 1000 > now;
  return { plan: paid ? match.plan : 'free', cycle: match?.cycle || 'monthly',
    status: subscription.pause_collection ? 'paused' : subscription.status,
    currentPeriodEnd, cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end) };
}
