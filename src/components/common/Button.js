'use client';

import React from 'react';
import Link from 'next/link';
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
  iconPosition = 'left',
  className,
  type = 'button',
  href,
  onClick,
  ...props
}) {
  const variantClass = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    outline: styles.btnOutline,
    danger: styles.btnDanger,
    ghost: styles.btnSecondary,
  }[variant] || styles.btnPrimary;

  const renderIcon = () => {
    if (isLoading) return <Loader2 className="animate-spin" size={18} aria-hidden="true" />;
    if (Icon) return <Icon size={18} aria-hidden="true" />;
    return null;
  };

  const content = (
    <>
      {iconPosition === 'left' && renderIcon()}
      {children && <span>{children}</span>}
      {iconPosition === 'right' && renderIcon()}
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={clsx(styles.btn, variantClass, className)}
        onClick={onClick}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={clsx(styles.btn, variantClass, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}


