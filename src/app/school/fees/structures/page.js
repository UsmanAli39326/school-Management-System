'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { createFeeStructure, getFeeStructures, deleteFeeStructure } from '@/firebase/db/fees';
import { Plus, Trash2, Settings, DollarSign } from 'lucide-react';

const LEVELS = ['Nursery', 'Primary', 'Middle', 'High'];
const FEE_TYPES = ['Admission', 'Tuition', 'Annual', 'Exam', 'Misc'];

export default function FeeStructuresPage() {
  const { schoolId } = useAuth();
  
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    level: 'Primary',
    feeType: 'Tuition',
    amount: '',
    frequency: 'MONTHLY'
  });

  useEffect(() => {
    if (schoolId) {
      loadStructures();
    }
  }, [schoolId]);

  const loadStructures = async () => {
    setLoading(true);
    const data = await getFeeStructures(schoolId);
    setStructures(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.amount) {
      alert("Please enter a valid amount.");
      return;
    }
    
    await createFeeStructure(schoolId, formData);
    setIsModalOpen(false);
    setFormData({ ...formData, amount: '' });
    loadStructures();
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this fee structure? This will not delete previously generated invoices.")) {
      await deleteFeeStructure(id);
      loadStructures();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Settings color="var(--primary-color)" /> Fee Structures
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Define standard fee amounts per class level</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Fee Structure
          </Button>
        </div>

        {loading ? (
          <p>Loading fee structures...</p>
        ) : structures.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <DollarSign size={48} color="var(--text-tertiary)" style={{ margin: '0 auto', marginBottom: '1rem' }} />
            <h3>No Fee Structures Defined</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Start by defining the tuition and admission fees for different class levels.
            </p>
            <Button variant="outline" onClick={() => setIsModalOpen(true)}>Create One Now</Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {structures.map((fs) => (
              <Card key={fs.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: 'var(--primary-color)', 
                      backgroundColor: 'var(--primary-light)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.5rem', 
                      display: 'inline-block',
                      marginBottom: '0.5rem'
                    }}>
                      {fs.level.toUpperCase()}
                    </div>
                    <h3 style={{ margin: 0 }}>{fs.feeType} Fee</h3>
                  </div>
                  <button onClick={() => handleDelete(fs.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fs.amount}</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}> / {fs.frequency}</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Creating Structure */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Add New Fee Structure"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Class Level</label>
              <select 
                value={formData.level} 
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Fee Type</label>
              <select 
                value={formData.feeType} 
                onChange={(e) => setFormData({...formData, feeType: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Frequency</label>
              <select 
                value={formData.frequency} 
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="MONTHLY">Monthly</option>
                <option value="ONE_TIME">One Time</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <Input 
              label="Amount" 
              type="number" 
              placeholder="e.g. 5000" 
              value={formData.amount} 
              onChange={(e) => setFormData({...formData, amount: e.target.value})} 
            />

            <Button variant="primary" onClick={handleCreate} style={{ marginTop: '1rem' }}>
              Save Fee Structure
            </Button>
          </div>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
