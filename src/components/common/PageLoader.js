'use client';

import React from 'react';
import { Loader2, GraduationCap } from 'lucide-react';

export default function PageLoader({ text = 'Loading page...' }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.25rem',
      padding: '2rem',
      width: '100%'
    }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '4.5rem',
        height: '4.5rem',
        borderRadius: '1.25rem',
        backgroundColor: 'var(--primary-light, #fef2f2)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <GraduationCap size={36} style={{ color: 'var(--primary-color, #dc2626)' }} />
        <div style={{
          position: 'absolute',
          inset: '-6px',
          borderRadius: '1.5rem',
          border: '2px dashed var(--primary-color, #dc2626)',
          opacity: 0.4,
          animation: 'spin 8s linear infinite'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--primary-color, #dc2626)' }} />
        <span>{text}</span>
      </div>
    </div>
  );
}