'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { getSchedulesForTeacher } from '@/firebase/db/schedules';
import { getSubjectsForTeacher } from '@/firebase/db/academic';
import { Calendar, Clock } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherSchedulePage() {
  const { currentUser, schoolId } = useAuth();
  
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadSchedule();
    }
  }, [schoolId, currentUser]);

  const loadSchedule = async () => {
    setLoading(true);
    const [fetchedSchedules, fetchedSubjects] = await Promise.all([
      getSchedulesForTeacher(schoolId, currentUser.uid),
      getSubjectsForTeacher(schoolId, currentUser.uid)
    ]);
    setSchedules(fetchedSchedules);
    setSubjects(fetchedSubjects);
    setLoading(false);
  };

  const getSchedulesForDay = (day) => {
    return schedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1>My Schedule</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Your weekly timetable across all assigned classes</p>
        </div>

        {loading ? (
          <p>Loading schedule...</p>
        ) : schedules.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            You have no classes scheduled. If you believe this is an error, please contact the administrator.
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {DAYS_OF_WEEK.map(day => {
              const daySchedules = getSchedulesForDay(day);
              if (daySchedules.length === 0) return null;

              return (
                <Card key={day} style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                    <Calendar size={18} />
                    {day}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {daySchedules.map(sch => {
                      const subject = subjects.find(s => s.id === sch.subjectId);
                      return (
                        <div key={sch.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)', minWidth: '45px' }}>
                            <Clock size={16} style={{ marginBottom: '0.25rem' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sch.startTime}</span>
                          </div>
                          <div style={{ width: '2px', alignSelf: 'stretch', backgroundColor: 'var(--surface-border)' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{subject?.name || 'Unknown Subject'}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              Class ID: {sch.classId} {sch.sectionId ? `(Sec: ${sch.sectionId})` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
