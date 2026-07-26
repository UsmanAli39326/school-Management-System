'use client';

import { useState, useEffect, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getInvoices, collectPayment } from '@/firebase/db/fees';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getClasses } from '@/firebase/db/academic';
import { DollarSign, Search, CheckCircle2, Printer, ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

export default function FeeCollectionTab() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    discount: 0,
    fine: 0,
    paidAmount: 0,
    paymentMethod: 'CASH',
    remarks: ''
  });

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studs, cls, invs] = await Promise.all([
        getStudentsBySchool(schoolId),
        getClasses(schoolId),
        getInvoices(schoolId)
      ]);
      setStudents(studs);
      setClasses(cls);
      setInvoices(invs);
    } catch (err) {
      console.error('Error loading collection data:', err);
      showAlert('Failed to load fee collection data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return students
      .filter((s) => {
        const name = (s.personalInfo?.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
        const adm = (s.admissionNumber || s.rollNumber || s.id || '').toLowerCase();
        return name.includes(query) || adm.includes(query);
      })
      .slice(0, 5);
  }, [students, searchQuery]);

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : 'Class';
  };

  const getStudentInvoices = () => {
    if (!selectedStudent) return [];
    return invoices.filter((inv) => inv.studentId === selectedStudent.id && inv.status !== 'PAID');
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      discount: 0,
      fine: 0,
      paidAmount: invoice.remainingBalance,
      paymentMethod: 'CASH',
      remarks: ''
    });
    setIsPaymentModalOpen(true);
  };

  const handleCollect = async () => {
    if (!selectedInvoice) return;
    if (!paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0) {
      showAlert('Please enter a valid positive payment amount.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const payment = await collectPayment(schoolId, selectedInvoice, paymentForm);
      const updatedInvoices = await getInvoices(schoolId);
      setInvoices(updatedInvoices);

      setIsPaymentModalOpen(false);
      setReceiptData({
        student: selectedStudent,
        invoice: selectedInvoice,
        payment: payment,
        className: getClassName(selectedStudent.classId)
      });
      showAlert('Payment collected and official receipt generated!', 'success');
    } catch (error) {
      console.error('Error processing payment:', error);
      showAlert('Failed to process fee payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceiptData(null);
    setSelectedStudent(null);
    setSearchQuery('');
  };

  // -------------------------------------
  // RECEIPT VIEW (PRINTABLE)
  // -------------------------------------
  if (receiptData) {
    return (
      <div style={{ padding: '2rem', maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={closeReceipt}>
            Back to Fee Collection
          </Button>
          <Button variant="primary" icon={Printer} onClick={printReceipt}>
            Print Official Receipt
          </Button>
        </div>

        <Card style={{ padding: '3rem', border: '1px solid var(--surface-border)', boxShadow: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px dashed var(--surface-border)', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Official School Fee Receipt</h2>
            <h1 style={{ margin: '0.5rem 0', color: 'var(--primary-color)', fontSize: '1.75rem', fontWeight: 800 }}>
              {receiptData.payment.receiptNumber || `REC-${Date.now()}`}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', margin: 0 }}>
              Payment Date: {new Date().toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.875rem' }}>
            <div>
              <p style={{ margin: '0 0 0.375rem 0' }}>Student Name: <strong>{receiptData.student.personalInfo?.fullName || 'Student'}</strong></p>
              <p style={{ margin: '0 0 0.375rem 0' }}>Admission No: <strong>{receiptData.student.admissionNumber || receiptData.student.studentId}</strong></p>
              <p style={{ margin: 0 }}>Class: <strong>{receiptData.className}</strong></p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 0.375rem 0' }}>Invoice Number: <strong>{receiptData.invoice.invoiceNumber}</strong></p>
              <p style={{ margin: '0 0 0.375rem 0' }}>Fee Month: <strong>{receiptData.invoice.feeMonth}</strong></p>
              <p style={{ margin: 0 }}>Payment Mode: <strong>{receiptData.payment.paymentMethod}</strong></p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '2rem', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                <th style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>Description</th>
                <th style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--text-secondary)' }}>Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                <td style={{ padding: '0.75rem 0', fontWeight: 600 }}>{receiptData.invoice.feeType} Fee Base Amount</td>
                <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>${receiptData.invoice.amount}</td>
              </tr>
              {Number(receiptData.payment.discount) > 0 && (
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--status-success)' }}>Concession / Discount</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--status-success)', fontWeight: 600 }}>-${receiptData.payment.discount}</td>
                </tr>
              )}
              {Number(receiptData.payment.fine) > 0 && (
                <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <td style={{ padding: '0.75rem 0', color: 'var(--status-danger)' }}>Late Fine / Arrears</td>
                  <td style={{ padding: '0.75rem 0', textAlign: 'right', color: 'var(--status-danger)', fontWeight: 600 }}>+${receiptData.payment.fine}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '1rem 0 0 0', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Amount Paid</td>
                <td style={{ padding: '1rem 0 0 0', textAlign: 'right', fontWeight: 800, fontSize: '1.25rem', color: 'var(--status-success)' }}>
                  ${receiptData.payment.paidAmount}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
            <p style={{ margin: '0 0 0.25rem 0' }}>Thank you for your payment!</p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>This is an official computer-generated fee receipt.</p>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------
  // MAIN COLLECTION VIEW
  // -------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Sub Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Fee Payment Collection</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Search student records, process fee payments, and issue computer-generated receipts</p>
      </div>

      {loading ? (
        <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Student Search & Selection */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card style={{ padding: '1.25rem' }}>
              <Input
                icon={Search}
                label="Search Student Record"
                placeholder="Type Student Name or Admission No..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedStudent(null);
                }}
              />

              {!selectedStudent && searchQuery.trim() && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--surface-border)', borderRadius: '0.625rem', overflow: 'hidden' }}>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudent(s)}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--surface-card)',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                            {s.personalInfo?.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                            Adm: {s.admissionNumber || s.id} • {getClassName(s.classId)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84375rem' }}>
                      No student records found
                    </div>
                  )}
                </div>
              )}
            </Card>

            {selectedStudent && (
              <Card style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)', padding: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.84375rem', textTransform: 'uppercase', color: 'var(--primary-color)', letterSpacing: '0.05em' }}>Selected Student</h4>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.375rem' }}>
                  {selectedStudent.personalInfo?.fullName || `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim() || 'Student'}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', marginTop: '0.25rem' }}>
                  Admission No: <strong>{selectedStudent.admissionNumber || selectedStudent.id}</strong>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.84375rem', marginTop: '0.125rem' }}>
                  Class Level: <strong>{getClassName(selectedStudent.classId)}</strong>
                </div>
                <Button variant="outline" onClick={() => setSelectedStudent(null)} style={{ marginTop: '1rem', width: '100%' }}>
                  Clear Selected Student
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column: Pending Invoices */}
          <div className="lg:col-span-8">
            {selectedStudent ? (
              <Card style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: 0, marginBottom: '1.25rem', fontSize: '1.125rem', fontWeight: 700 }}>Pending Invoices</h3>

                {getStudentInvoices().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={40} style={{ color: 'var(--status-success)', marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>No Pending Fee Invoices</p>
                    <p style={{ fontSize: '0.84375rem', marginTop: '0.25rem' }}>This student is fully paid up with zero outstanding balance!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {getStudentInvoices().map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          padding: '1.25rem',
                          border: '1px solid var(--surface-border)',
                          borderRadius: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '1rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                            {inv.feeType} Fee ({inv.feeMonth})
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                            Invoice #: <strong>{inv.invoiceNumber}</strong>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                            Status: <strong style={{ color: inv.status === 'PARTIAL' ? 'var(--status-warning)' : 'var(--status-danger)' }}>{inv.status}</strong>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-danger)', marginBottom: '0.5rem' }}>
                            ${inv.remainingBalance}
                          </div>
                          <Button variant="primary" icon={CreditCard} onClick={() => openPaymentModal(inv)}>
                            Collect Payment
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card style={{ textAlign: 'center', padding: '4rem 2rem', border: '2px dashed var(--surface-border)' }}>
                <Receipt size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', margin: 0 }}>
                  Search and select a student from the left panel to display pending fee invoices.
                </p>
              </Card>
            )}
          </div>

        </div>
      )}

      {/* Payment Processing Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => !isProcessing && setIsPaymentModalOpen(false)} title="Collect Fee Payment">
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--surface-hover)', padding: '1rem 1.25rem', borderRadius: '0.625rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoice Amount</span>
                <strong>${selectedInvoice.amount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9375rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Remaining Balance Due</span>
                <strong style={{ color: 'var(--status-danger)', fontSize: '1.25rem', fontWeight: 800 }}>${selectedInvoice.remainingBalance}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Concession / Discount ($)"
                type="number"
                min="0"
                value={paymentForm.discount}
                onChange={(e) => setPaymentForm({ ...paymentForm, discount: e.target.value })}
              />
              <Input
                label="Fine / Late Charge ($)"
                type="number"
                min="0"
                value={paymentForm.fine}
                onChange={(e) => setPaymentForm({ ...paymentForm, fine: e.target.value })}
              />
            </div>

            <Select
              label="Payment Mode *"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
            >
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online Payment</option>
              <option value="CHEQUE">Cheque / Demand Draft</option>
            </Select>

            <Input
              label="Amount Paying Now ($) *"
              type="number"
              min="1"
              value={paymentForm.paidAmount}
              onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
              required
            />

            <Input
              label="Remarks / Reference Number"
              placeholder="e.g. Transaction ID, Bank Slip #"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
            />

            <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '1rem', borderRadius: '0.625rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Total Collected Amount:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>${paymentForm.paidAmount || 0}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button type="button" variant="primary" icon={Printer} onClick={handleCollect} disabled={isProcessing || !paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0} isLoading={isProcessing}>
                Confirm & Issue Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
