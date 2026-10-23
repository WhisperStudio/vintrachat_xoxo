import { after } from 'next/server';
import type { DocumentReference, DocumentData } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createNotificationService } from './notifications/service.mjs';
import { deliveryEnabled } from './notifications/release.mjs';

export const notificationsEnabled = () =>
  deliveryEnabled(process.env.VINTRA_NOTIFICATIONS_ENABLED);

export function notificationService() {
  return createNotificationService(getAdminDb(), {
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
    recipientActive: async (uid: string, device: { authTime?: number }) => {
      try {
        const user = await getAdminAuth().getUser(uid);
        const validAfter = Date.parse(user.tokensValidAfterTime || '') / 1000;
        return !user.disabled && user.emailVerified && (device.authTime || 0) >= validAfter;
      } catch (error) {
        if ((error as { code?: string }).code === 'auth/user-not-found') return false;
        throw error; // Transient Auth errors leave the job retryable.
      }
    },
  });
}

export function scheduleNotificationDelivery(work: () => Promise<void>) {
  after(async () => {
    try {
      await work();
    } catch {
      console.error(
        'Notification maintenance failed; pending jobs remain stored.',
      );
    }
  });
}

export async function saveChatWithNotifications(
  ref: DocumentReference,
  data: DocumentData,
  messages: { id?: string; role: string; text: string; createdAt?: string }[],
  append = false,
) {
  if (!notificationsEnabled()) {
    await getAdminDb().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const previous = snap.data()?.messages || [];
      const known = new Set(previous.map((message: { id: string }) => message.id));
      const merged = [...previous, ...(data.messages || []).filter((message: { id: string }) => !known.has(message.id))];
      tx.set(ref, { ...data, messages: merged, messageCount: merged.length }, { merge: true });
    });
    return;
  }
  const service = notificationService();
  const ids = await service.saveChat(ref, data, messages, append);
  scheduleNotificationDelivery(() => service.drain(ids));
}
