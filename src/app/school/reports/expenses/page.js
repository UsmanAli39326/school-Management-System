'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getExpenses } from '@/firebase/db/accounting';
import { Download, ArrowLeft, Receipt, Printer, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

const CATEGORIES = [
  'ALL',
  'Salaries & Payroll',
  'Utility Bills',
  'Office & Classroom Supplies',
  'Maintenance & Repairs',
  'Events & Functions',
  'Miscellaneous'
];

export default function ExpenseAuditReportPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      loadExpenses();
    }
  }, [schoolId]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await getExpenses(schoolId);
      setExpenses(data);
    } catch (err) {
      console.error('Error fetching expenses for audit:', err);
      showAlert('Failed to load expense audit report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
      return true;
    });
  }, [expenses, categoryFilter]);

  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Category,Vendor Name,Vendor Ref,Description,Amount\n';

    filteredExpenses.forEach((e) => {
      const dateStr = e.date?.toMillis ? new Date(e.date.toMillis()).toLocaleDateString() : 'N/A';
      const cat = `"${e.category || 'Misc'}"`;
      const vendor = `"${e.vendorName || ''}"`;
      const ref = `"${e.vendorRef || ''}"`;
      const desc = `"${e.description || ''}"`;
      const amt = e.amount || 0;
      csvContent += `${dateStr},${cat},${vendor},${ref},${desc},${amt}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_Audit_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Back Button */}
        <div>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/reports')}>
            Back to Reports Hub
          </Button>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Expense Audit & Ledger Report</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Comprehensive audit log of operational expenditures, vendors, and line items</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={Printer} onClick={() => window.print()} className="no-print">
              Print Report
            </Button>
            <Button variant="primary" icon={Download} onClick={handleExportCSV} disabled={filteredExpenses.length === 0}>
              Export CSV Report
            </Button>
          </div>
        </div>

        {/* Filter Card */}
        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ width: '240px' }}>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Expense Categories' : c}</option>
              ))}
            </Select>
          </div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Total Audit Expense: <strong style={{ fontSize: '1.25rem', color: 'var(--status-danger)' }}>${totalExpenseAmount.toLocaleString()}</strong>
          </div>
        </Card>

        {/* Table / Skeleton Loader */}
        {loading ? (
          <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : filteredExpenses.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
            <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Expense Audit Records Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              No logged expenses match the selected category filter.
            </p>
          </Card>
        ) : (
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Category</th>
                    <th style={{ padding: '1rem' }}>Vendor / Payee</th>
                    <th style={{ padding: '1rem' }}>Ref / Invoice #</th>
                    <th style={{ padding: '1rem' }}>Description</th>
                    <th style={{ padding: '1rem' }}>Amount ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>
                        {exp.date?.toMillis ? new Date(exp.date.toMillis()).toLocaleDateString() : new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ backgroundColor: 'var(--surface-hover)', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600 }}>
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {exp.vendorName || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {exp.vendorRef || '—'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {exp.description || '—'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--status-danger)' }}>
                        ${exp.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </ProtectedRoute>
  );
}
