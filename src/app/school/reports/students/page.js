'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getClasses } from '@/firebase/db/academic';
import { Users, Printer, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentListReportPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  useEffect(() => {
    if (schoolId) {
      Promise.all([
        getStudentsBySchool(schoolId),
        getClasses(schoolId)
      ]).then(([studentsData, classesData]) => {
        setStudents(studentsData);
        setClasses(classesData);
        setLoading(false);
      });
    }
  }, [schoolId]);

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = students.filter(s => {
    if (classFilter && s.classId !== classFilter) return false;
    if (statusFilter && s.academicDetails?.status !== statusFilter) return false;
    return true;
  });

  const getClassName = (id) => {
    return classes.find(c => c.id === id)?.name || 'Unknown Class';
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <button onClick={() => router.push('/school/reports')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <Users color="var(--primary-color)" /> Student List Report
            </h1>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="outline" icon={Printer} onClick={handlePrint}>Print Report</Button>
          </div>
        </div>

        <Card style={{ padding: '1.25rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Filter by Class</label>
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive / Alumni</option>
              </select>
            </div>
          </div>
        </Card>

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <Card>
            <div style={{ marginBottom: '1rem', fontWeight: 600 }}>Total Students: {filteredStudents.length}</div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Admission #</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Student Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Class</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Father's Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Contact</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem' }}>{student.admissionNumber}</td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        <a href={`/school/students/${student.id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                          {student.personalInfo?.fullName}
                        </a>
                      </td>
                      <td style={{ padding: '1rem' }}>{getClassName(student.classId)}</td>
                      <td style={{ padding: '1rem' }}>{student.parentInfo?.fatherName || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.parentInfo?.phone || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          backgroundColor: student.academicDetails?.status === 'ACTIVE' ? 'var(--success-light)' : 'var(--bg-secondary)', 
                          color: student.academicDetails?.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-secondary)',
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {student.academicDetails?.status || 'UNKNOWN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

      </div>
    </ProtectedRoute>
  );
}
