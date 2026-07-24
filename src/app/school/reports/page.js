'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { BarChart3, Users, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsHubPage() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 color="var(--primary-color)" /> Reports Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Centralized reports and analytics for the institution.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          <Card hoverable style={{ borderTop: '4px solid var(--danger)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: 'var(--danger)' }}>
                <AlertCircle size={24} />
              </div>
              <h2 style={{ margin: 0 }}>Due Fees Report</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              List of all students with pending or overdue fee payments. Often referred to as the Defaulters List.
            </p>
            <Button variant="outline" onClick={() => router.push('/school/reports/due-fees')}>
              View Report
            </Button>
          </Card>

          <Card hoverable style={{ borderTop: '4px solid var(--primary-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', color: 'var(--primary-color)' }}>
                <Users size={24} />
              </div>
              <h2 style={{ margin: 0 }}>Student List Report</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Comprehensive master list of all admitted students across all classes and sections.
            </p>
            <Button variant="outline" onClick={() => router.push('/school/reports/students')}>
              View Report
            </Button>
          </Card>

        </div>

      </div>
    </ProtectedRoute>
  );
}
