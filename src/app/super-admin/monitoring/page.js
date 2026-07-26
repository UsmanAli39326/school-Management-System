'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/super-admin/PageHeader';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { getActivityLogs } from '@/firebase/db/logs';
import {
  Activity,
  Search,
  Clock,
  User,
  Download,
  Filter,
  Inbox,
  X,
  AlertTriangle,
  Info,
  ShieldAlert
} from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const data = await getActivityLogs(100);
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      (log.action || '').toLowerCase().includes(query) ||
      (log.details || '').toLowerCase().includes(query) ||
      (log.userName || '').toLowerCase().includes(query) ||
      (log.schoolId || '').toLowerCase().includes(query);

    const isDanger = log.action?.includes('DELETED') || log.action?.includes('LOCKED');
    const isWarning = log.action?.includes('STATUS') || log.action?.includes('UPDATED');

    if (severityFilter === 'DANGER') return matchesQuery && isDanger;
    if (severityFilter === 'WARNING') return matchesQuery && isWarning;
    if (severityFilter === 'INFO') return matchesQuery && !isDanger && !isWarning;
    return matchesQuery;
  });

  const handleExportLogs = () => {
    if (filteredLogs.length === 0) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Standard Header (UX §1, §8, §17) */}
      <PageHeader
        title="System Monitoring & Audit Logs"
        subtitle="Real-time security events, tenant onboarding actions, and admin activity audit trails."
        actions={
          /* Error Prevention (UX §22): Disable export when zero logs present */
          <div title={filteredLogs.length === 0 ? 'No logs available to export' : 'Export current filtered audit logs'}>
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportLogs}
              disabled={filteredLogs.length === 0}
            >
              Export Logs ({filteredLogs.length})
            </Button>
          </div>
        }
      />

      {/* Filter & Search Toolbar (UX §10, §11) */}
      <Card
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '400px' }}>
          <Input
            icon={Search}
            placeholder="Search action, user, school ID, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'INFO', 'WARNING', 'DANGER'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--surface-border)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: severityFilter === sev ? 'var(--primary-color)' : 'var(--surface-bg)',
                color: severityFilter === sev ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {sev}
            </button>
          ))}
        </div>
      </Card>

      {/* Audit Logs Table (UX §11) */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          /* Skeleton Loader (UX §4) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  height: '3rem',
                  backgroundColor: 'var(--surface-border)',
                  borderRadius: '0.375rem',
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          /* Contextual Empty State (UX §3) */
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Inbox size={44} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>No Audit Logs Recorded</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              {searchQuery || severityFilter !== 'ALL'
                ? 'No system logs matched your search or severity filter.'
                : 'No security or administration events have been logged yet.'}
            </p>
            {(searchQuery || severityFilter !== 'ALL') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            )}
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
                  <th style={{ padding: '0.875rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Action Type</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Event Details</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>User / Actor</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Tenant Scope</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isDanger = log.action?.includes('DELETED') || log.action?.includes('LOCKED');
                  const isWarning = log.action?.includes('STATUS') || log.action?.includes('UPDATED');
                  const badgeVariant = isDanger ? 'danger' : isWarning ? 'warning' : 'info';

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                          <span>
                            {log.createdAtStr ? new Date(log.createdAtStr).toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant={badgeVariant}>{log.action}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', fontWeight: 500 }}>
                        {log.details}
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <User size={15} style={{ color: 'var(--text-muted)' }} />
                          <span>{log.userName || 'System'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant="secondary">{log.schoolId || 'GLOBAL'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
