'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { getClasses, getSectionsForClass } from '@/firebase/db/academic';
import { getStudentsByClass } from '@/firebase/db/students';
import { saveDailyAttendance } from '@/firebase/db/attendance';
import { Users, BookOpen, ArrowLeft, Search, CalendarCheck, Save, Inbox } from 'lucide-react';

export default function CentralAttendancePage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const fetchedClasses = await getClasses(schoolId);
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Error fetching classes:', err);
      showAlert('Failed to load classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = async (e) => {
    const cid = e.target.value;
    setSelectedClassId(cid);
    setSelectedSectionId('');
    setStudents([]);
    setSections([]);
    
    if (!cid) return;

    try {
      const secs = await getSectionsForClass(schoolId, cid);
      setSections(secs);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedClassId) return;
    setStudentsLoading(true);
    setSearchQuery('');
    try {
      const fetchedStudents = await getStudentsByClass(schoolId, selectedClassId);
      // If a section is selected, filter students by section if they have it assigned
      // (Assuming students have a sectionId, otherwise show all in class)
      const filtered = selectedSectionId 
        ? fetchedStudents.filter(s => s.sectionId === selectedSectionId || !s.sectionId)
        : fetchedStudents;
      setStudents(filtered);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleOpenAttendanceModal = () => {
    const initial = {};
    (students || []).forEach((s) => {
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
    setSavingAttendance(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        status
      }));

      await saveDailyAttendance(
        schoolId,
        selectedClassId,
        selectedSectionId || 'DEFAULT',
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
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Student Attendance</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Select a class and section to mark daily student attendance</p>
        </div>

        {/* Filters */}
        <Card style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Select label="Select Class" value={selectedClassId} onChange={handleClassChange} disabled={loading}>
              <option value="">-- Select Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Select label="Select Section (Optional)" value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} disabled={!selectedClassId || sections.length === 0}>
              <option value="">-- All Sections / Default --</option>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Button variant="primary" icon={Search} onClick={handleLoadStudents} disabled={!selectedClassId || studentsLoading}>
              Load Students
            </Button>
          </div>
        </Card>

        {/* Students Table */}
        {students.length > 0 && (
          <Card style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} style={{ color: 'var(--primary-color)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Class Roster</h3>
                <span style={{ marginLeft: 'auto', backgroundColor: 'var(--surface-hover)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.84375rem', fontWeight: 600 }}>
                  {filteredStudents.length} / {students.length} Students
                </span>
              </div>
              <Button variant="primary" icon={CalendarCheck} onClick={handleOpenAttendanceModal}>
                Take Daily Attendance
              </Button>
            </div>

            <Input
              placeholder="Search enrolled students by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
              style={{ marginBottom: '1.5rem' }}
            />

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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
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
