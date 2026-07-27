'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Select from '@/components/common/Select';
import Input from '@/components/common/Input';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { getSubjectsForTeacher, getClasses } from '@/firebase/db/academic';
import { getStudentsByClass } from '@/firebase/db/students';
import { recordGrade, getGradesForSubject } from '@/firebase/db/grades';
import { CheckCircle, Save, AlertCircle, Download, Printer, Inbox } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

const EXAM_TERMS = ['Midterm', 'Final', 'Assignment 1', 'Assignment 2', 'Quiz 1'];

export default function TeacherGradingPage() {
  const { currentUser, schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [subjects, setSubjects] = useState([]);
  const [classesMap, setClassesMap] = useState({});
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Midterm');

  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save Confirmation modal state (UX §7)
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadSubjects();
    }
  }, [schoolId, currentUser]);

  useEffect(() => {
    if (selectedSubjectId && selectedTerm) {
      loadStudentsAndGrades();
    } else {
      setStudents([]);
      setGrades({});
    }
  }, [selectedSubjectId, selectedTerm]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const [fetchedSubjects, fetchedClasses] = await Promise.all([
        getSubjectsForTeacher(schoolId, currentUser.uid),
        getClasses(schoolId)
      ]);
      const cMap = {};
      (fetchedClasses || []).forEach(c => { cMap[c.id] = c.name; });
      setClassesMap(cMap);

      setSubjects(fetchedSubjects || []);
      if (fetchedSubjects && fetchedSubjects.length > 0) {
        setSelectedSubjectId(fetchedSubjects[0].id);
      }
    } catch (err) {
      console.error('Error loading teacher subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndGrades = async () => {
    setLoading(true);
    setSaveSuccess(false);
    const subject = subjects.find((s) => s.id === selectedSubjectId);
    if (!subject) return;

    try {
      const [classStudents, existingGrades] = await Promise.all([
        getStudentsByClass(schoolId, subject.classId),
        getGradesForSubject(schoolId, subject.classId, subject.id, selectedTerm)
      ]);

      setStudents(classStudents || []);

      const gradeMap = {};
      (existingGrades || []).forEach((g) => {
        gradeMap[g.studentId] = {
          marksObtained: g.marksObtained !== undefined && g.marksObtained !== null ? String(g.marksObtained) : '',
          totalMarks: g.totalMarks || 100,
          remarks: g.remarks || ''
        };
      });

      (classStudents || []).forEach((s) => {
        if (!gradeMap[s.id]) {
          gradeMap[s.id] = { marksObtained: '', totalMarks: 100, remarks: '' };
        }
      });

      setGrades(gradeMap);
    } catch (err) {
      console.error('Error loading grades:', err);
      showAlert('Failed to load class gradebook', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
    setSaveSuccess(false);
  };

  const calculateGrade = (obtained, total) => {
    if (obtained === '' || obtained === null || total == 0) return '-';
    const numObtained = Number(obtained);
    const numTotal = Number(total);
    if (isNaN(numObtained) || isNaN(numTotal)) return '-';
    const percentage = (numObtained / numTotal) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const validateGrades = () => {
    for (const student of students) {
      const g = grades[student.id];
      if (g.marksObtained !== '') {
        const ob = Number(g.marksObtained);
        const tot = Number(g.totalMarks);
        if (isNaN(ob) || ob < 0) {
          showAlert(`Invalid obtained marks for ${student.personalInfo?.fullName || 'student'}.`, 'error');
          return false;
        }
        if (ob > tot) {
          showAlert(`Obtained marks (${ob}) cannot exceed total marks (${tot}) for ${student.personalInfo?.fullName || 'student'}.`, 'error');
          return false;
        }
      }
    }
    return true;
  };

  const handlePromptSaveGrades = () => {
    if (validateGrades()) {
      setShowSaveConfirmModal(true);
    }
  };

  const handleConfirmSaveGrades = async () => {
    setShowSaveConfirmModal(false);
    setSaving(true);
    const subject = subjects.find((s) => s.id === selectedSubjectId);

    try {
      const promises = students.map((student) => {
        const studentGrade = grades[student.id];
        if (studentGrade.marksObtained !== '') {
          return recordGrade(schoolId, {
            classId: subject.classId,
            subjectId: subject.id,
            studentId: student.id,
            examTerm: selectedTerm,
            marksObtained: Number(studentGrade.marksObtained),
            totalMarks: Number(studentGrade.totalMarks),
            grade: calculateGrade(studentGrade.marksObtained, studentGrade.totalMarks),
            remarks: studentGrade.remarks,
            recordedBy: currentUser.uid
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setSaveSuccess(true);
      showAlert('Gradebook entries finalized and saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving grades:', error);
      showAlert('Failed to save grade entries.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const subject = subjects.find((s) => s.id === selectedSubjectId);
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Roll/ID,Student Name,Marks Obtained,Total Marks,Grade,Remarks\n';

    students.forEach((st) => {
      const g = grades[st.id] || {};
      const roll = st.rollNumber || st.studentId || '';
      const name = `"${st.personalInfo?.fullName || 'Student'}"`;
      const ob = g.marksObtained || '';
      const tot = g.totalMarks || 100;
      const gradeLetter = calculateGrade(ob, tot);
      const remarks = `"${g.remarks || ''}"`;
      csvContent += `${roll},${name},${ob},${tot},${gradeLetter},${remarks}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${subject?.name || 'Marksheet'}_${selectedTerm}_Grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Gradebook & Assessments</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Enter marks, compute auto-grades, and generate class marksheets</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="outline" icon={Download} onClick={handleExportCSV} disabled={students.length === 0}>
              Export Marksheet CSV
            </Button>
            <Button variant="primary" icon={Save} onClick={handlePromptSaveGrades} disabled={saving || students.length === 0}>
              Finalize & Save Grades
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
            <CheckCircle size={22} />
            Gradebook entries saved successfully!
          </div>
        )}

        {/* Controls Card */}
        {loading && subjects.length === 0 ? (
          <div style={{ height: '90px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : subjects.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed var(--surface-border)' }}>
            <AlertCircle size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Assigned Subjects</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              You have not been assigned to any subjects yet. Contact your school administrator.
            </p>
          </Card>
        ) : (
          <Card style={{ padding: '1.5rem' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Assigned Subject *"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects.map((s) => {
                  const cleanName = (s.name || '').replace(/^,+|,+$/g, '').trim();
                  const rawClass = (s.classId || '').replace(/^,+|,+$/g, '').trim();
                  const className = classesMap[rawClass] || classesMap[s.classId] || (rawClass ? `Class: ${rawClass}` : 'Class');
                  return (
                    <option key={s.id} value={s.id}>{cleanName} ({className})</option>
                  );
                })}
              </Select>

              <Select
                label="Assessment Term / Exam *"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                {EXAM_TERMS.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </Select>
            </div>
          </Card>
        )}

        {/* Grading Grid */}
        {loading ? (
          <div style={{ height: '250px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : students.length > 0 ? (
          <Card style={{ overflow: 'hidden', padding: '0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Grade Entry Sheet</span>
              <span style={{ fontSize: '0.84375rem', color: 'var(--text-secondary)' }}>{students.length} Enrolled Students</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]" style={{ borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '2px solid var(--surface-border)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', width: '25%' }}>Student Name</th>
                    <th style={{ padding: '1rem', width: '15%' }}>Roll / ID</th>
                    <th style={{ padding: '1rem', width: '15%', textAlign: 'center' }}>Obtained Marks</th>
                    <th style={{ padding: '1rem', width: '15%', textAlign: 'center' }}>Total Marks</th>
                    <th style={{ padding: '1rem', width: '12%', textAlign: 'center' }}>Auto-Grade</th>
                    <th style={{ padding: '1rem', width: '18%' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const g = grades[student.id] || { marksObtained: '', totalMarks: 100, remarks: '' };
                    const autoGrade = calculateGrade(g.marksObtained, g.totalMarks);
                    const isInvalid = g.marksObtained !== '' && (Number(g.marksObtained) > Number(g.totalMarks) || Number(g.marksObtained) < 0);

                    return (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {student.personalInfo?.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unnamed Student'}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {student.rollNumber || student.admissionNumber || student.studentId}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <input
                            type="number"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: `1px solid ${isInvalid ? 'var(--status-danger)' : 'var(--surface-border)'}`,
                              textAlign: 'center',
                              fontWeight: 700,
                              backgroundColor: isInvalid ? 'var(--status-danger-bg)' : 'var(--surface-card)'
                            }}
                            value={g.marksObtained}
                            onChange={(e) => handleGradeChange(student.id, 'marksObtained', e.target.value)}
                            placeholder="-"
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <input
                            type="number"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--surface-border)',
                              textAlign: 'center',
                              backgroundColor: 'var(--surface-hover)',
                              fontWeight: 600
                            }}
                            value={g.totalMarks}
                            onChange={(e) => handleGradeChange(student.id, 'totalMarks', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '1.125rem', color: autoGrade === 'F' ? 'var(--status-danger)' : 'var(--primary-color)' }}>
                          {autoGrade}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <input
                            type="text"
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--surface-border)'
                            }}
                            value={g.remarks}
                            onChange={(e) => handleGradeChange(student.id, 'remarks', e.target.value)}
                            placeholder="e.g. Excellent work"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {/* Confirmation Modal for Finalizing Grades (UX §7) */}
        <ConfirmationModal
          isOpen={showSaveConfirmModal}
          onClose={() => setShowSaveConfirmModal(false)}
          onConfirm={handleConfirmSaveGrades}
          title={`Finalize Grades for ${selectedTerm}?`}
          description="Are you sure you want to save these student marks into the official gradebook?"
          confirmText="Finalize & Save"
          cancelText="Cancel"
          variant="primary"
          isLoading={saving}
        />

      </div>
    </ProtectedRoute>
  );
}
