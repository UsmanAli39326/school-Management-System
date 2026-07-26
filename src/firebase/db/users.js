import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION_NAME = 'users';

/**
 * Save user profile in Firestore
 */
export async function createUserProfile(uid, userData) {
  const userRef = doc(db, COLLECTION_NAME, uid);
  const profile = {
    uid,
    email: userData.email || '',
    displayName: userData.displayName || '',
    role: userData.role || 'SCHOOL_ADMIN',
    schoolId: userData.schoolId || 'GLOBAL',
    status: userData.status || 'ACTIVE',
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };

  await setDoc(userRef, profile, { merge: true });
  return profile;
}

/**
 * Fetch all users (optionally filtered by schoolId or role)
 */
export async function getAllUsers(schoolIdFilter = null) {
  try {
    let q = query(collection(db, COLLECTION_NAME));
    if (schoolIdFilter) {
      q = query(collection(db, COLLECTION_NAME), where('schoolId', '==', schoolIdFilter));
    }
    const snapshot = await getDocs(q);
    const users = [];
    snapshot.forEach((d) => {
      users.push({ id: d.id, ...d.data() });
    });
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Toggle user lock/unlock status
 */
export async function updateUserStatus(uid, status) {
  const userRef = doc(db, COLLECTION_NAME, uid);
  await updateDoc(userRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update user profile details (role, department, phone, status, etc.)
 */
export async function updateUserProfile(uid, updates) {
  const userRef = doc(db, COLLECTION_NAME, uid);
  const cleanUpdates = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(userRef, cleanUpdates);
  return cleanUpdates;
}

