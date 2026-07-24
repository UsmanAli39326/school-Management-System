'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { admitStudent } from '@/firebase/db/students';
import { getClasses, getSectionsForClass } from '@/firebase/db/academic';
import { uploadFile, generateUniqueFileName } from '@/firebase/storage';
import { ArrowLeft, ArrowRight, Check, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = ['Admission Details', 'Personal Info', 'Parent Info', 'Address', 'Review'];

export default function StudentAdmissionPage() {
  const { schoolId } = useAuth();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Form State
  const [formData, setFormData] = useState({
    admissionNumber: '',
    rollNumber: '',
    admissionDate: new Date().toISOString().split('T')[0],
    classId: '',
    sectionId: '',
    personalInfo: {
      fullName: '',
      gender: '',
      dob: '',
      bloodGroup: '',
      religion: '',
      nationality: '',
    },
    parentInfo: {
      fatherName: '',
      motherName: '',
      guardianName: '',
      cnic: '',
      phone: '',
      email: '',
      occupation: '',
    },
    addresses: {
      current: '',
      permanent: '',
      city: '',
      postalCode: '',
    }
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    if (schoolId) {
      getClasses(schoolId).then(setClasses);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && formData.classId) {
      getSectionsForClass(schoolId, formData.classId).then(setSections);
      // Reset section when class changes
      setFormData(prev => ({ ...prev, sectionId: '' }));
    } else {
      setSections([]);
    }
  }, [schoolId, formData.classId]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    // Basic validation could go here
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        const path = `students/${schoolId}/photos/${generateUniqueFileName(photoFile.name)}`;
        photoUrl = await uploadFile(photoFile, path);
      }

      const finalData = {
        ...formData,
        admissionDate: new Date(formData.admissionDate),
        personalInfo: {
          ...formData.personalInfo,
          dob: formData.personalInfo.dob ? new Date(formData.personalInfo.dob) : null,
          photoUrl
        }
      };

      const result = await admitStudent(schoolId, finalData);
      router.push(`/school/students/${result.id}`);
    } catch (error) {
      console.error("Failed to admit student:", error);
      alert("Failed to admit student. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="Admission Number *" value={formData.admissionNumber} onChange={e => handleInputChange(null, 'admissionNumber', e.target.value)} />
            <Input label="Admission Date *" type="date" value={formData.admissionDate} onChange={e => handleInputChange(null, 'admissionDate', e.target.value)} />
            <Input label="Roll Number" value={formData.rollNumber} onChange={e => handleInputChange(null, 'rollNumber', e.target.value)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Class *</label>
              <select value={formData.classId} onChange={e => handleInputChange(null, 'classId', e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Section</label>
              <select value={formData.sectionId} onChange={e => handleInputChange(null, 'sectionId', e.target.value)} disabled={!formData.classId} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                {photoPreview ? <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UploadCloud size={24} color="var(--text-tertiary)" />}
              </div>
              <div>
                <label style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                  Upload Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <Input label="Full Name *" value={formData.personalInfo.fullName} onChange={e => handleInputChange('personalInfo', 'fullName', e.target.value)} />
            <Input label="Date of Birth *" type="date" value={formData.personalInfo.dob} onChange={e => handleInputChange('personalInfo', 'dob', e.target.value)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Gender *</label>
              <select value={formData.personalInfo.gender} onChange={e => handleInputChange('personalInfo', 'gender', e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <Input label="Blood Group" value={formData.personalInfo.bloodGroup} onChange={e => handleInputChange('personalInfo', 'bloodGroup', e.target.value)} />
            <Input label="Religion" value={formData.personalInfo.religion} onChange={e => handleInputChange('personalInfo', 'religion', e.target.value)} />
            <Input label="Nationality" value={formData.personalInfo.nationality} onChange={e => handleInputChange('personalInfo', 'nationality', e.target.value)} />
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input label="Father's Name *" value={formData.parentInfo.fatherName} onChange={e => handleInputChange('parentInfo', 'fatherName', e.target.value)} />
            <Input label="Mother's Name" value={formData.parentInfo.motherName} onChange={e => handleInputChange('parentInfo', 'motherName', e.target.value)} />
            <Input label="Guardian's Name" value={formData.parentInfo.guardianName} onChange={e => handleInputChange('parentInfo', 'guardianName', e.target.value)} />
            <Input label="CNIC / ID" value={formData.parentInfo.cnic} onChange={e => handleInputChange('parentInfo', 'cnic', e.target.value)} />
            <Input label="Phone Number *" type="tel" value={formData.parentInfo.phone} onChange={e => handleInputChange('parentInfo', 'phone', e.target.value)} />
            <Input label="Email" type="email" value={formData.parentInfo.email} onChange={e => handleInputChange('parentInfo', 'email', e.target.value)} />
            <Input label="Occupation" value={formData.parentInfo.occupation} onChange={e => handleInputChange('parentInfo', 'occupation', e.target.value)} />
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <Input label="Current Address *" value={formData.addresses.current} onChange={e => handleInputChange('addresses', 'current', e.target.value)} />
            <Input label="Permanent Address" value={formData.addresses.permanent} onChange={e => handleInputChange('addresses', 'permanent', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input label="City *" value={formData.addresses.city} onChange={e => handleInputChange('addresses', 'city', e.target.value)} />
              <Input label="Postal Code" value={formData.addresses.postalCode} onChange={e => handleInputChange('addresses', 'postalCode', e.target.value)} />
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>Review Details</h3>
            <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
              <p><strong>Name:</strong> {formData.personalInfo.fullName || 'Not provided'}</p>
              <p><strong>Admission No:</strong> {formData.admissionNumber || 'Not provided'}</p>
              <p><strong>Class ID:</strong> {formData.classId || 'Not provided'}</p>
              <p><strong>Father's Name:</strong> {formData.parentInfo.fatherName || 'Not provided'}</p>
              <p><strong>Phone:</strong> {formData.parentInfo.phone || 'Not provided'}</p>
              <p><strong>City:</strong> {formData.addresses.city || 'Not provided'}</p>
              {photoFile && <p style={{ color: 'var(--success-color)' }}>✓ Photo attached</p>}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Please ensure all details are correct before admitting the student. You can edit these details later from the student profile.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'RECEPTIONIST']}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={() => router.push('/school/students')} style={{ padding: '0.5rem' }}>
            Back to Records
          </Button>
        </div>

        <Card style={{ padding: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>New Admission: {STEPS[currentStep]}</h2>
          
          {/* Progress Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {STEPS.map((step, index) => (
              <div key={index} style={{ flex: 1 }}>
                <div style={{ 
                  height: '4px', 
                  backgroundColor: index <= currentStep ? 'var(--primary-color)' : 'var(--border-color)',
                  borderRadius: '2px',
                  marginBottom: '0.5rem'
                }} />
                <div style={{ fontSize: '0.75rem', color: index <= currentStep ? 'var(--primary-color)' : 'var(--text-tertiary)', fontWeight: index === currentStep ? 600 : 400 }}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          <div style={{ minHeight: '300px', marginBottom: '2rem' }}>
            {renderStepContent()}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <Button 
              variant="outline" 
              onClick={prevStep} 
              disabled={currentStep === 0 || isSubmitting}
            >
              Previous
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button variant="primary" onClick={nextStep} icon={ArrowRight}>
                Next Step
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit} icon={Check} disabled={isSubmitting || !formData.personalInfo.fullName || !formData.admissionNumber}>
                {isSubmitting ? 'Processing...' : 'Confirm Admission'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
