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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';

const GRADES_COLLECTION = 'grades';

/**
 * Record a grade for a student
 */
export async function recordGrade(schoolId, gradeData) {
  // We can use a composite ID to easily upsert/update an existing grade
  // ID format: schoolId_studentId_subjectId_examTerm
  const gradeId = `${schoolId}_${gradeData.studentId}_${gradeData.subjectId}_${gradeData.examTerm.replace(/\s+/g, '')}`;
  const docRef = doc(db, GRADES_COLLECTION, gradeId);

  const newGrade = {
    gradeId,
    schoolId,
    classId: gradeData.classId,
    subjectId: gradeData.subjectId,
    studentId: gradeData.studentId,
    examTerm: gradeData.examTerm,
    marksObtained: Number(gradeData.marksObtained),
    totalMarks: Number(gradeData.totalMarks),
    grade: gradeData.grade || '',
    remarks: gradeData.remarks || '',
    recordedBy: gradeData.recordedBy || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, newGrade, { merge: true });
  return { id: gradeId, ...newGrade };
}

/**
 * Fetch grades for a specific class and subject and term
 */
export async function getGradesForSubject(schoolId, classId, subjectId, examTerm) {
  try {
    const q = query(
      collection(db, GRADES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId),
      where('subjectId', '==', subjectId),
      where('examTerm', '==', examTerm)
    );
    const snapshot = await getDocs(q);
    const grades = [];
    snapshot.forEach((d) => grades.push({ id: d.id, ...d.data() }));
    return grades;
  } catch (error) {
    console.error('Error fetching grades for subject:', error);
    return [];
  }
}

/**
 * Fetch all grades for a specific student
 */
export async function getGradesForStudent(schoolId, studentId) {
  try {
    const q = query(
      collection(db, GRADES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);
    const grades = [];
    snapshot.forEach((d) => grades.push({ id: d.id, ...d.data() }));
    return grades;
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return [];
  }
}
