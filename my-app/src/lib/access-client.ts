import { auth } from '@/lib/firebase';

export async function accessRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Logg inn først.');
  const token = await user.getIdToken(true);
  const response = await fetch('/api/access', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, data }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message || 'Kunne ikke kontrollere tilgangen.');
  return result.data as T;
}
