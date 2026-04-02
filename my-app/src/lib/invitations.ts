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
import { UserRole } from "@/types/database";

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