'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { getSubjectsForTeacher } from '@/firebase/db/academic';
import { getStudentsByClass } from '@/firebase/db/students';
import { saveDailyAttendance } from '@/firebase/db/attendance';
import { Users, BookOpen, ArrowLeft, Search, CalendarCheck, CheckCircle2, XCircle, Clock, Save, Inbox } from 'lucide-react';

export default function TeacherClassesPage() {
  const { currentUser, schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadSubjects();
    }
  }, [schoolId, currentUser]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const fetchedSubjects = await getSubjectsForTeacher(schoolId, currentUser.uid);
      setSubjects(fetchedSubjects);
    } catch (err) {
      console.error('Error fetching teacher subjects:', err);
      showAlert('Failed to load assigned subjects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setStudentsLoading(true);
    setSearchQuery('');
    try {
      const fetchedStudents = await getStudentsByClass(schoolId, subject.classId);
      setStudents(fetchedStudents);
    } catch (err) {
      console.error('Error fetching class students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleOpenAttendanceModal = () => {
    // Default all students to PRESENT
    const initial = {};
    students.forEach((s) => {
      initial[s.id] = 'PRESENT';
    });
    setAttendanceRecords(initial);
    setIsAttendanceModalOpen(true);
  };

  const handleToggleStudentStatus = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSubject) return;
    setSavingAttendance(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await saveDailyAttendance(
        schoolId,
        selectedSubject.classId,
        selectedSubject.sectionId || 'DEFAULT',
        dateStr,
        records
      );

      showAlert(`Attendance for ${new Date().toLocaleDateString()} saved successfully!`, 'success');
      setIsAttendanceModalOpen(false);
    } catch (err) {
      console.error('Error saving daily attendance:', err);
      showAlert('Failed to save daily attendance', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = (s.personalInfo?.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
      const roll = (s.rollNumber || s.admissionNumber || s.studentId || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || roll.includes(query);
    });
  }, [students, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {!selectedSubject ? (
          <>
            {/* Header */}
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Assigned Classes & Subjects</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Select a class subject to view the student roster or record daily attendance</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ height: '120px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
                <Inbox size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Subjects Assigned</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  You have not been assigned to any subjects or classes yet. Contact your school administrator.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((sub) => (
                  <Card
                    key={sub.id}
                    hoverable
                    onClick={() => handleSelectSubject(sub)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', height: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.875rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{sub.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.125rem' }}>Class ID: <strong>{sub.classId}</strong></p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Subject Roster View Header */}
            <div>
              <Button variant="outline" icon={ArrowLeft} onClick={() => setSelectedSubject(null)} style={{ marginBottom: '1rem' }}>
                Back to Subjects
              </Button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{selectedSubject.name} Roster</h1>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Enrolled class roster & attendance control</p>
                </div>
                <Button variant="primary" icon={CalendarCheck} onClick={handleOpenAttendanceModal} disabled={students.length === 0}>
                  Take Daily Attendance
                </Button>
              </div>
            </div>

            {/* Search Filter (UX §10) */}
            <Card style={{ padding: '1rem 1.25rem' }}>
              <Input
                placeholder="Search enrolled students by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
            </Card>

            {/* Students Table */}
            <Card style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Users size={20} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Class Roster</h3>
                <span style={{ marginLeft: 'auto', backgroundColor: 'var(--surface-hover)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.84375rem', fontWeight: 600 }}>
                  {filteredStudents.length} / {students.length} Students
                </span>
              </div>

              {studentsLoading ? (
                <div style={{ height: '180px', backgroundColor: 'var(--surface-border)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No students found matching your search.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Roll No</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Student Name</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Gender</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Guardian Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{student.rollNumber || student.admissionNumber || student.studentId}</td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {student.personalInfo?.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{student.personalInfo?.gender || student.gender || 'N/A'}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{student.parentInfo?.phone || student.guardian?.phone || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Daily Attendance Modal */}
        <Modal
          isOpen={isAttendanceModalOpen}
          onClose={() => !savingAttendance && setIsAttendanceModalOpen(false)}
          title={`Mark Today's Attendance (${new Date().toLocaleDateString()})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Toggle status for each student. Defaults to <strong>PRESENT</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.map((student) => {
                const currentStatus = attendanceRecords[student.id] || 'PRESENT';
                const name = student.personalInfo?.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student';

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--surface-hover)',
                      borderRadius: '0.625rem',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Roll: {student.rollNumber || student.studentId}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Button
                        type="button"
                        variant={currentStatus === 'PRESENT' ? 'primary' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStudentStatus(student.id, 'PRESENT')}
                      >
                        Present
                      </Button>
                      <Button
                        type="button"
                        variant={currentStatus === 'ABSENT' ? 'danger' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStudentStatus(student.id, 'ABSENT')}
                      >
                        Absent
                      </Button>
                      <Button
                        type="button"
                        variant={currentStatus === 'LATE' ? 'warning' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStudentStatus(student.id, 'LATE')}
                      >
                        Late
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsAttendanceModalOpen(false)} disabled={savingAttendance}>
                Cancel
              </Button>
              <Button type="button" variant="primary" icon={Save} onClick={handleSaveAttendance} isLoading={savingAttendance}>
                Save Attendance
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
