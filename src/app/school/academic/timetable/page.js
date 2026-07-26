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
import { getClasses, getSectionsForClass, getSubjectsForClass } from '@/firebase/db/academic';
import { createSchedule, getSchedulesForClass, deleteSchedule, checkTeacherConflict, checkClassSectionConflict, checkRoomConflict } from '@/firebase/db/schedules';
import { Calendar, Trash2, Plus, Clock, Layers, AlertTriangle, Room } from 'lucide-react';
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
    roomNumber: '',
    startTime: '09:00',
    endTime: '09:45'
  });

  // Delete slot confirmation modal (UX §7)
  const [slotToDelete, setSlotToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    try {
      const fetchedClasses = await getClasses(schoolId);
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0) {
        setSelectedClassId(fetchedClasses[0].id);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableData = async (classId) => {
    setLoading(true);
    try {
      const [fetchedSections, fetchedSubjects, fetchedSchedules] = await Promise.all([
        getSectionsForClass(schoolId, classId),
        getSubjectsForClass(schoolId, classId),
        getSchedulesForClass(schoolId, classId)
      ]);
      setSections(fetchedSections);
      setSubjects(fetchedSubjects);
      setSchedules(fetchedSchedules);
    } catch (err) {
      console.error('Error fetching timetable data:', err);
      showAlert('Failed to load timetable entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      dayOfWeek: 'Monday',
      sectionId: selectedSectionId !== 'ALL' ? selectedSectionId : '',
      subjectId: '',
      roomNumber: '',
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

      // 1. Check Teacher Conflict
      if (teacherId) {
        const teacherConflict = await checkTeacherConflict(
          schoolId,
          teacherId,
          formData.dayOfWeek,
          formData.startTime,
          formData.endTime
        );
        if (teacherConflict) {
          showAlert(`Teacher Conflict! ${teacherName} is already allotted to another class/section on ${formData.dayOfWeek} (${teacherConflict.startTime} - ${teacherConflict.endTime}).`, 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Check Class/Section Conflict
      const classConflict = await checkClassSectionConflict(
        schoolId,
        selectedClassId,
        formData.sectionId || null,
        formData.dayOfWeek,
        formData.startTime,
        formData.endTime
      );
      if (classConflict) {
        showAlert(`Class Conflict! This section already has a class scheduled on ${formData.dayOfWeek} between ${classConflict.startTime} and ${classConflict.endTime}.`, 'error');
        setIsSubmitting(false);
        return;
      }

      // 3. Check Room Conflict
      if (formData.roomNumber && formData.roomNumber.trim()) {
        const roomConflict = await checkRoomConflict(
          schoolId,
          formData.roomNumber.trim(),
          formData.dayOfWeek,
          formData.startTime,
          formData.endTime
        );
        if (roomConflict) {
          showAlert(`Room Collision! Room "${formData.roomNumber}" is already booked on ${formData.dayOfWeek} between ${roomConflict.startTime} and ${roomConflict.endTime}.`, 'error');
          setIsSubmitting(false);
          return;
        }
      }

      await createSchedule(schoolId, {
        classId: selectedClassId,
        sectionId: formData.sectionId || null,
        subjectId: formData.subjectId,
        teacherId: teacherId,
        roomNumber: formData.roomNumber.trim() || '',
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime
      });

      setIsModalOpen(false);
      loadTimetableData(selectedClassId);
      showAlert('Timetable slot created successfully', 'success');
    } catch (error) {
      console.error('Error adding schedule:', error);
      showAlert('Failed to add timetable slot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSlot = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSchedule(slotToDelete.id);
      showAlert('Timetable slot deleted', 'success');
      setSlotToDelete(null);
      loadTimetableData(selectedClassId);
    } catch (err) {
      console.error('Error deleting schedule slot:', err);
      showAlert('Failed to delete slot', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Master Timetable</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Build weekly period schedules, assign rooms, and prevent timetable collisions</p>
          </div>
          <Button variant="primary" icon={Plus} onClick={handleOpenModal} disabled={!selectedClassId || subjects.length === 0}>
            Add Time Slot
          </Button>
        </div>

        {loading && classes.length === 0 ? (
          <div style={{ height: '300px', backgroundColor: 'var(--surface-border)', borderRadius: '0.75rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            
            {/* Left Sidebar: Class Selector */}
            <div className="w-full md:w-60 shrink-0">
              <h3 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Class
              </h3>
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
                        borderRadius: '0.625rem',
                        border: '1px solid',
                        borderColor: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--surface-border)',
                        backgroundColor: selectedClassId === cls.id ? 'var(--primary-light)' : 'var(--surface-card)',
                        color: selectedClassId === cls.id ? 'var(--primary-color)' : 'var(--text-primary)',
                        fontWeight: selectedClassId === cls.id ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cls.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Main Timetable Grid */}
            <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {selectedClassId ? (
                <>
                  {/* Section Selector Pills */}
                  {sections.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Layers size={15} /> Section:
                      </span>
                      <button
                        onClick={() => setSelectedSectionId('ALL')}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '1rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: selectedSectionId === 'ALL' ? 'var(--primary-color)' : 'var(--surface-border)',
                          backgroundColor: selectedSectionId === 'ALL' ? 'var(--primary-color)' : 'transparent',
                          color: selectedSectionId === 'ALL' ? '#fff' : 'var(--text-primary)',
                          cursor: 'pointer'
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
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: selectedSectionId === sec.id ? 'var(--primary-color)' : 'var(--surface-border)',
                            backgroundColor: selectedSectionId === sec.id ? 'var(--primary-color)' : 'transparent',
                            color: selectedSectionId === sec.id ? '#fff' : 'var(--text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Section {sec.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {subjects.length === 0 ? (
                    <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No subjects cataloged for this class yet. Please add subjects first before building a timetable.
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {DAYS_OF_WEEK.map(day => {
                        const daySchedules = getSchedulesForDay(day);
                        return (
                          <Card key={day} style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                              <Calendar size={18} style={{ color: 'var(--primary-color)' }} />
                              {day}
                            </h3>

                            {daySchedules.length === 0 ? (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No periods scheduled for {day}</div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {daySchedules.map(sch => {
                                  const subject = subjects.find(s => s.id === sch.subjectId);
                                  const section = sections.find(sec => sec.id === sch.sectionId);
                                  return (
                                    <div key={sch.id} style={{
                                      padding: '1rem',
                                      border: '1px solid var(--surface-border)',
                                      borderRadius: '0.625rem',
                                      backgroundColor: 'var(--surface-card)',
                                      position: 'relative',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '0.5rem'
                                    }}>
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem', paddingRight: '1.5rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                                            <Clock size={13} />
                                            {sch.startTime} - {sch.endTime}
                                          </div>
                                          {section && (
                                            <span style={{
                                              fontSize: '0.7rem',
                                              padding: '0.1rem 0.4rem',
                                              borderRadius: '0.25rem',
                                              backgroundColor: 'var(--primary-light)',
                                              color: 'var(--primary-color)',
                                              fontWeight: 700
                                            }}>
                                              Sec {section.name}
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                          {subject ? subject.name : 'Unknown Subject'}
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                          Teacher: {subject?.teacherName || 'Unassigned'}
                                        </div>
                                        {sch.roomNumber && (
                                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem', fontWeight: 500 }}>
                                            Room: {sch.roomNumber}
                                          </div>
                                        )}
                                      </div>

                                      <button
                                        onClick={() => setSlotToDelete(sch)}
                                        style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer' }}
                                        title="Delete Period Slot"
                                      >
                                        <Trash2 size={15} />
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
                <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Please select a class level from the left panel.
                </Card>
              )}
            </div>

          </div>
        )}

        {/* Modal for Adding Slot */}
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Add Timetable Period Slot">
          <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select
                label="Day of Week *"
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
              label="Subject *"
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              placeholder="-- Select Subject --"
              required
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.teacherName || 'No Teacher Assigned'})</option>
              ))}
            </Select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <Input
                label="Start Time *"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
              <Input
                label="End Time *"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
              <Input
                label="Room / Lab"
                placeholder="e.g. 101, Lab B"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting} isLoading={isSubmitting}>
                Add Slot
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal (UX §7) */}
        <ConfirmationModal
          isOpen={!!slotToDelete}
          onClose={() => setSlotToDelete(null)}
          onConfirm={handleConfirmDeleteSlot}
          title="Delete Period Time Slot?"
          description="Are you sure you want to remove this timetable period entry? This action cannot be undone."
          confirmText="Delete Slot"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />

      </div>
    </ProtectedRoute>
  );
}
