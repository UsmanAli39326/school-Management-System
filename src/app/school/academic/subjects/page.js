'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getClasses, createSubject, getSubjectsForClass, deleteSubject } from '@/firebase/db/academic';
import { getAllUsers } from '@/firebase/db/users';
import { Plus, Trash2, BookOpen } from 'lucide-react';

export default function SubjectsPage() {
  const { schoolId } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadInitialData();
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && selectedClassId) {
      loadSubjects(selectedClassId);
    } else {
      setSubjects([]);
    }
  }, [schoolId, selectedClassId]);

  const loadInitialData = async () => {
    setLoading(true);
    const [fetchedClasses, fetchedUsers] = await Promise.all([
      getClasses(schoolId),
      getAllUsers(schoolId)
    ]);
    setClasses(fetchedClasses);
    if (fetchedClasses.length > 0) {
      setSelectedClassId(fetchedClasses[0].id);
    }
    // Filter out only teachers
    setTeachers(fetchedUsers.filter(u => u.role === 'TEACHER'));
    setLoading(false);
  };

  const loadSubjects = async (classId) => {
    const data = await getSubjectsForClass(schoolId, classId);
    setSubjects(data);
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) return;
    
    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
      
      await createSubject(schoolId, selectedClassId, {
        name: newSubjectName,
        teacherId: selectedTeacherId || null,
        teacherName: selectedTeacher ? selectedTeacher.displayName || selectedTeacher.email : null
      });
      setIsModalOpen(false);
      setNewSubjectName('');
      setSelectedTeacherId('');
      loadSubjects(selectedClassId);
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      await deleteSubject(subjectId);
      loadSubjects(selectedClassId);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Manage Subjects</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Assign subjects and teachers to classes</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} disabled={!selectedClassId}>
            Add Subject
          </Button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Left Sidebar: Classes */}
            <div style={{ width: '250px', flexShrink: 0 }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Select Class</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classes.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No classes found. Add classes first.</p>
                ) : (
                  classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderRadius: '0.5rem',
                        border: '1px solid',
                        borderColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--surface-border)',
                        backgroundColor: selectedClassId === cls.id ? 'var(--primary-light)' : 'var(--surface-bg)',
                        color: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: selectedClassId === cls.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {cls.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Content: Subjects */}
            <div style={{ flex: 1 }}>
              {selectedClassId ? (
                <>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                    Subjects for {classes.find(c => c.id === selectedClassId)?.name}
                  </h3>
                  
                  {subjects.length === 0 ? (
                    <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No subjects configured for this class yet.
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {subjects.map(subject => (
                        <Card key={subject.id} style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <BookOpen size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{subject.name}</div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Teacher: {subject.teacherName || 'Not Assigned'}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger-bg)' }} onClick={() => handleDeleteSubject(subject.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Please select a class from the left to view subjects.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Add Subject Modal */}
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Add Subject to Class">
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Selected Class</label>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--app-bg)', borderRadius: '0.5rem', border: '1px solid var(--surface-border)' }}>
                {classes.find(c => c.id === selectedClassId)?.name}
              </div>
            </div>
            
            <Input
              label="Subject Name"
              placeholder="e.g. Mathematics, Science"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
            />
            
            <div className="fieldGroup">
              <label className="label">Assign Teacher (Optional)</label>
              <select
                className="input"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="">-- No Teacher Assigned --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.displayName || t.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Add Subject'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
