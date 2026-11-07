import { createHash } from 'node:crypto';
import { PLANS, effectivePlan } from './catalog.mjs';

export const usageDay = (now = new Date()) => now.toISOString().slice(0, 10);
// Reduce contention within a server instance. Firestore transactions remain the
// authority across instances; this queue is an optimization, never a quota check.
const pending = new Map();
export async function reserveUsage(db, businessId, widgetKey, sessionId, now = new Date()) {
  const key = `${db.projectId}:${businessId}`;
  const previous = pending.get(key) || Promise.resolve();
  const work = previous.catch(() => {}).then(() => reserveInTransaction(db, businessId, widgetKey, sessionId, now));
  pending.set(key, work);
  try { return await work; }
  finally { if (pending.get(key) === work) pending.delete(key); }
}
/** Reserve usage atomically before doing billable work. Counters are never client writable.
 * Sessions are scoped to the widget and UTC day, so caller-provided IDs cannot bypass quotas.
 * @param {import('firebase-admin/firestore').Firestore} db
 */
async function reserveInTransaction(db, businessId, widgetKey, sessionId, now = new Date()) {
  const day = usageDay(now);
  const businessRef = db.doc(`businesses/${businessId}`);
  const usageRef = businessRef.collection('billingUsage').doc(day);
  const hash = createHash('sha256').update(`${widgetKey}:${sessionId}`).digest('hex');
  const sessionRef = usageRef.collection('sessions').doc(hash);
  try { return await db.runTransaction(async tx => {
    const business = await tx.get(businessRef);
    const usage = await tx.get(usageRef);
    const session = await tx.get(sessionRef);
    if (!business.exists) throw new Error('Business not found');
    const plan = effectivePlan(business.data(), now.getTime());
    const limits = PLANS[plan];
    const conversations = Number(usage.data()?.conversations || 0);
    const messages = Number(usage.data()?.messages || 0);
    if ((!session.exists && conversations >= limits.conversations) || messages >= limits.messages) {
      return { allowed: false, isNewConversation: false, plan };
    }
    tx.set(usageRef, { conversations: conversations + (session.exists ? 0 : 1), messages: messages + 1 });
    if (!session.exists) tx.create(sessionRef, { createdAt: now });
    return { allowed: true, isNewConversation: !session.exists, plan };
  }, { maxAttempts: 10 }); }
  catch (error) {
    if (error.code === 10 || error.code === 4) return { allowed: false, isNewConversation: false, retry: true };
    throw error;
  }
}
