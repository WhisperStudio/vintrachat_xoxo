import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { accessRequest } from '@/lib/access-client';
import type { BusinessInvitation, UserRole } from '@/types/database';

type Result = { success: boolean; message?: string; businessId?: string; invitationId?: string };
async function mutate(action: string, data: Record<string, unknown>): Promise<Result> {
  try { return await accessRequest<Result>(action, data); }
  catch (error) { return { success: false, message: error instanceof Error ? error.message : 'Kunne ikke oppdatere invitasjonen.' }; }
}
export function createInvitation(businessId: string, email: string, role: UserRole, _createdBy: string) {
  return mutate('createInvitation', { businessId, email, role });
}
export function acceptInvitation(invitationId: string, businessId: string, _userId: string) {
  return mutate('acceptInvitation', { invitationId, businessId });
}
export function deleteInvitation(businessId: string, invitationId: string) {
  return mutate('deleteInvitation', { businessId, invitationId });
}
export async function getInvitationsForEmail(_email: string): Promise<BusinessInvitation[]> {
  const invites = await accessRequest<BusinessInvitation[]>('listInvitations');
  return invites.map(d => ({ ...d, createdAt: new Date(d.createdAt), expiresAt: new Date(d.expiresAt) }));
}
export async function getBusinessInvitations(businessId: string) {
  const snap = await getDocs(query(collection(db, `businesses/${businessId}/invitations`), where('status', '==', 'pending')));
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, businessId, ...data, createdAt: data.createdAt?.toDate?.() || new Date(),
      expiresAt: data.expiresAt?.toDate?.() || new Date(), usedAt: data.usedAt?.toDate?.() } as BusinessInvitation;
  });
}
