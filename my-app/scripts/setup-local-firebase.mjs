// Reuse an existing Firebase CLI login for this checkout's local server only.
// No service-account keys, Firebase writes, or changes to Vercel are made.
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env.development.local');
const credentialsPath = resolve(root, '.audit/local-admin-credentials.json');
const require = createRequire(import.meta.url);

try {
  const config = JSON.parse(await readFile(resolve(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  if (!config.tokens?.refresh_token) throw new Error('Run npx firebase login first.');
  const { clientId, clientSecret } = require('firebase-tools/lib/api.js');
  const credentials = {
    type: 'authorized_user', client_id: clientId(), client_secret: clientSecret(),
    refresh_token: config.tokens.refresh_token,
  };
  let env = '';
  try { env = await readFile(envPath, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const settings = {
    FIREBASE_PROJECT_ID: 'vintrasolutions-f58a7',
    GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
    VINTRA_NOTIFICATIONS_ENABLED: 'false',
  };
  for (const [key, value] of Object.entries(settings)) {
    if (!new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`, 'm').test(env))
      env += `\n${key}=${JSON.stringify(value)}\n`;
  }
  await mkdir(resolve(root, '.audit'), { recursive: true, mode: 0o700 });
  await writeFile(credentialsPath, JSON.stringify(credentials) + '\n', { mode: 0o600 });
  await chmod(credentialsPath, 0o600);
  await writeFile(envPath, env, { mode: 0o600 });
  await chmod(envPath, 0o600);
  console.log('Local Firebase credentials configured in gitignored files. Restart npm run dev if it is already running.');
} catch (error) {
  // Never print credential contents or an OAuth error response.
  console.error(error.code === 'ENOENT' ? 'Firebase CLI login not found. Run npx firebase login first.' : 'Could not configure local Firebase credentials. Check your Firebase CLI login and local file permissions.');
  process.exitCode = 1;
}
