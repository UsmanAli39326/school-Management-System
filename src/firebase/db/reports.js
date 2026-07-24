import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../config';

const INVOICES_COL = 'invoices';
const STUDENTS_COL = 'students';

/**
 * Get all students who have UNPAID or PARTIAL invoices
 */
export async function getDefaulters(schoolId) {
  try {
    // 1. Fetch all unpaid/partial invoices
    const q1 = query(collection(db, INVOICES_COL), where('schoolId', '==', schoolId), where('status', 'in', ['UNPAID', 'PARTIAL', 'OVERDUE']));
    const invSnapshot = await getDocs(q1);
    
    if (invSnapshot.empty) return [];
    
    // Group by studentId
    const duesByStudent = {};
    invSnapshot.forEach(doc => {
      const inv = doc.data();
      if (!duesByStudent[inv.studentId]) {
        duesByStudent[inv.studentId] = {
          studentId: inv.studentId,
          totalDue: 0,
          invoices: []
        };
      }
      duesByStudent[inv.studentId].totalDue += (inv.remainingBalance || 0);
      duesByStudent[inv.studentId].invoices.push(inv);
    });

    // 2. Fetch student details for those student IDs in batches of 10
    const studentIds = Object.keys(duesByStudent);
    const studentsMap = {};

    // Firestore 'in' query max 10 items.
    for (let i = 0; i < studentIds.length; i += 10) {
      const batchIds = studentIds.slice(i, i + 10);
      if (batchIds.length > 0) {
        const q2 = query(collection(db, STUDENTS_COL), where(documentId(), 'in', batchIds));
        const stuSnapshot = await getDocs(q2);
        stuSnapshot.forEach(doc => {
          studentsMap[doc.id] = doc.data();
        });
      }
    }
    
    // 3. Merge data
    const defaulters = [];
    for (const studentId of studentIds) {
      if (studentsMap[studentId]) {
        defaulters.push({
          student: studentsMap[studentId],
          totalDue: duesByStudent[studentId].totalDue,
          invoices: duesByStudent[studentId].invoices
        });
      }
    }
    
    return defaulters.sort((a, b) => b.totalDue - a.totalDue);
    
  } catch (error) {
    console.error('Error fetching defaulters:', error);
    return [];
  }
}
