'use client';

import React from 'react';
import clsx from 'clsx';
import styles from '@/styles/components.module.css';

export default function Badge({
  children,
  variant = 'info',
  icon: Icon,
  className,
  ...props
}) {
  const variantClass = {
    success: styles.badgeSuccess,
    danger: styles.badgeDanger,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
  }[variant] || styles.badgeInfo;

  return (
    <span className={clsx(styles.badge, variantClass, className)} {...props}>
      {Icon && <Icon size={12} />}
      <span>{children}</span>
    </span>
  );
}
