'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  // Reset loading status when pathname or searchParams change (navigation finished)
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Listen to custom navigation start event
  useEffect(() => {
    const handleNavStart = () => {
      startTransition(() => {
        setLoading(true);
      });
    };

    window.addEventListener('page-navigation-start', handleNavStart);
    return () => window.removeEventListener('page-navigation-start', handleNavStart);
  }, []);

  // Global click interceptor for internal links, buttons with href, and navigation targets
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const clickable = e.target.closest('a[href^="/"], button[href^="/"], [data-href^="/"]');
      if (clickable) {
        const href = clickable.getAttribute('href') || clickable.getAttribute('data-href');
        if (href && href !== window.location.pathname && !href.startsWith('#')) {
          startTransition(() => {
            setLoading(true);
          });
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  if (!loading) return null;

  return (
    <>
      <div className="top-loader-bar" aria-hidden="true">
        <div className="top-loader-progress" />
      </div>
      <div className="top-loader-badge" role="status" aria-live="polite">
        <Loader2 className="animate-spin" size={15} style={{ color: 'var(--primary-color, #dc2626)' }} />
        <span>Loading page...</span>
      </div>
    </>
  );
}
