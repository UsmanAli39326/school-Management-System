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

const COLLECTION_NAME = 'students';

/**
 * Admit a new student to the school
 */
export async function admitStudent(schoolId, studentData) {
  const studentId = studentData.studentId || `student_${Date.now()}`;
  const docRef = doc(db, COLLECTION_NAME, studentId);

  const newStudent = {
    studentId,
    schoolId,
    admissionNumber: studentData.admissionNumber || '',
    rollNumber: studentData.rollNumber || '',
    admissionDate: studentData.admissionDate || serverTimestamp(),
    classId: studentData.classId || '',
    sectionId: studentData.sectionId || '',
    
    personalInfo: {
      fullName: studentData.personalInfo?.fullName || '',
      gender: studentData.personalInfo?.gender || '',
      dob: studentData.personalInfo?.dob || null,
      bloodGroup: studentData.personalInfo?.bloodGroup || '',
      religion: studentData.personalInfo?.religion || '',
      nationality: studentData.personalInfo?.nationality || '',
      photoUrl: studentData.personalInfo?.photoUrl || '',
    },
    
    parentInfo: {
      fatherName: studentData.parentInfo?.fatherName || '',
      motherName: studentData.parentInfo?.motherName || '',
      guardianName: studentData.parentInfo?.guardianName || '',
      cnic: studentData.parentInfo?.cnic || '',
      phone: studentData.parentInfo?.phone || '',
      email: studentData.parentInfo?.email || '',
      occupation: studentData.parentInfo?.occupation || '',
    },
    
    addresses: {
      current: studentData.addresses?.current || '',
      permanent: studentData.addresses?.permanent || '',
      city: studentData.addresses?.city || '',
      postalCode: studentData.addresses?.postalCode || '',
    },
    
    academicDetails: {
      previousSchool: studentData.academicDetails?.previousSchool || '',
      previousClass: studentData.academicDetails?.previousClass || '',
      admissionType: studentData.academicDetails?.admissionType || 'NEW',
      status: studentData.status || 'ACTIVE',
    },
    
    documents: studentData.documents || {},
    
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, newStudent);
  return { id: studentId, ...newStudent };
}

/**
 * Fetch all students for a school
 */
export async function getStudentsBySchool(schoolId) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const students = [];
    snapshot.forEach((d) => students.push({ id: d.id, ...d.data() }));
    
    // Sort client-side by admissionDate descending
    return students.sort((a, b) => {
      const timeA = a.admissionDate?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.admissionDate?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

/**
 * Fetch a single student by ID
 */
export async function getStudentById(studentId) {
  try {
    const docRef = doc(db, COLLECTION_NAME, studentId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    console.error('Error fetching student by ID:', error);
  }
  return null;
}

/**
 * Update student details
 */
export async function updateStudent(studentId, updateData) {
  const docRef = doc(db, COLLECTION_NAME, studentId);
  const dataToUpdate = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, dataToUpdate);
}

/**
 * Delete a student document
 */
export async function deleteStudent(studentId) {
  const docRef = doc(db, COLLECTION_NAME, studentId);
  await deleteDoc(docRef);
}
