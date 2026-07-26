'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getFeeCollectionReport } from '@/firebase/db/fees';
import { getStudentsBySchool } from '@/firebase/db/students';
import { Download, ArrowLeft, DollarSign, Printer, Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function FeeCollectionReportPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [payments, setPayments] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPayments, fetchedStudents] = await Promise.all([
        getFeeCollectionReport(schoolId, startDate, endDate),
        getStudentsBySchool(schoolId)
      ]);

      const smap = {};
      fetchedStudents.forEach((s) => {
        smap[s.id] = s.personalInfo?.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
      });

      setPayments(fetchedPayments);
      setStudentsMap(smap);
    } catch (err) {
      console.error('Error loading collection report:', err);
      showAlert('Failed to load fee collection report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    loadData();
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.paidAmount || 0), 0);

  const handleExportCSV = () => {
    if (payments.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Receipt No,Date,Student Name,Payment Mode,Paid Amount,Remarks\n';

    payments.forEach((p) => {
      const receiptNo = p.receiptNumber || p.id;
      const dateStr = p.paymentDate?.toMillis ? new Date(p.paymentDate.toMillis()).toLocaleDateString() : 'N/A';
      const studentName = `"${studentsMap[p.studentId] || 'Student'}"`;
      const mode = p.paymentMethod || 'CASH';
      const amt = p.paidAmount || 0;
      const remarks = `"${p.remarks || ''}"`;
      csvContent += `${receiptNo},${dateStr},${studentName},${mode},${amt},${remarks}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Collection_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Back Button */}
        <div>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/reports')}>
            Back to Reports Hub
          </Button>
        </div>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Fee Collection Summary Report</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Audit payment receipts, payment methods, and historical fee collections</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={Printer} onClick={() => window.print()} className="no-print">
              Print
            </Button>
            <Button variant="primary" icon={Download} onClick={handleExportCSV} disabled={payments.length === 0}>
              Export CSV Report
            </Button>
          </div>
        </div>

        {/* Date Filter Card */}
        <Card style={{ padding: '1.25rem' }}>
          <form onSubmit={handleApplyFilter} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ width: '200px' }}>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ width: '200px' }}>
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" icon={DollarSign}>
              Apply Filter
            </Button>
          </form>
        </Card>

        {/* Total Summary */}
        <Card style={{ padding: '1.25rem', backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--status-success)', textTransform: 'uppercase' }}>Total Collections</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.125rem' }}>
              ${totalCollected.toLocaleString()}
            </div>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--status-success)' }}>
            {payments.length} Payment Receipts Recorded
          </span>
        </Card>

        {/* Report Table */}
        {loading ? (
          <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : payments.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
            <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Collection Records Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
              No payment receipts found matching the selected date range.
            </p>
          </Card>
        ) : (
          <Card style={{ padding: '0', overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '2px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1rem' }}>Receipt #</th>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem' }}>Student Name</th>
                    <th style={{ padding: '1rem' }}>Payment Mode</th>
                    <th style={{ padding: '1rem' }}>Paid Amount</th>
                    <th style={{ padding: '1rem' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{p.receiptNumber || p.id}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                        {p.paymentDate?.toMillis ? new Date(p.paymentDate.toMillis()).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {studentsMap[p.studentId] || 'Student'}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{p.paymentMethod || 'CASH'}</td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--status-success)' }}>
                        ${p.paidAmount}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{p.remarks || '—'}</td>
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
