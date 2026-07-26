'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useAuth } from '@/hooks/useAuth';
import { getSessions, createSession, updateSession, getClasses } from '@/firebase/db/academic';
import { getStudentsBySchool, updateStudent } from '@/firebase/db/students';
import { Plus, CheckCircle, CalendarDays, GraduationCap, Layers, Inbox } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

export default function AcademicSessionsPage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [sessions, setSessions] = useState([]);
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  const [newSessionName, setNewSessionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [terms, setTerms] = useState('Term 1, Term 2, Term 3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promotion state
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  // Confirmation Modals state (UX §7)
  const [sessionToActivate, setSessionToActivate] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadInitialData();
    }
  }, [schoolId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [fetchedSessions, fetchedClasses] = await Promise.all([
        getSessions(schoolId),
        getClasses(schoolId)
      ]);
      setSessions(fetchedSessions);
      setClassList(fetchedClasses);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      showAlert('Failed to load academic sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName.trim() || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const termList = terms
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createSession(schoolId, {
        name: newSessionName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        terms: termList.length > 0 ? termList : ['Term 1', 'Term 2', 'Term 3'],
        isCurrent: sessions.length === 0 // Make current if first session
      });

      setIsModalOpen(false);
      setNewSessionName('');
      setStartDate('');
      setEndDate('');
      setTerms('Term 1, Term 2, Term 3');
      loadInitialData();
      showAlert('Academic session created successfully!', 'success');
    } catch (error) {
      console.error('Error creating session:', error);
      showAlert('Failed to create session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSetCurrent = async () => {
    if (!sessionToActivate) return;
    setIsActivating(true);
    try {
      const currentSession = sessions.find((s) => s.isCurrent);
      if (currentSession && currentSession.id !== sessionToActivate.id) {
        await updateSession(currentSession.id, { isCurrent: false });
      }
      await updateSession(sessionToActivate.id, { isCurrent: true });
      showAlert(`Session "${sessionToActivate.name}" set as active current session!`, 'success');
      setSessionToActivate(null);
      loadInitialData();
    } catch (err) {
      console.error('Error setting active session:', err);
      showAlert('Failed to switch active session', 'error');
    } finally {
      setIsActivating(false);
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

    const activeSession = sessions.find((s) => s.isCurrent);
    if (!activeSession) {
      showAlert('Please set an active session first before promoting students.', 'error');
      return;
    }

    setIsPromoting(true);
    try {
      const allStudents = await getStudentsBySchool(schoolId);
      const eligibleStudents = allStudents.filter(
        (s) => s.classId === fromClassId && (s.academicDetails?.status === 'ACTIVE' || !s.academicDetails?.status)
      );

      if (eligibleStudents.length === 0) {
        showAlert('No active students found in the selected From Class.', 'error');
        setIsPromoting(false);
        return;
      }

      const fromClassName = classList.find((c) => c.id === fromClassId)?.name || 'Class';
      const toClassName = classList.find((c) => c.id === toClassId)?.name || 'Class';

      let count = 0;
      for (const st of eligibleStudents) {
        await updateStudent(st.id, {
          classId: toClassId,
          sectionId: '', // Reset section for new class assignment
          sessionId: activeSession.id,
          sessionName: activeSession.name,
          academicDetails: {
            ...st.academicDetails,
            previousClass: fromClassName
          }
        });
        count++;
      }

      showAlert(`Successfully promoted ${count} students from ${fromClassName} to ${toClassName}!`, 'success');
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

  const activeSessionObj = sessions.find((s) => s.isCurrent);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Academic Sessions</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage academic years, term breakdowns, active current session filtering, and student promotion</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="outline" icon={GraduationCap} onClick={() => setIsPromoteModalOpen(true)}>
              Promote Class Students
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
              Add Session
            </Button>
          </div>
        </div>

        {/* Skeleton Loaders (UX §4) */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: '90px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px dashed var(--surface-border)' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={32} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Academic Sessions Configured</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 0 auto', fontSize: '0.9375rem' }}>
                Add your first academic session year (e.g. 2025-2026 Academic Year) to filter records platform-wide.
              </p>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} style={{ marginTop: '0.5rem' }}>
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
                  justify: 'space-between',
                  alignItems: 'center',
                  padding: '1.5rem',
                  borderLeft: session.isCurrent ? '5px solid var(--status-success)' : '1px solid var(--surface-border)',
                  backgroundColor: session.isCurrent ? 'var(--status-success-bg)' : 'var(--surface-card)',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div
                    style={{
                      width: '3.25rem',
                      height: '3.25rem',
                      borderRadius: '0.875rem',
                      backgroundColor: session.isCurrent ? 'var(--status-success)' : 'var(--surface-hover)',
                      color: session.isCurrent ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CalendarDays size={26} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{session.name}</h3>
                      {session.isCurrent && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--status-success)',
                            color: '#fff',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <CheckCircle size={13} /> ACTIVE CURRENT SESSION
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {session.startDate?.toDate ? session.startDate.toDate().toLocaleDateString() : new Date(session.startDate).toLocaleDateString()}
                      {' — '}
                      {session.endDate?.toDate ? session.endDate.toDate().toLocaleDateString() : new Date(session.endDate).toLocaleDateString()}
                    </p>
                    {session.terms && session.terms.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {session.terms.map((term, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', backgroundColor: 'var(--surface-border)', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontWeight: 500 }}>
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {!session.isCurrent && (
                    <Button variant="outline" onClick={() => setSessionToActivate(session)}>
                      Set as Active Session
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal for Creating Session */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          title="Add Academic Session Year"
        >
          <form onSubmit={handleCreateSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Session Title *"
              placeholder="e.g. 2025-2026 Academic Session"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
              <Input
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            <Input
              label="Term Breakdowns (Comma separated)"
              placeholder="e.g. Term 1, Term 2, Term 3"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
                Create Session
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal for Student Promotion */}
        <Modal
          isOpen={isPromoteModalOpen}
          onClose={() => !isPromoting && setIsPromoteModalOpen(false)}
          title="Promote Class Students to Next Level"
        >
          <form onSubmit={handlePromoteStudents} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ padding: '0.875rem 1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', borderRadius: '0.625rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Batch promote active students from an existing class to the next academic level for the active session (<strong>{activeSessionObj?.name || 'Current Session'}</strong>).
            </div>

            <Select
              label="From Class (Current Level) *"
              value={fromClassId}
              onChange={(e) => setFromClassId(e.target.value)}
              placeholder="Select Source Class"
              required
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select
              label="To Class (Target Level) *"
              value={toClassId}
              onChange={(e) => setToClassId(e.target.value)}
              placeholder="Select Target Class"
              required
            >
              {classList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsPromoteModalOpen(false)} disabled={isPromoting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isPromoting || !fromClassId || !toClassId} isLoading={isPromoting}>
                Promote Students
              </Button>
            </div>
          </form>
        </Modal>

        {/* Confirmation Modal for Active Session Switch (UX §7) */}
        <ConfirmationModal
          isOpen={!!sessionToActivate}
          onClose={() => setSessionToActivate(null)}
          onConfirm={handleConfirmSetCurrent}
          title={`Switch Active Session to "${sessionToActivate?.name}"?`}
          description="Are you sure you want to set this session as the active current session? Dashboard stats, student rosters, and fee collection filters will update to this active session."
          confirmText="Set as Active Session"
          cancelText="Cancel"
          variant="primary"
          isLoading={isActivating}
        />

      </div>
    </ProtectedRoute>
  );
}
