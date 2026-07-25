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

const SCHEDULES_COLLECTION = 'schedules';

/**
 * Create a new schedule entry
 */
export async function createSchedule(schoolId, scheduleData) {
  const scheduleId = scheduleData.scheduleId || `sch_${Date.now()}`;
  const docRef = doc(db, SCHEDULES_COLLECTION, scheduleId);

  const newSchedule = {
    scheduleId,
    schoolId,
    classId: scheduleData.classId,
    sectionId: scheduleData.sectionId || null,
    subjectId: scheduleData.subjectId,
    teacherId: scheduleData.teacherId,
    dayOfWeek: scheduleData.dayOfWeek, // e.g. "Monday"
    startTime: scheduleData.startTime, // e.g. "09:00"
    endTime: scheduleData.endTime,     // e.g. "09:45"
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, newSchedule);
  return { id: scheduleId, ...newSchedule };
}

/**
 * Get schedules for a specific class
 */
export async function getSchedulesForClass(schoolId, classId) {
  try {
    const q = query(
      collection(db, SCHEDULES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId)
    );
    const snapshot = await getDocs(q);
    const schedules = [];
    snapshot.forEach((d) => schedules.push({ id: d.id, ...d.data() }));
    return schedules;
  } catch (error) {
    console.error('Error fetching schedules for class:', error);
    return [];
  }
}

/**
 * Get schedules for a specific teacher
 */
export async function getSchedulesForTeacher(schoolId, teacherId) {
  try {
    const q = query(
      collection(db, SCHEDULES_COLLECTION),
      where('schoolId', '==', schoolId),
      where('teacherId', '==', teacherId)
    );
    const snapshot = await getDocs(q);
    const schedules = [];
    snapshot.forEach((d) => schedules.push({ id: d.id, ...d.data() }));
    return schedules;
  } catch (error) {
    console.error('Error fetching teacher schedules:', error);
    return [];
  }
}

/**
 * Check if teacher has time overlap conflict on the given day
 */
export async function checkTeacherConflict(schoolId, teacherId, dayOfWeek, startTime, endTime, excludeScheduleId = null) {
  if (!teacherId) return null;
  const teacherSchedules = await getSchedulesForTeacher(schoolId, teacherId);
  
  for (const sch of teacherSchedules) {
    if (excludeScheduleId && sch.id === excludeScheduleId) continue;
    if (sch.dayOfWeek === dayOfWeek) {
      if (sch.startTime < endTime && sch.endTime > startTime) {
        return sch; // Conflict found
      }
    }
  }
  return null;
}

/**
 * Check if a class/section has a time overlap conflict on the given day
 */
export async function checkClassSectionConflict(schoolId, classId, sectionId, dayOfWeek, startTime, endTime, excludeScheduleId = null) {
  const classSchedules = await getSchedulesForClass(schoolId, classId);
  
  for (const sch of classSchedules) {
    if (excludeScheduleId && sch.id === excludeScheduleId) continue;
    if (sch.dayOfWeek === dayOfWeek) {
      const sameSection = !sectionId || !sch.sectionId || sch.sectionId === sectionId;
      if (sameSection) {
        if (sch.startTime < endTime && sch.endTime > startTime) {
          return sch; // Conflict found
        }
      }
    }
  }
  return null;
}

export async function deleteSchedule(scheduleId) {
  const docRef = doc(db, SCHEDULES_COLLECTION, scheduleId);
  await deleteDoc(docRef);
}
