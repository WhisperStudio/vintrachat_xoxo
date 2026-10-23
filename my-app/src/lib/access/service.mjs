import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NotificationError } from '../notifications/service.mjs';

const roles = ['admin', 'manager', 'support', 'viewer', 'user'];
const email = value => String(value || '').trim().toLowerCase();
const phone = value => String(value || '').replace(/\D/g, '');
const fail = (code, message) => { throw new NotificationError(code, message); };
const id = value => {
  if (typeof value !== 'string' || !value || value.length > 128 || value.includes('/'))
    fail('invalid-argument', 'Invalid identifier.');
  return value;
};
export function accessRole(business, member, uid) {
  if (!business || member?.status === 'disabled') return null;
  if (business.ownerId === uid) return 'owner';
  return member?.status === 'active' && roles.includes(member.role) ? member.role : null;
}
export function invitationMatches(invite, token) {
  // A typed phone number or pending profile is never proof of identity.
  const recipientEmail = email(invite.email || invite.normalizedEmail);
  if (recipientEmail) return token.email_verified === true && recipientEmail === email(token.email);
  const verifiedPhone = phone(token.phone_number);
  return Boolean(verifiedPhone && [invite.phone, invite.telephone, invite.phoneNumber, invite.normalizedPhone]
    .some(value => phone(value) === verifiedPhone));
}
const millis = value => value?.toMillis?.() || (value ? new Date(value).getTime() : 0);

