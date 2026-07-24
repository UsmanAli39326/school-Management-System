'use client';

import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { uploadFile } from '@/firebase/storage';
import { addExpense } from '@/firebase/db/accounting';
import { useAuth } from '@/hooks/useAuth';

const CATEGORIES = ['Utility Bills', 'Office Expenses', 'Maintenance', 'Miscellaneous'];

export default function ExpenseFormModal({ isOpen, onClose, onSuccess }) {
  const { schoolId, currentUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Utility Bills',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });

  const handleSubmit = async () => {
    if (!formData.amount || !formData.date) {
      alert("Amount and Date are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      let receiptUrl = '';
      if (file) {
        // Upload receipt to Firebase Storage
        receiptUrl = await uploadFile(file, `schools/${schoolId}/expenses`);
      }

      const expenseData = {
        ...formData,
        receiptUrl
      };

      await addExpense(schoolId, expenseData, currentUser.uid);
      
      // Reset form
      setFormData({
        category: 'Utility Bills',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        description: ''
      });
      setFile(null);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to add expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !isSubmitting && onClose()} title="Add New Expense">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Category</label>
          <select 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <Input 
          label="Amount *" 
          type="number" 
          value={formData.amount} 
          onChange={(e) => setFormData({...formData, amount: e.target.value})} 
        />

        <Input 
          label="Date *" 
          type="date" 
          value={formData.date} 
          onChange={(e) => setFormData({...formData, date: e.target.value})} 
        />

        <Input 
          label="Description" 
          placeholder="e.g. Electricity bill for July" 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
        />

        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Receipt (Optional)</label>
          <input 
            type="file" 
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} style={{ marginTop: '1rem' }}>
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>

      </div>
    </Modal>
  );
}
