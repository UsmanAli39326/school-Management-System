'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { getClasses, createClass, updateClass, deleteClass } from '@/firebase/db/academic';
import { Plus, Trash2, Edit2, ChevronRight, BookOpen, Inbox } from 'lucide-react';
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

  // Delete confirmation modal state (UX §7)
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await getClasses(schoolId);
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      showAlert('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
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
        showAlert('Class updated successfully', 'success');
      } else {
        await createClass(schoolId, {
          name: newClassName,
          level: newClassLevel
        });
        showAlert('Class created successfully', 'success');
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

  const handlePromptDeleteClass = (e, cls) => {
    e.stopPropagation();
    setClassToDelete(cls);
  };

  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClass(classToDelete.id);
      showAlert(`Class "${classToDelete.name}" deleted successfully`, 'success');
      setClassToDelete(null);
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      showAlert('Failed to delete class', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header (UX §1 & §8) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>Classes & Grades</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Define academic levels, grade structures, and section allocations</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Add New Class
          </Button>
        </div>

        {/* Skeleton Loaders (UX §4) */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} style={{ padding: '1.5rem', height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ height: '1.5rem', width: '60%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '1rem', width: '40%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '1.25rem', width: '50%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', alignSelf: 'flex-end', animation: 'pulse 1.5s infinite ease-in-out' }} />
              </Card>
            ))}
          </div>
        ) : classes.length === 0 ? (
          /* Contextual Empty State (UX §3) */
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px dashed var(--surface-border)' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Classes Configured Yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 0 auto', fontSize: '0.9375rem' }}>
                Get started by defining your school's class levels (e.g. Grade 1, Grade 2, Class 10).
              </p>
            </div>
            <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} style={{ marginTop: '0.5rem' }}>
              Add Your First Class
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <Card
                key={cls.id}
                hoverable
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', height: '100%' }}
                onClick={() => router.push(`/school/classes/${cls.id}`)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{cls.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                          Level: {cls.level}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Button
                        variant="outline"
                        style={{ padding: '0.4rem 0.6rem' }}
                        onClick={(e) => handleOpenEditModal(e, cls)}
                        title="Edit Class"
                      >
                        <Edit2 size={15} />
                      </Button>
                      <Button
                        variant="outline"
                        style={{ padding: '0.4rem 0.6rem', color: 'var(--status-danger)' }}
                        onClick={(e) => handlePromptDeleteClass(e, cls)}
                        title="Delete Class"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1.5rem', color: 'var(--primary-color)', fontSize: '0.875rem', fontWeight: 600 }}>
                  Manage Sections <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit Class */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={editingClass ? 'Edit Class Level' : 'Add New Class Level'}
        >
          <form onSubmit={handleSaveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Class Name"
              placeholder="e.g. Class 1, Grade 10, Nursery"
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
              <option value="Primary">Primary (Grade 1 - 5)</option>
              <option value="Middle">Middle (Grade 6 - 8)</option>
              <option value="High">High School (Grade 9 - 10)</option>
              <option value="College">College / Higher Sec (Grade 11 - 12)</option>
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
                {editingClass ? 'Update Class' : 'Create Class'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal (UX §7) */}
        <ConfirmationModal
          isOpen={!!classToDelete}
          onClose={() => setClassToDelete(null)}
          onConfirm={handleConfirmDeleteClass}
          title={`Delete Class "${classToDelete?.name}"?`}
          description="Are you sure you want to delete this class level? Associated sections, schedules, and subjects may be affected."
          confirmText="Delete Class"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

      </div>
    </ProtectedRoute>
  );
}
