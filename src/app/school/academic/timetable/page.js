'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { getClasses, getSubjectsForClass } from '@/firebase/db/academic';
import { createSchedule, getSchedulesForClass, deleteSchedule } from '@/firebase/db/schedules';
import { Calendar, Trash2, Plus, Clock } from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const { schoolId } = useAuth();
  
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    subjectId: '',
    startTime: '09:00',
    endTime: '09:45'
  });

  useEffect(() => {
    if (schoolId) {
      loadClasses();
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId && selectedClassId) {
      loadTimetableData(selectedClassId);
    } else {
      setSubjects([]);
      setSchedules([]);
    }
  }, [schoolId, selectedClassId]);

  const loadClasses = async () => {
    setLoading(true);
    const fetchedClasses = await getClasses(schoolId);
    setClasses(fetchedClasses);
    if (fetchedClasses.length > 0) {
      setSelectedClassId(fetchedClasses[0].id);
    }
    setLoading(false);
  };

  const loadTimetableData = async (classId) => {
    setLoading(true);
    const [fetchedSubjects, fetchedSchedules] = await Promise.all([
      getSubjectsForClass(schoolId, classId),
      getSchedulesForClass(schoolId, classId)
    ]);
    setSubjects(fetchedSubjects);
    setSchedules(fetchedSchedules);
    setLoading(false);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!formData.subjectId || !selectedClassId) return;

    setIsSubmitting(true);
    try {
      const subject = subjects.find(s => s.id === formData.subjectId);
      await createSchedule(schoolId, {
        classId: selectedClassId,
        subjectId: formData.subjectId,
        teacherId: subject?.teacherId || null,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      setIsModalOpen(false);
      loadTimetableData(selectedClassId);
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Failed to add schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (confirm('Delete this schedule entry?')) {
      await deleteSchedule(scheduleId);
      loadTimetableData(selectedClassId);
    }
  };

  // Organize schedules into a grid structure
  const getSchedulesForDay = (day) => {
    return schedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Manage Timetable</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Create and manage weekly schedules</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)} disabled={!selectedClassId || subjects.length === 0}>
            Add Time Slot
          </Button>
        </div>

        {loading && classes.length === 0 ? (
          <p>Loading...</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Left Sidebar: Classes */}
            <div style={{ width: '250px', flexShrink: 0 }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Select Class</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classes.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No classes found.</p>
                ) : (
                  classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderRadius: '0.5rem',
                        border: '1px solid',
                        borderColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--surface-border)',
                        backgroundColor: selectedClassId === cls.id ? 'var(--primary-light)' : 'var(--surface-bg)',
                        color: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: selectedClassId === cls.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      {cls.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Content: Timetable */}
            <div style={{ flex: 1, overflowX: 'auto' }}>
              {selectedClassId ? (
                <>
                  {subjects.length === 0 ? (
                    <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No subjects configured for this class yet. Please add subjects first before building a timetable.
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {DAYS_OF_WEEK.map(day => {
                        const daySchedules = getSchedulesForDay(day);
                        return (
                          <Card key={day} style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                              {day}
                            </h3>
                            
                            {daySchedules.length === 0 ? (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No classes scheduled for {day}</div>
                            ) : (
                              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {daySchedules.map(sch => {
                                  const subject = subjects.find(s => s.id === sch.subjectId);
                                  return (
                                    <div key={sch.id} style={{ 
                                      padding: '1rem', 
                                      border: '1px solid var(--surface-border)', 
                                      borderRadius: '0.5rem',
                                      backgroundColor: 'var(--app-bg)',
                                      minWidth: '200px',
                                      position: 'relative'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        <Clock size={12} />
                                        {sch.startTime} - {sch.endTime}
                                      </div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {subject ? subject.name : 'Unknown Subject'}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {subject?.teacherName || 'No Teacher'}
                                      </div>
                                      
                                      <button 
                                        onClick={() => handleDeleteSchedule(sch.id)}
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Please select a class from the left.
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Add Timetable Modal */}
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Add Timetable Slot">
          <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div className="fieldGroup">
              <label className="label">Day of Week</label>
              <select
                className="input"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                required
              >
                {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            
            <div className="fieldGroup">
              <label className="label">Subject</label>
              <select
                className="input"
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                required
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.teacherName || 'No Teacher'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Add Slot'}
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
