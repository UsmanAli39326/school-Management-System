'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import {
  getAllSchools,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  deleteSchool
} from '@/firebase/db/schools';
import { logActivity } from '@/firebase/db/logs';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  Globe,
  Palette,
  Calendar,
  DollarSign,
  AlertTriangle,
  Check
} from 'lucide-react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'contact' | 'config' | 'branding' | 'subscription'
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    principalName: '',
    contact: { phone: '', email: '', address: '', city: '', website: '' },
    config: { activeSession: '2025-2026', currency: 'USD', timezone: 'UTC', dateFormat: 'DD/MM/YYYY' },
    theme: { primaryColor: '#4f46e5', secondaryColor: '#0ea5e9' },
    subscription: { status: 'TRIAL', trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    status: 'ACTIVE'
  });

  // Delete Confirm Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);
    const data = await getAllSchools();
    setSchools(data);
    setLoading(false);
  }

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingSchoolId(null);
    setFormData({
      name: '',
      tagline: '',
      principalName: '',
      contact: { phone: '', email: '', address: '', city: '', website: '' },
      config: { activeSession: '2025-2026', currency: 'USD', timezone: 'UTC', dateFormat: 'DD/MM/YYYY' },
      theme: { primaryColor: '#4f46e5', secondaryColor: '#0ea5e9' },
      subscription: { status: 'TRIAL', trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      status: 'ACTIVE'
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (school) => {
    setModalMode('edit');
    setEditingSchoolId(school.id);
    setFormData({
      name: school.name || '',
      tagline: school.tagline || '',
      principalName: school.principalName || '',
      contact: {
        phone: school.contact?.phone || '',
        email: school.contact?.email || '',
        address: school.contact?.address || '',
        city: school.contact?.city || '',
        website: school.contact?.website || ''
      },
      config: {
        activeSession: school.config?.activeSession || '2025-2026',
        currency: school.config?.currency || 'USD',
        timezone: school.config?.timezone || 'UTC',
        dateFormat: school.config?.dateFormat || 'DD/MM/YYYY'
      },
      theme: {
        primaryColor: school.theme?.primaryColor || '#4f46e5',
        secondaryColor: school.theme?.secondaryColor || '#0ea5e9'
      },
      subscription: {
        status: school.subscription?.status || 'TRIAL',
        trialEndsAt: school.subscription?.trialEndsAt ? new Date(school.subscription.trialEndsAt).toISOString().split('T')[0] : ''
      },
      status: school.status || 'ACTIVE'
    });
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        const created = await createSchool(formData);
        await logActivity('SCHOOL_CREATED', `Registered new school tenant: ${formData.name}`);
      } else {
        await updateSchool(editingSchoolId, formData);
        await logActivity('SCHOOL_UPDATED', `Updated school configuration for: ${formData.name}`);
      }
      setIsModalOpen(false);
      await loadSchools();
    } catch (err) {
      console.error('Error saving school:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (school) => {
    try {
      const newStatus = await toggleSchoolStatus(school.id, school.status);
      await logActivity('SCHOOL_STATUS_CHANGED', `Changed status of ${school.name} to ${newStatus}`);
      await loadSchools();
    } catch (err) {
      console.error('Error toggling school status:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    try {
      await deleteSchool(schoolToDelete.id);
      await logActivity('SCHOOL_DELETED', `Deleted school tenant: ${schoolToDelete.name}`);
      setDeleteConfirmOpen(false);
      setSchoolToDelete(null);
      await loadSchools();
    } catch (err) {
      console.error('Error deleting school:', err);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      (school.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (school.contact?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>School Tenant Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Register, configure branding, manage localization, and toggle tenant statuses
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
          Register New School
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '360px' }}>
          <Input
            icon={Search}
            placeholder="Search school name or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--surface-border)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: statusFilter === status ? 'var(--primary-color)' : 'var(--surface-bg)',
                color: statusFilter === status ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Schools Table */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schools...</div>
        ) : filteredSchools.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No schools found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Name</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>City</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Principal</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Branding Theme</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Currency</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Subscription</th>
                  <th style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr key={school.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '0.875rem 0.5rem', fontWeight: 600 }}>
                      <div>{school.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{school.tagline || 'No tagline'}</div>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {school.contact?.city || 'N/A'}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {school.principalName || 'N/A'}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            backgroundColor: school.theme?.primaryColor || '#4f46e5',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          title={`Primary: ${school.theme?.primaryColor}`}
                        />
                        <div
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            backgroundColor: school.theme?.secondaryColor || '#0ea5e9',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                          title={`Secondary: ${school.theme?.secondaryColor}`}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem' }}>
                      <Badge variant="info">{school.config?.currency || 'USD'}</Badge>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem' }}>
                      <Badge variant={school.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {school.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem' }}>
                      <Badge variant={school.subscription?.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {school.subscription?.status || 'TRIAL'}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                        <button
                          onClick={() => handleOpenEditModal(school)}
                          title="Edit School"
                          style={{
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--surface-border)',
                            backgroundColor: 'var(--surface-bg)',
                            cursor: 'pointer',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(school)}
                          title={school.status === 'ACTIVE' ? 'Deactivate School' : 'Activate School'}
                          style={{
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--surface-border)',
                            backgroundColor: 'var(--surface-bg)',
                            cursor: 'pointer',
                            color: school.status === 'ACTIVE' ? 'var(--status-danger)' : 'var(--status-success)'
                          }}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => { setSchoolToDelete(school); setDeleteConfirmOpen(true); }}
                          title="Delete School"
                          style={{
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--surface-border)',
                            backgroundColor: 'var(--surface-bg)',
                            cursor: 'pointer',
                            color: 'var(--status-danger)'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create / Edit School Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New School Tenant' : `Edit School: ${formData.name}`}
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Modal Navigation Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', gap: '0.5rem' }}>
            {[
              { id: 'general', label: 'General Info' },
              { id: 'contact', label: 'Contact' },
              { id: 'config', label: 'Localization' },
              { id: 'branding', label: 'Branding & Theme' },
              { id: 'subscription', label: 'Subscription' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: General Info */}
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="School Name *"
                placeholder="e.g. Apex International Grammar School"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Tagline / Motto"
                placeholder="e.g. Empowering Tomorrow's Leaders"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              />
              <Input
                label="Principal / Director Name"
                placeholder="e.g. Dr. Arthur Pendelton"
                value={formData.principalName}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
              />
            </div>
          )}

          {/* Tab 2: Contact */}
          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Official Email *"
                type="email"
                placeholder="info@apexschool.com"
                value={formData.contact.email}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+1 (555) 019-2834"
                value={formData.contact.phone}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
              />
              <Input
                label="City / Region"
                placeholder="e.g. New York, London, Islamabad"
                value={formData.contact.city}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, city: e.target.value } })}
              />
              <Input
                label="Full Address"
                placeholder="123 Education Boulevard..."
                value={formData.contact.address}
                onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })}
              />
            </div>
          )}

          {/* Tab 3: Localization & Config */}
          {activeTab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input
                label="Active Academic Session"
                placeholder="e.g. 2025-2026"
                value={formData.config.activeSession}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, activeSession: e.target.value } })}
              />
              <div className="fieldGroup">
                <label className="label">Currency Code</label>
                <select
                  className="input"
                  value={formData.config.currency}
                  onChange={(e) => setFormData({ ...formData, config: { ...formData.config, currency: e.target.value } })}
                >
                  <option value="USD">USD ($)</option>
                  <option value="PKR">PKR (Rs)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (DH)</option>
                </select>
              </div>
              <Input
                label="Date Format"
                placeholder="DD/MM/YYYY"
                value={formData.config.dateFormat}
                onChange={(e) => setFormData({ ...formData, config: { ...formData.config, dateFormat: e.target.value } })}
              />
            </div>
          )}

          {/* Tab 4: Branding & Theme */}
          {activeTab === 'branding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Primary Brand Color"
                  type="color"
                  value={formData.theme.primaryColor}
                  onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, primaryColor: e.target.value } })}
                />
                <Input
                  label="Secondary Accent Color"
                  type="color"
                  value={formData.theme.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, theme: { ...formData.theme, secondaryColor: e.target.value } })}
                />
              </div>

              {/* Live Theme Color Preview Card */}
              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--surface-border)',
                backgroundColor: 'var(--surface-bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Live School Branding Preview
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData.theme.primaryColor,
                      color: '#ffffff',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      fontSize: '0.8125rem',
                      fontWeight: 600
                    }}
                  >
                    Primary Button
                  </button>
                  <span style={{
                    backgroundColor: formData.theme.secondaryColor,
                    color: '#ffffff',
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Secondary Accent Badge
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Subscription */}
          {activeTab === 'subscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="fieldGroup">
                <label className="label">Subscription Status</label>
                <select
                  className="input"
                  value={formData.subscription.status}
                  onChange={(e) => setFormData({ ...formData, subscription: { ...formData.subscription, status: e.target.value } })}
                >
                  <option value="TRIAL">Trial Period</option>
                  <option value="ACTIVE">Active Plan</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <Input
                label="Trial End Date"
                type="date"
                value={formData.subscription.trialEndsAt}
                onChange={(e) => setFormData({ ...formData, subscription: { ...formData.subscription, trialEndsAt: e.target.value } })}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Register School' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Confirm School Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--status-danger)' }}>
            <AlertTriangle size={24} />
            <span style={{ fontWeight: 600 }}>This action cannot be undone.</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete <strong>{schoolToDelete?.name}</strong>? All associated tenant data will be permanently removed.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Yes, Delete School
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