export function createAccessService(db, { teamLimit = () => 1 } = {}) {
  function user(request) {
    if (!request.auth?.uid || request.auth.token.email_verified !== true)
      fail('unauthenticated', 'Sign in with a verified email.');
    return request.auth;
  }
  async function listBusinesses(request) {
    const auth = user(request);
    // Server-side discovery avoids exposing other tenants and needs no new indexes.
    const businesses = await db.collection('businesses').get();
    const profiles = [];
    for (const business of businesses.docs) {
      const member = await business.ref.collection('users').doc(auth.uid).get();
      const role = accessRole(business.data(), member.data(), auth.uid);
      if (!role) continue;
      profiles.push({
        businessId: business.id, businessName: business.data().name || business.id,
        role, email: auth.token.email || '', displayName: member.data()?.displayName || auth.token.name || '',
        status: 'active',
      });
    }
    return profiles;
  }
  async function listInvitations(request) {
    const auth = user(request);
    const businesses = await db.collection('businesses').get();
    const result = [];
    for (const business of businesses.docs) {
      const invites = await business.ref.collection('invitations').where('status', '==', 'pending').get();
      for (const invite of invites.docs) {
        const data = invite.data();
        if (!invitationMatches(data, auth.token) || millis(data.expiresAt) <= Date.now()) continue;
        result.push({ id: invite.id, businessId: business.id, businessName: business.data().name || business.id,
          email: data.email || '', role: data.role, status: data.status, createdBy: data.createdBy,
          createdAt: millis(data.createdAt), expiresAt: millis(data.expiresAt) });
      }
    }
    return result;
  }
  function refs(data) {
    const business = db.doc(`businesses/${id(data.businessId)}`);
    return { business, invites: business.collection('invitations'), members: business.collection('users') };
  }
  async function manager(tx, business, auth) {
    const b = await tx.get(business);
    const m = await tx.get(business.collection('users').doc(auth.uid));
    if (!b.exists) fail('not-found', 'Business not found.');
    const role = accessRole(b.data(), m.data(), auth.uid);
    if (!['owner', 'admin'].includes(role))
      fail('permission-denied', 'Only an active administrator can manage the team.');
    return b;
  }
  async function createInvitation(request) {
    const auth = user(request), data = request.data;
    const { business, invites, members } = refs(data);
    const recipient = email(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient) || !roles.includes(data.role))
      fail('invalid-argument', 'Choose an email and a valid role.');
    const ref = invites.doc();
    await db.runTransaction(async tx => {
      const b = await manager(tx, business, auth);
      const team = await tx.get(members);
      const pending = await tx.get(invites.where('status', '==', 'pending'));
      const reserved = pending.docs.filter(d => millis(d.data().expiresAt) > Date.now());
      const limit = teamLimit(b.data().chatWidgetConfig?.plan || 'free');
      if (limit !== null && team.size + reserved.length >= limit)
        fail('permission-denied', 'Team limit reached for this subscription.');
      if (reserved.some(d => email(d.data().email) === recipient))
        fail('invalid-argument', 'A pending invitation already exists.');
      tx.create(ref, { email: recipient, role: data.role, status: 'pending', createdBy: auth.uid,
        expiresAt: Timestamp.fromMillis(Date.now() + 7 * 86400000), createdAt: FieldValue.serverTimestamp() });
    });
    return { success: true, invitationId: ref.id };
  }
  async function acceptInvitation(request) {
    const auth = user(request), data = request.data;
    const { business, invites, members } = refs(data);
    const inviteRef = invites.doc(id(data.invitationId));
    await db.runTransaction(async tx => {
      const b = await tx.get(business);
      const snap = await tx.get(inviteRef);
      const member = await tx.get(members.doc(auth.uid));
      const team = await tx.get(members);
      const invite = snap.data();
      if (!b.exists || !invite) fail('not-found', 'Invitation not found.');
      if (!invitationMatches(invite, auth.token)) fail('permission-denied', 'This invitation belongs to another account.');
      // Retrying an already committed acceptance is safe, but never restores revoked access.
      if (invite.status === 'accepted' && invite.usedBy === auth.uid && accessRole(b.data(), member.data(), auth.uid)) return;
      if (invite.status !== 'pending' || millis(invite.expiresAt) <= Date.now() || !roles.includes(invite.role))
        fail('permission-denied', 'This invitation is expired or no longer valid.');
      const issuer = await tx.get(members.doc(String(invite.createdBy || '_missing')));
      if (!['owner', 'admin'].includes(accessRole(b.data(), issuer.data(), invite.createdBy)))
        fail('permission-denied', 'The inviting administrator no longer has access.');
      const limit = teamLimit(b.data().chatWidgetConfig?.plan || 'free');
      if (!member.exists && limit !== null && team.size >= limit)
        fail('permission-denied', 'Team limit reached for this subscription.');
      if (member.exists && !accessRole(b.data(), member.data(), auth.uid))
        fail('permission-denied', 'An administrator must restore your membership.');
      // An invitation cannot silently change an existing member's role.
      if (!member.exists && b.data().ownerId !== auth.uid) tx.create(members.doc(auth.uid), {
        email: email(auth.token.email), displayName: auth.token.name || '', businessId: business.id,
        role: invite.role, status: 'active', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tx.update(inviteRef, { status: 'accepted', usedBy: auth.uid, usedAt: FieldValue.serverTimestamp() });
      tx.delete(db.doc(`pending_users/${auth.uid}`));
    });
    return { success: true, businessId: business.id };
  }
  async function deleteInvitation(request) {
    const auth = user(request), data = request.data;
    const { business, invites } = refs(data);
    const ref = invites.doc(id(data.invitationId));
    await db.runTransaction(async tx => {
      const invite = await tx.get(ref);
      if (!invite.exists) return;
      if (!invitationMatches(invite.data(), auth.token)) await manager(tx, business, auth);
      tx.delete(ref);
    });
    return { success: true };
  }
  async function updateUserRole(request) {
    const auth = user(request), data = request.data;
    const { business, members } = refs(data);
    const uid = id(data.userId);
    if (!roles.includes(data.role)) fail('invalid-argument', 'Invalid role.');
    await db.runTransaction(async tx => {
      const b = await manager(tx, business, auth);
      const member = await tx.get(members.doc(uid));
      if (uid === auth.uid || uid === b.data().ownerId)
        fail('permission-denied', 'You cannot change your own role or the business owner.');
      if (!member.exists) fail('not-found', 'Member not found.');
      tx.update(member.ref, { role: data.role, updatedAt: FieldValue.serverTimestamp() });
    });
    return { success: true };
  }
  return { listBusinesses, listInvitations, createInvitation, acceptInvitation, deleteInvitation, updateUserRole };
}
