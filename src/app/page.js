'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import PageLoader from '@/components/common/PageLoader';

export default function Home() {
  const { currentUser, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/login');
      } else if (role === 'SUPER_ADMIN') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/school/dashboard');
      }
    }
  }, [currentUser, role, loading, router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--app-bg)',
      width: '100%'
    }}>
      <PageLoader text="Redirecting to portal..." />
    </div>
  );
}