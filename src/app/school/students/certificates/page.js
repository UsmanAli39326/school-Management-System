'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getStudentsBySchool } from '@/firebase/db/students';
import { FileBadge, Search, Printer } from 'lucide-react';
import Modal from '@/components/common/Modal';

export default function CertificatesPage() {
  const { schoolId } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [certificateType, setCertificateType] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (schoolId) {
      getStudentsBySchool(schoolId).then(setStudents);
    }
  }, [schoolId]);

  const filteredStudents = students.filter(s => 
    s.personalInfo?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = (student, type) => {
    setSelectedStudent(student);
    setCertificateType(type);
    setIsModalOpen(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-certificate');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Certificate</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 20mm; font-family: serif; color: #000; background: #fff; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 250);
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileBadge color="var(--primary-color)" /> Certificates
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Generate official printable certificates for students.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '2rem' }}>
          
          <Card>
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '1.2rem', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredStudents.slice(0, 20).map(student => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedStudent?.id === student.id ? 'var(--primary-color)' : 'var(--border-color)',
                    backgroundColor: selectedStudent?.id === student.id ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{student.personalInfo?.fullName}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Adm #: {student.admissionNumber}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            {selectedStudent ? (
              <div>
                <h2>{selectedStudent.personalInfo?.fullName}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Admission Number: {selectedStudent.admissionNumber}
                </p>

                <h3>Available Certificates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  
                  <Card hoverable style={{ borderLeft: '4px solid var(--primary-color)' }}>
                    <h4>Bonafide Certificate</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Proof of current enrollment.</p>
                    <Button variant="outline" onClick={() => handleGenerate(selectedStudent, 'BONAFIDE')}>Generate</Button>
                  </Card>

                  <Card hoverable style={{ borderLeft: '4px solid var(--secondary-accent)' }}>
                    <h4>Character Certificate</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Record of student conduct.</p>
                    <Button variant="outline" onClick={() => handleGenerate(selectedStudent, 'CHARACTER')}>Generate</Button>
                  </Card>

                  <Card hoverable style={{ borderLeft: '4px solid var(--success-color)' }}>
                    <h4>Admission Certificate</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Proof of admission details.</p>
                    <Button variant="outline" onClick={() => handleGenerate(selectedStudent, 'ADMISSION')}>Generate</Button>
                  </Card>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-tertiary)' }}>
                <FileBadge size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3>Select a student</h3>
                <p>Search and click a student on the left to generate certificates.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Certificate Printable Modal */}
        {isModalOpen && selectedStudent && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <Button variant="primary" icon={Printer} onClick={handlePrint}>Print Certificate</Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: '#fff' }}>Close</Button>
            </div>

            {/* Printable Area */}
            <div id="printable-certificate" style={{ 
              backgroundColor: '#fff', width: '210mm', minHeight: '297mm', padding: '40mm', 
              boxShadow: '0 0 20px rgba(0,0,0,0.5)', position: 'relative',
              fontFamily: 'serif', color: '#000'
            }}>
              
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '36px', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, color: '#000' }}>
                  Official School Certificate
                </h1>
                <p style={{ fontSize: '18px', margin: '10px 0 0 0', color: '#555' }}>To whom it may concern</p>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', textDecoration: 'underline', textTransform: 'uppercase' }}>
                  {certificateType} CERTIFICATE
                </h2>
              </div>

              <div style={{ fontSize: '18px', lineHeight: '2', textAlign: 'justify' }}>
                {certificateType === 'BONAFIDE' && (
                  <p>
                    This is to certify that <strong>{selectedStudent.personalInfo?.fullName}</strong>, 
                    son/daughter of <strong>{selectedStudent.parentInfo?.fatherName || selectedStudent.parentInfo?.guardianName || '__________'}</strong>, 
                    bearing Admission Number <strong>{selectedStudent.admissionNumber}</strong>, is a bonafide student of this institution.
                    <br/><br/>
                    He/She is currently studying in the school and bears a good moral character.
                  </p>
                )}

                {certificateType === 'CHARACTER' && (
                  <p>
                    This is to certify that <strong>{selectedStudent.personalInfo?.fullName}</strong>, 
                    has been a student of this institution under Admission Number <strong>{selectedStudent.admissionNumber}</strong>.
                    <br/><br/>
                    During his/her stay at the school, his/her conduct and character have been found to be <strong>Excellent</strong>. 
                    He/She has shown great respect towards teachers and fellow students, and has participated actively in school activities.
                  </p>
                )}

                {certificateType === 'ADMISSION' && (
                  <p>
                    This is to certify that <strong>{selectedStudent.personalInfo?.fullName}</strong>, 
                    has been officially admitted to this institution. 
                    <br/><br/>
                    Admission Number: <strong>{selectedStudent.admissionNumber}</strong><br/>
                    Date of Birth: <strong>{selectedStudent.personalInfo?.dob || 'N/A'}</strong><br/>
                    Father's Name: <strong>{selectedStudent.parentInfo?.fatherName || 'N/A'}</strong><br/>
                    <br/>
                    The school acknowledges his/her enrollment and extends best wishes for future academic endeavors.
                  </p>
                )}
              </div>

              <div style={{ position: 'absolute', bottom: '40mm', left: '40mm', right: '40mm', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #000', width: '150px', marginBottom: '5px' }}>
                    {new Date().toLocaleDateString()}
                  </div>
                  <div>Date</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #000', width: '200px', marginBottom: '5px', height: '25px' }}></div>
                  <div>Principal's Signature</div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
