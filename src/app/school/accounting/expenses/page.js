'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { getExpenses, deleteExpense } from '@/firebase/db/accounting';
import ExpenseFormModal from '@/components/accounting/ExpenseFormModal';
import { Receipt, Plus, Trash2, ExternalLink, Search, Inbox } from 'lucide-react';
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

export default function ExpensesPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Confirmation Modal (UX §7)
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      console.error('Error fetching expenses:', err);
      showAlert('Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteExpense(expenseToDelete.id);
      showAlert('Expense entry deleted', 'success');
      setExpenseToDelete(null);
      loadExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      showAlert('Failed to delete expense entry', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        (exp.description && exp.description.toLowerCase().includes(query)) ||
        (exp.vendorName && exp.vendorName.toLowerCase().includes(query)) ||
        (exp.vendorRef && exp.vendorRef.toLowerCase().includes(query));
      return matchesCat && matchesSearch;
    });
  }, [expenses, categoryFilter, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Expense Management</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Record and audit operational school expenditures, vendors, and receipts</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Record New Expense
          </Button>
        </div>

        {/* Search & Category Filters (UX §10) */}
        <Card style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input
              placeholder="Search expenses by vendor name, ref, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div style={{ width: '220px' }}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
              ))}
            </Select>
          </div>
        </Card>

        {/* Table / Skeleton Loader */}
        {loading ? (
          <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : filteredExpenses.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
            <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Expenses Logged</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              No expenditure records matched your search or category filter.
            </p>
            {categoryFilter === 'ALL' && !searchQuery && (
              <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
                Log First Expense
              </Button>
            )}
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
                    <th style={{ padding: '1rem' }}>Description</th>
                    <th style={{ padding: '1rem' }}>Amount</th>
                    <th style={{ padding: '1rem' }}>Receipt</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
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
                        {exp.vendorName || 'N/A'} {exp.vendorRef && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({exp.vendorRef})</span>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{exp.description || '—'}</td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--status-danger)' }}>${exp.amount}</td>
                      <td style={{ padding: '1rem' }}>
                        {exp.receiptUrl ? (
                          <a href={exp.receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>
                            <ExternalLink size={15} /> View File
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => setExpenseToDelete(exp)} style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }} title="Delete Expense">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Expense Form Modal */}
        <ExpenseFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadExpenses}
        />

        {/* Delete Confirmation Modal (UX §7) */}
        <ConfirmationModal
          isOpen={!!expenseToDelete}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Expense Record?"
          description="Are you sure you want to delete this school expense entry? This will update net balance calculations."
          confirmText="Delete Expense"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

      </div>
    </ProtectedRoute>
  );
}
