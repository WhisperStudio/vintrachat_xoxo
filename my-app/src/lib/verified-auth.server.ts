import { getAdminAuth } from '@/lib/firebase-admin';

export async function verifyActiveUserToken(token: string) {
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token, true);
  const user = await auth.getUser(decoded.uid);
  if (user.disabled) throw new Error('Account disabled');
  // Check current Auth state as well as signed claims; pending Firestore data is not identity proof.
  return { ...decoded, email: user.email, phone_number: user.phoneNumber,
    email_verified: decoded.email_verified === true && user.emailVerified,
    superAdmin: decoded.superAdmin === true && user.customClaims?.superAdmin === true };
}

export const apiOrigins = () => [
  'https://chat.vintrastudio.com', 'https://vintranordic.com', 'https://www.vintranordic.com',
  ...(process.env.NOTIFICATION_WEB_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:8081', 'http://localhost:3000'] : []),
];
