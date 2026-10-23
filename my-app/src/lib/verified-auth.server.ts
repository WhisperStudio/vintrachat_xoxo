import { getAdminAuth } from '@/lib/firebase-admin';
import { verifyActiveToken } from './verified-auth.mjs';

export async function verifyActiveUserToken(token: string) {
  // Check current Auth state as well as signed claims; pending Firestore data is not identity proof.
  return verifyActiveToken(getAdminAuth(), token);
}

export const apiOrigins = () => [
  'https://chat.vintrastudio.com', 'https://vintranordic.com', 'https://www.vintranordic.com',
  ...(process.env.NOTIFICATION_WEB_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:8081', 'http://localhost:3000'] : []),
];
