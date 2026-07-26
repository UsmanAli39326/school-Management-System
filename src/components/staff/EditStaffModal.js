'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { User, Phone, Shield, Building, ToggleLeft } from 'lucide-react';

const DEPARTMENTS = [
  'General',
  'Mathematics',
  'Science',
  'English & Languages',
  'Social Sciences',
  'Accounts & Finance',
  'Administration',
  'Sports & Physical Ed',
  'IT & Computer Science',
];

const ROLES = [
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'SCHOOL_ADMIN', label: 'School Administrator' },
];

export default function EditStaffModal({
  isOpen,
  onClose,
  staffMember,
  onSave,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    displayName: '',
    role: 'TEACHER',
    department: 'General',
    phone: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (staffMember) {
      setFormData({
        displayName: staffMember.displayName || '',
        role: staffMember.role || 'TEACHER',
        department: staffMember.department || 'General',
        phone: staffMember.phone || '',
        status: staffMember.status || 'ACTIVE',
      });
    }
  }, [staffMember]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(staffMember.id, formData);
  };

  if (!staffMember) return null;

  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title="Edit Staff Profile">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
            Email Address (Read-only)
          </label>
          <input
            type="email"
            value={staffMember.email || ''}
            disabled
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <Input
          label="Full Name / Display Name"
          placeholder="e.g. Sarah Jenkins"
          value={formData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          icon={User}
        />

        <Input
          label="Contact Phone Number"
          placeholder="+1 (555) 000-0000"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          icon={Phone}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Shield size={14} color="var(--primary-color)" /> Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Building size={14} color="var(--primary-color)" /> Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
              }}
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ToggleLeft size={14} color="var(--primary-color)" /> Account Activation Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '0.625rem 0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <option value="ACTIVE">ACTIVE (Full access)</option>
            <option value="INACTIVE">INACTIVE (Temporarily offline)</option>
            <option value="SUSPENDED">SUSPENDED (Access blocked)</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
