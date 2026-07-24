'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, Users, Shield, DollarSign, Calendar, BookOpen, UserPlus, FileText, FileBadge, BarChart3, UserCog, LogOut } from 'lucide-react';
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

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

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

  const ActionCard = ({ icon: Icon, label, color, onClick }) => (
    <div onClick={onClick} style={{ cursor: 'pointer', height: '100%' }}>
      <Card hoverable style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem', textAlign: 'center', height: '100%', justifyContent: 'center' }}>
        <div style={{ backgroundColor: `${color}15`, color: color, padding: '1rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={28} />
        </div>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{label}</span>
      </Card>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', paddingBottom: '3rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent)',
          padding: '1.5rem',
          borderRadius: '1rem',
          border: '1px solid var(--surface-border)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.025em' }}>School Dashboard</h1>
              <Badge variant="success" icon={Shield} style={{ textTransform: 'uppercase' }}>{role?.replace('_', ' ') || 'STAFF'}</Badge>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.375rem', fontSize: '0.9375rem' }}>
              Welcome back, {currentUser?.displayName || currentUser?.name || currentUser?.email || 'User'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'].includes(role) && (
              <Button variant="primary" icon={BookOpen} onClick={() => router.push('/school/classes')}>
                Manage Classes
              </Button>
            )}
            {['SCHOOL_ADMIN'].includes(role) && (
              <Button variant="outline" icon={Calendar} onClick={() => router.push('/school/sessions')}>
                Sessions
              </Button>
            )}
            <Button variant="outline" icon={LogOut} onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Total Students</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{loading ? '—' : studentsCount}</h3>
            </div>
          </Card>

          <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Active Classes</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{loading ? '—' : classesCount}</h3>
            </div>
          </Card>

          {['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role) && (
            <>
              <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Collection (Month)</p>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', lineHeight: 1.2 }}>
                    {loading ? '—' : '$' + monthlyCollection.toLocaleString()}
                  </h3>
                </div>
              </Card>

              <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={28} />
                </div>
                <div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Pending Fees</p>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ef4444', lineHeight: 1.2 }}>
                    {loading ? '—' : '$' + pendingFees.toLocaleString()}
                  </h3>
                </div>
              </Card>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.25rem' }}>
            
            {/* Admin Only Actions */}
            {['SCHOOL_ADMIN'].includes(role) && (
              <>
                <ActionCard icon={BookOpen} label="Manage Classes" color="#3b82f6" onClick={() => router.push('/school/classes')} />
                <ActionCard icon={BookOpen} label="Manage Subjects" color="#8b5cf6" onClick={() => router.push('/school/academic/subjects')} />
                <ActionCard icon={Calendar} label="Timetable" color="#0ea5e9" onClick={() => router.push('/school/academic/timetable')} />
                <ActionCard icon={UserCog} label="Manage Staff" color="#6366f1" onClick={() => router.push('/school/staff')} />
              </>
            )}

            {/* Admission & Student Management */}
            {['SCHOOL_ADMIN', 'RECEPTIONIST'].includes(role) && (
              <>
                <ActionCard icon={UserPlus} label="Admit Student" color="#10b981" onClick={() => router.push('/school/students/admission')} />
                <ActionCard icon={FileBadge} label="Certificates" color="#f59e0b" onClick={() => router.push('/school/students/certificates')} />
              </>
            )}

            {/* Accounting Actions */}
            {['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role) && (
              <>
                <ActionCard icon={FileText} label="Collect Fee" color="#ef4444" onClick={() => router.push('/school/fees/collection')} />
                <ActionCard icon={FileText} label="Manage Expenses" color="#f43f5e" onClick={() => router.push('/school/accounting/expenses')} />
                <ActionCard icon={BarChart3} label="Reports Hub" color="#14b8a6" onClick={() => router.push('/school/reports')} />
                <ActionCard icon={FileText} label="Financial Summary" color="#84cc16" onClick={() => router.push('/school/accounting/summary')} />
              </>
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}