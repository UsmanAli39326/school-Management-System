'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getSubjectsForTeacher } from '@/firebase/db/academic';
import { getStudentsByClass } from '@/firebase/db/students';
import { Users, BookOpen, ArrowLeft } from 'lucide-react';

export default function TeacherClassesPage() {
  const { currentUser, schoolId } = useAuth();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (schoolId && currentUser?.uid) {
      loadSubjects();
    }
  }, [schoolId, currentUser]);

  const loadSubjects = async () => {
    setLoading(true);
    const fetchedSubjects = await getSubjectsForTeacher(schoolId, currentUser.uid);
    setSubjects(fetchedSubjects);
    setLoading(false);
  };

  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setStudentsLoading(true);
    const fetchedStudents = await getStudentsByClass(schoolId, subject.classId);
    setStudents(fetchedStudents);
    setStudentsLoading(false);
  };

  return (
    <ProtectedRoute allowedRoles={['TEACHER']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {!selectedSubject ? (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h1>My Classes & Subjects</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Select a subject to view the student roster</p>
            </div>

            {loading ? (
              <p>Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                You have not been assigned any subjects yet.
              </Card>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {subjects.map(sub => (
                  <Card 
                    key={sub.id} 
                    hoverable 
                    onClick={() => handleSelectSubject(sub)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1.25rem' }}>{sub.name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class ID: {sub.classId}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <Button variant="outline" icon={ArrowLeft} onClick={() => setSelectedSubject(null)} style={{ marginBottom: '1rem' }}>
                Back to Subjects
              </Button>
              <h1>{selectedSubject.name} Roster</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Class ID: {selectedSubject.classId}</p>
            </div>

            <Card style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Users size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '1.125rem' }}>Enrolled Students</h3>
                <span style={{ marginLeft: 'auto', backgroundColor: 'var(--surface-hover)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: 500 }}>
                  {students.length} Total
                </span>
              </div>

              {studentsLoading ? (
                <p>Loading students...</p>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No students found in this class.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Roll No</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Student Name</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Gender</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Guardian Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(student => (
                        <tr key={student.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{student.rollNumber || student.studentId}</td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{student.firstName} {student.lastName}</div>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>{student.gender}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{student.guardian?.phone || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

      </div>
    </ProtectedRoute>
  );
}
