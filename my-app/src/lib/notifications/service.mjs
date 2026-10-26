import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  hash,
  validToken,
  isSuperAdmin,
  isMember,
  isSupportMember,
  incomingMessages,
  messageKey,
  channelId,
  deliveryStatus,
} from './core.mjs';

export class NotificationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// No credentials, listeners, timers or scheduled Firebase Functions at import time.
export function createNotificationService(
  db,
  { fetchImpl = fetch, accessToken = '', recipientActive = async (_uid, _device) => true } = {},
) {
  const devices = db.collection('notificationDevices');
  const jobs = db.collection('notificationJobs');
  const receipts = db.collection('notificationReceipts');
  function requireUser(request) {
    if (!request.auth?.uid || request.auth.token.email_verified !== true)
      throw new NotificationError(
        'unauthenticated',
        'Sign in with a verified account.',
      );
    return request.auth;
  }
  function requireAdmin(request) {
    const auth = requireUser(request);
    if (!isSuperAdmin(auth.token))
      throw new NotificationError(
        'permission-denied',
        'Only a notification administrator can send announcements.',
      );
    return auth;
  }
  async function hasAccess(uid, businessId, supportOnly = false) {
    const [business, member] = await Promise.all([
      db.doc(`businesses/${businessId}`).get(),
      db.doc(`businesses/${businessId}/users/${uid}`).get(),
    ]);
    const permits = supportOnly ? isSupportMember : isMember;
    return business.exists && permits(business.data(), member.data(), uid);
  }

  async function registerNotificationDevice(request) {
    const auth = requireUser(request);
    const { token, businessIds, enabled, sound, vibration, platform } =
      request.data || {};
    if (
      !validToken(token) ||
      !Array.isArray(businessIds) ||
      businessIds.length > 100 ||
      !['ios', 'android'].includes(platform)
    ) {
      throw new NotificationError(
        'invalid-argument',
        'Invalid device registration.',
      );
    }
    const allowed = [];
    for (const id of new Set(businessIds)) {
      if (typeof id !== 'string' || !id || id.includes('/'))
        throw new NotificationError('invalid-argument', 'Invalid business.');
      if (await hasAccess(auth.uid, id)) allowed.push(id);
    }
    // One record per physical token: multiple phones never overwrite each other.
    // Reassignment on login prevents the previous account receiving private messages.
    await devices.doc(hash(token)).set({
      token,
      userId: auth.uid,
      businessIds: allowed,
      enabled: enabled !== false,
      sound: sound !== false,
      vibration: vibration !== false,
      platform,
      authTime: auth.token.auth_time || 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { registered: true, businesses: allowed.length };
  }

  async function unregisterNotificationDevice(request) {
    const auth = requireUser(request);
    if (!validToken(request.data?.token))
      throw new NotificationError('invalid-argument', 'Invalid token.');
    const ref = devices.doc(hash(request.data.token));
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (snap.data()?.userId === auth.uid) tx.delete(ref);
    });
    return { removed: true };
  }

  async function notificationCenter(request) {
    requireAdmin(request);
    const [businesses, registered, history] = await Promise.all([
      db.collection('businesses').get(),
      devices.where('enabled', '==', true).get(),
      db
        .collection('notificationAnnouncements')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get(),
    ]);
    return {
      businesses: businesses.docs.map((d) => ({
        id: d.id,
        name: d.data().businessName || d.data().name || d.id,
        devices: registered.docs.filter((device) =>
          device.data().businessIds?.includes(d.id),
        ).length,
      })),
      devices: registered.size,
      history: (
        await Promise.all(history.docs.map((d) => jobs.doc(d.id).get()))
      )
        .filter((d) => d.exists)
        .map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toMillis() || 0,
        })),
    };
  }

  async function queueAnnouncement(request) {
    const auth = requireAdmin(request);
    const { title, body, targetBusinessId, requestId, testToken } =
      request.data || {};
    if (
      typeof title !== 'string' ||
      !title.trim() ||
      title.length > 80 ||
      typeof body !== 'string' ||
      !body.trim() ||
      body.length > 300 ||
      typeof targetBusinessId !== 'string' ||
      !targetBusinessId ||
      targetBusinessId.includes('/') ||
      typeof requestId !== 'string' ||
      !/^[\w-]{12,100}$/.test(requestId)
    ) {
      throw new NotificationError(
        'invalid-argument',
        'Choose an audience and enter a title (80 characters) and message (300 characters).',
      );
    }
    if (testToken) {
      if (!validToken(testToken))
        throw new NotificationError(
          'invalid-argument',
          'Register this device first.',
        );
      const device = await devices.doc(hash(testToken)).get();
      if (device.data()?.userId !== auth.uid || !device.data()?.enabled)
        throw new NotificationError(
          'permission-denied',
          'Enable notifications on this device first.',
        );
    } else if (
      targetBusinessId !== 'all' &&
      !(await db.doc(`businesses/${targetBusinessId}`).get()).exists
    ) {
      throw new NotificationError(
        'not-found',
        'This business no longer exists.',
      );
    }
    const id = hash(`${auth.uid}:${requestId}`);
    await db.runTransaction(async (tx) => {
      const ref = jobs.doc(id);
      if ((await tx.get(ref)).exists) return;
      tx.create(db.collection('notificationAnnouncements').doc(id), {
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.create(ref, {
        kind: 'announcement',
        title: title.trim(),
        body: body.trim(),
        targetBusinessId,
        ...(testToken ? { testToken } : {}),
        createdBy: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        status: 'queued',
        data: { type: 'announcement' },
      });
    });
    return { id, status: 'queued' };
  }

  async function expo(path, payload) {
    const response = await fetchImpl(
      `https://exp.host/--/api/v2/push/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok)
      throw new Error(`Push service returned ${response.status}`);
    const json = await response.json();
    if (!json.data)
      throw new Error(
        json.errors?.[0]?.message || 'Invalid push service response',
      );
    return json.data;
  }

  async function deliver(ref, deadline = Date.now() + 120000) {
    const job = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.data();
      if (
        !data ||
        !['queued', 'retry', 'sending'].includes(data.status) ||
        data.leaseUntil?.toMillis() > Date.now()
      )
        return null;
      tx.update(ref, {
        status: 'sending',
        leaseUntil: Timestamp.fromMillis(Date.now() + 180000),
        attempts: FieldValue.increment(1),
      });
      return data;
    });
    if (!job) return;
    try {
      // Single-field queries keep setup independent of composite Firestore indexes.
      let target = devices.where('enabled', '==', true);
      if (job.testToken) target = devices.where('token', '==', job.testToken);
      else if (job.targetBusinessId !== 'all')
        target = devices.where(
          'businessIds',
          'array-contains',
          job.targetBusinessId,
        );
      const snapshot = await target.get();
      let accepted = job.sentCount || 0;
      let failed = job.failedCount || 0;
      const errors = new Set(job.errors || []);
      for (const device of snapshot.docs) {
        if (Date.now() + 22000 > deadline) {
          await ref.update({ status: 'queued', leaseUntil: null });
          return;
        }
        const attemptRef = ref.collection('attempts').doc(device.id);
        if ((await attemptRef.get()).exists) continue;
        const current = await device.ref.get();
        const d = current.data();
        if (!d?.enabled || !validToken(d.token) || !(await recipientActive(d.userId, d))) continue;
        if (job.testToken && d.userId !== job.createdBy) continue;
        if (
          job.targetBusinessId !== 'all' &&
          !job.testToken &&
          !(await hasAccess(d.userId, job.targetBusinessId, job.kind === 'chat'))
        )
          continue;
        if (job.targetBusinessId === 'all' || job.testToken) {
          let activeBusiness = false;
          for (const businessId of d.businessIds || []) {
            if (await hasAccess(d.userId, businessId)) { activeBusiness = true; break; }
          }
          if (!activeBusiness) continue;
        } else if (!d.businessIds?.includes(job.targetBusinessId)) continue;
        // Persist the result before moving to the next device. Retries skip accepted tickets.
        const tickets = await expo('send', [
          {
            to: d.token,
            title: job.title,
            body: job.body,
            data: { ...job.data, notificationId: ref.id },
            sound: d.sound ? 'default' : null,
            channelId: channelId(d.sound, d.vibration),
            priority: 'high',
            ttl: 86400,
          },
        ]);
        const ticket = tickets[0];
        if (!ticket || !['ok', 'error'].includes(ticket.status))
          throw new Error('Missing push ticket');
        const batch = db.batch();
        if (ticket.status === 'ok') {
          accepted++;
          if (ticket.id)
            batch.set(receipts.doc(ticket.id), {
              jobId: ref.id,
              deviceId: device.id,
              createdAt: FieldValue.serverTimestamp(),
              status: 'pending',
            });
        } else {
          const reason =
            ticket.details?.error || ticket.message || 'Push rejected';
          if (reason === 'MessageRateExceeded') throw new Error(reason);
          failed++;
          errors.add(reason);
          if (reason === 'DeviceNotRegistered')
            batch.update(device.ref, { enabled: false });
        }
        batch.set(attemptRef, {
          status: ticket.status,
          ticketId: ticket.id || null,
        });
        batch.update(ref, {
          sentCount: accepted,
          failedCount: failed,
          errors: [...errors].slice(0, 5),
          leaseUntil: Timestamp.fromMillis(Date.now() + 180000),
        });
        await batch.commit();
      }
      await ref.update({
        status: deliveryStatus(accepted + failed, accepted, failed),
        recipients: accepted + failed,
        sentCount: accepted,
        failedCount: failed,
        leaseUntil: null,
        completedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const exhausted = (job.attempts || 0) >= 4;
      await ref.update({
        status: exhausted ? 'failed' : 'retry',
        leaseUntil: Timestamp.fromMillis(Date.now() + 60000),
        errors: [String(error.message || error)],
        ...(exhausted ? { completedAt: FieldValue.serverTimestamp() } : {}),
      });
    }
  }

  async function saveChat(ref, data, newMessages, append = false, { enqueueNotifications = true } = {}) {
    // Called only after widget authorization/rate limiting. Ignore client-supplied
    // history: callers pass only the visitor message accepted by this request.
    const candidates = enqueueNotifications
      ? incomingMessages(null, { messages: newMessages })
      : [];
    // The support route passes a Firestore arrayUnion transform. Merge the
    // accepted messages ourselves so message history and jobs commit together.
    const incoming = Array.isArray(data.messages)
      ? data.messages
      : append ? newMessages : [];
    return db.runTransaction(async (tx) => {
      const chat = await tx.get(ref);
      const entries = candidates.map((message) => ({
        message,
        ref: jobs.doc(
          hash(`${data.businessId}:${ref.id}:${messageKey(message)}`),
        ),
      }));
      const existing = await Promise.all(
        entries.map((entry) => tx.get(entry.ref)),
      );
      const previousMessages = chat.data()?.messages || [];
      const previous = new Set(previousMessages.map(messageKey));
      const seen = new Set(previousMessages.map(messageKey));
      const additions = incoming.filter(message => {
        const key = messageKey(message);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const merged = [...previousMessages, ...additions];
      tx.set(
        ref,
        { ...data, messages: merged, messageCount: merged.length },
        { merge: true },
      );
      entries.forEach((entry, index) => {
        if (existing[index].exists || previous.has(messageKey(entry.message)))
          return;
        tx.create(entry.ref, {
          kind: 'chat',
          title: data.visitorName || data.pageTitle || 'New customer message',
          body: entry.message.text.slice(0, 300),
          targetBusinessId: data.businessId,
          data: {
            type: 'chat',
            businessId: data.businessId,
            chatId: ref.id,
            widgetKey: data.widgetKey || '',
          },
          status: 'queued',
          createdAt: FieldValue.serverTimestamp(),
        });
      });
      return entries.map((entry) => entry.ref.id);
    });
  }

  async function checkReceipts() {
    const pending = await receipts
      .where('status', '==', 'pending')
      .limit(100)
      .get();
    const ready = pending.docs.filter(
      (d) => d.data().createdAt?.toMillis() < Date.now() - 60000,
    );
    if (!ready.length) return;
    const results = await expo('getReceipts', { ids: ready.map((d) => d.id) });
    for (const receipt of ready) {
      const result = results[receipt.id];
      if (
        !result &&
        receipt.data().createdAt.toMillis() > Date.now() - 86400000
      )
        continue;
      // Multiple requests can run maintenance concurrently. Count each receipt once.
      await db.runTransaction(async (tx) => {
        const current = await tx.get(receipt.ref);
        if (current.data()?.status !== 'pending') return;
        const deviceRef = devices.doc(receipt.data().deviceId);
        const device = await tx.get(deviceRef);
        tx.update(receipt.ref, {
          status: result?.status || 'expired',
          checkedAt: FieldValue.serverTimestamp(),
        });
        const job = jobs.doc(receipt.data().jobId);
        if (result?.status === 'ok')
          tx.update(job, { confirmedCount: FieldValue.increment(1) });
        else {
          tx.update(job, {
            receiptFailedCount: FieldValue.increment(1),
            errors: FieldValue.arrayUnion(
              result?.details?.error || 'Receipt unavailable',
            ),
          });
          if (result?.details?.error === 'DeviceNotRegistered' && device.exists)
            tx.update(deviceRef, { enabled: false });
        }
      });
    }
  }

  async function drain(preferredId) {
    const deadline = Date.now() + 120000;
    for (const id of Array.isArray(preferredId)
      ? preferredId
      : preferredId
        ? [preferredId]
        : []) {
      if (Date.now() + 22000 > deadline) break;
      await deliver(jobs.doc(id), deadline);
    }
    const pending = await jobs
      .where('status', 'in', ['queued', 'retry', 'sending'])
      .limit(30)
      .get();
    for (const job of pending.docs) {
      if (Date.now() + 22000 > deadline) break;
      await deliver(job.ref, deadline);
    }
    if (Date.now() + 22000 < deadline) await checkReceipts();
  }
  return {
    registerNotificationDevice,
    unregisterNotificationDevice,
    notificationCenter,
    queueAnnouncement,
    saveChat,
    drain,
  };
}
