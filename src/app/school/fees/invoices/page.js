'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getInvoices, generateInvoicesForClass, getFeeStructures } from '@/firebase/db/fees';
import { getClasses } from '@/firebase/db/academic';
import { getStudentsBySchool } from '@/firebase/db/students';
import { FileText, Plus, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InvoicesPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [genClassId, setGenClassId] = useState('');
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [invs, cls, studs] = await Promise.all([
      getInvoices(schoolId),
      getClasses(schoolId),
      getStudentsBySchool(schoolId)
    ]);
    setInvoices(invs);
    setClasses(cls);
    setStudents(studs);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!genClassId || !genMonth) return;
    
    setGenerating(true);
    
    try {
      const cls = classes.find(c => c.id === genClassId);
      if (!cls) throw new Error("Class not found");
      
      const structures = await getFeeStructures(schoolId);
      const levelStructures = structures.filter(s => s.level === cls.level);
      
      if (levelStructures.length === 0) {
        alert(`No fee structures found for level: ${cls.level}. Please create them first.`);
        setGenerating(false);
        return;
      }
      
      const classStudents = students.filter(s => s.classId === genClassId && s.academicDetails.status === 'ACTIVE');
      
      if (classStudents.length === 0) {
        alert("No active students found in this class.");
        setGenerating(false);
        return;
      }
      
      await generateInvoicesForClass(schoolId, genClassId, classStudents, levelStructures, genMonth);
      
      alert(`Successfully generated invoices for ${classStudents.length} students.`);
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  };

  const getStudentName = (studentId) => {
    const s = students.find(s => s.id === studentId);
    return s ? s.personalInfo.fullName : 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'var(--success-color)';
      case 'PARTIAL': return 'var(--warning-color)';
      case 'OVERDUE': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter && inv.status !== statusFilter) return false;
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText color="var(--primary-color)" /> Invoices
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage and generate student fee invoices</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Generate Invoices
            </Button>
          </div>
        </div>

        <Card style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <div style={{ width: '200px' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
            >
              <option value="">All Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </Card>

        {loading ? (
          <p>Loading invoices...</p>
        ) : filteredInvoices.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No invoices found. Generate monthly invoices to start collecting fees.
            </p>
          </Card>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Invoice No</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Student</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Month</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Amount</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Balance</th>
                  <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '1rem' }}>{getStudentName(inv.studentId)}</td>
                    <td style={{ padding: '1rem' }}>{inv.feeMonth}</td>
                    <td style={{ padding: '1rem' }}>{inv.feeType}</td>
                    <td style={{ padding: '1rem' }}>{inv.amount}</td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{inv.remainingBalance}</td>
                    <td style={{ padding: '1rem', color: getStatusColor(inv.status), fontWeight: 600 }}>
                      {inv.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Invoices Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Monthly Invoices">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              This will generate an invoice for every active student in the selected class based on the fee structures defined for their class level.
            </p>
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Class</label>
              <select 
                value={genClassId}
                onChange={(e) => setGenClassId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Fee Month</label>
              <input 
                type="month"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <Button variant="primary" onClick={handleGenerate} disabled={generating || !genClassId} icon={generating ? null : Check} style={{ marginTop: '1rem' }}>
              {generating ? 'Generating...' : 'Generate Invoices'}
            </Button>
          </div>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
