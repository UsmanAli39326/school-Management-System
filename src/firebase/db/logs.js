import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const COLLECTION_NAME = 'activity_logs';

/**
 * Write a new activity log entry
 */
export async function logActivity(action, details, userId = 'system', userName = 'System', schoolId = 'GLOBAL') {
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COLLECTION_NAME, logId);

    const logEntry = {
      logId,
      action,
      details,
      userId,
      userName,
      schoolId,
      timestamp: serverTimestamp(),
      createdAtStr: new Date().toISOString(),
    };

    await setDoc(docRef, logEntry);
    return logEntry;
  } catch (err) {
    console.error('Error logging activity:', err);
  }
}

/**
 * Fetch activity logs
 */
export async function getActivityLogs(maxLogs = 50) {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((d) => {
      logs.push({ id: d.id, ...d.data() });
    });
    return logs.sort((a, b) => (b.createdAtStr || '').localeCompare(a.createdAtStr || ''));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}
