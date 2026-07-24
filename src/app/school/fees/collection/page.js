'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getInvoices, collectPayment } from '@/firebase/db/fees';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getClasses } from '@/firebase/db/academic';
import { DollarSign, Search, CheckCircle, Printer } from 'lucide-react';

export default function FeeCollectionPage() {
  const { schoolId } = useAuth();
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
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
      Promise.all([
        getStudentsBySchool(schoolId),
        getClasses(schoolId),
        getInvoices(schoolId)
      ]).then(([studs, cls, invs]) => {
        setStudents(studs);
        setClasses(cls);
        setInvoices(invs);
      });
    }
  }, [schoolId]);

  const filteredStudents = students.filter(s => {
    if (!searchQuery) return false;
    return s.personalInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
  }).slice(0, 5); // show max 5 results

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : '';
  };

  const getStudentInvoices = () => {
    if (!selectedStudent) return [];
    return invoices.filter(inv => inv.studentId === selectedStudent.id && inv.status !== 'PAID');
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
    setIsProcessing(true);
    
    try {
      const payment = await collectPayment(schoolId, selectedInvoice, paymentForm);
      
      // Update local state to reflect payment
      const updatedInvoices = await getInvoices(schoolId);
      setInvoices(updatedInvoices);
      
      setIsPaymentModalOpen(false);
      setReceiptData({
        student: selectedStudent,
        invoice: selectedInvoice,
        payment: payment,
        className: getClassName(selectedStudent.classId)
      });
    } catch (error) {
      console.error(error);
      alert("Failed to process payment");
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
  // RECEIPT VIEW
  // -------------------------------------
  if (receiptData) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
          <Button variant="outline" onClick={closeReceipt}>Back to Collection</Button>
          <Button variant="primary" icon={Printer} onClick={printReceipt}>Print Receipt</Button>
        </div>

        <Card style={{ padding: '3rem', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '2rem' }}>
            <h2>FEE RECEIPT</h2>
            <h1 style={{ margin: '0.5rem 0', color: 'var(--primary-color)' }}>{receiptData.payment.receiptNumber}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Date: {new Date(receiptData.payment.paymentDate?.toMillis ? receiptData.payment.paymentDate.toMillis() : Date.now()).toLocaleString()}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <p><strong>Student:</strong> {receiptData.student.personalInfo.fullName}</p>
              <p><strong>Admission No:</strong> {receiptData.student.admissionNumber}</p>
              <p><strong>Class:</strong> {receiptData.className}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Invoice No:</strong> {receiptData.invoice.invoiceNumber}</p>
              <p><strong>Fee Month:</strong> {receiptData.invoice.feeMonth}</p>
              <p><strong>Payment Method:</strong> {receiptData.payment.paymentMethod}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 0' }}>Description</th>
                <th style={{ padding: '1rem 0', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 0' }}>{receiptData.invoice.feeType} Fee</td>
                <td style={{ padding: '1rem 0', textAlign: 'right' }}>{receiptData.invoice.amount}</td>
              </tr>
              {receiptData.payment.discount > 0 && (
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0' }}>Discount</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: 'var(--success-color)' }}>-{receiptData.payment.discount}</td>
                </tr>
              )}
              {receiptData.payment.fine > 0 && (
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem 0' }}>Fine / Arrears</td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', color: 'var(--danger)' }}>+{receiptData.payment.fine}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: '1rem 0', fontWeight: 700, fontSize: '1.25rem' }}>Amount Paid</td>
                <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 700, fontSize: '1.25rem' }}>{receiptData.payment.paidAmount}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated receipt.</p>
          </div>
        </Card>
      </div>
    );
  }

  // -------------------------------------
  // COLLECTION VIEW
  // -------------------------------------
  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, marginBottom: '0.5rem' }}>
            <DollarSign color="var(--primary-color)" size={32} /> Fee Collection
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Search for a student to collect fees and generate a receipt</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          
          {/* Left Column: Search & Student Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card>
              <Input 
                icon={Search}
                label="Search Student"
                placeholder="Name or Adm No..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedStudent(null); // reset selection on search change
                }}
              />
              
              {!selectedStudent && searchQuery && (
                <div style={{ marginTop: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => setSelectedStudent(s)}
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{s.personalInfo.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.admissionNumber} • {getClassName(s.classId)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No students found</div>
                  )}
                </div>
              )}
            </Card>

            {selectedStudent && (
              <Card style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}>
                <h3 style={{ margin: 0, marginBottom: '1rem', color: 'var(--primary-color)' }}>Selected Student</h3>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{selectedStudent.personalInfo.fullName}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Admission No: {selectedStudent.admissionNumber}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class: {getClassName(selectedStudent.classId)}</div>
                <Button variant="outline" onClick={() => setSelectedStudent(null)} style={{ marginTop: '1rem', width: '100%' }}>Clear Selection</Button>
              </Card>
            )}
          </div>

          {/* Right Column: Invoices */}
          <div>
            {selectedStudent ? (
              <Card>
                <h3 style={{ margin: 0, marginBottom: '1.5rem' }}>Pending Invoices</h3>
                
                {getStudentInvoices().length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={48} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
                    <p>This student has no pending invoices!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {getStudentInvoices().map(inv => (
                      <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{inv.feeType} Fee ({inv.feeMonth})</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Invoice: {inv.invoiceNumber}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status: <span style={{ color: inv.status === 'PARTIAL' ? 'var(--warning-color)' : 'var(--danger)', fontWeight: 600 }}>{inv.status}</span></div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{inv.remainingBalance}</div>
                          <Button variant="primary" onClick={() => openPaymentModal(inv)}>Collect Payment</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', border: '2px dashed var(--border-color)', borderRadius: '1rem' }}>
                <p>Select a student to view pending invoices</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <Modal isOpen={isPaymentModalOpen} onClose={() => !isProcessing && setIsPaymentModalOpen(false)} title="Process Payment">
          {selectedInvoice && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice Base Amount</span>
                  <strong>{selectedInvoice.amount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Remaining Balance</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--danger)' }}>{selectedInvoice.remainingBalance}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input label="Discount (Optional)" type="number" value={paymentForm.discount} onChange={e => setPaymentForm({...paymentForm, discount: e.target.value})} />
                <Input label="Fine/Arrears (Optional)" type="number" value={paymentForm.fine} onChange={e => setPaymentForm({...paymentForm, fine: e.target.value})} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Payment Method</label>
                <select 
                  value={paymentForm.paymentMethod}
                  onChange={e => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                  style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <Input label="Amount Paid Now *" type="number" value={paymentForm.paidAmount} onChange={e => setPaymentForm({...paymentForm, paidAmount: e.target.value})} />
              <Input label="Remarks (Optional)" value={paymentForm.remarks} onChange={e => setPaymentForm({...paymentForm, remarks: e.target.value})} />

              <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Total Paying:</strong>
                <strong style={{ fontSize: '1.5rem' }}>{paymentForm.paidAmount || 0}</strong>
              </div>

              <Button variant="primary" onClick={handleCollect} disabled={isProcessing || !paymentForm.paidAmount || Number(paymentForm.paidAmount) <= 0}>
                {isProcessing ? 'Processing...' : 'Confirm Payment & Generate Receipt'}
              </Button>
            </div>
          )}
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
