'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getClassById, getSectionsForClass, createSection, updateSection, deleteSection } from '@/firebase/db/academic';
import { Plus, Trash2, Edit2, ArrowLeft, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function ClassDetailsPage({ params }) {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();
  const router = useRouter();
  const classId = params.classId;
  
  const [classData, setClassData] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  
  const [newSectionName, setNewSectionName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId && classId) {
      loadClassAndSections();
    }
  }, [schoolId, classId]);

  const loadClassAndSections = async () => {
    setLoading(true);
    const cls = await getClassById(classId);
    if (!cls || cls.schoolId !== schoolId) {
      router.push('/school/classes');
      return;
    }
    setClassData(cls);
    
    const secs = await getSectionsForClass(schoolId, classId);
    setSections(secs);
    setLoading(false);
  };

  const handleOpenCreateModal = () => {
    setEditingSection(null);
    setNewSectionName('');
    setNewRoomNumber('');
    setNewCapacity('30');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sec) => {
    setEditingSection(sec);
    setNewSectionName(sec.name || '');
    setNewRoomNumber(sec.roomNumber || '');
    setNewCapacity(sec.capacity !== undefined && sec.capacity !== null ? String(sec.capacity) : '30');
    setIsModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingSection) {
        await updateSection(editingSection.id, {
          name: newSectionName,
          roomNumber: newRoomNumber,
          capacity: Number(newCapacity) || 30
        });
      } else {
        await createSection(schoolId, classId, {
          name: newSectionName,
          roomNumber: newRoomNumber,
          capacity: newCapacity
        });
      }
      setIsModalOpen(false);
      setEditingSection(null);
      setNewSectionName('');
      setNewRoomNumber('');
      setNewCapacity('30');
      
      const secs = await getSectionsForClass(schoolId, classId);
      setSections(secs);
    } catch (error) {
      console.error('Error saving section:', error);
      showAlert(editingSection ? 'Failed to update section' : 'Failed to create section', "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (confirm('Are you sure you want to delete this section?')) {
      await deleteSection(sectionId);
      const secs = await getSectionsForClass(schoolId, classId);
      setSections(secs);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/classes')} style={{ padding: '0.5rem' }}>
            Back to Classes
          </Button>
        </div>

        {loading ? (
          <p>Loading details...</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1>{classData?.name}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Level: {classData?.level}</p>
              </div>
              <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
                Add Section
              </Button>
            </div>

            {sections.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <h3>No Sections Found</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Add a section (e.g., A, B, Green, Blue) to start assigning students.
                </p>
                <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
                  Add Your First Section
                </Button>
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {sections.map((sec) => (
                  <Card key={sec.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {sec.name.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ margin: 0 }}>Section {sec.name}</h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Room: {sec.roomNumber || 'TBA'}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button 
                          variant="outline" 
                          style={{ padding: '0.5rem' }} 
                          onClick={() => handleOpenEditModal(sec)}
                          title="Edit Section"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          style={{ padding: '0.5rem', color: 'var(--danger)' }} 
                          onClick={() => handleDeleteSection(sec.id)}
                          title="Delete Section"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <Users size={16} /> Capacity: {sec.capacity}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isSubmitting && setIsModalOpen(false)} 
          title={editingSection ? "Edit Section" : "Add New Section"}
        >
          <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Section Name"
              placeholder="e.g. A, B, Rose, Lily"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              required
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Room Number"
                placeholder="e.g. 101"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
              />
              <Input
                label="Capacity"
                type="number"
                min="1"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? (editingSection ? 'Updating...' : 'Creating...') : (editingSection ? 'Update Section' : 'Create Section')}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
