'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Dangerous Action',
  description = 'Are you sure you want to perform this action? This step may have irreversible consequences.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  requireTextToConfirm = null, // e.g. "CONFIRM" or school name string
  isLoading = false
}) {
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedInput('');
    }
  }, [isOpen]);

  const isConfirmedDisabled =
    isLoading || (requireTextToConfirm && typedInput.trim() !== requireTextToConfirm.trim());

  const iconMap = {
    danger: <ShieldAlert size={28} style={{ color: 'var(--status-danger)', flexShrink: 0 }} />,
    warning: <AlertTriangle size={28} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />,
    primary: <Info size={28} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor:
              variant === 'danger'
                ? 'var(--status-danger-bg)'
                : variant === 'warning'
                ? 'var(--status-warning-bg)'
                : 'var(--primary-light)'
          }}
        >
          {iconMap[variant]}
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'var(--text-primary)',
                fontWeight: 500,
                lineHeight: 1.5
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {requireTextToConfirm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
              To confirm, type <strong>{requireTextToConfirm}</strong> in the box below:
            </p>
            <Input
              placeholder={`Type "${requireTextToConfirm}"...`}
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isConfirmedDisabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
