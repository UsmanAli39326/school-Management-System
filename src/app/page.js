'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

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
      color: 'var(--text-secondary)',
      gap: '0.75rem'
    }}>
      <Loader2 className="animate-spin" size={28} style={{ color: 'var(--primary-color)' }} />
      <span style={{ fontWeight: 500 }}>Redirecting to portal...</span>
    </div>
  );
}
