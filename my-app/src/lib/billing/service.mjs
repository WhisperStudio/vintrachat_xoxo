import { randomUUID } from 'node:crypto';
import { PLANS, paidPlan, validCycle, priceKey, effectivePlan, subscriptionEntitlement } from './catalog.mjs';
import { usageDay } from './usage.mjs';
import { accessRole } from '../access/service.mjs';

export class BillingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const objectId = value => typeof value === 'string' ? value : value?.id;
export async function loadPrices(stripe) {
  const result = await stripe.prices.list({ active: true, limit: 100,
    lookup_keys: ['pro', 'business'].flatMap(p => ['monthly', 'yearly'].map(c => priceKey(p, c))) });
  return ['pro', 'business'].flatMap(plan => ['monthly', 'yearly'].map(cycle => {
    const price = result.data.find(p => p.lookup_key === priceKey(plan, cycle));
    if (!price || price.currency !== 'nok' || price.unit_amount !== PLANS[plan][cycle]
      || price.recurring?.interval !== (cycle === 'monthly' ? 'month' : 'year')
      || price.recurring?.interval_count !== 1 || price.tax_behavior !== 'inclusive') {
      throw new BillingError(503, 'Betaling er ikke ferdig konfigurert. Kontakt oss.');
    }
    return { id: price.id, plan, cycle };
  }));
}

