'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getStudentById, deleteStudent, updateStudent } from '@/firebase/db/students';
import { getClassById, getSectionsForClass } from '@/firebase/db/academic';
import { getStudentLedger } from '@/firebase/db/fees';
import { ArrowLeft, Printer, Trash2, Edit2, UserCircle, MapPin, Phone, BookOpen, DollarSign, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage({ params }) {
  const { schoolId, role } = useAuth();
  const router = useRouter();
  const studentId = params.studentId;
  
  const [student, setStudent] = useState(null);
  const [className, setClassName] = useState('Loading...');
  const [sectionName, setSectionName] = useState('Loading...');
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('PROFILE'); // PROFILE, LEDGER, SETTINGS
  const [customFeesForm, setCustomFeesForm] = useState({ feeType: 'Tuition', amount: '' });
  const [savingFees, setSavingFees] = useState(false);

  useEffect(() => {
    if (schoolId && studentId) {
      loadStudentProfile();
      loadLedger();
    }
  }, [schoolId, studentId]);

  const loadStudentProfile = async () => {
    setLoading(true);
    const data = await getStudentById(studentId);
    if (!data || data.schoolId !== schoolId) {
      router.push('/school/students');
      return;
    }
    setStudent(data);
    
    if (data.classId) {
      const cls = await getClassById(data.classId);
      setClassName(cls ? cls.name : 'Unknown Class');
      
      if (data.sectionId) {
        const sections = await getSectionsForClass(schoolId, data.classId);
        const sec = sections.find(s => s.id === data.sectionId);
        setSectionName(sec ? sec.name : 'Unknown Section');
      } else {
        setSectionName('No Section');
      }
    } else {
      setClassName('No Class Assigned');
      setSectionName('-');
    }
    
    setLoading(false);
  };

  const loadLedger = async () => {
    const data = await getStudentLedger(schoolId, studentId);
    setLedger(data);
  }

  const handleSaveCustomFee = async () => {
    if (!customFeesForm.amount) return;
    setSavingFees(true);
    try {
      const currentCustomFees = student.customFees || {};
      const updatedCustomFees = {
        ...currentCustomFees,
        [customFeesForm.feeType]: Number(customFeesForm.amount)
      };
      await updateStudent(studentId, { customFees: updatedCustomFees });
      
      // Update local state
      setStudent({ ...student, customFees: updatedCustomFees });
      setCustomFeesForm({ ...customFeesForm, amount: '' });
      alert("Custom fee saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to save custom fee.");
    } finally {
      setSavingFees(false);
    }
  };

  const handleRemoveCustomFee = async (feeType) => {
    if (!confirm(`Remove custom fee for ${feeType}?`)) return;
    setSavingFees(true);
    try {
      const currentCustomFees = { ...student.customFees };
      delete currentCustomFees[feeType];
      
      await updateStudent(studentId, { customFees: currentCustomFees });
      setStudent({ ...student, customFees: currentCustomFees });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingFees(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently delete this student record?')) {
      await deleteStudent(studentId);
      router.push('/school/students');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading student profile...</div>;
  }

  if (!student) return null;

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'TEACHER']}>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Hide header during print */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/students')} style={{ padding: '0.5rem' }}>
            Back to Records
          </Button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="outline" icon={Printer} onClick={handlePrint}>
              Print {activeTab === 'PROFILE' ? 'Profile' : 'Ledger'}
            </Button>
            {['SCHOOL_ADMIN', 'RECEPTIONIST'].includes(role) && (
              <>
                <Button variant="outline" icon={Edit2} onClick={() => alert('Edit form coming soon!')}>
                  Edit
                </Button>
                <Button variant="outline" icon={Trash2} onClick={handleDelete} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card style={{ marginBottom: '1.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            {student.personalInfo?.photoUrl ? (
              <img 
                src={student.personalInfo.photoUrl} 
                alt="Profile" 
                style={{ width: '120px', height: '120px', borderRadius: '1rem', objectFit: 'cover', border: '1px solid var(--border-color)' }}
              />
            ) : (
              <div style={{ width: '120px', height: '120px', borderRadius: '1rem', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                <UserCircle size={64} />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>{student.personalInfo.fullName}</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  {className} - Section {sectionName}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  backgroundColor: student.academicDetails.status === 'ACTIVE' ? 'var(--success-light)' : 'var(--bg-secondary)',
                  color: student.academicDetails.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  {student.academicDetails.status}
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Adm No: {student.admissionNumber}
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Roll No: {student.rollNumber || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
          <button 
            onClick={() => setActiveTab('PROFILE')}
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'PROFILE' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'PROFILE' ? '3px solid var(--primary-color)' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            Profile Information
          </button>
          <button 
            onClick={() => setActiveTab('LEDGER')}
            style={{ 
              background: 'none', border: 'none', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              color: activeTab === 'LEDGER' ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'LEDGER' ? '3px solid var(--primary-color)' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            Fee Ledger
          </button>
          {['SCHOOL_ADMIN', 'ACCOUNTANT'].includes(role) && (
            <button 
              onClick={() => setActiveTab('SETTINGS')}
              style={{ 
                background: 'none', border: 'none', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                color: activeTab === 'SETTINGS' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'SETTINGS' ? '3px solid var(--primary-color)' : '3px solid transparent',
                marginBottom: '-2px'
              }}
            >
              Fee Settings
            </button>
          )}
        </div>

        {activeTab === 'PROFILE' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <Card>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <UserCircle size={20} color="var(--primary-color)" /> Personal Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Date of Birth</span>
                  <strong>{student.personalInfo.dob ? new Date(student.personalInfo.dob).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Gender</span>
                  <strong>{student.personalInfo.gender || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Blood Group</span>
                  <strong>{student.personalInfo.bloodGroup || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Religion</span>
                  <strong>{student.personalInfo.religion || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Nationality</span>
                  <strong>{student.personalInfo.nationality || 'N/A'}</strong>
                </div>
              </div>
            </Card>

            <Card>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Phone size={20} color="var(--primary-color)" /> Parent / Guardian Info
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Father's Name</span>
                  <strong>{student.parentInfo.fatherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Mother's Name</span>
                  <strong>{student.parentInfo.motherName || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Primary Phone</span>
                  <strong>{student.parentInfo.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Email</span>
                  <strong>{student.parentInfo.email || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>CNIC</span>
                  <strong>{student.parentInfo.cnic || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Occupation</span>
                  <strong>{student.parentInfo.occupation || 'N/A'}</strong>
                </div>
              </div>
            </Card>

            <Card style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <MapPin size={20} color="var(--primary-color)" /> Address & Location
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Current Address</span>
                  <strong>{student.addresses.current || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Permanent Address</span>
                  <strong>{student.addresses.permanent || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>City</span>
                  <strong>{student.addresses.city || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Postal Code</span>
                  <strong>{student.addresses.postalCode || 'N/A'}</strong>
                </div>
              </div>
            </Card>
            
            <Card style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <BookOpen size={20} color="var(--primary-color)" /> Academic History
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Date of Admission</span>
                  <strong>{student.admissionDate ? new Date(student.admissionDate.toDate ? student.admissionDate.toDate() : student.admissionDate).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Admission Type</span>
                  <strong>{student.academicDetails.admissionType || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Previous School</span>
                  <strong>{student.academicDetails.previousSchool || 'N/A'}</strong>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <DollarSign size={20} color="var(--primary-color)" /> Fee Ledger
            </h3>
            
            {ledger.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No financial records found for this student.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                      <th style={{ padding: '1rem 0.5rem' }}>Description</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Debit (Dr)</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Credit (Cr)</th>
                      <th style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry, index) => (
                      <tr key={entry.id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0.5rem' }}>{entry.date?.toMillis ? new Date(entry.date.toMillis()).toLocaleDateString() : ''}</td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>{entry.transactionType}</span>
                          <br />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{entry.description}</span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right', color: entry.debit ? 'var(--danger)' : 'inherit' }}>
                          {entry.debit ? entry.debit.toFixed(2) : '-'}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right', color: entry.credit ? 'var(--success-color)' : 'inherit' }}>
                          {entry.credit ? entry.credit.toFixed(2) : '-'}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                          {entry.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <Card>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <Settings size={20} color="var(--primary-color)" /> Custom Fee Concessions
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Override the standard class fee for this specific student. When invoices are generated, the custom amount will be used instead of the standard amount.
              </p>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Fee Type</label>
                  <select 
                    value={customFeesForm.feeType}
                    onChange={e => setCustomFeesForm({ ...customFeesForm, feeType: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="Admission">Admission</option>
                    <option value="Annual">Annual</option>
                    <option value="Exam">Exam</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Custom Amount</label>
                  <input 
                    type="number" 
                    value={customFeesForm.amount}
                    onChange={e => setCustomFeesForm({ ...customFeesForm, amount: e.target.value })}
                    placeholder="e.g. 3700"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                  />
                </div>
                <Button variant="primary" onClick={handleSaveCustomFee} disabled={savingFees || !customFeesForm.amount}>
                  {savingFees ? 'Saving...' : 'Add Override'}
                </Button>
              </div>

              {student.customFees && Object.keys(student.customFees).length > 0 ? (
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Active Overrides</h4>
                  {Object.entries(student.customFees).map(([type, amount]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{type} Fee</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Overridden to {amount}</div>
                      </div>
                      <button 
                        onClick={() => handleRemoveCustomFee(type)}
                        disabled={savingFees}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
                  No custom fee overrides for this student.
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
