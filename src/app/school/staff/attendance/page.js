'use client';

import { useState, useEffect, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import { useAuth } from '@/hooks/useAuth';
import { useAlert } from '@/context/AlertContext';
import { getAllUsers } from '@/firebase/db/users';
import { saveDailyStaffAttendance } from '@/firebase/db/attendance';
import { Users, Search, CalendarCheck, Save } from 'lucide-react';

export default function StaffAttendancePage() {
  const { schoolId } = useAuth();
  const { showAlert } = useAlert();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Attendance Modal
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadStaff();
    }
  }, [schoolId]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers(schoolId);
      // Filter out students and parents to get staff
      const staffMembers = users.filter(u => u.role !== 'STUDENT' && u.role !== 'PARENT');
      setStaff(staffMembers);
    } catch (err) {
      console.error('Error fetching staff:', err);
      showAlert('Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAttendanceModal = () => {
    const initial = {};
    (staff || []).forEach((s) => {
      initial[s.uid || s.id] = 'PRESENT';
    });
    setAttendanceRecords(initial);
    setIsAttendanceModalOpen(true);
  };

  const handleToggleStaffStatus = (staffId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [staffId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const records = Object.entries(attendanceRecords).map(([staffId, status]) => ({
        staffId,
        status
      }));

      await saveDailyStaffAttendance(schoolId, dateStr, records);

      showAlert(`Staff attendance for ${new Date().toLocaleDateString()} saved successfully!`, 'success');
      setIsAttendanceModalOpen(false);
    } catch (err) {
      console.error('Error saving staff attendance:', err);
      showAlert('Failed to save staff attendance', 'error');
    } finally {
      setSavingAttendance(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const name = (s.displayName || s.name || s.email || '').toLowerCase();
      const role = (s.role || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query) || role.includes(query);
    });
  }, [staff, searchQuery]);

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div className="max-w-7xl w-full mx-auto pb-12 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Staff Attendance</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Mark daily attendance for teachers, accountants, and other staff members.</p>
        </div>

        {/* Staff Table */}
        <Card style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} style={{ color: 'var(--primary-color)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Staff Directory</h3>
              <span style={{ marginLeft: 'auto', backgroundColor: 'var(--surface-hover)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.84375rem', fontWeight: 600 }}>
                {filteredStaff.length} / {staff.length} Staff
              </span>
            </div>
            <Button variant="primary" icon={CalendarCheck} onClick={handleOpenAttendanceModal} disabled={staff.length === 0}>
              Take Daily Staff Attendance
            </Button>
          </div>

          <Input
            placeholder="Search staff by name, email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            style={{ marginBottom: '1.5rem' }}
          />

          {loading ? (
            <div style={{ height: '180px', backgroundColor: 'var(--surface-border)', borderRadius: '0.5rem', animation: 'pulse 1.5s infinite ease-in-out' }} />
          ) : filteredStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
              No staff members found matching your search.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--surface-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.uid || member.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {member.displayName || member.name || 'Unnamed Staff'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{member.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '999px', 
                          backgroundColor: 'var(--primary-light)', 
                          color: 'var(--primary-color)' 
                        }}>
                          {member.role?.replace('_', ' ') || 'STAFF'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Daily Attendance Modal */}
        <Modal
          isOpen={isAttendanceModalOpen}
          onClose={() => !savingAttendance && setIsAttendanceModalOpen(false)}
          title={`Mark Staff Attendance (${new Date().toLocaleDateString()})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Toggle status for each staff member. Defaults to <strong>PRESENT</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {staff.map((member) => {
                const memberId = member.uid || member.id;
                const currentStatus = attendanceRecords[memberId] || 'PRESENT';
                const name = member.displayName || member.name || member.email || 'Unnamed Staff';

                return (
                  <div
                    key={memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--surface-hover)',
                      borderRadius: '0.625rem',
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role: {member.role?.replace('_', ' ')}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                      <Button
                        type="button"
                        variant={currentStatus === 'PRESENT' ? 'primary' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStaffStatus(memberId, 'PRESENT')}
                      >
                        Present
                      </Button>
                      <Button
                        type="button"
                        variant={currentStatus === 'ABSENT' ? 'danger' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStaffStatus(memberId, 'ABSENT')}
                      >
                        Absent
                      </Button>
                      <Button
                        type="button"
                        variant={currentStatus === 'LATE' ? 'warning' : 'outline'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleStaffStatus(memberId, 'LATE')}
                      >
                        Late
                      </Button>
                      <Button
                        type="button"
                        variant={currentStatus === 'ON_LEAVE' ? 'outline' : 'outline'}
                        style={{ 
                          padding: '0.35rem 0.65rem', 
                          fontSize: '0.75rem', 
                          backgroundColor: currentStatus === 'ON_LEAVE' ? 'var(--text-muted)' : 'transparent',
                          color: currentStatus === 'ON_LEAVE' ? '#ffffff' : 'var(--text-primary)'
                        }}
                        onClick={() => handleToggleStaffStatus(memberId, 'ON_LEAVE')}
                      >
                        On Leave
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsAttendanceModalOpen(false)} disabled={savingAttendance}>
                Cancel
              </Button>
              <Button type="button" variant="primary" icon={Save} onClick={handleSaveAttendance} isLoading={savingAttendance}>
                Save Staff Attendance
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
