'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { getAllSchools } from '@/firebase/db/schools';
import { getAllUsers } from '@/firebase/db/users';
import { getActivityLogs } from '@/firebase/db/logs';
import { Building2, Users, ShieldCheck, Activity, Plus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function SuperAdminDashboardPage() {
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [fetchedSchools, fetchedUsers, fetchedLogs] = await Promise.all([
        getAllSchools(),
        getAllUsers(),
        getActivityLogs(10),
      ]);
      setSchools(fetchedSchools);
      setUsers(fetchedUsers);
      setLogs(fetchedLogs);
      setLoading(false);
    }
    loadData();
  }, []);

  const activeSchoolsCount = schools.filter((s) => s.status === 'ACTIVE').length;
  const trialSchoolsCount = schools.filter((s) => s.subscription?.status === 'TRIAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Platform Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Multi-school tenant metrics and platform analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '0.875rem',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Total Schools</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {loading ? '...' : schools.length}
            </div>
          </div>
        </Card>

        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '0.875rem',
            backgroundColor: 'var(--status-success-bg)',
            color: 'var(--status-success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Active Tenants</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {loading ? '...' : activeSchoolsCount}
            </div>
          </div>
        </Card>

        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '0.875rem',
            backgroundColor: 'var(--secondary-light)',
            color: 'var(--secondary-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Active Trials</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {loading ? '...' : trialSchoolsCount}
            </div>
          </div>
        </Card>

        <Card hoverable style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '0.875rem',
            backgroundColor: 'var(--status-info-bg)',
            color: 'var(--status-info)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Provisioned Users</div>
            <div style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {loading ? '...' : users.length}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Registered Schools & Audit Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Schools Summary Table */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Registered Schools</h3>
            <Link href="/super-admin/schools" style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {schools.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No schools registered yet. Click "Register School" to onboard your first tenant.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>School Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>City / Location</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Currency</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.slice(0, 5).map((school) => (
                    <tr key={school.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '50%',
                            backgroundColor: school.theme?.primaryColor || 'var(--primary-color)'
                          }} />
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

        {/* Real-time Activity Feed */}
        <Card style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Activity Logs</h3>
            <Activity size={18} style={{ color: 'var(--primary-color)' }} />
          </div>

          {logs.length === 0 ? (
            <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {logs.slice(0, 5).map((log) => (
                <div key={log.id} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    marginTop: '0.375rem',
                    flexShrink: 0
                  }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{log.details}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                      {log.userName} • {log.createdAtStr ? new Date(log.createdAtStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
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
