'use client';

import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import styles from '@/styles/components.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className,
  type = 'button',
  ...props
}) {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    outline: styles.btnOutline,
    danger: styles.btnDanger,
  }[variant] || styles.btnPrimary;

  return (
    <button
      type={type}
      className={clsx(styles.btn, variantClass, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={18} aria-hidden="true" />
      ) : Icon ? (
        <Icon size={18} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
