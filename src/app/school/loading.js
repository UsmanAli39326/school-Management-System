import React from 'react';
import PageLoader from '@/components/common/PageLoader';

export default function SchoolLoading() {
  return (
    <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="skeleton-box" style={{ width: '220px', height: '32px' }} />
          <div className="skeleton-box" style={{ width: '340px', height: '18px' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="skeleton-box" style={{ width: '120px', height: '40px' }} />
          <div className="skeleton-box" style={{ width: '140px', height: '40px' }} />
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="skeleton-box" style={{ width: '100%', height: '140px', borderRadius: '0.875rem' }} />
      <div className="skeleton-box" style={{ width: '100%', height: '320px', borderRadius: '0.875rem' }} />
    </div>
  );
}
