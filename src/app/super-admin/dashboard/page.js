'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import PageHeader from '@/components/super-admin/PageHeader';
import { getAllSchools } from '@/firebase/db/schools';
import { getAllUsers } from '@/firebase/db/users';
import { getActivityLogs } from '@/firebase/db/logs';
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  Inbox
} from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedSchools, fetchedUsers, fetchedLogs] = await Promise.all([
          getAllSchools(),
          getAllUsers(),
          getActivityLogs(10)
        ]);
        setSchools(fetchedSchools || []);
        setUsers(fetchedUsers || []);
        setLogs(fetchedLogs || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeSchoolsCount = schools.filter((s) => s.status === 'ACTIVE').length;
  const trialSchoolsCount = schools.filter((s) => s.subscription?.status === 'TRIAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Standard Page Header (UX §1, §8, §17) */}
      <PageHeader
        title="Platform Dashboard"
        subtitle="Overview of platform-wide statistics, active subscriptions, and real-time activity metrics."
        actions={
          <>
            <Link href="/super-admin/schools">
              <Button variant="primary" icon={Plus}>
                Register School
              </Button>
            </Link>
            <Link href="/super-admin/users">
              <Button variant="secondary" icon={Users}>
                Provision Admin
              </Button>
            </Link>
          </>
        }
      />

      {/* Analytics KPI Grid with Skeleton Loading (UX §4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        {[
          {
            title: 'Total Schools',
            count: schools.length,
            icon: Building2,
            bgColor: 'var(--primary-light)',
            color: 'var(--primary-color)'
          },
          {
            title: 'Active Tenants',
            count: activeSchoolsCount,
            icon: CheckCircle2,
            bgColor: 'var(--status-success-bg)',
            color: 'var(--status-success)'
          },
          {
            title: 'Active Trials',
            count: trialSchoolsCount,
            icon: Clock,
            bgColor: 'var(--secondary-light)',
            color: 'var(--secondary-accent)'
          },
          {
            title: 'Provisioned Users',
            count: users.length,
            icon: Users,
            bgColor: 'var(--status-info-bg)',
            color: 'var(--status-info)'
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.375rem' }}>
              <div
                style={{
                  width: '3.25rem',
                  height: '3.25rem',
                  borderRadius: '0.875rem',
                  backgroundColor: kpi.bgColor,
                  color: kpi.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={24} />
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '0.84375rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {kpi.title}
                </div>
                {loading ? (
                  <div
                    style={{
                      height: '1.75rem',
                      width: '60%',
                      backgroundColor: 'var(--surface-border)',
                      borderRadius: '0.375rem',
                      marginTop: '0.375rem',
                      animation: 'pulse 1.5s infinite ease-in-out'
                    }}
                  />
                ) : (
                  <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    {kpi.count}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid: Schools Overview & Real-Time Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Registered Schools Table */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Registered School Tenants</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Recent tenant onboarding overview</p>
            </div>
            <Link
              href="/super-admin/schools"
              style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'none'
              }}
            >
              <span>Manage All ({schools.length})</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            /* Skeleton Table Rows (UX §4) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: '2.5rem',
                    backgroundColor: 'var(--surface-border)',
                    borderRadius: '0.375rem',
                    opacity: 0.6
                  }}
                />
              ))}
            </div>
          ) : schools.length === 0 ? (
            /* Contextual Empty State (UX §3) */
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--surface-hover)',
                borderRadius: '0.75rem',
                border: '1px dashed var(--surface-border)'
              }}
            >
              <Inbox size={40} style={{ color: 'var(--text-muted)' }} />
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>No Schools Onboarded Yet</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '360px' }}>
                Get started by provisioning your first school branch or tenant organization into the platform.
              </p>
              <Link href="/super-admin/schools">
                <Button variant="primary" icon={Plus} style={{ marginTop: '0.5rem' }}>
                  Register First School
                </Button>
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--surface-border)',
                      textAlign: 'left',
                      color: 'var(--text-secondary)',
                      position: 'sticky',
                      top: 0
                    }}
                  >
                    <th style={{ padding: '0.75rem 0.5rem' }}>School Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Location</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Currency</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.slice(0, 6).map((school) => (
                    <tr key={school.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '0.75rem',
                              height: '0.75rem',
                              borderRadius: '50%',
                              backgroundColor: school.theme?.primaryColor || 'var(--primary-color)'
                            }}
                          />
                          <span>{school.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {school.contact?.city || 'N/A'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge variant="info">{school.config?.currency || 'USD'}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge variant={school.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {school.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge variant={school.subscription?.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {school.subscription?.status || 'TRIAL'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Audit Log Activity Feed */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Audit Activity</h3>
            <Activity size={18} style={{ color: 'var(--primary-color)' }} />
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ height: '2rem', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', opacity: 0.5 }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No recent audit events recorded.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div
                    style={{
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-color)',
                      marginTop: '0.375rem',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{log.details}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {log.userName || 'System Admin'} •{' '}
                      {log.createdAtStr ? new Date(log.createdAtStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
