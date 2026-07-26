'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  Shield,
  DollarSign,
  Calendar,
  BookOpen,
  UserPlus,
  FileText,
  FileBadge,
  BarChart3,
  UserCog,
  LogOut,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  CreditCard,
  ArrowRight,
  ExternalLink,
  Receipt,
  Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getClasses, getActiveSession } from '@/firebase/db/academic';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getPendingFees, getMonthlyCollection, getInvoices } from '@/firebase/db/fees';
import { getSchoolById } from '@/firebase/db/schools';
import { getAllUsers } from '@/firebase/db/users';
import { getTodayAttendanceRate } from '@/firebase/db/attendance';
import TeacherDashboard from './TeacherDashboard';

export default function SchoolDashboard() {
  const { currentUser, role, schoolId, logout } = useAuth();
  const router = useRouter();

  const [classesCount, setClassesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [attendanceData, setAttendanceData] = useState({ rate: null, presentCount: 0, totalCount: 0, taken: false });
  const [pendingFees, setPendingFees] = useState(0);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [currency, setCurrency] = useState('USD');

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [classesMap, setClassesMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    let d = dateVal;
    if (dateVal?.toDate) d = dateVal.toDate();
    else if (dateVal?.seconds) d = new Date(dateVal.seconds * 1000);
    else if (typeof dateVal === 'string' || typeof dateVal === 'number') d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const fetchDashboardData = useCallback(async () => {
    if (!schoolId || role === 'TEACHER') return;

    setLoading(true);
    setError(null);

    try {
      const [
        classes,
        students,
        users,
        attendance,
        pending,
        collection,
        currentSession,
        school,
        invoicesData
      ] = await Promise.all([
        getClasses(schoolId),
        getStudentsBySchool(schoolId),
        getAllUsers(schoolId),
        getTodayAttendanceRate(schoolId),
        getPendingFees(schoolId),
        getMonthlyCollection(schoolId),
        getActiveSession(schoolId),
        getSchoolById(schoolId),
        role === 'ACCOUNTANT' ? getInvoices(schoolId) : Promise.resolve([])
      ]);

      const cMap = {};
      (classes || []).forEach(c => { cMap[c.id] = c.name; });
      setClassesMap(cMap);

      setClassesCount(classes?.length || 0);
      setStudentsCount(students?.length || 0);
      setStudentsList(students || []);
      setRecentInvoices((invoicesData || []).slice(0, 5));

      // Calculate active staff count (all non-student users with active status)
      const staffMembers = (users || []).filter(
        (u) => u.role !== 'STUDENT' && u.role !== 'PARENT' && (u.status === 'ACTIVE' || !u.status)
      );
      setStaffCount(staffMembers.length);

      setAttendanceData(attendance || { rate: null, presentCount: 0, totalCount: 0, taken: false });
      setPendingFees(pending || 0);
      setMonthlyCollection(collection || 0);
      setActiveSession(currentSession);
      setSchoolInfo(school);
      setCurrency(school?.config?.currency || 'USD');
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to load school dashboard metrics. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [schoolId, role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  if (role === 'TEACHER') {
    return <TeacherDashboard />;
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const ActionCard = ({ icon: Icon, label, color, onClick }) => (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        height: '100%',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
      className="action-card-hover"
    >
      <Card
        hoverable
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.125rem',
          padding: '1.25rem 1.5rem',
          height: '100%',
          minHeight: '4.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid rgba(226, 232, 240, 0.75)',
          boxShadow: '0 6px 20px -4px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
          borderRadius: '1rem'
        }}
      >
        <div
          style={{
            backgroundColor: `${color}15`,
            color: color,
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontSize: '0.9375rem',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {label}
          </div>
        </div>
      </Card>
    </div>
  );

  const showStudentKpi = ['SCHOOL_ADMIN', 'RECEPTIONIST'].includes(role);
  const showClassesKpi = ['SCHOOL_ADMIN', 'RECEPTIONIST'].includes(role);
  const showCollectionKpi = ['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role);
  const showPendingKpi = ['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role);

  const studentsMap = {};
  (studentsList || []).forEach(s => {
    studentsMap[s.id] = s.personalInfo?.fullName || s.name || s.id;
  });

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/80 to-indigo-50/40 border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          {/* Subtle Decorative Background Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Left Info: Icon Avatar + School Info + Greeting */}
            <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[var(--primary-color)] to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                {schoolInfo?.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </div>

              <div className="flex flex-col gap-1 min-w-0">
                {/* Greeting */}
                <div className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1.5">
                  <span>{getTimeGreeting()},</span>
                  <strong className="text-slate-900 font-semibold">
                    {currentUser?.displayName || currentUser?.name || currentUser?.email || 'User'}
                  </strong>
                  <span>👋</span>
                </div>

                {/* School Name */}
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate leading-tight">
                  {schoolInfo?.name || 'School Dashboard'}
                </h1>

                {/* Badges Pill Row */}
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <Badge variant="success" icon={Shield} className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                    {role?.replace('_', ' ') || 'STAFF'}
                  </Badge>
                  {activeSession && (
                    <Badge variant="info" icon={Clock} className="text-[11px] font-medium px-2.5 py-0.5">
                      Active Session: {activeSession.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Bar */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
              {['SCHOOL_ADMIN'].includes(role) && (
                <Button variant="primary" icon={BookOpen} onClick={() => router.push('/school/classes')} className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2">
                  Manage Classes
                </Button>
              )}
              {['SCHOOL_ADMIN'].includes(role) && (
                <Button variant="outline" icon={Sparkles} onClick={() => router.push('/school/sessions')} className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2">
                  Academic Sessions
                </Button>
              )}
              {role === 'ACCOUNTANT' && (
                <Button variant="primary" icon={CreditCard} onClick={() => router.push('/school/fees?tab=collection')} className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2">
                  Fee Collection
                </Button>
              )}
              {role === 'RECEPTIONIST' && (
                <Button variant="primary" icon={UserPlus} onClick={() => router.push('/school/students/admission')} className="w-full sm:w-auto justify-center text-xs sm:text-sm py-2">
                  Admit Student
                </Button>
              )}
              <Button variant="outline" icon={LogOut} onClick={() => setShowLogoutModal(true)} className="col-span-2 sm:col-span-1 w-full sm:w-auto justify-center text-xs sm:text-sm py-2 text-slate-600 hover:text-rose-600 hover:border-rose-200">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <Card style={{ padding: '1.25rem', backgroundColor: 'var(--status-danger-bg)', borderColor: 'var(--status-danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--status-danger)' }}>
                <AlertCircle size={22} />
                <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{error}</span>
              </div>
              <Button variant="outline" icon={RefreshCw} onClick={fetchDashboardData}>
                Retry Data Load
              </Button>
            </div>
          </Card>
        )}

        {/* Concise KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* KPI 1: Total Students */}
          {showStudentKpi && (
            <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Students</div>
                {loading ? (
                  <div style={{ height: '1.5rem', width: '60px', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', marginTop: '0.25rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ) : (
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem', lineHeight: 1.2 }}>{studentsCount}</div>
                )}
              </div>
            </Card>
          )}

          {/* KPI 2: Active Classes */}
          {showClassesKpi && (
            <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Active Classes</div>
                {loading ? (
                  <div style={{ height: '1.5rem', width: '60px', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', marginTop: '0.25rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ) : (
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.125rem', lineHeight: 1.2 }}>{classesCount}</div>
                )}
              </div>
            </Card>
          )}

          {/* KPI 3: Collection (Month) */}
          {showCollectionKpi && (
            <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Collection (Month)</div>
                {loading ? (
                  <div style={{ height: '1.5rem', width: '80px', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', marginTop: '0.25rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ) : (
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.125rem', lineHeight: 1.2 }}>{formatCurrency(monthlyCollection)}</div>
                )}
              </div>
            </Card>
          )}

          {/* KPI 4: Pending Fees */}
          {showPendingKpi && (
            <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', borderRadius: '0.875rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02)' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Pending Fees</div>
                {loading ? (
                  <div style={{ height: '1.5rem', width: '80px', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', marginTop: '0.25rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ) : (
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.125rem', lineHeight: 1.2 }}>{formatCurrency(pendingFees)}</div>
                )}
              </div>
            </Card>
          )}

        </div>

        {/* Quick Actions Section */}
        {role === 'SCHOOL_ADMIN' ? (
          /* Multi-Category Admin View (Unchanged 3 Categories with Labels) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                Academic Administration
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem 1.25rem' }}>
                <ActionCard
                  icon={BookOpen}
                  label="Manage Classes"
                  color="#3b82f6"
                  onClick={() => router.push('/school/classes')}
                />
                <ActionCard
                  icon={BookOpen}
                  label="Subject Catalog"
                  color="#8b5cf6"
                  onClick={() => router.push('/school/academic/subjects')}
                />
                <ActionCard
                  icon={Calendar}
                  label="Master Timetable"
                  color="#0ea5e9"
                  onClick={() => router.push('/school/academic/timetable')}
                />
                <ActionCard
                  icon={Sparkles}
                  label="Academic Sessions"
                  color="#6366f1"
                  onClick={() => router.push('/school/sessions')}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                Students & Faculty
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem 1.25rem' }}>
                <ActionCard
                  icon={UserPlus}
                  label="Admit Student"
                  color="#10b981"
                  onClick={() => router.push('/school/students/admission')}
                />
                <ActionCard
                  icon={Users}
                  label="Student Directory"
                  color="#14b8a6"
                  onClick={() => router.push('/school/students')}
                />
                <ActionCard
                  icon={UserCog}
                  label="Manage Staff"
                  color="#6366f1"
                  onClick={() => router.push('/school/staff')}
                />
                <ActionCard
                  icon={FileBadge}
                  label="Certificates"
                  color="#f59e0b"
                  onClick={() => router.push('/school/students/certificates')}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
                Financial Operations
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem 1.25rem' }}>
                <ActionCard
                  icon={CreditCard}
                  label="Fee Collection"
                  color="#ef4444"
                  onClick={() => router.push('/school/fees?tab=collection')}
                />
                <ActionCard
                  icon={FileText}
                  label="Manage Expenses"
                  color="#f43f5e"
                  onClick={() => router.push('/school/accounting/expenses')}
                />
                <ActionCard
                  icon={BarChart3}
                  label="Reports Hub"
                  color="#10b981"
                  onClick={() => router.push('/school/reports')}
                />
                <ActionCard
                  icon={FileText}
                  label="Financial Summary"
                  color="#84cc16"
                  onClick={() => router.push('/school/accounting/summary')}
                />
              </div>
            </div>
          </div>
        ) : role === 'ACCOUNTANT' ? (
          /* Framed Single-Category View for Accountant (No uppercase category label) */
          <Card style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-color)' }} />
                Quick Actions
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <ActionCard
                icon={CreditCard}
                label="Fee Collection"
                color="#ef4444"
                onClick={() => router.push('/school/fees?tab=collection')}
              />
              <ActionCard
                icon={FileText}
                label="Manage Expenses"
                color="#f43f5e"
                onClick={() => router.push('/school/accounting/expenses')}
              />
              <ActionCard
                icon={BarChart3}
                label="Reports Hub"
                color="#10b981"
                onClick={() => router.push('/school/reports')}
              />
              <ActionCard
                icon={FileText}
                label="Financial Summary"
                color="#84cc16"
                onClick={() => router.push('/school/accounting/summary')}
              />
            </div>
          </Card>
        ) : (
          /* Framed Single-Category View for Receptionist (No uppercase category label) */
          <Card style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-color)' }} />
                Quick Actions
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <ActionCard
                icon={UserPlus}
                label="Admit Student"
                color="#10b981"
                onClick={() => router.push('/school/students/admission')}
              />
              <ActionCard
                icon={Users}
                label="Student Directory"
                color="#14b8a6"
                onClick={() => router.push('/school/students')}
              />
              <ActionCard
                icon={FileBadge}
                label="Certificates"
                color="#f59e0b"
                onClick={() => router.push('/school/students/certificates')}
              />
            </div>
          </Card>
        )}

        {/* Role-Relevant Supporting Content below Quick Actions */}

        {/* ACCOUNTANT SUPPORTING WIDGET */}
        {role === 'ACCOUNTANT' && (
          <Card style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Recent Invoices & Transactions
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Latest fee records and payment status
                </p>
              </div>
              <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => router.push('/school/fees')}>
                View All Invoices
              </Button>
            </div>

            {loading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent transactions...</div>
            ) : recentInvoices.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed rgba(226, 232, 240, 0.95)' }}>
                <Receipt size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>No recent invoices recorded</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>Generate invoices or collect payments to view recent activity here.</div>
                <Button variant="primary" icon={CreditCard} onClick={() => router.push('/school/fees?tab=collection')}>
                  Fee Collection
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.95)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Invoice #</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student / Type</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Month</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv) => {
                      const studentName = studentsMap[inv.studentId] || 'Student Record';
                      const statusVariant = inv.status === 'PAID' ? 'success' : inv.status === 'PARTIAL' ? 'warning' : 'danger';
                      return (
                        <tr key={inv.id || inv.invoiceId} style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.95)' }}>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {inv.invoiceNumber || inv.id}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{studentName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.feeType || 'Tuition'}</div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                            {inv.feeMonth || 'Current'}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {formatCurrency(inv.payableAmount || inv.amount)}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <Badge variant={statusVariant} style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                              {inv.status || 'UNPAID'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                            <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => router.push('/school/fees')}>
                              Manage
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* RECEPTIONIST SUPPORTING WIDGET */}
        {role === 'RECEPTIONIST' && (
          <Card style={{ padding: '1.5rem', borderRadius: '1rem', backgroundColor: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.95)', boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.04)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Recent Admissions & Student Activity
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Newly registered students and active directory entries
                </p>
              </div>
              <Button variant="outline" icon={ArrowRight} iconPosition="right" onClick={() => router.push('/school/students')}>
                Open Student Directory
              </Button>
            </div>

            {loading ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent admissions...</div>
            ) : studentsList.length === 0 ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed rgba(226, 232, 240, 0.95)' }}>
                <Users size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>No student admissions found</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1rem' }}>Admit new students to manage directory records here.</div>
                <Button variant="primary" icon={UserPlus} onClick={() => router.push('/school/students/admission')}>
                  Admit Student
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.95)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Admission #</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Class</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Admission Date</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsList.slice(0, 5).map((st) => {
                      const fullName = st.personalInfo?.fullName || st.name || 'Unnamed Student';
                      const className = classesMap[st.classId] || st.classId || 'Unassigned';
                      const statusName = st.academicDetails?.status || st.status || 'ACTIVE';
                      return (
                        <tr key={st.id || st.studentId} style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.95)' }}>
                          <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {st.admissionNumber || st.id}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.parentInfo?.fatherName ? `Father: ${st.parentInfo.fatherName}` : 'Student Record'}</div>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                            {className}
                          </td>
                          <td style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)' }}>
                            {formatDate(st.admissionDate || st.createdAt)}
                          </td>
                          <td style={{ padding: '0.875rem 1rem' }}>
                            <Badge variant="success" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                              {statusName}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                            <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => router.push(`/school/students/${st.id}`)}>
                              Profile
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Confirmation Modal for Sign Out */}
        <ConfirmationModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
          title="Confirm Sign Out"
          description="Are you sure you want to sign out of the School Management Portal? Any unsaved changes may be lost."
          confirmText="Sign Out"
          cancelText="Cancel"
          variant="warning"
          isLoading={loggingOut}
        />

      </div>
    </ProtectedRoute>
  );
}