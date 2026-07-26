'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/super-admin/PageHeader';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import ProvisionSchoolModal from '@/components/super-admin/ProvisionSchoolModal';
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
  AlertTriangle,
  Inbox,
  X
} from 'lucide-react';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Provision Tenant Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Edit School Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', tagline: '', principalName: '', city: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Status Toggle Confirmation Modal State (UX §7)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [schoolToToggle, setSchoolToToggle] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Delete Confirmation Modal State (UX §7)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  async function loadSchools() {
    setLoading(true);
    try {
      const data = await getAllSchools();
      setSchools(data || []);
    } catch (err) {
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Provision New School Tenant
  const handleProvisionSubmit = async (provisionData) => {
    setIsProvisioning(true);
    try {
      const newSchoolPayload = {
        name: provisionData.name,
        subdomain: provisionData.subdomain,
        tagline: provisionData.tagline || '',
        principalName: provisionData.principalName || '',
        contact: {
          email: provisionData.contact.email,
          phone: provisionData.contact.phone || '',
          city: provisionData.contact.city || '',
          address: ''
        },
        config: {
          activeSession: provisionData.activeSession || '2025-2026',
          currency: provisionData.currency || 'USD',
          timezone: 'UTC',
          dateFormat: 'DD/MM/YYYY'
        },
        theme: {
          primaryColor: '#4f46e5',
          secondaryColor: '#0ea5e9'
        },
        subscription: {
          status: provisionData.tier || 'TRIAL',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        status: 'ACTIVE'
      };

      await createSchool(newSchoolPayload);
      await logActivity('SCHOOL_PROVISIONED', `Provisioned tenant ${provisionData.name} (${provisionData.subdomain})`);
      setIsProvisionOpen(false);
      await loadSchools();
    } catch (err) {
      console.error('Error provisioning school:', err);
    } finally {
      setIsProvisioning(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setEditFormData({
      name: school.name || '',
      tagline: school.tagline || '',
      principalName: school.principalName || '',
      city: school.contact?.city || ''
    });
    setIsEditOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSchool) return;
    setIsSavingEdit(true);
    try {
      await updateSchool(editingSchool.id, {
        name: editFormData.name,
        tagline: editFormData.tagline,
        principalName: editFormData.principalName,
        contact: {
          ...(editingSchool.contact || {}),
          city: editFormData.city
        }
      });
      await logActivity('SCHOOL_UPDATED', `Updated details for school tenant: ${editFormData.name}`);
      setIsEditOpen(false);
      await loadSchools();
    } catch (err) {
      console.error('Error updating school:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Trigger Status Toggle Modal (UX §7)
  const handlePromptStatusToggle = (school) => {
    setSchoolToToggle(school);
    setStatusConfirmOpen(true);
  };

  // Confirm Status Toggle
  const handleConfirmStatusToggle = async () => {
    if (!schoolToToggle) return;
    setIsTogglingStatus(true);
    try {
      const updatedStatus = await toggleSchoolStatus(schoolToToggle.id, schoolToToggle.status);
      await logActivity('SCHOOL_STATUS_CHANGED', `Changed status of ${schoolToToggle.name} to ${updatedStatus}`);
      setStatusConfirmOpen(false);
      setSchoolToToggle(null);
      await loadSchools();
    } catch (err) {
      console.error('Error toggling school status:', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Trigger Delete Confirmation Modal (UX §7)
  const handlePromptDelete = (school) => {
    setSchoolToDelete(school);
    setDeleteConfirmOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSchool(schoolToDelete.id);
      await logActivity('SCHOOL_DELETED', `Deleted tenant school: ${schoolToDelete.name}`);
      setDeleteConfirmOpen(false);
      setSchoolToDelete(null);
      await loadSchools();
    } catch (err) {
      console.error('Error deleting school:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchools = schools.filter((school) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (school.name || '').toLowerCase().includes(query) ||
      (school.contact?.city || '').toLowerCase().includes(query) ||
      (school.subdomain || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Standard Header (UX §1, §8, §17) */}
      <PageHeader
        title="School Tenant Management"
        subtitle="Provision new tenant organizations, manage school profiles, and toggle access states."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setIsProvisionOpen(true)}>
            Provision New School
          </Button>
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
            placeholder="Search school name, city, or subdomain..."
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
                cursor: 'pointer',
                padding: '0.25rem'
              }}
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--surface-border)',
                fontSize: '0.84375rem',
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

      {/* Schools Table (UX §11 Table Standards) */}
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
        ) : filteredSchools.length === 0 ? (
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
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>No Schools Found</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              {searchQuery || statusFilter !== 'ALL'
                ? 'No registered schools match your current search query or filter selection.'
                : 'No school tenants exist yet in the system. Click below to provision your first school.'}
            </p>
            {searchQuery || statusFilter !== 'ALL' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </Button>
            ) : (
              <Button variant="primary" icon={Plus} onClick={() => setIsProvisionOpen(true)}>
                Provision New School
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
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Tenant</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>City / Location</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Principal</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: '0.75rem',
                            height: '0.75rem',
                            borderRadius: '50%',
                            backgroundColor: school.theme?.primaryColor || 'var(--primary-color)'
                          }}
                        />
                        <div>
                          <div>{school.name}</div>
                          {school.subdomain && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              {school.subdomain}.edusystem.com
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {school.contact?.city || 'N/A'}
                    </td>
                    <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {school.principalName || 'N/A'}
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
                          onClick={() => handleOpenEdit(school)}
                          title="Edit School Profile"
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
                          onClick={() => handlePromptStatusToggle(school)}
                          title={school.status === 'ACTIVE' ? 'Deactivate School Tenant' : 'Activate School Tenant'}
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
                          onClick={() => handlePromptDelete(school)}
                          title="Delete School Tenant"
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

      {/* Provision School Modal Component */}
      <ProvisionSchoolModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        onSubmit={handleProvisionSubmit}
        isSubmitting={isProvisioning}
      />

      {/* Edit Basic Details Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit School Tenant: ${editingSchool?.name}`}>
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Input
            label="School Name *"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            required
          />
          <Input
            label="Tagline / Motto"
            value={editFormData.tagline}
            onChange={(e) => setEditFormData({ ...editFormData, tagline: e.target.value })}
          />
          <Input
            label="Principal / Director Name"
            value={editFormData.principalName}
            onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
          />
          <Input
            label="City / Location"
            value={editFormData.city}
            onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingEdit}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Toggle Confirmation Modal (UX §7) */}
      <ConfirmationModal
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusToggle}
        title={schoolToToggle?.status === 'ACTIVE' ? 'Deactivate School Access?' : 'Activate School Access?'}
        description={
          schoolToToggle?.status === 'ACTIVE'
            ? `Deactivating ${schoolToToggle?.name} will temporarily block all student, teacher, and school admin logins across this tenant.`
            : `Activating ${schoolToToggle?.name} will restore login access for all users under this school branch.`
        }
        confirmText={schoolToToggle?.status === 'ACTIVE' ? 'Yes, Deactivate' : 'Yes, Activate'}
        variant={schoolToToggle?.status === 'ACTIVE' ? 'danger' : 'primary'}
        isLoading={isTogglingStatus}
      />

      {/* Delete Confirmation Modal (UX §7) */}
      <ConfirmationModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Permanently Delete ${schoolToDelete?.name}?`}
        description={`This will permanently purge ${schoolToDelete?.name} and all associated student, fee, and class records from the database.`}
        confirmText="Permanently Delete School"
        variant="danger"
        requireTextToConfirm={schoolToDelete?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}
