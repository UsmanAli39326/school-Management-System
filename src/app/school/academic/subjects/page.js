'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { getClasses, createSubject, getSubjectsForClass, deleteSubject } from '@/firebase/db/academic';
import { getAllUsers } from '@/firebase/db/users';
import { Plus, Trash2, BookOpen, Search, Filter, Inbox, Layers } from 'lucide-react';

const DEPARTMENTS = ['General', 'Sciences', 'Mathematics', 'Languages', 'Humanities', 'Computer Science & ICT', 'Arts & Commerce'];

export default function SubjectsPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state (UX §10)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState('Core');
  const [department, setDepartment] = useState('General');
  const [creditWeight, setCreditWeight] = useState('3.0');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state (UX §7)
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    try {
      const [fetchedClasses, fetchedUsers] = await Promise.all([
        getClasses(schoolId),
        getAllUsers(schoolId)
      ]);
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0].id);
      }
      setTeachers((fetchedUsers || []).filter((u) => u.role === 'TEACHER'));
    } catch (err) {
      console.error('Error fetching initial subjects data:', err);
      showAlert('Failed to load academic catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (classId) => {
    try {
      const data = await getSubjectsForClass(schoolId, classId);
      setSubjects(data);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) return;

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId || t.uid === selectedTeacherId);

      await createSubject(schoolId, selectedClassId, {
        name: newSubjectName,
        code: subjectCode.trim().toUpperCase(),
        type: subjectType,
        department: department,
        creditWeight: Number(creditWeight) || 1,
        teacherId: selectedTeacherId || null,
        teacherName: selectedTeacher ? (selectedTeacher.displayName || selectedTeacher.name || selectedTeacher.email) : null
      });

      showAlert('Subject catalog entry created successfully!', 'success');
      setIsModalOpen(false);
      setNewSubjectName('');
      setSubjectCode('');
      setSubjectType('Core');
      setDepartment('General');
      setCreditWeight('3.0');
      setSelectedTeacherId('');
      loadSubjects(selectedClassId);
    } catch (error) {
      console.error('Error creating subject:', error);
      showAlert('Failed to create subject', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubject(subjectToDelete.id);
      showAlert(`Subject "${subjectToDelete.name}" removed`, 'success');
      setSubjectToDelete(null);
      loadSubjects(selectedClassId);
    } catch (error) {
      console.error('Error deleting subject:', error);
      showAlert('Failed to delete subject', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter subjects (UX §10)
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.teacherName && s.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDept === 'ALL' || s.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [subjects, searchQuery, selectedDept]);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Subject Catalog</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage subjects, course codes, departments, and faculty assignments</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} disabled={!selectedClassId}>
            Add Subject
          </Button>
        </div>

        {loading ? (
          <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : (
          <div style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
            
            {/* Left Sidebar: Class Selector */}
            <div style={{ width: '240px', flexShrink: 0 }}>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Class Level
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classes.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No classes configured yet.</p>
                ) : (
                  classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderRadius: '0.625rem',
                        border: '1px solid',
                        borderColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--surface-border)',
                        backgroundColor: selectedClassId === cls.id ? 'var(--primary-light)' : 'var(--surface-card)',
                        color: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: selectedClassId === cls.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cls.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Main Panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: '280px' }}>
              {selectedClassId ? (
                <>
                  {/* Search and Filters (UX §10) */}
                  <Card style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <Input
                        placeholder="Search subjects by name, code, or teacher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={Search}
                      />
                    </div>
                    <div style={{ width: '180px' }}>
                      <Select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                      >
                        <option value="ALL">All Departments</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </Select>
                    </div>
                  </Card>

                  {/* Subject List */}
                  {filteredSubjects.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
                      <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>No Subjects Found</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        {searchQuery ? 'No subjects matched your filter criteria.' : 'No subjects have been cataloged for this class level yet.'}
                      </p>
                      {!searchQuery && (
                        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
                          Add First Subject
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                      {filteredSubjects.map((subject) => (
                        <Card key={subject.id} style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <BookOpen size={22} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{subject.name}</span>
                                {subject.code && (
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'var(--surface-hover)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', color: 'var(--text-secondary)' }}>
                                    {subject.code}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: subject.type === 'Core' ? 'var(--status-info)' : 'var(--status-warning)' }}>
                                  • {subject.type || 'Core'}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <span>Dept: <strong>{subject.department || 'General'}</strong></span>
                                <span>Credits: <strong>{subject.creditWeight || 1} hrs</strong></span>
                                <span>Teacher: <strong>{subject.teacherName || 'Unassigned'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <Button variant="outline" style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger-bg)' }} onClick={() => setSubjectToDelete(subject)}>
                            <Trash2 size={16} />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Please select a class level from the left panel to manage subjects.
                </Card>
              )}
            </div>

          </div>
        )}

        {/* Modal for Creating Subject */}
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Catalog New Subject">
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <Input
                label="Subject Name *"
                placeholder="e.g. Mathematics, General Science"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
              <Input
                label="Subject Code"
                placeholder="e.g. MATH-101"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Select
                label="Subject Type"
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value)}
              >
                <option value="Core">Core Required</option>
                <option value="Elective">Elective</option>
                <option value="Optional">Optional</option>
              </Select>

              <Select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>

              <Input
                label="Credit Weight / Hours"
                type="number"
                step="0.5"
                min="0.5"
                value={creditWeight}
                onChange={(e) => setCreditWeight(e.target.value)}
                required
              />
            </div>

            <Select
              label="Assign Subject Teacher (Optional)"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              <option value="">-- No Teacher Assigned --</option>
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
                Catalog Subject
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal (UX §7) */}
        <ConfirmationModal
          isOpen={!!subjectToDelete}
          onClose={() => setSubjectToDelete(null)}
          onConfirm={handleConfirmDeleteSubject}
          title={`Delete Subject "${subjectToDelete?.name}"?`}
          description="Are you sure you want to delete this subject catalog entry? Recorded marks and active schedule entries for this subject may be affected."
          confirmText="Delete Subject"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

      </div>
    </ProtectedRoute>
  );
}
