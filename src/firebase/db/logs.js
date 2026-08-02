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
    const docRef = doc(collection(db, COLLECTION_NAME));
    const logId = docRef.id;

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
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(maxLogs)
    );
    const snapshot = await getDocs(q);
    const logs = [];
    snapshot.forEach((d) => {
      logs.push({ id: d.id, ...d.data() });
    });
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}
