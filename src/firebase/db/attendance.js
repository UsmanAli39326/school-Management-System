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

const ATTENDANCE_COLLECTION = 'student_attendance';

/**
 * Save or update daily attendance for a section on a given date
 * @param {string} schoolId
 * @param {string} classId
 * @param {string} sectionId
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array<{ studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' }>} records
 */
export async function saveDailyAttendance(schoolId, classId, sectionId, dateStr, records) {
  const docId = `${schoolId}_${classId}_${sectionId}_${dateStr}`;
  const docRef = doc(db, ATTENDANCE_COLLECTION, docId);

  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const totalCount = records.length;

  const data = {
    schoolId,
    classId,
    sectionId,
    dateStr,
    records,
    presentCount,
    totalCount,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, data, { merge: true });
  return data;
}

/**
 * Get today's attendance rate across all sections for a school
 * @param {string} schoolId
 * @param {string} [todayDateStr] - YYYY-MM-DD
 */
export async function getTodayAttendanceRate(schoolId, todayDateStr = null) {
  try {
    const dateStr = todayDateStr || new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, ATTENDANCE_COLLECTION),
      where('schoolId', '==', schoolId),
      where('dateStr', '==', dateStr)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { rate: null, presentCount: 0, totalCount: 0, taken: false };
    }

    let totalPresent = 0;
    let totalStudents = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalPresent += data.presentCount || 0;
      totalStudents += data.totalCount || 0;
    });

    const rate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
    return {
      rate: Number(rate.toFixed(1)),
      presentCount: totalPresent,
      totalCount: totalStudents,
      taken: true,
    };
  } catch (error) {
    console.error('Error fetching today attendance rate:', error);
    return { rate: null, presentCount: 0, totalCount: 0, taken: false };
  }
}

const STAFF_ATTENDANCE_COLLECTION = 'staff_attendance';

/**
 * Save or update daily attendance for staff
 * @param {string} schoolId
 * @param {string} dateStr - YYYY-MM-DD
 * @param {Array<{ staffId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE' }>} records
 */
export async function saveDailyStaffAttendance(schoolId, dateStr, records) {
  const docId = `${schoolId}_${dateStr}`;
  const docRef = doc(db, STAFF_ATTENDANCE_COLLECTION, docId);

  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const totalCount = records.length;

  const data = {
    schoolId,
    dateStr,
    records,
    presentCount,
    totalCount,
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, data, { merge: true });
  return data;
}

/**
 * Get today's staff attendance rate for a school
 * @param {string} schoolId
 * @param {string} [todayDateStr] - YYYY-MM-DD
 */
export async function getTodayStaffAttendanceRate(schoolId, todayDateStr = null) {
  try {
    const dateStr = todayDateStr || new Date().toISOString().split('T')[0];
    const docId = `${schoolId}_${dateStr}`;
    const docRef = doc(db, STAFF_ATTENDANCE_COLLECTION, docId);
    
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { rate: null, presentCount: 0, totalCount: 0, taken: false, records: [] };
    }

    const data = snap.data();
    const rate = data.totalCount > 0 ? (data.presentCount / data.totalCount) * 100 : 0;
    
    return {
      rate: Number(rate.toFixed(1)),
      presentCount: data.presentCount || 0,
      totalCount: data.totalCount || 0,
      taken: true,
      records: data.records || [],
    };
  } catch (error) {
    console.error('Error fetching today staff attendance rate:', error);
    return { rate: null, presentCount: 0, totalCount: 0, taken: false, records: [] };
  }
}
