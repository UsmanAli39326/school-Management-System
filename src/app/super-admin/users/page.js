'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { getAllSchools } from '@/firebase/db/schools';
import { getAllUsers, createUserProfile, updateUserStatus } from '@/firebase/db/users';
import { logActivity } from '@/firebase/db/logs';
import { Users, UserPlus, Search, Lock, Unlock, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function UserProvisioningPage() {
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // New User Form State
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    schoolId: '',
    role: 'SCHOOL_ADMIN'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [fetchedUsers, fetchedSchools] = await Promise.all([
      getAllUsers(),
      getAllSchools()
    ]);
    setUsers(fetchedUsers);
    setSchools(fetchedSchools);
    if (fetchedSchools.length > 0) {
      setFormData((prev) => ({ ...prev, schoolId: fetchedSchools[0].id }));
    }
    setLoading(false);
  }

  const handleOpenProvisionModal = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setFormData({
      displayName: '',
      email: '',
      password: '',
      schoolId: schools.length > 0 ? schools[0].id : '',
      role: 'SCHOOL_ADMIN'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // 1. Generate local UID for provisioned account
      const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // 2. Set Custom Claims via Server API Route
      const res = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          role: formData.role,
          schoolId: formData.schoolId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.warn('Custom claim warning:', errorData.error);
      }

      // 3. Create User Document in Firestore
      await createUserProfile(uid, {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        schoolId: formData.schoolId,
        status: 'ACTIVE'
      });

      await logActivity('USER_PROVISIONED', `Provisioned ${formData.role} account for ${formData.email} (School: ${formData.schoolId})`);

      setSuccessMessage(`Account successfully provisioned for ${formData.email}`);
      await loadData();
      setTimeout(() => setIsModalOpen(false), 1200);
    } catch (err) {
      console.error('Provisioning error:', err);
      setErrorMessage(err.message || 'Failed to provision user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLockStatus = async (user) => {
    const newStatus = user.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      await updateUserStatus(user.id, newStatus);
      await logActivity('USER_STATUS_CHANGED', `Changed account status of ${user.email} to ${newStatus}`);
      await loadData();
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Provisioning & Roles</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Provision School Admins, manage roles, and lock/unlock staff accounts
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={handleOpenProvisionModal}>
          Provision School Admin
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '320px' }}>
          <Input
            icon={Search}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredUsers.length}</strong> provisioned user accounts
        </div>
      </Card>

      {/* Users Table */}
      <Card style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No user accounts found matching your query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Full Name</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Email Address</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Assigned Role</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Tenant</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Account Status</th>
                  <th style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const targetSchool = schools.find((s) => s.id === user.schoolId);
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.875rem 0.5rem', fontWeight: 600 }}>
                        {user.displayName || 'Unnamed User'}
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant={user.role === 'SUPER_ADMIN' ? 'info' : 'success'} icon={ShieldCheck}>
                          {user.role}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', color: 'var(--text-secondary)' }}>
                        {targetSchool ? targetSchool.name : user.schoolId === 'GLOBAL' ? 'GLOBAL (System)' : user.schoolId}
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem' }}>
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'danger'}>
                          {user.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleLockStatus(user)}
                          title={user.status === 'LOCKED' ? 'Unlock Account' : 'Lock Account'}
                          style={{
                            padding: '0.375rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--surface-border)',
                            backgroundColor: 'var(--surface-bg)',
                            cursor: 'pointer',
                            color: user.status === 'LOCKED' ? 'var(--status-success)' : 'var(--status-danger)'
                          }}
                        >
                          {user.status === 'LOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Provision User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Primary School Admin Account"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', fontSize: '0.875rem' }}>
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="fieldGroup">
            <label className="label">Target School Tenant *</label>
            <select
              className="input"
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              required
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contact?.city || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Admin Full Name *"
            placeholder="e.g. Sarah Connor"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="admin@school.com"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Temporary Password *"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="fieldGroup">
            <label className="label">Role Assignment</label>
            <select
              className="input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="SCHOOL_ADMIN">School Admin (Full School Access)</option>
              <option value="ACCOUNTANT">Accountant (Fees & Financials)</option>
              <option value="RECEPTIONIST">Receptionist (Admissions)</option>
              <option value="TEACHER">Teacher (View Student Lists)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
