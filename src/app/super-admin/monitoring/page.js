'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Input from '@/components/common/Input';
import { getActivityLogs } from '@/firebase/db/logs';
import { Activity, Search, ShieldAlert, Clock, User } from 'lucide-react';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const data = await getActivityLogs(100);
    setLogs(data);
    setLoading(false);
  }

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(query) ||
      (log.details || '').toLowerCase().includes(query) ||
      (log.userName || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>System Monitoring & Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Real-time security events, tenant onboarding actions, and admin activity audit trails
        </p>
      </div>

      {/* Filter & Search */}
      <Card style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '320px' }}>
          <Input
            icon={Search}
            placeholder="Search action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredLogs.length}</strong> logged events
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No activity logs found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Timestamp</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Action Type</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Details</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>User</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Tenant Scope</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
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
                      <Badge variant="info">{log.action}</Badge>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
