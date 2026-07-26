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

const CLASSES_COLLECTION = 'classes';
const SECTIONS_COLLECTION = 'sections';
const SESSIONS_COLLECTION = 'academic_sessions';

// ----------------------------------------------------------------------
// ACADEMIC SESSIONS
// ----------------------------------------------------------------------

export async function createSession(schoolId, sessionData) {
  const sessionId = sessionData.sessionId || `session_${Date.now()}`;
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);

  const newSession = {
    sessionId,
    schoolId,
    name: sessionData.name || '',
    startDate: sessionData.startDate || serverTimestamp(),
    endDate: sessionData.endDate || serverTimestamp(),
    isCurrent: sessionData.isCurrent || false,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newSession);
  return { id: sessionId, ...newSession };
}

export async function getSessions(schoolId) {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const sessions = [];
    snapshot.forEach((d) => sessions.push({ id: d.id, ...d.data() }));
    // Sort client-side
    return sessions.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA; // desc
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

export async function getActiveSession(schoolId) {
  try {
    const sessions = await getSessions(schoolId);
    const active = sessions.find((s) => s.isCurrent === true || s.isCurrent === 'true');
    return active || sessions[0] || null;
  } catch (error) {
    console.error('Error fetching active session:', error);
    return null;
  }
}


export async function updateSession(sessionId, updateData) {
  const docRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(docRef, updateData);
}

// ----------------------------------------------------------------------
// CLASSES
// ----------------------------------------------------------------------

export async function createClass(schoolId, classData) {
  const classId = classData.classId || `class_${Date.now()}`;
  const docRef = doc(db, CLASSES_COLLECTION, classId);

  const newClass = {
    classId,
    schoolId,
    name: classData.name || '',
    level: classData.level || 'Primary', // Nursery, Primary, Middle, High
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newClass);
  return { id: classId, ...newClass };
}

export async function getClasses(schoolId) {
  try {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('schoolId', '==', schoolId)
    );
    const snapshot = await getDocs(q);
    const classes = [];
    snapshot.forEach((d) => classes.push({ id: d.id, ...d.data() }));
    // Sort client-side
    return classes.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB; // asc
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
}

export async function getClassById(classId) {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (error) {
    console.error('Error fetching class by ID:', error);
  }
  return null;
}

export async function updateClass(classId, updateData) {
  const docRef = doc(db, CLASSES_COLLECTION, classId);
  await updateDoc(docRef, updateData);
}

export async function deleteClass(classId) {
  const docRef = doc(db, CLASSES_COLLECTION, classId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------------------------
// SECTIONS
// ----------------------------------------------------------------------

export async function createSection(schoolId, classId, sectionData) {
  const sectionId = sectionData.sectionId || `section_${Date.now()}`;
  const docRef = doc(db, SECTIONS_COLLECTION, sectionId);

  const newSection = {
    sectionId,
    schoolId,
    classId,
    name: sectionData.name || '',
    roomNumber: sectionData.roomNumber || '',
    capacity: Number(sectionData.capacity) || 30,
    classTeacherId: sectionData.classTeacherId || null,
    classTeacherName: sectionData.classTeacherName || null,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newSection);
  return { id: sectionId, ...newSection };
}

export async function getSectionsForClass(schoolId, classId) {
  try {
    const q = query(
      collection(db, SECTIONS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId)
    );
    const snapshot = await getDocs(q);
    const sections = [];
    snapshot.forEach((d) => sections.push({ id: d.id, ...d.data() }));
    // Sort client-side
    return sections.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB; // asc
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
}

export async function updateSection(sectionId, updateData) {
  const docRef = doc(db, SECTIONS_COLLECTION, sectionId);
  await updateDoc(docRef, updateData);
}

export async function deleteSection(sectionId) {
  const docRef = doc(db, SECTIONS_COLLECTION, sectionId);
  await deleteDoc(docRef);
}

// ----------------------------------------------------------------------
// SUBJECTS
// ----------------------------------------------------------------------

const SUBJECTS_COLLECTION = 'subjects';

export async function createSubject(schoolId, classId, subjectData) {
  const subjectId = subjectData.subjectId || `sub_${Date.now()}`;
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);

  const newSubject = {
    subjectId,
    schoolId,
    classId,
    name: subjectData.name || '',
    code: subjectData.code || '',
    type: subjectData.type || 'Core', // Core, Elective, Optional
    department: subjectData.department || 'General',
    creditWeight: Number(subjectData.creditWeight) || 1,
    teacherId: subjectData.teacherId || null,
    teacherName: subjectData.teacherName || null,
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newSubject);
  return { id: subjectId, ...newSubject };
}

export async function getSubjectsForClass(schoolId, classId) {
  try {
    const q = query(
      collection(db, SUBJECTS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId)
    );
    const snapshot = await getDocs(q);
    const subjects = [];
    snapshot.forEach((d) => subjects.push({ id: d.id, ...d.data() }));
    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
  }
}

export async function getSubjectsForTeacher(schoolId, teacherId) {
  try {
    const q = query(
      collection(db, SUBJECTS_COLLECTION),
      where('schoolId', '==', schoolId),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);
    const subjects = [];
    snapshot.forEach((d) => subjects.push({ id: d.id, ...d.data() }));
    return subjects;
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    return [];
  }
}

export async function updateSubject(subjectId, updateData) {
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);
  await updateDoc(docRef, updateData);
}

export async function deleteSubject(subjectId) {
  const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);
  await deleteDoc(docRef);
}
