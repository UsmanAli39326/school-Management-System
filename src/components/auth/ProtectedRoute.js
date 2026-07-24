'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
        // Redirect based on role if access denied for target route
        if (role === 'SUPER_ADMIN') {
          router.push('/super-admin/dashboard');
        } else {
          router.push('/school/dashboard');
        }
      }
    }
  }, [currentUser, role, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--app-bg)',
        gap: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary-color)' }} />
        <span style={{ fontWeight: 500 }}>Authenticating session...</span>
      </div>
    );
  }

  if (!currentUser || (allowedRoles.length > 0 && (!role || !allowedRoles.includes(role)))) {
    return null;
  }

  return <>{children}</>;
}
