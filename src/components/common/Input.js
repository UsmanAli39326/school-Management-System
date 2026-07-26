'use client';

import React from 'react';
import clsx from 'clsx';
import styles from '@/styles/components.module.css';

export default function Input({
  label,
  error,
  icon: Icon,
  rightElement,
  className,
  id,
  type = 'text',
  required,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorId = inputId ? `${inputId}-error` : undefined;

  return (
    <div className={styles.fieldGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.requiredAsterisk}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {Icon && (
          <span className={styles.inputIcon} aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={clsx(
            styles.input,
            Icon && styles.inputWithIcon,
            rightElement && styles.inputWithRightElement,
            error && styles.inputError,
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {rightElement && (
          <span className={styles.inputRightElement}>
            {rightElement}
          </span>
        )}
      </div>
      {error && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
