import { verifyActiveUserToken } from '@/lib/verified-auth.server';
import {
  notificationService,
  notificationsEnabled,
  scheduleNotificationDelivery,
} from '@/lib/notifications.server';
import { createNotificationHandler } from '@/lib/notifications/http.mjs';

export const maxDuration = 180;

const handle = createNotificationHandler({
  verifyToken: verifyActiveUserToken,
  service: notificationService,
  schedule: scheduleNotificationDelivery,
  enabled: notificationsEnabled,
  origins: [
    'https://chat.vintrastudio.com',
    'https://vintranordic.com',
    'https://www.vintranordic.com',
    ...(process.env.NOTIFICATION_WEB_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:8081', 'http://localhost:3000']
      : []),
  ],
});

export const POST = handle;
export const OPTIONS = handle;
