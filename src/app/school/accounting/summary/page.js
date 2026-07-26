'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getMonthlyFinancialSummary } from '@/firebase/db/accounting';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FinancialSummaryPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth().toString());

  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    netBalance: 0,
    categoryBreakdown: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      loadSummary();
    }
  }, [schoolId, selectedYear, selectedMonth]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getMonthlyFinancialSummary(schoolId, Number(selectedYear), Number(selectedMonth));
      setSummary(data);
    } catch (err) {
      console.error('Error calculating financial summary:', err);
      showAlert('Failed to load financial summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedMonthName = `${MONTHS[Number(selectedMonth)]} ${selectedYear}`;

  const totalVolume = summary.income + summary.expenses || 1;
  const incomePct = Math.round((summary.income / totalVolume) * 100);
  const expensePct = Math.round((summary.expenses / totalVolume) * 100);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Financial Summary & Cash Flow</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Monthly income vs. expense metrics, net balances, and expenditure audit</p>
          </div>

          {/* Month / Year Filter */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '140px' }}>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </Select>
            </div>
            <div style={{ width: '100px' }}>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Top Summary Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '120px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Total Income */}
              <Card style={{ borderLeft: '5px solid var(--status-success)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84375rem', fontWeight: 600, textTransform: 'uppercase' }}>Monthly Income</p>
                    <h2 style={{ margin: '0.5rem 0', color: 'var(--status-success)', fontSize: '1.875rem', fontWeight: 800 }}>
                      +${summary.income.toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Collected student tuition & fees</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-success-bg)', borderRadius: '0.75rem', color: 'var(--status-success)' }}>
                    <TrendingUp size={26} />
                  </div>
                </div>
              </Card>

              {/* Total Expenses */}
              <Card style={{ borderLeft: '5px solid var(--status-danger)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84375rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Expenses</p>
                    <h2 style={{ margin: '0.5rem 0', color: 'var(--status-danger)', fontSize: '1.875rem', fontWeight: 800 }}>
                      -${summary.expenses.toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Logged operational expenditures</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--status-danger-bg)', borderRadius: '0.75rem', color: 'var(--status-danger)' }}>
                    <TrendingDown size={26} />
                  </div>
                </div>
              </Card>

              {/* Net Balance */}
              <Card style={{ borderLeft: '5px solid var(--primary-color)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84375rem', fontWeight: 600, textTransform: 'uppercase' }}>Net Cash Balance</p>
                    <h2 style={{ margin: '0.5rem 0', color: summary.netBalance >= 0 ? 'var(--text-primary)' : 'var(--status-danger)', fontSize: '1.875rem', fontWeight: 800 }}>
                      {summary.netBalance >= 0 ? '+' : ''}${summary.netBalance.toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Net surplus / deficit for {selectedMonthName}</p>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: '0.75rem', color: 'var(--primary-color)' }}>
                    <DollarSign size={26} />
                  </div>
                </div>
              </Card>

            </div>

            {/* Visual Cash Flow Bar */}
            <Card style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: 0, marginBottom: '1.25rem', fontSize: '1.125rem', fontWeight: 700 }}>
                Cash Flow Ratio ({selectedMonthName})
              </h3>

              <div style={{ height: '32px', display: 'flex', borderRadius: '1rem', overflow: 'hidden', backgroundColor: 'var(--surface-hover)' }}>
                {summary.income > 0 && (
                  <div
                    style={{
                      width: `${incomePct}%`,
                      backgroundColor: 'var(--status-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      transition: 'width 0.6s ease'
                    }}
                  >
                    {incomePct > 10 ? `Income ${incomePct}%` : ''}
                  </div>
                )}
                {summary.expenses > 0 && (
                  <div
                    style={{
                      width: `${expensePct}%`,
                      backgroundColor: 'var(--status-danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      transition: 'width 0.6s ease'
                    }}
                  >
                    {expensePct > 10 ? `Expenses ${expensePct}%` : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
                  <span>Collected Income: <strong>${summary.income.toLocaleString()}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Logged Expenses: <strong>${summary.expenses.toLocaleString()}</strong></span>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-danger)' }} />
                </div>
              </div>
            </Card>

            {/* Expense Categories Breakdown */}
            {Object.keys(summary.categoryBreakdown).length > 0 && (
              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, marginBottom: '1.25rem', fontSize: '1.125rem', fontWeight: 700 }}>
                  Expense Category Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {Object.entries(summary.categoryBreakdown).map(([cat, amt]) => {
                    const catPct = Math.round((amt / (summary.expenses || 1)) * 100);
                    return (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 }}>
                          <span>{cat}</span>
                          <span>${amt.toLocaleString()} ({catPct}%)</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${catPct}%`, backgroundColor: 'var(--status-danger)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
