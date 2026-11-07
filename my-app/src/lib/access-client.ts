import { auth } from '@/lib/firebase';

export async function accessRequest<T>(action: string, data: Record<string, unknown> = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Logg inn først.');
  const token = await user.getIdToken(true);
  const response = await fetch('/api/access', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action, data }),
    signal: AbortSignal.timeout(20_000),
    cache: 'no-store',
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 503) throw new Error(process.env.NODE_ENV === 'development'
      ? 'Serveren kan ikke kontrollere kontoen. Konfigurer Firebase Admin lokalt og start utviklingsserveren på nytt.'
      : 'Serveren kan ikke kontrollere kontoen akkurat nå. Prøv igjen senere.');
    throw new Error(result.error?.message || 'Kunne ikke kontrollere tilgangen.');
  }
  return result.data as T;
}
