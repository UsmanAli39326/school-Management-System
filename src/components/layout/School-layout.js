'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import SchoolShell from '@/components/layout/SchoolShell';

export default function SchoolLayout({ children }) {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--app-bg)',
                gap: '0.75rem',
                color: 'var(--text-secondary)',
            }}>
                <Loader2 className="animate-spin" size={26} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontWeight: 500 }}>Loading your portal...</span>
            </div>
        );
    }

    if (!currentUser) {
        return null;
    }

    // Individual pages still use <ProtectedRoute allowedRoles={[...]}> internally
    // for role-based access control; this layout only guarantees an authenticated
    // session and provides the persistent shell around every school route.
    return <SchoolShell>{children}</SchoolShell>;
}