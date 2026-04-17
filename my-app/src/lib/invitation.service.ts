// /lib/invitation.service.ts

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { BusinessInvitation, UserRole } from "@/types/database";
import { getPlanLimits, type SubscriptionPlan } from "@/lib/subscription";

async function getBusinessTeamState(businessId: string) {
  const businessSnap = await getDoc(doc(db, `businesses/${businessId}`));
  const businessPlan = (businessSnap.exists()
    ? businessSnap.data()?.chatWidgetConfig?.plan || 'free'
    : 'free') as SubscriptionPlan;
  const usersSnap = await getDocs(collection(db, `businesses/${businessId}/users`));

  return {
    plan: businessPlan,
    memberCount: usersSnap.size,
  };
}

// ----------------------
// CREATE INVITE
// ----------------------
export async function createInvitation(
  businessId: string,
  inviteEmail: string,
  role: UserRole,
  createdBy: string
) {
  try {
    const teamState = await getBusinessTeamState(businessId);
    const limits = getPlanLimits(teamState.plan);

    if (limits.maxTeamMembers !== null && teamState.memberCount >= limits.maxTeamMembers) {
      return {
        success: false,
        message: `Team limit reached for ${limits.maxTeamMembers} members on this plan.`,
      };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const ref = await addDoc(
      collection(db, `businesses/${businessId}/invitations`),
      {
        email: inviteEmail,
        role,
        createdBy,
        status: "pending",
        expiresAt,
        createdAt: serverTimestamp(),
      }
    );

    return {
      success: true,
      invitationId: ref.id,
    };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

// ----------------------
// ACCEPT INVITE
// ----------------------
export async function acceptInvitation(
  invitationId: string,
  businessId: string,
  userId: string
) {
  try {
    const inviteRef = doc(
      db,
      `businesses/${businessId}/invitations/${invitationId}`
    );

    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
      return { success: false, message: "Invitasjon finnes ikke" };
    }

    const invite = inviteSnap.data();

    if (invite.status !== "pending") {
      return { success: false, message: "Allerede brukt" };
    }

    if (new Date() > new Date(invite.expiresAt)) {
      return { success: false, message: "Utløpt invitasjon" };
    }

    const pendingRef = doc(db, "pending_users", userId);
    const pendingSnap = await getDoc(pendingRef);

    if (!pendingSnap.exists()) {
      return { success: false, message: "Verify email først" };
    }

    const userData = pendingSnap.data();
    const teamState = await getBusinessTeamState(businessId);
    const limits = getPlanLimits(teamState.plan);

    if (limits.maxTeamMembers !== null && teamState.memberCount >= limits.maxTeamMembers) {
      return { success: false, message: "Team limit reached for this subscription" };
    }

    await setDoc(
      doc(db, `businesses/${businessId}/users/${userId}`),
      {
        ...userData,
        businessId, // 🔥 viktig!
        role: invite.role,
        status: "active",
        createdAt: serverTimestamp(),
      }
    );

    await deleteDoc(pendingRef);

    await updateDoc(inviteRef, {
      status: "accepted",
      usedAt: serverTimestamp(),
    });

    return { success: true, businessId };
  } catch (err) {
    console.error(err);
    return { success: false, message: "Feil ved accept" };
  }
}

// ----------------------
// GET INVITES
// ----------------------
export async function getBusinessInvitations(businessId: string) {
  const q = query(
    collection(db, `businesses/${businessId}/invitations`),
    where("status", "==", "pending")
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();

    return {
      id: d.id,
      businessId,
      businessName: undefined,
      email: data.email,
      role: data.role,
      createdBy: data.createdBy,
      status: data.status,
      expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt || Date.now()),
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
      usedAt: data.usedAt?.toDate?.() || undefined,
    };
  });
}

// ----------------------
// GET INVITES FOR EMAIL
// ----------------------
export async function getInvitationsForEmail(email: string): Promise<BusinessInvitation[]> {
  const businessesSnap = await getDocs(collection(db, "businesses"));
  const invitations = await Promise.all(
    businessesSnap.docs.map(async (businessDoc) => {
      const invitesSnap = await getDocs(
        query(
          collection(db, `businesses/${businessDoc.id}/invitations`),
          where("email", "==", email)
        )
      );

      return invitesSnap.docs
        .filter((d) => d.data().status === "pending")
        .map((d) => {
          const data = d.data();

          return {
            id: d.id,
            businessId: businessDoc.id,
            businessName: businessDoc.data().name || businessDoc.id,
            email: data.email,
            role: data.role,
            createdBy: data.createdBy,
            status: data.status,
            expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt || Date.now()),
            createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
            usedAt: data.usedAt?.toDate?.() || undefined,
          } as BusinessInvitation;
        });
    })
  );

  return invitations.flat();
}

// ----------------------
// DELETE INVITE
// ----------------------
export async function deleteInvitation(
  businessId: string,
  invitationId: string
) {
  try {
    await deleteDoc(
      doc(db, `businesses/${businessId}/invitations/${invitationId}`)
    );
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}
