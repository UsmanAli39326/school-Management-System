'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/super-admin/PageHeader';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { getAllSchools, updateSchool } from '@/firebase/db/schools';
import { logActivity } from '@/firebase/db/logs';
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Search,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  Inbox
} from 'lucide-react';

export default function SubscriptionsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Edit Subscription Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [subStatus, setSubStatus] = useState('TRIAL');
  const [trialEndDate, setTrialEndDate] = useState('');
  const [maxStudents, setMaxStudents] = useState(500);
  const [enableCustomDomain, setEnableCustomDomain] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Downgrade confirmation (UX §7)
  const [downgradeConfirmOpen, setDowngradeConfirmOpen] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);
    try {
      const data = await getAllSchools();
      setSchools(data || []);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenEditModal = (school) => {
    setSelectedSchool(school);
    setSubStatus(school.subscription?.status || 'TRIAL');
    setTrialEndDate(
      school.subscription?.trialEndsAt
        ? new Date(school.subscription.trialEndsAt).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    setMaxStudents(school.subscription?.entitlements?.maxStudents || 500);
    setEnableCustomDomain(Boolean(school.subscription?.entitlements?.customDomain));
    setIsModalOpen(true);
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return;

    // Check if downgrading to TRIAL from ACTIVE (UX §7)
    if (selectedSchool.subscription?.status === 'ACTIVE' && subStatus === 'TRIAL') {
      setDowngradeConfirmOpen(true);
      return;
    }

    await executeSubscriptionUpdate();
  };

  const executeSubscriptionUpdate = async () => {
    if (!selectedSchool) return;
    setIsSubmitting(true);

    try {
      await updateSchool(selectedSchool.id, {
        subscription: {
          status: subStatus,
          trialEndsAt: trialEndDate,
          expiresAt: trialEndDate,
          entitlements: {
            maxStudents: Number(maxStudents),
            customDomain: enableCustomDomain
          }
        }
      });
      await logActivity(
        'SUBSCRIPTION_UPDATED',
        `Updated subscription tier for ${selectedSchool.name} to ${subStatus}`
      );
      setDowngradeConfirmOpen(false);
      setIsModalOpen(false);
      await loadSchools();
    } catch (err) {
      console.error('Error updating subscription:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (school.name || '').toLowerCase().includes(query) ||
      (school.subdomain || '').toLowerCase().includes(query);
    const matchesTier =
      tierFilter === 'ALL' || (school.subscription?.status || 'TRIAL') === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Standard Page Header (UX §1, §8, §17) */}
      <PageHeader
        title="Subscription & Plan Entitlements"
        subtitle="Manage billing status, trial expiration dates, and feature entitlement limits per school tenant."
      />

      {/* Progressive Disclosure Tier Comparison Cards (UX §24) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {[
          { title: 'Trial Tier', desc: '30 days full feature preview', badge: 'TRIAL', color: 'var(--status-warning)' },
          { title: 'Standard Plan', desc: 'Up to 1,000 students & core modules', badge: 'ACTIVE', color: 'var(--status-success)' },
          { title: 'Premium Enterprise', desc: 'Unlimited students & custom domains', badge: 'PREMIUM', color: 'var(--primary-color)' }
        ].map((plan, idx) => (
          <Card key={idx} style={{ padding: '1.25rem', borderLeft: `4px solid ${plan.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{plan.title}</h4>
              <Badge variant="info">{plan.badge}</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {plan.desc}
            </p>
          </Card>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
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
        <div style={{ width: '340px' }}>
          <Input
            icon={Search}
            placeholder="Search school name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'TRIAL', 'ACTIVE', 'SUSPENDED'].map((tier) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              style={{
                padding: '0.5rem 0.875rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--surface-border)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: tierFilter === tier ? 'var(--primary-color)' : 'var(--surface-bg)',
                color: tierFilter === tier ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tier}
            </button>
          ))}
        </div>
      </Card>

      {/* Subscriptions Table (UX §11) */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[1, 2, 3, 4].map((i) => (
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
        ) : filteredSchools.length === 0 ? (
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
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>No Subscriptions Found</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              No school subscriptions match your current filter criteria.
            </p>
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
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Tenant</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Plan Status</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Trial / Expiry Date</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Student Quota</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Custom Domain</th>
                  <th style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => {
                  const status = school.subscription?.status || 'TRIAL';
                  const trialEnd = school.subscription?.trialEndsAt
                    ? new Date(school.subscription.trialEndsAt).toLocaleDateString()
                    : 'N/A';
                  const quota = school.subscription?.entitlements?.maxStudents || 500;
                  const hasCustomDomain = Boolean(school.subscription?.entitlements?.customDomain);

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
                          <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                          <span>{trialEnd}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant="info">{quota} Students</Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant={hasCustomDomain ? 'success' : 'secondary'}>
                          {hasCustomDomain ? 'Enabled' : 'Standard'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          icon={Sliders}
                          onClick={() => handleOpenEditModal(school)}
                          style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
                        >
                          Configure Plan
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

      {/* Configure Plan Modal (UX §24 Progressive Disclosure) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Configure Plan & Entitlements: ${selectedSchool?.name}`}
      >
        <form onSubmit={handleSaveSubscription} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="fieldGroup">
            <label className="label">Plan Status *</label>
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
            label="Trial / Subscription Renewal Expiry Date *"
            type="date"
            value={trialEndDate}
            onChange={(e) => setTrialEndDate(e.target.value)}
            required
          />

          <Input
            label="Max Allowed Student Accounts"
            type="number"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
          />

          <div
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--surface-hover)',
              border: '1px solid var(--surface-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Custom Branding & SSL Domain</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Allow tenant to map custom domain (e.g. portal.oakridge.edu)
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableCustomDomain}
              onChange={(e) => setEnableCustomDomain(e.target.checked)}
              style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
            />
          </div>

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

      {/* Downgrade Confirmation Modal (UX §7) */}
      <ConfirmationModal
        isOpen={downgradeConfirmOpen}
        onClose={() => setDowngradeConfirmOpen(false)}
        onConfirm={executeSubscriptionUpdate}
        title="Confirm Plan Downgrade"
        description={`Reverting ${selectedSchool?.name} to a Trial status will enforce strict 30-day expiration limits.`}
        confirmText="Confirm Downgrade"
        variant="warning"
        isLoading={isSubmitting}
      />
    </div>
  );
}
