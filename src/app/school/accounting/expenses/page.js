'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getExpenses, deleteExpense } from '@/firebase/db/accounting';
import ExpenseFormModal from '@/components/accounting/ExpenseFormModal';
import { Receipt, Plus, Trash2, ExternalLink } from 'lucide-react';

export default function ExpensesPage() {
  const { schoolId } = useAuth();
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    if (schoolId) {
      loadExpenses();
    }
  }, [schoolId]);

  const loadExpenses = async () => {
    setLoading(true);
    const data = await getExpenses(schoolId);
    setExpenses(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      await deleteExpense(id);
      loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (categoryFilter && exp.category !== categoryFilter) return false;
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Receipt color="var(--primary-color)" /> Expenses
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Track and manage school expenditures</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Expense
          </Button>
        </div>

        <Card style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <div style={{ width: '250px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Filter by Category</label>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
            >
              <option value="">All Categories</option>
              <option value="Utility Bills">Utility Bills</option>
              <option value="Office Expenses">Office Expenses</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <p>Loading expenses...</p>
        ) : filteredExpenses.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <Receipt size={48} color="var(--text-tertiary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3>No Expenses Logged</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No expense records found matching the current criteria.</p>
          </Card>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Category</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Description</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Amount</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Receipt</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>
                      {exp.date?.toMillis ? new Date(exp.date.toMillis()).toLocaleDateString() : new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{exp.description}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{exp.amount}</td>
                    <td style={{ padding: '1rem' }}>
                      {exp.receiptUrl ? (
                        <a href={exp.receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
                          <ExternalLink size={16} /> View
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button onClick={() => handleDelete(exp.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExpenseFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={loadExpenses}
        />

      </div>
    </ProtectedRoute>
  );
}
