import { getAdminDb } from '@/lib/firebase-admin';
import { createAccessService } from '@/lib/access/service.mjs';
import { createNotificationHandler } from '@/lib/notifications/http.mjs';
import { apiOrigins, verifyActiveUserToken } from '@/lib/verified-auth.server';
import { getPlanLimits, normalizeSubscriptionPlan } from '@/lib/subscription';

export const runtime = 'nodejs';
export const maxDuration = 60;
const handle = createNotificationHandler({
  verifyToken: verifyActiveUserToken,
  enabled: () => true,
  origins: apiOrigins(),
  actions: new Set(['listBusinesses', 'listInvitations', 'createInvitation', 'acceptInvitation', 'deleteInvitation', 'updateUserRole']),
  service: () => createAccessService(getAdminDb(), {
    teamLimit: (plan: string) => getPlanLimits(normalizeSubscriptionPlan(plan)).maxTeamMembers,
  }),
  schedule: () => {},
});
export const POST = handle;
export const OPTIONS = handle;
