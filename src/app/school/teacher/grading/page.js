'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getSubjectsForTeacher, getClassById } from '@/firebase/db/academic';
import { getStudentsByClass } from '@/firebase/db/students';
import { recordGrade, getGradesForSubject } from '@/firebase/db/grades';
import { CheckCircle, Save, AlertCircle } from 'lucide-react';

const EXAM_TERMS = ['Midterm', 'Final', 'Assignment 1', 'Assignment 2', 'Quiz 1'];

export default function TeacherGradingPage() {
  const { currentUser, schoolId } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Midterm');
  
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    // Assuming currentUser.uid matches teacherId
    const data = await getSubjectsForTeacher(schoolId, currentUser.uid);
    setSubjects(data);
    if (data.length > 0) {
      setSelectedSubjectId(data[0].id);
    }
    setLoading(false);
  };

  const loadStudentsAndGrades = async () => {
    setLoading(true);
    setSaveSuccess(false);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (!subject) return;

    const [classStudents, existingGrades] = await Promise.all([
      getStudentsByClass(schoolId, subject.classId),
      getGradesForSubject(schoolId, subject.classId, subject.id, selectedTerm)
    ]);

    setStudents(classStudents);
    
    // Map existing grades to state
    const gradeMap = {};
    existingGrades.forEach(g => {
      gradeMap[g.studentId] = {
        marksObtained: g.marksObtained || '',
        totalMarks: g.totalMarks || 100,
        remarks: g.remarks || ''
      };
    });

    // Fill in defaults for students without grades yet
    classStudents.forEach(s => {
      if (!gradeMap[s.id]) {
        gradeMap[s.id] = { marksObtained: '', totalMarks: 100, remarks: '' };
      }
    });

    setGrades(gradeMap);
    setLoading(false);
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
    setSaveSuccess(false);
  };

  const calculateGrade = (obtained, total) => {
    if (!obtained || !total || total == 0) return '-';
    const percentage = (obtained / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleSaveGrades = async () => {
    setSaving(true);
    const subject = subjects.find(s => s.id === selectedSubjectId);
    
    try {
      const promises = students.map(student => {
        const studentGrade = grades[student.id];
        if (studentGrade.marksObtained !== '') {
          return recordGrade(schoolId, {
            classId: subject.classId,
            subjectId: subject.id,
            studentId: student.id,
            examTerm: selectedTerm,
            marksObtained: studentGrade.marksObtained,
            totalMarks: studentGrade.totalMarks,
            grade: calculateGrade(studentGrade.marksObtained, studentGrade.totalMarks),
            remarks: studentGrade.remarks,
            recordedBy: currentUser.uid
          });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save some grades.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Grading System</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Enter marks for your assigned subjects</p>
          </div>
          <Button variant="primary" icon={Save} onClick={handleSaveGrades} disabled={saving || students.length === 0}>
            {saving ? 'Saving...' : 'Finalize & Save Grades'}
          </Button>
        </div>

        {saveSuccess && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} />
            Grades saved successfully!
          </div>
        )}

        {loading && subjects.length === 0 ? (
          <p>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No Subjects Assigned</h3>
            <p style={{ color: 'var(--text-secondary)' }}>You have not been assigned to any subjects yet. Contact the school administrator.</p>
          </Card>
        ) : (
          <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="fieldGroup">
                <label className="label">Select Subject</label>
                <select
                  className="input"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Class ID: {s.classId})</option>
                  ))}
                </select>
              </div>
              
              <div className="fieldGroup">
                <label className="label">Assessment Term</label>
                <select
                  className="input"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  {EXAM_TERMS.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Grading Grid */}
        {!loading && students.length > 0 && (
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--surface-border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Student Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Roll / ID</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Obtained Marks</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Total Marks</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Auto-Grade</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{student.firstName} {student.lastName}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{student.rollNumber || student.studentId}</td>
                      <td style={{ padding: '1rem', width: '120px' }}>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--surface-border)', textAlign: 'center' }}
                          value={grades[student.id]?.marksObtained}
                          onChange={(e) => handleGradeChange(student.id, 'marksObtained', e.target.value)}
                          placeholder="-"
                        />
                      </td>
                      <td style={{ padding: '1rem', width: '100px' }}>
                        <input
                          type="number"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--surface-border)', textAlign: 'center', backgroundColor: 'var(--surface-hover)' }}
                          value={grades[student.id]?.totalMarks}
                          onChange={(e) => handleGradeChange(student.id, 'totalMarks', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--primary-color)' }}>
                        {calculateGrade(grades[student.id]?.marksObtained, grades[student.id]?.totalMarks)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <input
                          type="text"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--surface-border)' }}
                          value={grades[student.id]?.remarks}
                          onChange={(e) => handleGradeChange(student.id, 'remarks', e.target.value)}
                          placeholder="Optional remarks"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {!loading && selectedSubjectId && students.length === 0 && (
          <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No students found in this class.
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
