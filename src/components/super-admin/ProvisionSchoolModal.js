'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import SchoolBrandSetup from '@/components/common/SchoolBrandSetup';
import { Building2, Globe, Mail, Sparkles, AlertCircle, Palette } from 'lucide-react';
import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from '@/utils/brand';

export default function ProvisionSchoolModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    tagline: '',
    principalName: '',
    contact: { email: '', phone: '', city: '', address: '' },
    tier: 'STANDARD',
    activeSession: '2025-2026',
    currency: 'USD',
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
    logoUrl: '',
  });

  const [subdomainError, setSubdomainError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        subdomain: '',
        tagline: '',
        principalName: '',
        contact: { email: '', phone: '', city: '', address: '' },
        tier: 'STANDARD',
        activeSession: '2025-2026',
        currency: 'USD',
        primaryColor: DEFAULT_PRIMARY_COLOR,
        secondaryColor: DEFAULT_SECONDARY_COLOR,
        logoUrl: '',
      });
      setSubdomainError('');
      setActiveTab('details');
    }
  }, [isOpen]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSub = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      subdomain: prev.subdomain ? prev.subdomain : autoSub,
    }));
  };

  const handleSubdomainChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, subdomain: val }));
    if (val.length > 0 && val.length < 3) {
      setSubdomainError('Subdomain must be at least 3 characters');
    } else {
      setSubdomainError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (subdomainError) return;

    const payload = {
      ...formData,
      logoUrl: formData.logoUrl,
      theme: {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      },
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Provision New School Tenant">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Helper Banner */}
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: '0.625rem',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary-color)',
          fontSize: '0.84375rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <Sparkles size={20} style={{ flexShrink: 0 }} />
          <div>
            Provisioning initializes an isolated multi-tenant database entry, brand theme, and default academic calendar.
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              padding: '0.5rem 0.25rem',
              fontSize: '0.84375rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'details' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'details' ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
          >
            Tenant Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            style={{
              padding: '0.5rem 0.25rem',
              fontSize: '0.84375rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'branding' ? 'var(--primary-color)' : 'var(--text-muted)',
              borderBottom: activeTab === 'branding' ? '2px solid var(--primary-color)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Palette size={15} /> Brand & Logo Personalization
          </button>
        </div>

        {/* Tab 1: Tenant Details */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="School Tenant Name *"
              placeholder="e.g. Oakridge Academy"
              icon={Building2}
              value={formData.name}
              onChange={handleNameChange}
              required
            />

            <div>
              <Input
                label="Tenant Subdomain *"
                placeholder="oakridge"
                icon={Globe}
                value={formData.subdomain}
                onChange={handleSubdomainChange}
                required
              />
              {formData.subdomain && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Tenant Domain URL: <strong style={{ color: 'var(--primary-color)' }}>https://{formData.subdomain}.edusystem.com</strong>
                </div>
              )}
              {subdomainError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--status-danger)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} />
                  <span>{subdomainError}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Official Contact Email *"
                type="email"
                placeholder="admin@oakridge.edu"
                icon={Mail}
                value={formData.contact.email}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                required
              />

              <Input
                label="City / Location"
                placeholder="e.g. Boston, MA"
                value={formData.contact.city}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, city: e.target.value } })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="fieldGroup">
                <label className="label">Subscription Tier *</label>
                <select
                  className="input"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                >
                  <option value="TRIAL">Trial (30 Days Free)</option>
                  <option value="STANDARD">Standard Plan ($99/mo)</option>
                  <option value="PREMIUM">Premium Enterprise ($249/mo)</option>
                </select>
              </div>

              <div className="fieldGroup">
                <label className="label">Default Currency</label>
                <select
                  className="input"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Brand & Logo Customization */}
        {activeTab === 'branding' && (
          <SchoolBrandSetup
            embeddedInModal={true}
            initialColor={formData.primaryColor}
            initialSecondaryColor={formData.secondaryColor}
            initialLogoUrl={formData.logoUrl}
            schoolName={formData.name || 'Oakridge Academy'}
            onChange={({ primaryColor, secondaryColor, logoUrl }) => {
              setFormData((prev) => ({
                ...prev,
                primaryColor,
                secondaryColor,
                logoUrl,
              }));
            }}
          />
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={Boolean(subdomainError)}>
            Provision School Tenant
          </Button>
        </div>
      </form>
    </Modal>
  );
}

