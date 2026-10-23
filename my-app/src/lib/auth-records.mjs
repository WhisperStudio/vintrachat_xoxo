import { createHmac, timingSafeEqual } from 'node:crypto';

export function signAuthRecord(secret, purpose, uid, data) {
  if (!secret) throw new Error('Missing server signing key');
  const expiresAt = data.expiresAt?.toMillis?.() || new Date(data.expiresAt).getTime();
  return createHmac('sha256', secret).update(JSON.stringify([
    'v1', purpose, uid, data.tokenHash, data.email, expiresAt,
    data.accountType || '', data.businessName || '',
  ])).digest('hex');
}
export function validAuthRecord(secret, purpose, uid, data) {
  if (typeof data.signature !== 'string' || !/^[a-f0-9]{64}$/.test(data.signature)) return false;
  return timingSafeEqual(Buffer.from(data.signature, 'hex'), Buffer.from(signAuthRecord(secret, purpose, uid, data), 'hex'));
}
