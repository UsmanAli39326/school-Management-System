'use client';

import React from 'react';
import clsx from 'clsx';
import styles from '@/styles/components.module.css';

export default function Card({
  children,
  hoverable = false,
  className,
  ...props
}) {
  return (
    <div
      className={clsx(styles.card, hoverable && styles.cardHover, className)}
      {...props}
    >
      {children}
    </div>
  );
}