/** @param {{db: import('firebase-admin/firestore').Firestore, stripe: import('stripe').default, origin: string, portalConfiguration: string}} options */
export function createBillingService({ db, stripe, origin, portalConfiguration }) {
  const accountRef = id => db.doc(`billingAccounts/${id}`);
  const businessRef = id => db.doc(`businesses/${id}`);
  const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
  async function authorize(actor, id, manage = true) {
    if (!actor?.uid || !actor.email_verified) throw new BillingError(401, 'Logg inn med en bekreftet e-postadresse.');
    if (!validId(id)) throw new BillingError(400, 'Ugyldig bedrift.');
    const [business, member] = await Promise.all([businessRef(id).get(), businessRef(id).collection('users').doc(actor.uid).get()]);
    const role = accessRole(business.data(), member.data(), actor.uid);
    if (!role || (manage && role !== 'owner')) throw new BillingError(403, 'Bare bedriftens eier kan administrere betaling.');
    return { business: business.data(), canManage: role === 'owner' };
  }
  async function locked(id, work) {
    const ref = accountRef(id), lock = randomUUID();
    await db.runTransaction(async tx => {
      const snapshot = await tx.get(ref);
      if (snapshot.data()?.lockUntil > Date.now()) throw new BillingError(409, 'Abonnementet oppdateres. Prøv igjen om noen sekunder.');
      tx.set(ref, { lock, lockUntil: Date.now() + 180000 }, { merge: true });
    });
    try { return await work(ref, (await ref.get()).data() || {}); }
    finally {
      await db.runTransaction(async tx => {
        const current = await tx.get(ref);
        if (current.data()?.lock === lock) tx.update(ref, { lockUntil: 0 });
      });
    }
  }
  async function portal(customer) {
    if (!portalConfiguration) throw new BillingError(503, 'Kundeportalen er ikke konfigurert ennå.');
    const session = await stripe.billingPortal.sessions.create({ customer, configuration: portalConfiguration,
      return_url: `${origin}/priser?portal=returned` });
    return { url: session.url };
  }
  async function synchronize(id, subscriptionId, customerId) {
    // Always read current Stripe state: delayed/replayed webhook payloads cannot restore old access.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['latest_invoice'] });
    if (objectId(subscription.customer) !== customerId) throw new BillingError(403, 'Kunden stemmer ikke med abonnementet.');
    const billing = subscriptionEntitlement(subscription, await loadPrices(stripe));
    if (billing.status === 'active' && subscription.latest_invoice?.status !== 'paid') billing.plan = 'free';
    const ref = businessRef(id);
    await db.runTransaction(async tx => {
      const account = await tx.get(accountRef(id));
      const business = await tx.get(ref);
      const widgets = await tx.get(ref.collection('chatWidgets'));
      const members = await tx.get(ref.collection('users'));
      if (!business.exists || account.data()?.customerId !== customerId) throw new BillingError(403, 'Ukjent betalingskonto.');
      const existingId = account.data()?.subscriptionId;
      // Ignore deletion/updates for an older, replaced subscription.
      if (existingId && existingId !== subscription.id && ['canceled', 'incomplete_expired'].includes(subscription.status)) return;
      tx.update(ref, { billing: { ...billing, subscriptionId: subscription.id, updatedAt: new Date() },
        'chatWidgetConfig.plan': billing.plan, 'chatWidgetConfig.billingCycle': billing.cycle, updatedAt: new Date() });
      for (const widget of widgets.docs) tx.update(widget.ref, { 'config.plan': billing.plan, 'config.billingCycle': billing.cycle });
      const ownerId = business.data().ownerId;
      const eligible = members.docs.filter(m => m.id !== ownerId && (m.data().status === 'active' || m.data().billingDisabled))
        .sort((a, b) => (a.data().createdAt?.toMillis?.() || 0) - (b.data().createdAt?.toMillis?.() || 0) || a.id.localeCompare(b.id));
      eligible.forEach((member, index) => {
        const allowed = index < PLANS[billing.plan].members - 1;
        tx.update(member.ref, { status: allowed ? 'active' : 'disabled', billingDisabled: !allowed });
      });
      tx.set(accountRef(id), { subscriptionId: subscription.id, status: subscription.status }, { merge: true });
    });
    return billing;
  }
  async function checkout(actor, data) {
    const { businessId: id, plan, cycle } = data;
    const { business } = await authorize(actor, id);
    if (!paidPlan(plan) || !validCycle(cycle)) throw new BillingError(400, 'Velg et gyldig abonnement og betalingsintervall.');
    const price = (await loadPrices(stripe)).find(p => p.plan === plan && p.cycle === cycle);
    return locked(id, async (ref, account) => {
      let customerId = account.customerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: actor.email, name: business.name,
          metadata: { businessId: id } }, { idempotencyKey: `vintra-customer-${id}` });
        customerId = customer.id;
        await ref.set({ customerId }, { merge: true });
      }
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100 });
      const existing = subscriptions.data.find(s => !['canceled', 'incomplete_expired'].includes(s.status));
      if (existing) {
        await synchronize(id, existing.id, customerId);
        return portal(customerId);
      }
      if (account.checkoutId) {
        const previous = await stripe.checkout.sessions.retrieve(account.checkoutId);
        if (previous.status === 'open' && previous.url) {
          const sameOrigin = previous.success_url?.startsWith(`${origin}/`) && previous.cancel_url?.startsWith(`${origin}/`);
          if (previous.metadata?.plan === plan && previous.metadata?.cycle === cycle && sameOrigin) return { url: previous.url };
          await stripe.checkout.sessions.expire(previous.id);
        }
        if (previous.status === 'complete' && previous.subscription) {
          const subscription = await stripe.subscriptions.retrieve(objectId(previous.subscription));
          if (!['canceled', 'incomplete_expired'].includes(subscription.status)) return portal(customerId);
        }
      }
      // Persist a request ID before Stripe; retries after a timeout use the same idempotency key.
      const request = account.checkoutRequest?.plan === plan && account.checkoutRequest?.cycle === cycle
        && account.checkoutRequest?.origin === origin
        && account.checkoutRequest?.createdAt > Date.now() - 1800000
        ? account.checkoutRequest : { id: randomUUID(), plan, cycle, origin, createdAt: Date.now() };
      await ref.set({ checkoutRequest: request }, { merge: true });
      const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer: customerId,
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: id, metadata: { businessId: id, plan, cycle },
        subscription_data: { metadata: { businessId: id } }, locale: 'nb',
        billing_address_collection: 'required', tax_id_collection: { enabled: true },
        customer_update: { name: 'auto', address: 'auto' },
        success_url: `${origin}/priser?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/priser?checkout=canceled`, expires_at: Math.floor(request.createdAt / 1000) + 3600,
      }, { idempotencyKey: `vintra-checkout-${request.id}` });
      await ref.set({ checkoutId: session.id, checkoutRequest: null }, { merge: true });
      if (!session.url) throw new BillingError(502, 'Stripe returnerte ingen betalingslenke.');
      return { url: session.url };
    });
  }
  async function confirm(actor, { businessId: id, sessionId }) {
    await authorize(actor, id);
    if (typeof sessionId !== 'string' || !/^cs_[a-zA-Z0-9_]{1,250}$/.test(sessionId)) throw new BillingError(400, 'Ugyldig betalingsøkt.');
    return locked(id, async (_ref, account) => {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!account.customerId || objectId(session.customer) !== account.customerId || session.client_reference_id !== id) {
        throw new BillingError(403, 'Betalingen tilhører ikke denne bedriften.');
      }
      if (session.status !== 'complete' || !session.subscription || session.payment_status !== 'paid') {
        return { pending: true };
      }
      await synchronize(id, objectId(session.subscription), account.customerId);
      return { pending: false };
    });
  }
  async function status(actor, { businessId: id }) {
    const { business, canManage } = await authorize(actor, id, false);
    const usage = await businessRef(id).collection('billingUsage').doc(usageDay()).get();
    return { plan: effectivePlan(business), billing: business.billing || null, canManage,
      usage: usage.data() || { conversations: 0, messages: 0 } };
  }
  async function manage(actor, { businessId: id }) {
    await authorize(actor, id);
    const account = (await accountRef(id).get()).data();
    if (!account?.customerId) throw new BillingError(400, 'Bedriften har ikke et betalt abonnement ennå.');
    return portal(account.customerId);
  }
  async function refresh(actor, { businessId: id }) {
    await authorize(actor, id);
    return locked(id, async (_ref, account) => {
      if (account.subscriptionId) await synchronize(id, account.subscriptionId, account.customerId);
      return { success: true };
    });
  }
  async function webhook(event) {
    const object = event.data.object;
    const customerId = objectId(object.customer);
    if (!customerId) return;
    const matches = await db.collection('billingAccounts').where('customerId', '==', customerId).limit(2).get();
    if (matches.empty) return; // Other products in the same Stripe account.
    if (matches.size !== 1) throw new Error('Ambiguous billing customer');
    const id = matches.docs[0].id;
    await locked(id, async (_ref, account) => {
      const subscriptionId = object.object === 'subscription' ? object.id
        : objectId(object.subscription) || objectId(object.parent?.subscription_details?.subscription) || account.subscriptionId;
      if (subscriptionId) await synchronize(id, subscriptionId, customerId);
    });
  }
  return { checkout, confirm, status, manage, refresh, webhook };
}
