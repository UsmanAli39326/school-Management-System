'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getStudentsBySchool } from '@/firebase/db/students';
import { getClasses } from '@/firebase/db/academic';
import { Plus, Search, Filter, Download, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentRecordsPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [studentsData, classesData] = await Promise.all([
      getStudentsBySchool(schoolId),
      getClasses(schoolId)
    ]);
    setStudents(studentsData);
    setClasses(classesData);
    setLoading(false);
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : 'Unknown Class';
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.personalInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = classFilter ? student.classId === classFilter : true;
      const matchesStatus = statusFilter ? student.academicDetails.status === statusFilter : true;
      
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [students, searchQuery, classFilter, statusFilter]);

  const exportToCSV = () => {
    if (filteredStudents.length === 0) return;
    
    const headers = ['Admission No', 'Name', 'Gender', 'Class', 'Status', 'Admission Date'];
    const rows = filteredStudents.map(s => [
      s.admissionNumber,
      s.personalInfo.fullName,
      s.personalInfo.gender,
      getClassName(s.classId),
      s.academicDetails.status,
      s.admissionDate?.toDate ? s.admissionDate.toDate().toLocaleDateString() : new Date(s.admissionDate).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1>Student Records</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage all enrolled students</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="outline" icon={Download} onClick={exportToCSV}>
              Export
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => router.push('/school/students/admission')}>
              Admit Student
            </Button>
          </div>
        </div>

        <Card style={{ padding: '1.25rem' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div>
              <Input 
                icon={Search}
                label="Search Students"
                placeholder="Search by Name or Admission No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Select 
                label="Class"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="All Classes"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Select 
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                placeholder="All Statuses"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PASSED_OUT">Passed Out</option>
              </Select>
            </div>
          </div>
        </Card>

        {loading ? (
          <p>Loading students...</p>
        ) : filteredStudents.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No Students Found</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              No students match your search criteria, or you haven't admitted any students yet.
            </p>
            <Button variant="primary" icon={Plus} onClick={() => router.push('/school/students/admission')}>
              Start Admission
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card 
                key={student.id} 
                hoverable 
                style={{ cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'center' }}
                onClick={() => router.push(`/school/students/${student.id}`)}
              >
                {student.personalInfo?.photoUrl ? (
                  <img 
                    src={student.personalInfo.photoUrl} 
                    alt={student.personalInfo.fullName} 
                    style={{ width: '4rem', height: '4rem', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCircle size={32} />
                  </div>
                )}
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {student.personalInfo?.fullName}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>{getClassName(student.classId)}</span>
                    <span style={{ color: student.academicDetails?.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-secondary)' }}>
                      {student.academicDetails?.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    Adm: {student.admissionNumber || 'N/A'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
