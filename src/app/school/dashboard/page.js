'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Users, Shield, LogOut, DollarSign, Calendar, BookOpen, UserPlus, FileText, FileBadge, BarChart3, UserCog } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getClasses } from '@/firebase/db/academic';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getPendingFees, getMonthlyCollection } from '@/firebase/db/fees';
import TeacherDashboard from './TeacherDashboard';

export default function SchoolDashboard() {
  const { currentUser, role, schoolId, logout } = useAuth();
  const router = useRouter();

  const [classesCount, setClassesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId && role !== 'TEACHER') {
      Promise.all([
        getClasses(schoolId),
        getStudentsBySchool(schoolId),
        getPendingFees(schoolId),
        getMonthlyCollection(schoolId)
      ]).then(([classes, students, pending, collection]) => {
        setClassesCount(classes.length);
        setStudentsCount(students.length);
        setPendingFees(pending);
        setMonthlyCollection(collection);
        setLoading(false);
      });
    }
  }, [schoolId, role]);

  if (role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <h1>School Dashboard</h1>
              <Badge variant="success" icon={Shield}>{role || 'STAFF'}</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Logged in as {currentUser?.email || 'User'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'].includes(role) && (
              <Button variant="primary" icon={BookOpen} onClick={() => router.push('/school/classes')}>
                Manage Classes
              </Button>
            )}
            {['SCHOOL_ADMIN'].includes(role) && (
              <Button variant="secondary" icon={Calendar} onClick={() => router.push('/school/sessions')}>
                Sessions
              </Button>
            )}
            <Button variant="outline" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

          <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Students</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : studentsCount}</div>
            </div>
          </Card>

          <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem', height: '3rem', borderRadius: '0.75rem',
              backgroundColor: 'var(--secondary-light)', color: 'var(--secondary-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Classes</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : classesCount}</div>
            </div>
          </Card>

          {['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role) && (
            <>
              <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  backgroundColor: '#dcfce7', color: '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Collection (This Month)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : monthlyCollection.toLocaleString()}</div>
                </div>
              </Card>

              <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '3rem', height: '3rem', borderRadius: '0.75rem',
                  backgroundColor: '#fee2e2', color: '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Pending Fees</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{loading ? '...' : pendingFees.toLocaleString()}</div>
                </div>
              </Card>
            </>
          )}
        </div>

        <h2>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>

          {/* Admin Only Actions */}
          {['SCHOOL_ADMIN'].includes(role) && (
            <>
              <Button variant="outline" icon={BookOpen} onClick={() => router.push('/school/classes')}>
                Manage Classes
              </Button>
              <Button variant="outline" icon={BookOpen} onClick={() => router.push('/school/academic/subjects')}>
                Manage Subjects
              </Button>
              <Button variant="outline" icon={Calendar} onClick={() => router.push('/school/academic/timetable')}>
                Timetable
              </Button>
              <Button variant="outline" icon={UserCog} onClick={() => router.push('/school/staff')}>
                Manage Staff
              </Button>
            </>
          )}

          {/* Admission & Student Management */}
          {['SCHOOL_ADMIN', 'RECEPTIONIST'].includes(role) && (
            <>
              <Button variant="outline" icon={UserPlus} onClick={() => router.push('/school/students/admission')}>
                Admit Student
              </Button>
              <Button variant="outline" icon={FileBadge} onClick={() => router.push('/school/students/certificates')}>
                Certificates
              </Button>
            </>
          )}

          {/* Accounting Actions */}
          {['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role) && (
            <>
              <Button variant="outline" icon={FileText} onClick={() => router.push('/school/fees/collection')}>
                Collect Fee
              </Button>
              <Button variant="outline" icon={FileText} onClick={() => router.push('/school/accounting/expenses')}>
                Manage Expenses
              </Button>
              <Button variant="outline" icon={BarChart3} onClick={() => router.push('/school/reports')}>
                Reports Hub
              </Button>
              <Button variant="outline" icon={FileText} onClick={() => router.push('/school/accounting/summary')}>
                Financial Summary
              </Button>
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}