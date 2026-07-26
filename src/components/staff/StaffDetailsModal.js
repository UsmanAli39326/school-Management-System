'use client';

import React from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import { User, Mail, Phone, Building, ShieldCheck, Calendar, Clock, Edit2 } from 'lucide-react';

export default function StaffDetailsModal({
  isOpen,
  onClose,
  staffMember,
  onEdit,
}) {
  if (!staffMember) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="warning">Inactive</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="info">{status || 'Active'}</Badge>;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp?.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp?.seconds) return new Date(timestamp.seconds * 1000).toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Member Details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header Profile Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            {(staffMember.displayName || staffMember.email || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {staffMember.displayName || 'No Name Provided'}
            </h3>
            <p style={{ margin: 0, marginTop: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {staffMember.email}
            </p>
          </div>
          <div>{getStatusBadge(staffMember.status)}</div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          
          <div
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <ShieldCheck size={14} color="var(--primary-color)" /> Role
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {staffMember.role}
            </span>
          </div>

          <div
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Building size={14} color="var(--primary-color)" /> Department
            </span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {staffMember.department || 'General'}
            </span>
          </div>

          <div
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Phone size={14} color="var(--primary-color)" /> Phone Number
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {staffMember.phone || 'Not specified'}
            </span>
          </div>

          <div
            style={{
              padding: '0.875rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Calendar size={14} color="var(--primary-color)" /> Member Since
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {formatDate(staffMember.createdAt)}
            </span>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              icon={Edit2}
              onClick={() => {
                onClose();
                onEdit(staffMember);
              }}
            >
              Edit Staff Profile
            </Button>
          )}
        </div>

      </div>
    </Modal>
  );
}
