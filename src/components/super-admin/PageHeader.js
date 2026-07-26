'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function PageHeader({ title, subtitle, actions, breadcrumbs }) {
  const pathname = usePathname();

  // Generate fallback breadcrumbs if not explicitly provided
  const pathSegments = pathname.split('/').filter(Boolean);
  const defaultBreadcrumbs = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return { label, href };
  });

  const activeBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        marginBottom: '0.5rem'
      }}
    >
      {/* Breadcrumb Trail (UX §17) */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)'
        }}
      >
        <Link
          href="/super-admin/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color var(--transition-fast)'
          }}
        >
          <Home size={14} />
          <span>Super Admin</span>
        </Link>

        {activeBreadcrumbs.map((crumb, idx) => {
          const isLast = idx === activeBreadcrumbs.length - 1;
          if (crumb.label.toLowerCase() === 'super admin') return null;

          return (
            <React.Fragment key={crumb.href || idx}>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              {isLast ? (
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none'
                  }}
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Main Header & Actions (UX §1 & §8) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9375rem',
                marginTop: '0.375rem'
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
