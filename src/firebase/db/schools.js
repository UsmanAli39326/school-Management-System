import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION_NAME = 'schools';

/**
 * Create a new school document in Firestore
 */
export async function createSchool(schoolData) {
  const docRef = schoolData.schoolId ? doc(db, COLLECTION_NAME, schoolData.schoolId) : doc(collection(db, COLLECTION_NAME));
  const schoolId = docRef.id;

  const newSchool = {
    schoolId,
    name: schoolData.name || '',
    tagline: schoolData.tagline || '',
    principalName: schoolData.principalName || '',
    logoUrl: schoolData.logoUrl || '',
    bannerUrl: schoolData.bannerUrl || '',
    contact: {
      phone: schoolData.contact?.phone || '',
      email: schoolData.contact?.email || '',
      address: schoolData.contact?.address || '',
      city: schoolData.contact?.city || '',
      website: schoolData.contact?.website || '',
    },
    config: {
      activeSession: schoolData.config?.activeSession || '2025-2026',
      currency: schoolData.config?.currency || 'USD',
      timezone: schoolData.config?.timezone || 'UTC',
      dateFormat: schoolData.config?.dateFormat || 'DD/MM/YYYY',
    },
    theme: {
      primaryColor: schoolData.theme?.primaryColor || '#4f46e5',
      secondaryColor: schoolData.theme?.secondaryColor || '#0ea5e9',
    },
    subscription: {
      status: schoolData.subscription?.status || 'TRIAL',
      trialEndsAt: schoolData.subscription?.trialEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: schoolData.subscription?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    status: schoolData.status || 'ACTIVE',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, newSchool);
  return { id: schoolId, ...newSchool };
}

/**
 * Fetch all schools
 */
export async function getAllSchools() {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const schools = [];
    snapshot.forEach((d) => {
      schools.push({ id: d.id, ...d.data() });
    });
    return schools;
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
}

/**
 * Fetch a single school by ID
 */
export async function getSchoolById(schoolId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, schoolId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    console.error('Error fetching school by ID:', error);
  }
  return null;
}

/**
 * Update school details
 */
export async function updateSchool(schoolId, updateData) {
  const docRef = doc(db, COLLECTION_NAME, schoolId);
  const dataToUpdate = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, dataToUpdate);
}

/**
 * Toggle school active/inactive status
 */
export async function toggleSchoolStatus(schoolId, currentStatus) {
  const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  await updateSchool(schoolId, { status: newStatus });
  return newStatus;
}

/**
 * Delete a school document
 */
export async function deleteSchool(schoolId) {
  const docRef = doc(db, COLLECTION_NAME, schoolId);
  await deleteDoc(docRef);
}
