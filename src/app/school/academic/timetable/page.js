'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { useAuth } from '@/hooks/useAuth';
import { getClasses, getSectionsForClass, getSubjectsForClass } from '@/firebase/db/academic';
import { createSchedule, getSchedulesForClass, deleteSchedule, checkTeacherConflict, checkClassSectionConflict } from '@/firebase/db/schedules';
import { Calendar, Trash2, Plus, Clock, Layers } from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('ALL');

  const [subjects, setSubjects] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    sectionId: '',
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
      setSelectedSectionId('ALL');
      loadTimetableData(selectedClassId);
    } else {
      setSections([]);
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
    const [fetchedSections, fetchedSubjects, fetchedSchedules] = await Promise.all([
      getSectionsForClass(schoolId, classId),
      getSubjectsForClass(schoolId, classId),
      getSchedulesForClass(schoolId, classId)
    ]);
    setSections(fetchedSections);
    setSubjects(fetchedSubjects);
    setSchedules(fetchedSchedules);
    setLoading(false);
  };

  const handleOpenModal = () => {
    setFormData({
      dayOfWeek: 'Monday',
      sectionId: selectedSectionId !== 'ALL' ? selectedSectionId : '',
      subjectId: '',
      startTime: '09:00',
      endTime: '09:45'
    });
    setIsModalOpen(true);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!formData.subjectId || !selectedClassId) return;

    if (formData.startTime >= formData.endTime) {
      showAlert('Start time must be earlier than end time.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const subject = subjects.find(s => s.id === formData.subjectId);
      const teacherId = subject?.teacherId || null;
      const teacherName = subject?.teacherName || 'Teacher';

      // 1. Check if teacher is already allotted to another class/section at the same time
      if (teacherId) {
        const teacherConflict = await checkTeacherConflict(
          schoolId,
          teacherId,
          formData.dayOfWeek,
          formData.startTime,
          formData.endTime
        );
        if (teacherConflict) {
          showAlert(`Conflict Detected! Teacher (${teacherName}) is already allotted to another class/section on ${formData.dayOfWeek} between ${teacherConflict.startTime} and ${teacherConflict.endTime}.`, 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Check if this class/section already has a slot scheduled at the same time
      const classConflict = await checkClassSectionConflict(
        schoolId,
        selectedClassId,
        formData.sectionId || null,
        formData.dayOfWeek,
        formData.startTime,
        formData.endTime
      );
      if (classConflict) {
        showAlert(`Conflict Detected! This class/section already has a slot scheduled on ${formData.dayOfWeek} between ${classConflict.startTime} and ${classConflict.endTime}.`, 'error');
        setIsSubmitting(false);
        return;
      }

      await createSchedule(schoolId, {
        classId: selectedClassId,
        sectionId: formData.sectionId || null,
        subjectId: formData.subjectId,
        teacherId: teacherId,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime
      });
      setIsModalOpen(false);
      loadTimetableData(selectedClassId);
      showAlert("Schedule added successfully", "success");
    } catch (error) {
      console.error('Error adding schedule:', error);
      showAlert('Failed to add schedule', 'error');
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

  // Organize schedules into a grid structure, filtered by section
  const getSchedulesForDay = (day) => {
    return schedules
      .filter(s => s.dayOfWeek === day)
      .filter(s => {
        if (!selectedSectionId || selectedSectionId === 'ALL') return true;
        return s.sectionId === selectedSectionId;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1>Manage Timetable</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Create and manage weekly schedules by class & section</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={handleOpenModal} disabled={!selectedClassId || subjects.length === 0}>
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
                        borderColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--border-color)',
                        backgroundColor: selectedClassId === cls.id ? 'var(--primary-light)' : 'var(--bg-color)',
                        color: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: selectedClassId === cls.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
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
                  {/* Section Selector Pills */}
                  {sections.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Layers size={14} /> Section:
                      </span>
                      <button
                        onClick={() => setSelectedSectionId('ALL')}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '1rem',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: selectedSectionId === 'ALL' ? 'var(--primary-color)' : 'var(--border-color)',
                          backgroundColor: selectedSectionId === 'ALL' ? 'var(--primary-color)' : 'transparent',
                          color: selectedSectionId === 'ALL' ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        All Sections
                      </button>
                      {sections.map(sec => (
                        <button
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          style={{
                            padding: '0.35rem 0.85rem',
                            borderRadius: '1rem',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            border: '1px solid',
                            borderColor: selectedSectionId === sec.id ? 'var(--primary-color)' : 'var(--border-color)',
                            backgroundColor: selectedSectionId === sec.id ? 'var(--primary-color)' : 'transparent',
                            color: selectedSectionId === sec.id ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Section {sec.name}
                        </button>
                      ))}
                    </div>
                  )}

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
                                  const section = sections.find(sec => sec.id === sch.sectionId);
                                  return (
                                    <div key={sch.id} style={{
                                      padding: '1rem',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '0.5rem',
                                      backgroundColor: 'var(--bg-color)',
                                      minWidth: '220px',
                                      position: 'relative'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem', paddingRight: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                          <Clock size={12} />
                                          {sch.startTime} - {sch.endTime}
                                        </div>
                                        {section && (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            padding: '0.1rem 0.4rem',
                                            borderRadius: '0.25rem',
                                            backgroundColor: 'var(--primary-light)',
                                            color: 'var(--primary-color)',
                                            fontWeight: 600
                                          }}>
                                            Sec {section.name}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {subject ? subject.name : 'Unknown Subject'}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        {subject?.teacherName || 'No Teacher'}
                                      </div>

                                      <button
                                        onClick={() => handleDeleteSchedule(sch.id)}
                                        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        title="Delete Slot"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select
                label="Day of Week"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                required
              >
                {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
              </Select>

              {sections.length > 0 && (
                <Select
                  label="Section"
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                >
                  <option value="">All Sections</option>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                  ))}
                </Select>
              )}
            </div>

            <Select
              label="Subject"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              placeholder="-- Select Subject --"
              required
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.teacherName || 'No Teacher'})</option>
              ))}
            </Select>

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
