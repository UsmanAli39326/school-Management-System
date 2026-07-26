'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/super-admin/PageHeader';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { getAllSchools } from '@/firebase/db/schools';
import { getAllUsers, createUserProfile, updateUserStatus } from '@/firebase/db/users';
import { logActivity } from '@/firebase/db/logs';
import { auth } from '@/firebase/config';
import {
  Users,
  UserPlus,
  Search,
  Lock,
  Unlock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  Inbox,
  AlertCircle
} from 'lucide-react';

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

  // Lock Account Confirm Modal State (UX §7)
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [userToToggleLock, setUserToToggleLock] = useState(null);
  const [isLockingUser, setIsLockingUser] = useState(false);

  // New User Form State
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    schoolId: '',
    role: 'SCHOOL_ADMIN'
  });

  // Password validation rules state (UX §21)
  const passwordRules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least one number (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'At least one special character (!@#$%^&*)', test: (p) => /[^A-Za-z0-9]/.test(p) }
  ];

  const isPasswordValid = passwordRules.every((rule) => rule.test(formData.password));

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedSchools] = await Promise.all([
        getAllUsers(),
        getAllSchools()
      ]);
      setUsers(fetchedUsers || []);
      setSchools(fetchedSchools || []);
      if (fetchedSchools && fetchedSchools.length > 0) {
        setFormData((prev) => ({ ...prev, schoolId: fetchedSchools[0].id }));
      }
    } catch (err) {
      console.error('Error fetching users/schools:', err);
    } finally {
      setLoading(false);
    }
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

    if (!isPasswordValid) {
      setErrorMessage('Password does not meet complexity requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!auth.currentUser) {
        throw new Error('Not authenticated');
      }
      const idToken = await auth.currentUser.getIdToken();

      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          schoolId: formData.schoolId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      const { uid } = await res.json();

      await createUserProfile(uid, {
        displayName: formData.displayName,
        email: formData.email,
        role: formData.role,
        schoolId: formData.schoolId,
        status: 'ACTIVE'
      });

      await logActivity(
        'USER_PROVISIONED',
        `Provisioned ${formData.role} account for ${formData.email} (School ID: ${formData.schoolId})`
      );

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

  const handlePromptToggleLock = (user) => {
    setUserToToggleLock(user);
    setLockConfirmOpen(true);
  };

  const handleConfirmToggleLock = async () => {
    if (!userToToggleLock) return;
    const newStatus = userToToggleLock.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    setIsLockingUser(true);

    try {
      await updateUserStatus(userToToggleLock.id, newStatus);
      await logActivity(
        'USER_STATUS_CHANGED',
        `Changed account status of ${userToToggleLock.email} to ${newStatus}`
      );
      setLockConfirmOpen(false);
      setUserToToggleLock(null);
      await loadData();
    } catch (err) {
      console.error('Error updating user status:', err);
    } finally {
      setIsLockingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query) ||
      (u.role || '').toLowerCase().includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Standard Header (UX §1, §8, §17) */}
      <PageHeader
        title="User Provisioning & Role Assignments"
        subtitle="Provision administrative user accounts, assign tenant scope permissions, and lock/unlock accounts."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={handleOpenProvisionModal}>
            Provision School Admin
          </Button>
        }
      />

      {/* Filter Toolbar (UX §10, §11) */}
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
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredUsers.length}</strong> provisioned user accounts
        </div>
      </Card>

      {/* Users Table (UX §11 Table Standards) */}
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
        ) : filteredUsers.length === 0 ? (
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
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>No User Accounts Found</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              {searchQuery
                ? 'No provisioned administrative users match your search query.'
                : 'No administrative user accounts have been provisioned yet.'}
            </p>
            {searchQuery ? (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            ) : (
              <Button variant="primary" icon={UserPlus} onClick={handleOpenProvisionModal}>
                Provision Admin Account
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
                  <th style={{ padding: '0.875rem 0.5rem' }}>Full Name</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Email Address</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>Assigned Role</th>
                  <th style={{ padding: '0.875rem 0.5rem' }}>School Tenant Scope</th>
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
                        <Badge variant={user.status === 'LOCKED' ? 'danger' : 'success'}>
                          {user.status || 'ACTIVE'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.875rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handlePromptToggleLock(user)}
                          title={user.status === 'LOCKED' ? 'Unlock Staff Account' : 'Lock Staff Account'}
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

      {/* Provision User Modal with Password Checklist (UX §21) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Primary School Admin Account"
      >
        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--status-danger-bg)',
                color: 'var(--status-danger)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
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

          <div>
            <Input
              label="Temporary Password *"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            {/* Password Validation Criteria Checklist (UX §21) */}
            {formData.password.length > 0 && (
              <div
                style={{
                  marginTop: '0.625rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--surface-hover)',
                  border: '1px solid var(--surface-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password Complexity Criteria:
                </div>
                {passwordRules.map((rule, idx) => {
                  const passed = rule.test(formData.password);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        color: passed ? 'var(--status-success)' : 'var(--text-muted)'
                      }}
                    >
                      {passed ? <Check size={14} /> : <X size={14} />}
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="fieldGroup">
            <label className="label">Role Assignment *</label>
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
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={!isPasswordValid}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Lock Toggle Confirmation Modal (UX §7) */}
      <ConfirmationModal
        isOpen={lockConfirmOpen}
        onClose={() => setLockConfirmOpen(false)}
        onConfirm={handleConfirmToggleLock}
        title={userToToggleLock?.status === 'LOCKED' ? 'Unlock Staff Account?' : 'Lock Staff Account?'}
        description={
          userToToggleLock?.status === 'LOCKED'
            ? `Unlocking ${userToToggleLock?.email} will restore their access to login and manage school records.`
            : `Locking ${userToToggleLock?.email} will immediately terminate active sessions and block further login attempts.`
        }
        confirmText={userToToggleLock?.status === 'LOCKED' ? 'Yes, Unlock Account' : 'Yes, Lock Account'}
        variant={userToToggleLock?.status === 'LOCKED' ? 'primary' : 'danger'}
        isLoading={isLockingUser}
      />
    </div>
  );
}
