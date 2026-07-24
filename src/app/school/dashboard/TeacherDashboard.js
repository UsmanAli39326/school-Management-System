'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getSubjectsForTeacher } from '@/firebase/db/academic';
import { getSchedulesForTeacher } from '@/firebase/db/schedules';
import { BookOpen, Calendar, Clock, CheckCircle, GraduationCap } from 'lucide-react';

export default function TeacherDashboard() {
  const { currentUser, role, schoolId } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadData();
    }
  }, [schoolId, currentUser]);

  const loadData = async () => {
    setLoading(true);
    // Note: currentUser.uid might not match the teacherId if teacherId was random, 
    // but in a real app we'd map uid to teacherId. Let's assume we can fetch by currentUser.uid.
    const fetchedSubjects = await getSubjectsForTeacher(schoolId, currentUser.uid);
    const fetchedSchedules = await getSchedulesForTeacher(schoolId, currentUser.uid);
    setSubjects(fetchedSubjects);
    setSchedules(fetchedSchedules);
    setLoading(false);
  };

  const getTodaySchedule = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return schedules
      .filter(s => s.dayOfWeek === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const todaySchedule = getTodaySchedule();

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <div>
          <span className="eyebrow">Overview</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
            <h1 style={{ fontSize: '1.5rem' }}>Teacher Dashboard</h1>
            <Badge variant="success" icon={CheckCircle}>{role}</Badge>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Welcome back, {currentUser?.displayName || currentUser?.name || currentUser?.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <Card accentRule style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Assigned Subjects</span>
            <BookOpen size={17} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600 }}>{loading ? '—' : subjects.length}</div>
        </Card>

        <Card accentRule style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Classes Today</span>
            <Clock size={17} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600 }}>{loading ? '—' : todaySchedule.length}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Today's Timetable */}
        <div>
          <span className="eyebrow">Schedule</span>
          <h2 style={{ fontSize: '1.125rem', marginTop: '0.25rem', marginBottom: '1rem' }}>Today's Classes</h2>
          <Card style={{ padding: '1.5rem' }}>
            {loading ? (
              <p>Loading...</p>
            ) : todaySchedule.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                You have no classes scheduled for today.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {todaySchedule.map(sch => {
                  const subject = subjects.find(s => s.id === sch.subjectId);
                  return (
                    <div key={sch.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--surface-border)', borderRadius: '0.5rem' }}>
                      <div style={{ flexShrink: 0, fontWeight: 600, color: 'var(--text-primary)', width: '100px' }}>
                        {sch.startTime}
                      </div>
                      <div style={{ width: '4px', height: '2rem', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{subject ? subject.name : 'Unknown Subject'}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Class ID: {sch.classId}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <span className="eyebrow">Shortcuts</span>
          <h2 style={{ fontSize: '1.125rem', marginTop: '0.25rem', marginBottom: '1rem' }}>Quick Actions</h2>
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button variant="outline" icon={GraduationCap} onClick={() => router.push('/school/teacher/grading')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                Enter Grades / Marks
              </Button>
              <Button variant="outline" icon={Calendar} onClick={() => router.push('/school/teacher/schedule')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                My Full Schedule
              </Button>
              <Button variant="outline" icon={BookOpen} onClick={() => router.push('/school/teacher/classes')} style={{ width: '100%', justifyContent: 'flex-start' }}>
                My Classes & Students
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
