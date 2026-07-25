'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { getStudentById, deleteStudent, updateStudent } from '@/firebase/db/students';
import { getClassById, getClasses, getSectionsForClass } from '@/firebase/db/academic';
import { getStudentLedger } from '@/firebase/db/fees';
import { ArrowLeft, Printer, Trash2, Edit2, UserCircle, MapPin, Phone, BookOpen, DollarSign, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StudentProfilePage({ params }) {
  const { schoolId, role } = useAuth();
  const { showAlert } = useAlert();
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

  // Class & Section lists for editing
  const [classList, setClassList] = useState([]);
  const [sectionList, setSectionList] = useState([]);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [editForm, setEditForm] = useState({
    admissionNumber: '',
    rollNumber: '',
    classId: '',
    sectionId: '',
    fullName: '',
    gender: 'Male',
    dob: '',
    bloodGroup: '',
    religion: '',
    nationality: '',
    fatherName: '',
    motherName: '',
    guardianName: '',
    phone: '',
    email: '',
    cnic: '',
    occupation: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    postalCode: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    if (schoolId && studentId) {
      loadStudentProfile();
      loadLedger();
    }
  }, [schoolId, studentId]);

  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      return dateVal.split('T')[0];
    }
    if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
      return dateVal.toDate().toISOString().split('T')[0];
    }
    if (dateVal instanceof Date) {
      return dateVal.toISOString().split('T')[0];
    }
    return '';
  };

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

  const handleOpenEditModal = async () => {
    if (!student) return;

    const classesData = await getClasses(schoolId);
    setClassList(classesData);

    if (student.classId) {
      const secs = await getSectionsForClass(schoolId, student.classId);
      setSectionList(secs);
    } else {
      setSectionList([]);
    }

    setEditForm({
      admissionNumber: student.admissionNumber || '',
      rollNumber: student.rollNumber || '',
      classId: student.classId || '',
      sectionId: student.sectionId || '',
      fullName: student.personalInfo?.fullName || '',
      gender: student.personalInfo?.gender || 'Male',
      dob: formatDateForInput(student.personalInfo?.dob),
      bloodGroup: student.personalInfo?.bloodGroup || '',
      religion: student.personalInfo?.religion || '',
      nationality: student.personalInfo?.nationality || '',
      fatherName: student.parentInfo?.fatherName || '',
      motherName: student.parentInfo?.motherName || '',
      guardianName: student.parentInfo?.guardianName || '',
      phone: student.parentInfo?.phone || '',
      email: student.parentInfo?.email || '',
      cnic: student.parentInfo?.cnic || '',
      occupation: student.parentInfo?.occupation || '',
      currentAddress: student.addresses?.current || '',
      permanentAddress: student.addresses?.permanent || '',
      city: student.addresses?.city || '',
      postalCode: student.addresses?.postalCode || '',
      status: student.academicDetails?.status || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  const handleClassChangeInEdit = async (newClassId) => {
    setEditForm(prev => ({ ...prev, classId: newClassId, sectionId: '' }));
    if (newClassId) {
      const secs = await getSectionsForClass(schoolId, newClassId);
      setSectionList(secs);
    } else {
      setSectionList([]);
    }
  };

  const handleSaveEditStudent = async (e) => {
    e.preventDefault();
    setIsUpdatingStudent(true);
    try {
      const updatedData = {
        admissionNumber: editForm.admissionNumber,
        rollNumber: editForm.rollNumber,
        classId: editForm.classId,
        sectionId: editForm.sectionId,
        personalInfo: {
          ...student.personalInfo,
          fullName: editForm.fullName,
          gender: editForm.gender,
          dob: editForm.dob ? new Date(editForm.dob) : null,
          bloodGroup: editForm.bloodGroup,
          religion: editForm.religion,
          nationality: editForm.nationality,
        },
        parentInfo: {
          ...student.parentInfo,
          fatherName: editForm.fatherName,
          motherName: editForm.motherName,
          guardianName: editForm.guardianName,
          phone: editForm.phone,
          email: editForm.email,
          cnic: editForm.cnic,
          occupation: editForm.occupation,
        },
        addresses: {
          ...student.addresses,
          current: editForm.currentAddress,
          permanent: editForm.permanentAddress,
          city: editForm.city,
          postalCode: editForm.postalCode,
        },
        academicDetails: {
          ...student.academicDetails,
          status: editForm.status
        }
      };

      await updateStudent(studentId, updatedData);
      setIsEditModalOpen(false);
      await loadStudentProfile();
      showAlert('Student profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating student profile:', error);
      showAlert('Failed to update student profile.', 'error');
    } finally {
      setIsUpdatingStudent(false);
    }
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
      showAlert("Custom fee saved successfully!", 'success');
    } catch (error) {
      console.error(error);
      showAlert("Failed to save custom fee.", 'error');
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
            {['SCHOOL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'].includes(role) && (
              <>
                <Button variant="outline" icon={Edit2} onClick={handleOpenEditModal}>
                  Edit Profile
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
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Guardian Name</span>
                  <strong>{student.parentInfo.guardianName || 'N/A'}</strong>
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
                <BookOpen size={20} color="var(--primary-color)" /> Academic Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Date of Admission</span>
                  <strong>{student.admissionDate ? new Date(student.admissionDate.toDate ? student.admissionDate.toDate() : student.admissionDate).toLocaleDateString() : 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Admission Type</span>
                  <strong>{student.academicDetails?.admissionType || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>Previous School</span>
                  <strong>{student.academicDetails?.previousSchool || 'N/A'}</strong>
                </div>
              </div>
            </Card>
          </div>
        ) : activeTab === 'LEDGER' ? (
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
                  <Select 
                    label="Fee Type"
                    value={customFeesForm.feeType}
                    onChange={e => setCustomFeesForm({ ...customFeesForm, feeType: e.target.value })}
                  >
                    <option value="Tuition">Tuition</option>
                    <option value="Admission">Admission</option>
                    <option value="Annual">Annual</option>
                    <option value="Exam">Exam</option>
                    <option value="Misc">Misc</option>
                  </Select>
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

        {/* Edit Student Modal */}
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => !isUpdatingStudent && setIsEditModalOpen(false)} 
          title="Edit Student Profile"
        >
          <form onSubmit={handleSaveEditStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
            
            {/* Academic Information */}
            <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>Academic Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Admission Number *"
                value={editForm.admissionNumber}
                onChange={(e) => setEditForm({ ...editForm, admissionNumber: e.target.value })}
                required
              />
              <Input
                label="Roll Number"
                value={editForm.rollNumber}
                onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select
                label="Class"
                value={editForm.classId}
                onChange={(e) => handleClassChangeInEdit(e.target.value)}
                placeholder="Select Class"
              >
                {classList.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>

              <Select
                label="Section"
                value={editForm.sectionId}
                onChange={(e) => setEditForm({ ...editForm, sectionId: e.target.value })}
                disabled={!editForm.classId}
                placeholder={editForm.classId ? "Select Section" : "Select Class First"}
              >
                {sectionList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>

            {/* Personal Information */}
            <h4 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-color)' }}>Personal Information</h4>
            <Input
              label="Full Name *"
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select
                label="Gender"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Input
                label="Date of Birth"
                type="date"
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Input
                label="Blood Group"
                placeholder="e.g. O+, A+"
                value={editForm.bloodGroup}
                onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
              />
              <Input
                label="Religion"
                value={editForm.religion}
                onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })}
              />
              <Input
                label="Nationality"
                value={editForm.nationality}
                onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
              />
            </div>

            {/* Parent Information */}
            <h4 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-color)' }}>Parent / Guardian Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Father's Name"
                value={editForm.fatherName}
                onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
              />
              <Input
                label="Mother's Name"
                value={editForm.motherName}
                onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Input
                label="Guardian Name"
                value={editForm.guardianName}
                onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
              />
              <Input
                label="Parent Phone *"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Input
                label="CNIC / ID"
                value={editForm.cnic}
                onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Parent Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <Input
                label="Occupation"
                value={editForm.occupation}
                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
              />
            </div>

            {/* Address & Status */}
            <h4 style={{ margin: '0.5rem 0 0 0', color: 'var(--primary-color)' }}>Address & Status</h4>
            <Input
              label="Current Address"
              value={editForm.currentAddress}
              onChange={(e) => setEditForm({ ...editForm, currentAddress: e.target.value })}
            />
            <Input
              label="Permanent Address"
              value={editForm.permanentAddress}
              onChange={(e) => setEditForm({ ...editForm, permanentAddress: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Input
                label="City"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
              <Input
                label="Postal Code"
                value={editForm.postalCode}
                onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
              />
              <Select
                label="Academic Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PASSED_OUT">Passed Out</option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdatingStudent}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isUpdatingStudent}>
                {isUpdatingStudent ? 'Saving Changes...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
