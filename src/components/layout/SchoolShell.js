'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCog,
  Calendar,
  Wallet,
  Receipt,
  BarChart3,
  FileBadge,
  UserPlus,
  ClipboardList,
  ChevronDown,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

// Nav is grouped into small labeled sections rather than one flat list --
// this is the structural rhythm that replaces "depth via gradient": clear
// grouping, hairline dividers, and one active-state fill in the school's
// own brand color.
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/school/dashboard', icon: LayoutDashboard, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'TEACHER'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { name: 'Classes', href: '/school/classes', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'RECEPTIONIST'] },
      { name: 'My Classes', href: '/school/teacher/classes', icon: BookOpen, roles: ['TEACHER'] },
      { name: 'Schedule', href: '/school/teacher/schedule', icon: Calendar, roles: ['TEACHER'] },
      { name: 'Grading', href: '/school/teacher/grading', icon: ClipboardList, roles: ['TEACHER'] },
      { name: 'Subjects', href: '/school/academic/subjects', icon: BookOpen, roles: ['SCHOOL_ADMIN'] },
      { name: 'Timetable', href: '/school/academic/timetable', icon: Calendar, roles: ['SCHOOL_ADMIN'] },
      { name: 'Sessions', href: '/school/sessions', icon: Calendar, roles: ['SCHOOL_ADMIN'] },
    ],
  },
  {
    label: 'Students',
    items: [
      { name: 'All Students', href: '/school/students', icon: Users, roles: ['SCHOOL_ADMIN', 'RECEPTIONIST'] },
      { name: 'Admissions', href: '/school/students/admission', icon: UserPlus, roles: ['SCHOOL_ADMIN', 'RECEPTIONIST'] },
      { name: 'Certificates', href: '/school/students/certificates', icon: FileBadge, roles: ['SCHOOL_ADMIN', 'RECEPTIONIST'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { name: 'Fee Management', href: '/school/fees', icon: Wallet, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      { name: 'Expenses', href: '/school/accounting/expenses', icon: Receipt, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      { name: 'Financial Summary', href: '/school/accounting/summary', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
      { name: 'Reports', href: '/school/reports', icon: BarChart3, roles: ['SCHOOL_ADMIN', 'ACCOUNTANT'] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Staff', href: '/school/staff', icon: UserCog, roles: ['SCHOOL_ADMIN'] },
    ],
  },
];

const ROLE_LABEL = {
  SCHOOL_ADMIN: 'School Admin',
  ACCOUNTANT: 'Accountant',
  RECEPTIONIST: 'Receptionist',
  TEACHER: 'Teacher',
};

function initialsFor(email) {
  if (!email) return '??';
  const name = email.split('@')[0];
  return name.slice(0, 2).toUpperCase();
}

import { getSessions } from '@/firebase/db/academic';

export default function SchoolShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, schoolId, logout } = useAuth();

  useEffect(() => {
    if (schoolId) {
      getSessions(schoolId).then((sessionsData) => {
        const current = sessionsData.find((s) => s.isCurrent);
        setActiveSession(current || sessionsData[0] || null);
      });
    }
  }, [schoolId]);

  const sections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  const activeItem = sections
    .flatMap((s) => s.items)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--app-bg)' }}>
      {/* Sidebar Navigation -- solid ink fill, same structural family as SuperAdminShell */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '76px',
          flexShrink: 0,
          backgroundColor: 'var(--ink-900)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-fast)',
          zIndex: 40,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
        }}
        className="school-shell-sidebar"
      >
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          minHeight: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.375rem',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              <GraduationCap size={20} />
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9375rem', color: '#ffffff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  School Portal
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>{ROLE_LABEL[role] || 'Staff'}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Collapse sidebar"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          {sections.map((section) => (
            <div key={section.label} style={{ marginBottom: '1.25rem' }}>
              {sidebarOpen && (
                <div className="eyebrow" style={{ color: 'rgba(255,255,255,0.4)', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
                  {section.label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={!sidebarOpen ? item.name : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.5625rem 0.75rem',
                        borderRadius: '0.375rem',
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.62)',
                        backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.8125rem',
                        transition: 'all var(--transition-fast)',
                        textDecoration: 'none',
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      }}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info Footer */}
        <div style={{
          padding: '0.875rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '0.375rem',
              backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
            }}>
              {initialsFor(currentUser?.email)}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {currentUser?.email || 'User'}
                </div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                padding: '0.375rem', borderRadius: '0.375rem', display: 'flex', flexShrink: 0,
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Page Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          height: '64px',
          backgroundColor: 'var(--surface-bg)',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
            >
              <Menu size={19} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeItem?.name || 'School Portal'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
            {activeSession && (
              <span style={{
                fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem',
                borderRadius: '9999px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)',
                display: 'flex', alignItems: 'center', gap: '0.375rem', border: '1px solid rgba(5, 150, 105, 0.2)'
              }}>
                <Calendar size={14} /> Session: {activeSession.name}
              </span>
            )}
            <span style={{
              fontSize: '0.6875rem', fontWeight: 600, padding: '0.25rem 0.625rem',
              borderRadius: '9999px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
              textTransform: 'uppercase', letterSpacing: '0.03em',
            }}>
              {ROLE_LABEL[role] || 'Staff'}
            </span>
            <div style={{
              width: '2rem', height: '2rem', borderRadius: '0.375rem',
              backgroundColor: 'var(--primary-color)', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem',
            }}>
              {initialsFor(currentUser?.email)}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
