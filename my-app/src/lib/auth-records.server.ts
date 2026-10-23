import { signAuthRecord, validAuthRecord } from './auth-records.mjs';

// Reuse the existing server credential; no new service or public secret is needed.
const key = () => (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
export const signRecord = (purpose: string, uid: string, data: Record<string, unknown>) => signAuthRecord(key(), purpose, uid, data);
export const validRecord = (purpose: string, uid: string, data: Record<string, unknown>) => validAuthRecord(key(), purpose, uid, data);
