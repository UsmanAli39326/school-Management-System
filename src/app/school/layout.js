'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/common/Button';

export default function SchoolSimpleLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === '/school/dashboard' || pathname === '/school/dashboard/';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--app-bg)' }}>
      {!isDashboard && (
        <div style={{ padding: '1rem 2rem 0 2rem', display: 'flex', alignItems: 'center' }}>
          <Button 
            variant="outline" 
            icon={ArrowLeft} 
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
      )}
      {children}
    </div>
  );
}
