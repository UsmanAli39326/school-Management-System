'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Modal from '@/components/common/Modal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { createFeeStructure, getFeeStructures, deleteFeeStructure } from '@/firebase/db/fees';
import { Plus, Trash2, Settings, DollarSign, Inbox } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

const LEVELS = ['Nursery', 'Primary', 'Middle', 'High', 'College'];
const FEE_TYPES = ['Tuition', 'Admission', 'Transport', 'Library', 'Exam', 'Annual', 'Misc'];

export default function StructuresTab() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    level: 'Primary',
    feeType: 'Tuition',
    amount: '',
    frequency: 'MONTHLY'
  });

  // Delete modal state (UX §7)
  const [structureToDelete, setStructureToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadStructures();
    }
  }, [schoolId]);

  const loadStructures = async () => {
    setLoading(true);
    try {
      const data = await getFeeStructures(schoolId);
      setStructures(data);
    } catch (err) {
      console.error('Error loading fee structures:', err);
      showAlert('Failed to load fee structures', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      showAlert('Please enter a valid positive fee amount.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeeStructure(schoolId, formData);
      showAlert('Fee structure catalog entry created successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ level: 'Primary', feeType: 'Tuition', amount: '', frequency: 'MONTHLY' });
      loadStructures();
    } catch (err) {
      console.error('Error creating fee structure:', err);
      showAlert('Failed to create fee structure', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!structureToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFeeStructure(structureToDelete.id);
      showAlert('Fee structure entry removed', 'success');
      setStructureToDelete(null);
      loadStructures();
    } catch (err) {
      console.error('Error deleting fee structure:', err);
      showAlert('Failed to delete fee structure', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Sub Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Fee Structures & Catalog</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Define standard fee amounts (Tuition, Transport, Examination, Library) per class level</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Fee Structure
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '140px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ))}
        </div>
      ) : structures.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
          <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Fee Structures Configured</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Start by defining tuition, transport, or exam fees for different class levels.
          </p>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
            Create First Structure
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {structures.map((fs) => (
            <Card key={fs.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', height: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-color)', backgroundColor: 'var(--primary-light)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                    {fs.level} Level
                  </span>
                  <button onClick={() => setStructureToDelete(fs)} style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }} title="Delete Fee Structure">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{fs.feeType} Fee</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>Billing Frequency: <strong>{fs.frequency || 'MONTHLY'}</strong></div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--status-success)' }}>${fs.amount}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal for Creating Fee Structure */}
      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Add Fee Structure Entry">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <Select
            label="Class Level *"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </Select>

          <Select
            label="Fee Category Type *"
            value={formData.feeType}
            onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
          >
            {FEE_TYPES.map((type) => (
              <option key={type} value={type}>{type} Fee</option>
            ))}
          </Select>

          <Input
            label="Standard Fee Amount *"
            type="number"
            min="1"
            placeholder="e.g. 250"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />

          <Select
            label="Billing Frequency"
            value={formData.frequency}
            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="TERM">Per Term / Semester</option>
            <option value="ANNUAL">Annual / One-time</option>
          </Select>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
              Create Fee Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (UX §7) */}
      <ConfirmationModal
        isOpen={!!structureToDelete}
        onClose={() => setStructureToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Fee Structure for "${structureToDelete?.feeType}"?`}
        description="Are you sure you want to remove this fee structure? Existing generated invoices will not be altered."
        confirmText="Delete Structure"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
}
