'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { getMonthlyFinancialSummary } from '@/firebase/db/accounting';
import { PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function FinancialSummaryPage() {
  const { schoolId } = useAuth();
  
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    netBalance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      loadSummary();
    }
  }, [schoolId]);

  const loadSummary = async () => {
    setLoading(true);
    const data = await getMonthlyFinancialSummary(schoolId);
    setSummary(data);
    setLoading(false);
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Helper for progress bar
  const totalVolume = summary.income + summary.expenses || 1; // avoid div by 0
  const incomePct = (summary.income / totalVolume) * 100;
  const expensePct = (summary.expenses / totalVolume) * 100;

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, marginBottom: '0.5rem' }}>
            <PieChart color="var(--primary-color)" /> Financial Summary
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Income vs Expenses for <strong>{currentMonthName}</strong>
          </p>
        </div>

        {loading ? (
          <p>Loading financial data...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              
              <Card style={{ borderLeft: '4px solid var(--success-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Income</p>
                    <h2 style={{ margin: '0.5rem 0', color: 'var(--success-color)' }}>+{summary.income.toLocaleString()}</h2>
                    <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>From student fee collections</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-light)', borderRadius: '0.5rem', color: 'var(--success-color)' }}>
                    <TrendingUp size={24} />
                  </div>
                </div>
              </Card>

              <Card style={{ borderLeft: '4px solid var(--danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Expenses</p>
                    <h2 style={{ margin: '0.5rem 0', color: 'var(--danger)' }}>-{summary.expenses.toLocaleString()}</h2>
                    <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>From logged expenses</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', color: 'var(--danger)' }}>
                    <TrendingDown size={24} />
                  </div>
                </div>
              </Card>

              <Card style={{ borderLeft: '4px solid var(--primary-color)', backgroundColor: summary.netBalance >= 0 ? 'var(--bg-color)' : '#fee2e2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Net Balance</p>
                    <h2 style={{ margin: '0.5rem 0', color: summary.netBalance >= 0 ? 'var(--text-primary)' : 'var(--danger)' }}>
                      {summary.netBalance >= 0 ? '+' : ''}{summary.netBalance.toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Profit / Loss for the month</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.5rem', color: 'var(--primary-color)' }}>
                    <DollarSign size={24} />
                  </div>
                </div>
              </Card>

            </div>

            {/* Visual Bar */}
            <Card>
              <h3 style={{ margin: 0, marginBottom: '1.5rem' }}>Cash Flow Comparison</h3>
              
              <div style={{ height: '32px', display: 'flex', borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                {summary.income > 0 && (
                  <div 
                    style={{ 
                      width: `${incomePct}%`, 
                      backgroundColor: 'var(--success-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                      transition: 'width 1s ease-in-out'
                    }}
                  >
                    {incomePct > 10 ? `${Math.round(incomePct)}%` : ''}
                  </div>
                )}
                {summary.expenses > 0 && (
                  <div 
                    style={{ 
                      width: `${expensePct}%`, 
                      backgroundColor: 'var(--danger)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                      transition: 'width 1s ease-in-out'
                    }}
                  >
                    {expensePct > 10 ? `${Math.round(expensePct)}%` : ''}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></div>
                  Income
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Expenses
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--danger)' }}></div>
                </div>
              </div>
            </Card>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
