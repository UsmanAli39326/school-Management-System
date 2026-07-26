'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { BarChart3, Users, AlertCircle, DollarSign, Receipt, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportsHubPage() {
  const router = useRouter();

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 color="var(--primary-color)" size={32} /> Reports & Analytics Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Centralized financial audit reports, defaulter tracking, fee collections, and student master directories</p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">

          {/* Report 1: Defaulters / Due Fees */}
          <Card hoverable style={{ borderTop: '5px solid var(--status-danger)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-danger-bg)', borderRadius: '0.75rem', color: 'var(--status-danger)' }}>
                  <AlertCircle size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Due Fees & Defaulters</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Track students with overdue fee invoices and outstanding balance balances. Send overdue fee reminders.
              </p>
            </div>
            <Button variant="outline" icon={ArrowRight} onClick={() => router.push('/school/reports/due-fees')}>
              View Defaulters Report
            </Button>
          </Card>

          {/* Report 2: Fee Collections */}
          <Card hoverable style={{ borderTop: '5px solid var(--status-success)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-success-bg)', borderRadius: '0.75rem', color: 'var(--status-success)' }}>
                  <DollarSign size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Fee Collections Summary</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Detailed report of payment receipts, payment channels (Cash, Bank, Online), and collection history by date range.
              </p>
            </div>
            <Button variant="outline" icon={ArrowRight} onClick={() => router.push('/school/reports/collections')}>
              View Collection Report
            </Button>
          </Card>

          {/* Report 3: Expense Audit */}
          <Card hoverable style={{ borderTop: '5px solid var(--status-warning)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-warning-bg)', borderRadius: '0.75rem', color: 'var(--status-warning)' }}>
                  <Receipt size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Expense Audit & Ledger</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Comprehensive ledger of school operational expenses, vendor details, category breakdowns, and receipt attachments.
              </p>
            </div>
            <Button variant="outline" icon={ArrowRight} onClick={() => router.push('/school/reports/expenses')}>
              View Expense Audit
            </Button>
          </Card>

          {/* Report 4: Student Master List */}
          <Card hoverable style={{ borderTop: '5px solid var(--primary-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.75rem', color: 'var(--primary-color)' }}>
                  <Users size={24} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Student Master Directory</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Master list of all admitted students across classes, sections, academic levels, and guardian contacts.
              </p>
            </div>
            <Button variant="outline" icon={ArrowRight} onClick={() => router.push('/school/reports/students')}>
              View Master Directory
            </Button>
          </Card>

        </div>

      </div>
    </ProtectedRoute>
  );
}
