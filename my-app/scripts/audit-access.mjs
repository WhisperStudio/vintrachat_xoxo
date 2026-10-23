// Read-only inventory. Never repairs or approves existing access automatically.
import { initializeApp, applicationDefault, cert, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const projectId = process.argv[process.argv.indexOf('--project') + 1];
if (!process.argv.includes('--project') || projectId !== 'vintrasolutions-f58a7')
  throw new Error('Pass --project vintrasolutions-f58a7 explicitly. This script only reads access data.');
let credential, cliDb;
if (process.argv.includes('--firebase-cli')) {
  const require = createRequire(import.meta.url);
  const { getAccessToken } = require('firebase-tools/lib/auth.js');
  const { clientId, clientSecret } = require('firebase-tools/lib/api.js');
  const config = JSON.parse(await readFile(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
  cliDb = new Firestore({ projectId, credentials: { type: 'authorized_user', client_id: clientId(), client_secret: clientSecret(), refresh_token: config.tokens.refresh_token } });
  credential = { getAccessToken: async () => {
    const result = await getAccessToken(config.tokens.refresh_token, config.tokens.scopes);
    return { access_token: result.access_token, expires_in: result.expires_in || 3600 };
  } };
} else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  credential = cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') });
} else credential = applicationDefault();
const app = initializeApp({ projectId, credential });
try {
  const db = cliDb || getFirestore(app), auth = getAuth(app);
  const records = [];
  const account = async uid => {
    try { const user = await auth.getUser(uid); return { exists: true, email: user.email || '', verified: user.emailVerified, disabled: user.disabled }; }
    catch (error) { if (error.code === 'auth/user-not-found' || !uid) return { exists: false }; throw error; }
  };
  const businesses = await db.collection('businesses').get();
  for (const business of businesses.docs) {
    const data = business.data();
    const members = await business.ref.collection('users').get();
    const invitations = await business.ref.collection('invitations').where('status', '==', 'pending').get();
    const users = [];
    for (const member of members.docs) users.push({ uid: member.id, role: member.data().role || null, status: member.data().status || null, auth: await account(member.id) });
    records.push({ businessId: business.id, name: data.name || '', ownerId: data.ownerId || null,
      ownerAuth: await account(data.ownerId), members: users,
      pendingInvitations: invitations.docs.map(d => ({ id: d.id, email: d.data().email || '', role: d.data().role || null,
        createdBy: d.data().createdBy || null, expiresAt: d.data().expiresAt?.toDate?.().toISOString() || null })) });
  }
  const report = { projectId, checkedAt: new Date().toISOString(), approval: 'REQUIRED: old public rules cannot prove the legitimacy of existing ownership or membership.',
    fingerprint: createHash('sha256').update(JSON.stringify(records)).digest('hex'), businesses: records };
  await mkdir('.audit', { recursive: true, mode: 0o700 });
  await writeFile('.audit/access.json', JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ businesses: records.length, memberships: records.reduce((n, b) => n + b.members.length, 0),
    unverifiedOwners: records.filter(b => b.ownerAuth.exists && !b.ownerAuth.verified).length,
    missingOwners: records.filter(b => !b.ownerAuth.exists).length,
    missingMemberStatus: records.flatMap(b => b.members).filter(m => !m.status).length,
    report: '.audit/access.json', writesToFirebase: 0 }, null, 2));
} finally { await cliDb?.terminate(); await deleteApp(app); }
