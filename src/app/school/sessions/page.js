'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getSessions, createSession, updateSession, getClasses } from '@/firebase/db/academic';
import { getStudentsBySchool, updateStudent } from '@/firebase/db/students';
import { Plus, CheckCircle, CalendarDays, ArrowUpRight, GraduationCap } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

export default function AcademicSessionsPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();
  
  const [sessions, setSessions] = useState([]);
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  
  const [newSessionName, setNewSessionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promotion state
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadSessions();
      getClasses(schoolId).then(setClassList);
    }
  }, [schoolId]);

  const loadSessions = async () => {
    setLoading(true);
    const data = await getSessions(schoolId);
    setSessions(data);
    setLoading(false);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim() || !startDate || !endDate) return;
    
    setIsSubmitting(true);
    try {
      await createSession(schoolId, {
        name: newSessionName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: sessions.length === 0 // Make it current if it's the first one
      });
      setIsModalOpen(false);
      setNewSessionName('');
      setStartDate('');
      setEndDate('');
      loadSessions();
      showAlert("Session created successfully", "success");
    } catch (error) {
      console.error('Error creating session:', error);
      showAlert('Failed to create session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (sessionId) => {
    if (confirm('Are you sure you want to set this as the active session?')) {
      const currentSession = sessions.find(s => s.isCurrent);
      
      if (currentSession && currentSession.id !== sessionId) {
        await updateSession(currentSession.id, { isCurrent: false });
      }
      
      await updateSession(sessionId, { isCurrent: true });
      loadSessions();
    }
  };

  const handlePromoteStudents = async (e) => {
    e.preventDefault();
    if (!fromClassId || !toClassId) {
      showAlert('Please select both From Class and To Class.', 'error');
      return;
    }
    if (fromClassId === toClassId) {
      showAlert('From Class and To Class must be different.', 'error');
      return;
    }

    const currentSession = sessions.find(s => s.isCurrent);
    if (!currentSession) {
      showAlert('Please set an active session first.', 'error');
      return;
    }

    setIsPromoting(true);
    try {
      const allStudents = await getStudentsBySchool(schoolId);
      const eligibleStudents = allStudents.filter(
        s => s.classId === fromClassId && s.academicDetails?.status === 'ACTIVE'
      );

      if (eligibleStudents.length === 0) {
        showAlert('No active students found in the selected From Class.', 'error');
        setIsPromoting(false);
        return;
      }

      const fromClassName = classList.find(c => c.id === fromClassId)?.name || 'Class';
      const toClassName = classList.find(c => c.id === toClassId)?.name || 'Class';

      if (!confirm(`Promote ${eligibleStudents.length} students from ${fromClassName} to ${toClassName} for session ${currentSession.name}?`)) {
        setIsPromoting(false);
        return;
      }

      let count = 0;
      for (const st of eligibleStudents) {
        await updateStudent(st.id, {
          classId: toClassId,
          sectionId: '', // Reset section for new class assignment
          sessionId: currentSession.id,
          sessionName: currentSession.name,
          academicDetails: {
            ...st.academicDetails,
            previousClass: fromClassName
          }
        });
        count++;
      }

      showAlert(`Successfully promoted ${count} students to ${toClassName}!`, 'success');
      setIsPromoteModalOpen(false);
      setFromClassId('');
      setToClassId('');
    } catch (error) {
      console.error('Failed to promote students:', error);
      showAlert('Failed to promote students. Please try again.', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const activeSessionObj = sessions.find(s => s.isCurrent);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Academic Sessions</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage school years and active session</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button variant="outline" icon={GraduationCap} onClick={() => setIsPromoteModalOpen(true)}>
              Promote Students
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Add Session
            </Button>
          </div>
        </div>

        {loading ? (
          <p>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No Sessions Configured</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Add your first academic year (e.g., 2025-2026).
            </p>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Create Academic Session
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((session) => (
              <Card 
                key={session.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderLeft: session.isCurrent ? '4px solid var(--success-color)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '3rem', height: '3rem', borderRadius: '0.75rem',
                    backgroundColor: session.isCurrent ? 'var(--success-light)' : 'var(--bg-secondary)',
                    color: session.isCurrent ? 'var(--success-color)' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {session.name}
                      {session.isCurrent && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          backgroundColor: 'var(--success-light)', 
                          color: 'var(--success-color)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {session.startDate?.toDate ? session.startDate.toDate().toLocaleDateString() : new Date(session.startDate).toLocaleDateString()} 
                      {' '} - {' '}
                      {session.endDate?.toDate ? session.endDate.toDate().toLocaleDateString() : new Date(session.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  {!session.isCurrent && (
                    <Button variant="outline" onClick={() => handleSetCurrent(session.id)}>
                      Set as Active
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add Session Modal */}
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isSubmitting && setIsModalOpen(false)} 
          title="Add Academic Session"
        >
          <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Session Name"
              placeholder="e.g. 2025-2026"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              required
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Promote Students Modal */}
        <Modal
          isOpen={isPromoteModalOpen}
          onClose={() => !isPromoting && setIsPromoteModalOpen(false)}
          title="Promote Students to Next Class"
        >
          <form onSubmit={handlePromoteStudents} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Promote active students from one class level to the next for the active session{' '}
              <strong>({activeSessionObj?.name || 'Current Session'})</strong>.
            </p>

            <Select
              label="From Class (Current Class) *"
              value={fromClassId}
              onChange={(e) => setFromClassId(e.target.value)}
              placeholder="Select Current Class"
              required
            >
              {classList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select
              label="To Class (Promote Into) *"
              value={toClassId}
              onChange={(e) => setToClassId(e.target.value)}
              placeholder="Select Target Class"
              required
            >
              {classList.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsPromoteModalOpen(false)} disabled={isPromoting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPromoting || !fromClassId || !toClassId}>
                {isPromoting ? 'Promoting...' : 'Promote Class'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
