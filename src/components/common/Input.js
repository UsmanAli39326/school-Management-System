'use client';

import React from 'react';
import clsx from 'clsx';
import styles from '@/styles/components.module.css';

export default function Input({
  label,
  error,
  icon: Icon,
  className,
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={styles.fieldGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {Icon && (
          <span className={styles.inputIcon}>
            <Icon size={18} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={clsx(
            styles.input,
            Icon && styles.inputWithIcon,
            error && styles.inputError,
            className
          )}
          {...props}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
