'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { uploadFile } from '@/firebase/storage';
import { addExpense } from '@/firebase/db/accounting';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';

const CATEGORIES = [
  'Salaries & Payroll',
  'Utility Bills',
  'Office & Classroom Supplies',
  'Maintenance & Repairs',
  'Events & Functions',
  'Miscellaneous'
];

export default function ExpenseFormModal({ isOpen, onClose, onSuccess }) {
  const { schoolId, currentUser } = useAuth();
  const { showAlert } = useAlert();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Utility Bills',
    vendorName: '',
    vendorRef: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0 || !formData.date) {
      showAlert('Amount and Date are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let receiptUrl = '';
      if (file) {
        receiptUrl = await uploadFile(file, `schools/${schoolId}/expenses`);
      }

      const expenseData = {
        ...formData,
        amount: Number(formData.amount),
        receiptUrl
      };

      await addExpense(schoolId, expenseData, currentUser?.uid || '');

      setFormData({
        category: 'Utility Bills',
        vendorName: '',
        vendorRef: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: ''
      });
      setFile(null);

      showAlert('Expense logged successfully!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showAlert('Failed to add expense.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Record School Expense">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <Select
          label="Expense Category *"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Vendor / Payee Name"
            placeholder="e.g. City Electric Co, Supply Co"
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
          />
          <Input
            label="Vendor Ref / Invoice #"
            placeholder="e.g. INV-9902"
            value={formData.vendorRef}
            onChange={(e) => setFormData({ ...formData, vendorRef: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Amount ($) *"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <Input
            label="Expense Date *"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <Input
          label="Description / Purpose"
          placeholder="e.g. Electricity bill for main campus building"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>Receipt Attachment (Optional)</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid var(--surface-border)', backgroundColor: 'var(--surface-card)' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
            Log Expense
          </Button>
        </div>

      </form>
    </Modal>
  );
}
