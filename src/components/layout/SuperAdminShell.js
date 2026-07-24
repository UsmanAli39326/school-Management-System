'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Activity,
  LogOut,
  ShieldCheck,
  Search,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

export default function SuperAdminShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
    { name: 'Schools', href: '/super-admin/schools', icon: Building2 },
    { name: 'User Provisioning', href: '/super-admin/users', icon: Users },
    { name: 'Subscriptions', href: '/super-admin/subscriptions', icon: CreditCard },
    { name: 'Activity Logs', href: '/super-admin/monitoring', icon: Activity },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--app-bg)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: sidebarOpen ? '260px' : '80px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width var(--transition-fast)',
          borderRight: '1px solid #1e293b',
          zIndex: 40,
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          borderBottom: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.625rem',
              background: 'var(--brand-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0
            }}>
              <GraduationCap size={22} />
            </div>
            {sidebarOpen && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff', lineHeight: 1.2 }}>
                  EduSystem
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Super Admin</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: sidebarOpen ? 'block' : 'none'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all var(--transition-fast)',
                  textDecoration: 'none'
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info Bottom Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center'
        }}>
          {sidebarOpen ? (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email || 'Super Admin'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Platform Admin</div>
            </div>
          ) : null}
          <button
            onClick={logout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={18} />
          </button>
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
          zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--surface-hover)',
              padding: '0.5rem 0.875rem',
              borderRadius: '0.5rem',
              width: '280px'
            }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search schools, users..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.875rem',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge variant="info" icon={ShieldCheck}>GLOBAL SCOPE</Badge>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem'
            }}>
              SA
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
