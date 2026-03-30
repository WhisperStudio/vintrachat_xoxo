import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Invitation, User } from "@/types/database";

/**
 * Opprett en invitasjon for ny bruker
 * Admin kan invitere andre brukere til bedriften
 */
export async function createInvitation(
  businessId: string,
  businessName: string,
  inviteEmail: string,
  inviteRole: "admin" | "user",
  createdByUserId: string
): Promise<{ success: boolean; invitationId?: string; message: string }> {
  try {
    // Sett utløpstid 30 dager fra nå
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation: Omit<Invitation, "id"> = {
      businessId,
      businessName,
      inviteEmail,
      inviteRole,
      createdBy: createdByUserId,
      createdAt: new Date(),
      expiresAt,
      used: false,
    };

    const docRef = await addDoc(collection(db, "invitations"), {
      ...invitation,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    return {
      success: true,
      invitationId: docRef.id,
      message: "Invitasjon opprettet",
    };
  } catch (error) {
    console.error("Error creating invitation:", error);
    return {
      success: false,
      message: "Kunne ikke opprette invitasjon",
    };
  }
}

/**
 * Godta en invitasjon og opprett bruker
 */
export async function acceptInvitation(
  invitationId: string,
  firebaseUser: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }
): Promise<{ success: boolean; message: string; businessId?: string }> {
  try {
    // Hent invitasjonen
    const invitationRef = doc(db, "invitations", invitationId);
    const inviteDoc = await getDoc(invitationRef);

    if (!inviteDoc.exists()) {
      return {
        success: false,
        message: "Invitasjon finnes ikke",
      };
    }

    const invitation = inviteDoc.data() as Invitation;

    // Sjekk om invitasjonen er expired
    const now = new Date();
    if (invitation.expiresAt < now) {
      return {
        success: false,
        message: "Invitasjonen er utløpt",
      };
    }

    // Sjekk om invitasjonen allerede er brukt
    if (invitation.used) {
      return {
        success: false,
        message: "Invitasjonen er allerede brukt",
      };
    }

    // Sjekk at email matcher
    if (firebaseUser.email !== invitation.inviteEmail) {
      return {
        success: false,
        message: "Email matcher ikke invitasjonen",
      };
    }

    // Opprett user document
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      businessId: invitation.businessId,
      role: invitation.inviteRole,
      displayName: firebaseUser.displayName || "",
      photoURL: firebaseUser.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    // Lagre bruker
    await setDoc(doc(db, "users", firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    // Legg til bruker i business users array
    const businessRef = doc(db, "business", invitation.businessId);
    await updateDoc(businessRef, {
      users: arrayUnion(firebaseUser.uid),
      updatedAt: serverTimestamp(),
    });

    // Marker invitasjon som brukt
    await updateDoc(invitationRef, {
      used: true,
      usedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Bruker opprettet og lagt til bedriften",
      businessId: invitation.businessId,
    };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return {
      success: false,
      message: "Kunne ikke godta invitasjonen",
    };
  }
}

/**
 * Hent invitasjoner for en bedrift
 */
export async function getBusinessInvitations(
  businessId: string
): Promise<Invitation[]> {
  try {
    const q = query(
      collection(db, "invitations"),
      where("businessId", "==", businessId),
      where("used", "==", false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invitation[];
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }
}
