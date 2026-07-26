'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FeeCollectionTab from './FeeCollectionTab';
import InvoicesTab from './InvoicesTab';
import StructuresTab from './StructuresTab';
import { Wallet, Receipt, Settings } from 'lucide-react';

function FeeManagementContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'collection';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['collection', 'invoices', 'structures'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">
      <div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, marginBottom: '0.5rem' }}>
          <Wallet color="var(--primary-color)" size={32} /> Fee Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Manage fee structures, generate invoices, and collect payments all in one place.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-none gap-2 border-b border-slate-200 mb-4">
        <button
          onClick={() => setActiveTab('collection')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'collection' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'collection' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'collection' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          <Wallet size={18} /> Collection
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'invoices' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'invoices' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'invoices' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          <Receipt size={18} /> Invoices
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'structures' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'structures' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'structures' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1rem',
            transition: 'all 0.2s',
          }}
        >
          <Settings size={18} /> Structures
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'collection' && <FeeCollectionTab />}
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'structures' && <StructuresTab />}
      </div>
    </div>
  );
}

export default function FeeManagementPage() {
  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading fee management...</div>}>
        <FeeManagementContent />
      </Suspense>
    </ProtectedRoute>
  );
}
