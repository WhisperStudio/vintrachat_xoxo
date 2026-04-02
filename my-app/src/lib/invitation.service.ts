// /lib/invitation.service.ts

import {
  collection,
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
import { UserRole } from "@/types/database";

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

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}