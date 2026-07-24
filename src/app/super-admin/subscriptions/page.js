'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { getAllSchools, updateSchool } from '@/firebase/db/schools';
import { logActivity } from '@/firebase/db/logs';
import { CreditCard, Calendar, Clock, CheckCircle2, AlertCircle, Edit } from 'lucide-react';

export default function SubscriptionsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Subscription Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [subStatus, setSubStatus] = useState('TRIAL');
  const [trialEndDate, setTrialEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);
    const data = await getAllSchools();
    setSchools(data);
    setLoading(false);
  }

  const handleOpenEditModal = (school) => {
    setSelectedSchool(school);
    setSubStatus(school.subscription?.status || 'TRIAL');
    setTrialEndDate(
      school.subscription?.trialEndsAt
        ? new Date(school.subscription.trialEndsAt).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setIsModalOpen(true);
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;
    setIsSubmitting(true);

    try {
      await updateSchool(selectedSchool.id, {
        subscription: {
          status: subStatus,
          trialEndsAt: trialEndDate,
          expiresAt: trialEndDate
        }
      });
      await logActivity('SUBSCRIPTION_UPDATED', `Updated subscription for ${selectedSchool.name} to ${subStatus}`);
      setIsModalOpen(false);
      await loadSchools();
    } catch (err) {
      console.error('Error updating subscription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Subscription & Trial Management</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Track school trial periods, manage billing statuses, and update expiration dates
        </p>
      </div>

      {/* Subscriptions Table */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading subscriptions...</div>
        ) : schools.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered schools found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Tenant</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Plan Status</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Trial End / Expiry Date</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Currency</th>
                  <th style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => {
                  const status = school.subscription?.status || 'TRIAL';
                  const trialEnd = school.subscription?.trialEndsAt
                    ? new Date(school.subscription.trialEndsAt).toLocaleDateString()
                    : 'N/A';

                  return (
                    <tr key={school.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.875rem 0.5rem', fontWeight: 600 }}>
                        {school.name}
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge
                          variant={
                            status === 'ACTIVE' ? 'success' : status === 'TRIAL' ? 'warning' : 'danger'
                          }
                          icon={CreditCard}
                        >
                          {status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                          <span>{trialEnd}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant="info">{school.config?.currency || 'USD'}</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          icon={Edit}
                          onClick={() => handleOpenEditModal(school)}
                          style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                        >
                          Update Plan
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

      {/* Edit Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manage Plan: ${selectedSchool?.name}`}
      >
        <form onSubmit={handleSaveSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="fieldGroup">
            <label className="label">Plan Status</label>
            <select
              className="input"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
            >
              <option value="TRIAL">Trial Period</option>
              <option value="ACTIVE">Active Plan</option>
              <option value="EXPIRED">Expired</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <Input
            label="Trial / Subscription Expiry Date"
            type="date"
            value={trialEndDate}
            onChange={(e) => setTrialEndDate(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
