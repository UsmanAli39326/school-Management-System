'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { getSchedulesForTeacher } from '@/firebase/db/schedules';
import { getSubjectsForTeacher, getClasses } from '@/firebase/db/academic';
import { Calendar, Clock, Inbox, Sparkles } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherSchedulePage() {
  const { currentUser, schoolId } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classesMap, setClassesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('ALL');

  const todayDayName = DAYS_OF_WEEK[new Date().getDay() - 1] || 'Monday';

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadSchedule();
    }
  }, [schoolId, currentUser]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      const [fetchedSchedules, fetchedSubjects, fetchedClasses] = await Promise.all([
        getSchedulesForTeacher(schoolId, currentUser.uid),
        getSubjectsForTeacher(schoolId, currentUser.uid),
        getClasses(schoolId)
      ]);
      setSchedules(fetchedSchedules);
      setSubjects(fetchedSubjects);

      const cmap = {};
      (fetchedClasses || []).forEach((c) => { cmap[c.id] = c.name; });
      setClassesMap(cmap);
    } catch (err) {
      console.error('Error fetching teacher schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSchedulesForDay = (day) => {
    return (schedules || [])
      .filter((s) => s && s.dayOfWeek === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const activeDaysToRender = selectedDay === 'ALL' ? DAYS_OF_WEEK : [selectedDay];

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Teaching Schedule</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Personal weekly timetable across all assigned subject classes</p>
        </div>

        {/* Day Filter Pills */}
        <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-none gap-2 items-center">
          <button
            onClick={() => setSelectedDay('ALL')}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.84375rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: selectedDay === 'ALL' ? 'var(--primary-color)' : 'var(--surface-border)',
              backgroundColor: selectedDay === 'ALL' ? 'var(--primary-color)' : 'var(--surface-card)',
              color: selectedDay === 'ALL' ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            All Days
          </button>
          {DAYS_OF_WEEK.map((day) => {
            const isToday = day === todayDayName;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.84375rem',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--primary-color)' : 'var(--surface-border)',
                  backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--surface-card)',
                  color: isSelected ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {day} {isToday && '• Today'}
              </button>
            );
          })}
        </div>

        {/* Schedule Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '160px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
            <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Teaching Schedules Configured</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              You have no class periods scheduled. Contact the school administrator to configure your master timetable.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDaysToRender.map((day) => {
              const daySchedules = getSchedulesForDay(day);
              if (daySchedules.length === 0 && selectedDay !== 'ALL') {
                return (
                  <Card key={day} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No periods scheduled for {day}.
                  </Card>
                );
              }
              if (daySchedules.length === 0) return null;

              const isToday = day === todayDayName;

              return (
                <Card
                  key={day}
                  style={{
                    padding: '1.5rem',
                    borderTop: isToday ? '4px solid var(--primary-color)' : '1px solid var(--surface-border)',
                    height: '100%'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: isToday ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                      <Calendar size={18} />
                      {day}
                    </h3>
                    {isToday && <Badge variant="primary" icon={Sparkles}>TODAY</Badge>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {daySchedules.map((sch) => {
                      const subject = subjects.find((s) => s.id === sch.subjectId);
                      const className = classesMap[sch.classId] || 'Class';

                      return (
                        <div
                          key={sch.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--surface-hover)',
                            borderRadius: '0.625rem'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary-color)', minWidth: '55px' }}>
                            <Clock size={16} style={{ marginBottom: '0.25rem' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{sch.startTime}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sch.endTime}</span>
                          </div>

                          <div style={{ width: '2px', alignSelf: 'stretch', backgroundColor: 'var(--surface-border)' }} />

                          <div>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                              {subject?.name || 'Assigned Subject'}
                            </div>
                            <div style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              Class: <strong>{className}</strong> {sch.roomNumber && `• Room ${sch.roomNumber}`}
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
