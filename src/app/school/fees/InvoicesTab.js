'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Select from '@/components/common/Select';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { getInvoices, generateInvoicesForClass, getFeeStructures } from '@/firebase/db/fees';
import { getClasses } from '@/firebase/db/academic';
import { getStudentsBySchool } from '@/firebase/db/students';
import { FileText, Plus, Check, Inbox, Filter } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

export default function InvoicesTab() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [invoices, setInvoices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [genClassId, setGenClassId] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, cls, studs] = await Promise.all([
        getInvoices(schoolId),
        getClasses(schoolId),
        getStudentsBySchool(schoolId)
      ]);
      setInvoices(invs);
      setClasses(cls);
      setStudents(studs);
    } catch (err) {
      console.error('Error loading invoices data:', err);
      showAlert('Failed to load invoice records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genClassId || !genMonth) return;

    setGenerating(true);
    try {
      const cls = classes.find((c) => c.id === genClassId);
      if (!cls) throw new Error('Class not found');

      const structures = await getFeeStructures(schoolId);
      const levelStructures = structures.filter((s) => s.level === cls.level);

      if (levelStructures.length === 0) {
        showAlert(`No fee structures found for level: ${cls.level}. Please create them first.`, 'error');
        setGenerating(false);
        return;
      }

      const classStudents = students.filter(
        (s) => s.classId === genClassId && (s.academicDetails?.status === 'ACTIVE' || !s.academicDetails?.status)
      );

      if (classStudents.length === 0) {
        showAlert('No active students found in this class.', 'error');
        setGenerating(false);
        return;
      }

      const result = await generateInvoicesForClass(schoolId, genClassId, classStudents, levelStructures, genMonth);

      showAlert(`Generated ${result.createdCount || 0} new invoice(s). ${result.skippedCount || 0} existing invoice(s) preserved.`, 'success');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showAlert('Failed to generate invoices.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const getStudentName = (studentId) => {
    const s = students.find((st) => st.id === studentId);
    if (!s) return 'Unknown Student';
    return s.personalInfo?.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">PAID</Badge>;
      case 'PARTIAL':
        return <Badge variant="warning">PARTIAL</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      default:
        return <Badge variant="info">UNPAID</Badge>;
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      return true;
    });
  }, [invoices, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Fee Invoices & Billing</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Automated fee invoice generation for class rosters</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Generate Class Invoices
        </Button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-none gap-2 items-center">
        {['ALL', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.84375rem',
              fontWeight: statusFilter === status ? 700 : 500,
              border: '1px solid',
              borderColor: statusFilter === status ? 'var(--primary-color)' : 'var(--surface-border)',
              backgroundColor: statusFilter === status ? 'var(--primary-color)' : 'var(--surface-card)',
              color: statusFilter === status ? '#fff' : 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Invoices List / Skeleton */}
      {loading ? (
        <div style={{ height: '250px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      ) : filteredInvoices.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
          <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Invoices Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            No invoice records matched the current filter. Generate monthly invoices to start tracking payments.
          </p>
          {statusFilter === 'ALL' && (
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
              Generate Invoices Now
            </Button>
          )}
        </Card>
      ) : (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]" style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Student Name</th>
                  <th style={{ padding: '1rem' }}>Fee Month</th>
                  <th style={{ padding: '1rem' }}>Fee Category</th>
                  <th style={{ padding: '1rem' }}>Total Amount</th>
                  <th style={{ padding: '1rem' }}>Balance Due</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{getStudentName(inv.studentId)}</td>
                    <td style={{ padding: '1rem' }}>{inv.feeMonth}</td>
                    <td style={{ padding: '1rem' }}>{inv.feeType}</td>
                    <td style={{ padding: '1rem' }}>${inv.amount}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: inv.remainingBalance > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                      ${inv.remainingBalance}
                    </td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(inv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal for Invoices Generation */}
      <Modal isOpen={isModalOpen} onClose={() => !generating && setIsModalOpen(false)} title="Generate Monthly Invoices">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
            Automated billing will generate fee invoices for all active students in the selected class based on their class level fee structure. Existing paid/unpaid invoices will be preserved.
          </p>

          <Select
            label="Target Class *"
            value={genClassId}
            onChange={(e) => setGenClassId(e.target.value)}
            placeholder="Select Class"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Billing Month *</label>
            <input
              type="month"
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-card)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button type="button" variant="primary" icon={Check} onClick={handleGenerate} disabled={generating || !genClassId} isLoading={generating}>
              Generate Invoices
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
