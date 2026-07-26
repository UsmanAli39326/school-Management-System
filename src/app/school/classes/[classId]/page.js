'use client';

import { useState, useEffect, use } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { getClassById, getSectionsForClass, createSection, updateSection, deleteSection } from '@/firebase/db/academic';
import { getAllUsers } from '@/firebase/db/users';
import { Plus, Trash2, Edit2, ArrowLeft, Users, User, Inbox, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function ClassDetailsPage({ params }) {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const resolvedParams = use(params);
  const classId = resolvedParams.classId;

  const [classData, setClassData] = useState(null);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [newSectionName, setNewSectionName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('30');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal (UX §7)
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (schoolId && classId) {
      loadClassAndSections();
    }
  }, [schoolId, classId]);

  const loadClassAndSections = async () => {
    setLoading(true);
    try {
      const [cls, secs, users] = await Promise.all([
        getClassById(classId),
        getSectionsForClass(schoolId, classId),
        getAllUsers(schoolId)
      ]);

      if (!cls || cls.schoolId !== schoolId) {
        router.push('/school/classes');
        return;
      }

      setClassData(cls);
      setSections(secs);
      setTeachers((users || []).filter((u) => u.role === 'TEACHER'));
    } catch (err) {
      console.error('Error fetching class details:', err);
      showAlert('Failed to load section details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSection(null);
    setNewSectionName('');
    setNewRoomNumber('');
    setNewCapacity('30');
    setSelectedTeacherId('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sec) => {
    setEditingSection(sec);
    setNewSectionName(sec.name || '');
    setNewRoomNumber(sec.roomNumber || '');
    setNewCapacity(sec.capacity !== undefined && sec.capacity !== null ? String(sec.capacity) : '30');
    setSelectedTeacherId(sec.classTeacherId || '');
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId || t.uid === selectedTeacherId);

      const sectionPayload = {
        name: newSectionName,
        roomNumber: newRoomNumber,
        capacity: Number(newCapacity) || 30,
        classTeacherId: selectedTeacherId || null,
        classTeacherName: selectedTeacher ? (selectedTeacher.displayName || selectedTeacher.name || selectedTeacher.email) : null
      };

      if (editingSection) {
        await updateSection(editingSection.id, sectionPayload);
        showAlert('Section updated successfully', 'success');
      } else {
        await createSection(schoolId, classId, sectionPayload);
        showAlert('Section created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingSection(null);
      setNewSectionName('');
      setNewRoomNumber('');
      setNewCapacity('30');
      setSelectedTeacherId('');

      const secs = await getSectionsForClass(schoolId, classId);
      setSections(secs);
    } catch (error) {
      console.error('Error saving section:', error);
      showAlert(editingSection ? 'Failed to update section' : 'Failed to create section', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSection(sectionToDelete.id);
      showAlert(`Section "${sectionToDelete.name}" deleted successfully`, 'success');
      setSectionToDelete(null);
      const secs = await getSectionsForClass(schoolId, classId);
      setSections(secs);
    } catch (error) {
      console.error('Error deleting section:', error);
      showAlert('Failed to delete section', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Back Navigation & Breadcrumb */}
        <div>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/classes')}>
            Back to Classes
          </Button>
        </div>

        {loading ? (
          /* Skeleton Loader (UX §4) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ height: '2.5rem', width: '30%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{ height: '140px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ height: '1.25rem', width: '50%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                  <div style={{ height: '1rem', width: '70%', backgroundColor: 'var(--surface-border)', borderRadius: '0.375rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{classData?.name}</h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Academic Level: <strong>{classData?.level}</strong></p>
              </div>
              <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
                Add Section / Arm
              </Button>
            </div>

            {/* Sections Grid or Empty State */}
            {sections.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px dashed var(--surface-border)' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Inbox size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Sections Created</h3>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 0 auto', fontSize: '0.9375rem' }}>
                    Add sections (e.g. Section A, Section B) and assign class teachers to start enrolling students.
                  </p>
                </div>
                <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal} style={{ marginTop: '0.5rem' }}>
                  Add First Section
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((sec) => (
                  <Card key={sec.id} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.125rem' }}>
                            {sec.name.charAt(0)}
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Section {sec.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                              Room: <strong>{sec.roomNumber || 'Unassigned'}</strong>
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <Button
                            variant="outline"
                            style={{ padding: '0.4rem 0.6rem' }}
                            onClick={() => handleOpenEditModal(sec)}
                            title="Edit Section"
                          >
                            <Edit2 size={15} />
                          </Button>
                          <Button
                            variant="outline"
                            style={{ padding: '0.4rem 0.6rem', color: 'var(--status-danger)' }}
                            onClick={() => setSectionToDelete(sec)}
                            title="Delete Section"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84375rem', color: 'var(--text-secondary)', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={15} style={{ color: 'var(--primary-color)' }} />
                          <span>Class Teacher: <strong>{sec.classTeacherName || 'Not Assigned'}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Users size={15} style={{ color: 'var(--text-muted)' }} />
                          <span>Capacity: <strong>{sec.capacity} students</strong></span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal for Add / Edit Section */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title={editingSection ? 'Edit Section' : 'Add New Section'}
        >
          <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Section / Arm Name"
              placeholder="e.g. A, B, Green, Blue"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Room Number / Lab"
                placeholder="e.g. Room 101"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
              />
              <Input
                label="Max Student Capacity"
                type="number"
                min="1"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                required
              />
            </div>

            <Select
              label="Assign Class Teacher (Optional)"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <option value="">-- Select Class Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id || t.uid} value={t.id || t.uid}>
                  {t.displayName || t.name || t.email}
                </option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
                {editingSection ? 'Update Section' : 'Create Section'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal (UX §7) */}
        <ConfirmationModal
          isOpen={!!sectionToDelete}
          onClose={() => setSectionToDelete(null)}
          onConfirm={handleConfirmDeleteSection}
          title={`Delete Section "${sectionToDelete?.name}"?`}
          description="Are you sure you want to delete this section? Enrolled student records will remain intact."
          confirmText="Delete Section"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

      </div>
    </ProtectedRoute>
  );
}
