'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/common/Button';

// Route segment label dictionary
const ROUTE_LABELS = {
  'students': 'Students',
  'admission': 'Admission',
  'certificates': 'Certificates',
  'classes': 'Classes',
  'academic': 'Academics',
  'subjects': 'Subjects',
  'timetable': 'Timetable',
  'sessions': 'Academic Sessions',
  'fees': 'Fee Management',
  'accounting': 'Accounting',
  'expenses': 'Expenses',
  'summary': 'Financial Summary',
  'reports': 'Reports Hub',
  'due-fees': 'Due Fees Report',
  'collections': 'Fee Collections Report',
  'staff': 'Staff Management',
  'settings': 'School Settings',
  'teacher': 'Teacher Portal',
  'schedule': 'Schedule',
  'grading': 'Grading',
};

function getSchoolBreadcrumbs(pathname) {
  if (!pathname || pathname === '/school' || pathname === '/school/dashboard' || pathname === '/school/dashboard/') {
    return { breadcrumbs: [], parentHref: '/school/dashboard' };
  }

  const segments = pathname.split('/').filter(Boolean);
  const schoolSegments = segments[0] === 'school' ? segments.slice(1) : segments;

  const crumbs = [
    { label: 'Dashboard', href: '/school/dashboard' }
  ];

  let currentPath = '/school';

  for (let i = 0; i < schoolSegments.length; i++) {
    const seg = schoolSegments[i];
    currentPath += `/${seg}`;

    // Skip unroutable internal grouping subdirectories
    if (seg === 'academic' || seg === 'accounting' || seg === 'teacher') {
      continue;
    }

    let label = ROUTE_LABELS[seg];

    if (!label) {
      if (schoolSegments[i - 1] === 'students') {
        label = 'Student Profile';
      } else if (schoolSegments[i - 1] === 'classes') {
        label = 'Class Details';
      } else {
        label = seg.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }
    } else {
      if (schoolSegments[i - 1] === 'reports' && seg === 'students') {
        label = 'Student List Report';
      } else if (schoolSegments[i - 1] === 'reports' && seg === 'expenses') {
        label = 'Expense Audit Report';
      }
    }

    crumbs.push({
      label,
      href: currentPath
    });
  }

  const parentHref = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : '/school/dashboard';

  return { breadcrumbs: crumbs, parentHref };
}

export default function SchoolSimpleLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === '/school/dashboard' || pathname === '/school/dashboard/' || pathname === '/school';
  const { breadcrumbs, parentHref } = getSchoolBreadcrumbs(pathname);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--app-bg)',
      borderTop: '4px solid var(--primary-color)',
      padding: '1.5rem 1.5rem 2.5rem 1.5rem'
    }}>
      {!isDashboard && (
        <div style={{
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.625rem 1rem',
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid var(--surface-border, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexWrap: 'wrap' }}>
            <Button 
              variant="outline" 
              icon={ArrowLeft} 
              href={parentHref}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.84375rem', height: '2.125rem' }}
            >
              Back
            </Button>

            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.84375rem', color: 'var(--text-muted)' }}>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.href || idx}>
                    {idx > 0 && <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                    {isLast ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {crumb.label}
                      </span>
                    ) : (
                      <Link
                        href={crumb.href}
                        style={{
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          fontWeight: 500,
                          transition: 'color var(--transition-fast)',
                        }}
                        className="hover:text-[var(--primary-color)]"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}


