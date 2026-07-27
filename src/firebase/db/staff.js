import { collection, doc, getDoc, getDocs, setDoc, query, where, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../config';

const INVITATIONS_COL = 'staff_invitations';

/**
 * Create a new staff invitation
 */
export async function createInvitation(schoolId, email, role, adminName, department = 'General') {
  const cleanEmail = email.trim().toLowerCase();
  const inviteId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const docRef = doc(db, INVITATIONS_COL, inviteId);

  const invite = {
    inviteId,
    email: cleanEmail,
    role,
    department,
    schoolId,
    invitedBy: adminName,
    status: 'PENDING',
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, invite);
  return invite;
}

/**
 * Fetch all invitations for a school
 */
export async function getInvitations(schoolId) {
  try {
    const q = query(
      collection(db, INVITATIONS_COL),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const invites = [];
    snapshot.forEach((d) => invites.push(d.data()));
    return invites.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
}

/**
 * Check if a valid pending invitation exists for an email
 */
export async function getInvitationByEmail(email) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const inviteId = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const docRef = doc(db, INVITATIONS_COL, inviteId);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().status === 'PENDING') {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error('Error checking invitation:', error);
    throw error; // Throw the error so the UI can show if it's a permission issue
  }
}

/**
 * Mark an invitation as ACCEPTED
 */
export async function acceptInvitation(email) {
  const cleanEmail = email.trim().toLowerCase();
  const inviteId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const docRef = doc(db, INVITATIONS_COL, inviteId);
  await setDoc(docRef, { status: 'ACCEPTED', acceptedAt: serverTimestamp() }, { merge: true });
}

/**
 * Delete / Revoke an invitation
 */
export async function revokeInvitation(email) {
  const cleanEmail = email.trim().toLowerCase();
  const inviteId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  const docRef = doc(db, INVITATIONS_COL, inviteId);
  await deleteDoc(docRef);
}
