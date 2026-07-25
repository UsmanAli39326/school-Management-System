'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getClasses, createClass, updateClass, deleteClass } from '@/firebase/db/academic';
import { Plus, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function ClassesPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('Primary');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    const data = await getClasses(schoolId);
    setClasses(data);
    setLoading(false);
  };

  const handleOpenCreateModal = () => {
    setEditingClass(null);
    setNewClassName('');
    setNewClassLevel('Primary');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, cls) => {
    e.stopPropagation();
    setEditingClass(cls);
    setNewClassName(cls.name || '');
    setNewClassLevel(cls.level || 'Primary');
    setIsModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, {
          name: newClassName,
          level: newClassLevel
        });
      } else {
        await createClass(schoolId, {
          name: newClassName,
          level: newClassLevel
        });
      }
      setIsModalOpen(false);
      setEditingClass(null);
      setNewClassName('');
      setNewClassLevel('Primary');
      loadClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      showAlert(editingClass ? 'Failed to update class' : 'Failed to create class', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (e, classId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this class? Sections inside will be orphaned!')) {
      await deleteClass(classId);
      loadClasses();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Manage Classes</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Organize your academic structure</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Add Class
          </Button>
        </div>

        {loading ? (
          <p>Loading classes...</p>
        ) : classes.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No Classes Found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You haven't added any classes yet.
            </p>
            <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
              Add Your First Class
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {classes.map((cls) => (
              <Card 
                key={cls.id} 
                hoverable 
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/school/classes/${cls.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: '0.25rem' }}>{cls.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Level: {cls.level}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                      variant="outline" 
                      style={{ padding: '0.5rem' }} 
                      onClick={(e) => handleOpenEditModal(e, cls)}
                      title="Edit Class"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button 
                      variant="outline" 
                      style={{ padding: '0.5rem', color: 'var(--danger)' }} 
                      onClick={(e) => handleDeleteClass(e, cls.id)}
                      title="Delete Class"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1rem', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 500 }}>
                  Manage Sections <ChevronRight size={16} style={{ marginLeft: '0.25rem' }}/>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isSubmitting && setIsModalOpen(false)} 
          title={editingClass ? "Edit Class" : "Add New Class"}
        >
          <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Class Name"
              placeholder="e.g. Class 1, Nursery"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              required
            />
            
            <Select 
              label="Academic Level"
              value={newClassLevel}
              onChange={(e) => setNewClassLevel(e.target.value)}
            >
              <option value="Nursery">Nursery / Pre-Primary</option>
              <option value="Primary">Primary</option>
              <option value="Middle">Middle</option>
              <option value="High">High School</option>
              <option value="College">College / Higher Sec</option>
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (editingClass ? 'Updating...' : 'Creating...') : (editingClass ? 'Update Class' : 'Create Class')}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
