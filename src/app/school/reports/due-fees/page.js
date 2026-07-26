'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDefaulters } from '@/firebase/db/reports';
import { AlertCircle, Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DueFeesReportPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      getDefaulters(schoolId).then(data => {
        setDefaulters(data);
        setLoading(false);
      });
    }
  }, [schoolId]);

  const handlePrint = () => {
    window.print();
  };

  const totalOutstanding = defaulters.reduce((acc, curr) => acc + curr.totalDue, 0);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <AlertCircle color="var(--danger)" /> Due Fees Report
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.25rem' }}>Defaulters List</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="outline" icon={Printer} onClick={handlePrint}>Print Report</Button>
          </div>
        </div>

        <Card style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5' }}>
          <div style={{ textAlign: 'center', color: 'var(--danger)' }}>
            <p style={{ margin: 0, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem' }}>Total Outstanding Amount</p>
            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem' }}>PKR {totalOutstanding.toLocaleString()}</h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>Across {defaulters.length} students</p>
          </div>
        </Card>

        {loading ? (
          <p>Analyzing invoices...</p>
        ) : defaulters.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <AlertCircle size={48} color="var(--success-color)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3>No Defaulters Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>All students have cleared their dues.</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Student Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Admission #</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Unpaid Invoices</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Total Due</th>
                  </tr>
                </thead>
                <tbody>
                  {defaulters.map(d => (
                    <tr key={d.student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <a href={`/school/students/${d.student.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                             {d.student.personalInfo?.fullName}
                           </a>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>{d.student.admissionNumber}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {d.invoices.map(inv => (
                            <span key={inv.invoiceId} style={{ 
                              backgroundColor: 'var(--bg-secondary)', 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}>
                              {inv.feeType} ({inv.feeMonth})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--danger)', textAlign: 'right' }}>
                        {d.totalDue.toLocaleString()}
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
