'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SuperAdminShell from '@/components/layout/SuperAdminShell';

export default function SuperAdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
      <SuperAdminShell>
        {children}
      </SuperAdminShell>
    </ProtectedRoute>
  );
}
