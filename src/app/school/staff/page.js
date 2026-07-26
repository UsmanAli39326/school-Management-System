'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import Badge from '@/components/common/Badge';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import EditStaffModal from '@/components/staff/EditStaffModal';
import StaffDetailsModal from '@/components/staff/StaffDetailsModal';
import { useAuth } from '@/hooks/useAuth';
import { getAllUsers, updateUserProfile } from '@/firebase/db/users';
import { createInvitation, getInvitations, revokeInvitation } from '@/firebase/db/staff';
import {
  Users,
  Mail,
  Trash2,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Building,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Edit2,
  Eye,
  AlertTriangle,
  UserCheck,
  UserX,
  Phone,
} from 'lucide-react';
import { useAlert } from '@/context/AlertContext';

const DEPARTMENTS = [
  'ALL',
  'General',
  'Mathematics',
  'Science',
  'English & Languages',
  'Social Sciences',
  'Accounts & Finance',
  'Administration',
  'Sports & Physical Ed',
  'IT & Computer Science',
];

const ROLE_TABS = [
  { key: 'ALL', label: 'All Staff' },
  { key: 'TEACHER', label: 'Teachers' },
  { key: 'ACCOUNTANT', label: 'Accountants' },
  { key: 'RECEPTIONIST', label: 'Receptionists' },
  { key: 'SCHOOL_ADMIN', label: 'Administrators' },
];

export default function StaffManagementPage() {
  const { schoolId, currentUser } = useAuth();
  const { showAlert } = useAlert();

  // Data states
  const [activeStaff, setActiveStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleTab, setSelectedRoleTab] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState('displayName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Invite Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TEACHER');
  const [inviteDept, setInviteDept] = useState('General');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Details Modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [staffToView, setStaffToView] = useState(null);

  // Confirmation Modal state for Revoke Invite
  const [inviteToRevoke, setInviteToRevoke] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Confirmation Modal state for Status Toggle
  const [staffToToggleStatus, setStaffToToggleStatus] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [users, invites] = await Promise.all([
        getAllUsers(schoolId),
        getInvitations(schoolId),
      ]);
      setActiveStaff(users);
      setInvitations(invites);
    } catch (err) {
      console.error('Failed to load staff data:', err);
      setFetchError('Failed to connect to the database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper validation for email format
  const isValidEmail = useMemo(() => {
    if (!inviteEmail) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());
  }, [inviteEmail]);

  // Invite Handler
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!isValidEmail) return;

    setIsInviting(true);
    try {
      await createInvitation(
        schoolId,
        inviteEmail,
        inviteRole,
        currentUser?.displayName || currentUser?.email || 'School Admin',
        inviteDept
      );
      setInviteEmail('');
      setInviteRole('TEACHER');
      setInviteDept('General');
      setIsInviteModalOpen(false);
      await loadData();
      showAlert('Staff invitation sent successfully!', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to send invitation. Please try again.', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  // Confirm Revoke Invitation
  const confirmRevokeInvite = async () => {
    if (!inviteToRevoke) return;
    setIsRevoking(true);
    try {
      await revokeInvitation(inviteToRevoke.email);
      setInviteToRevoke(null);
      await loadData();
      showAlert(`Invitation for ${inviteToRevoke.email} revoked successfully.`, 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to revoke invitation.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  // Save Edit Staff
  const handleSaveStaffEdit = async (uid, updatedData) => {
    setIsSavingEdit(true);
    try {
      await updateUserProfile(uid, updatedData);
      setIsEditModalOpen(false);
      setStaffToEdit(null);
      await loadData();
      showAlert('Staff profile updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to update staff profile.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Confirm Status Toggle (Deactivate / Suspend / Activate)
  const confirmToggleStatus = async () => {
    if (!staffToToggleStatus) return;
    setIsTogglingStatus(true);
    const newStatus = staffToToggleStatus.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateUserProfile(staffToToggleStatus.id, { status: newStatus });
      setStaffToToggleStatus(null);
      await loadData();
      showAlert(
        `Staff member status changed to ${newStatus} successfully.`,
        'success'
      );
    } catch (error) {
      console.error(error);
      showAlert('Failed to update staff status.', 'error');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Filter & Search Logic
  const filteredStaff = useMemo(() => {
    return activeStaff.filter((staff) => {
      // Role Filter
      if (selectedRoleTab !== 'ALL' && staff.role !== selectedRoleTab) {
        return false;
      }
      // Department Filter
      if (selectedDept !== 'ALL' && (staff.department || 'General') !== selectedDept) {
        return false;
      }
      // Status Filter
      if (selectedStatus !== 'ALL' && (staff.status || 'ACTIVE') !== selectedStatus) {
        return false;
      }
      // Search Term Filter
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const nameMatch = staff.displayName?.toLowerCase().includes(query);
        const emailMatch = staff.email?.toLowerCase().includes(query);
        const deptMatch = staff.department?.toLowerCase().includes(query);
        const roleMatch = staff.role?.toLowerCase().includes(query);
        return nameMatch || emailMatch || deptMatch || roleMatch;
      }
      return true;
    });
  }, [activeStaff, selectedRoleTab, selectedDept, selectedStatus, searchTerm]);

  // Sort Logic
  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStaff, sortField, sortOrder]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedStaff.length / itemsPerPage) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedStaff.slice(start, start + itemsPerPage);
  }, [sortedStaff, currentPage, itemsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Metrics counts
  const teacherCount = activeStaff.filter((s) => s.role === 'TEACHER').length;
  const adminCount = activeStaff.filter((s) => s.role !== 'TEACHER').length;
  const pendingCount = invitations.filter((i) => i.status === 'PENDING').length;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="warning">Inactive</Badge>;
      case 'SUSPENDED':
        return <Badge variant="danger">Suspended</Badge>;
      default:
        return <Badge variant="info">{status || 'Active'}</Badge>;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div className="max-w-7xl w-full mx-auto pb-12">
        
        {/* Breadcrumb Header (UX Model Rule 1, 17) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <nav
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-tertiary)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
            aria-label="Breadcrumb"
          >
            <Link href="/school/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <span>/</span>
            <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Staff & Human Resources</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  margin: 0,
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                <Users color="var(--primary-color)" size={32} /> Staff & Human Resources
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.375rem', fontSize: '0.9375rem' }}>
                Manage teaching and non-teaching personnel, department affiliations, roles, and activation status.
              </p>
            </div>
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={() => setIsInviteModalOpen(true)}
              style={{ padding: '0.625rem 1.25rem' }}
            >
              Invite Staff Member
            </Button>
          </div>
        </div>

        {/* Metrics Grid Cards (UX Model Rule 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card style={{ borderLeft: '4px solid var(--primary-color)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  TOTAL STAFF
                </span>
                <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {loading ? '...' : activeStaff.length}
                </h2>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-color)',
                }}
              >
                <Users size={24} />
              </div>
            </div>
          </Card>

          <Card style={{ borderLeft: '4px solid var(--success-color, #10b981)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  TEACHERS
                </span>
                <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {loading ? '...' : teacherCount}
                </h2>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--success-color, #10b981)',
                }}
              >
                <GraduationCap size={24} />
              </div>
            </div>
          </Card>

          <Card style={{ borderLeft: '4px solid #8b5cf6', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  ADMIN & SUPPORT
                </span>
                <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {loading ? '...' : adminCount}
                </h2>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  color: '#8b5cf6',
                }}
              >
                <Briefcase size={24} />
              </div>
            </div>
          </Card>

          <Card style={{ borderLeft: '4px solid #f59e0b', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  PENDING INVITES
                </span>
                <h2 style={{ fontSize: '1.75rem', margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                  {loading ? '...' : pendingCount}
                </h2>
              </div>
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                }}
              >
                <Mail size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Error State Banner (UX Model Rule 5) */}
        {fetchError && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--status-danger-bg, #fef2f2)',
              border: '1px solid var(--status-danger, #ef4444)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={24} color="var(--status-danger, #ef4444)" />
              <div>
                <strong style={{ fontSize: '0.9375rem' }}>Error Loading Staff Data</strong>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{fetchError}</p>
              </div>
            </div>
            <Button variant="outline" icon={RefreshCw} onClick={loadData}>
              Retry Loading
            </Button>
          </div>
        )}

        {/* Staff Directory Card Section */}
        <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          
          {/* Header Controls & Role Tabs */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Staff Directory ({filteredStaff.length})
              </h2>

              {/* Instant Search Bar (UX Model Rule 10) */}
              <div style={{ minWidth: '280px', flex: 1, maxWidth: '400px' }}>
                <Input
                  placeholder="Search by name, email, department, or role..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={Search}
                />
              </div>
            </div>

            {/* Role Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSelectedRoleTab(tab.key);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: selectedRoleTab === tab.key ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: selectedRoleTab === tab.key ? '#fff' : 'var(--text-secondary)',
                    fontWeight: selectedRoleTab === tab.key ? 600 : 500,
                    fontSize: '0.84375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Secondary Filters (Department & Status) */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Building size={14} /> Department:
                </span>
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84375rem',
                  }}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d === 'ALL' ? 'All Departments' : d}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Filter size={14} /> Status:
                </span>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84375rem',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {(searchTerm || selectedRoleTab !== 'ALL' || selectedDept !== 'ALL' || selectedStatus !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRoleTab('ALL');
                    setSelectedDept('ALL');
                    setSelectedStatus('ALL');
                    setCurrentPage(1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Skeleton Loaders (UX Model Rule 4) */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 0' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    height: '52px',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    animation: 'pulse 1.5s infinite ease-in-out',
                  }}
                />
              ))}
            </div>
          ) : paginatedStaff.length === 0 ? (
            /* Empty State Card (UX Model Rule 3) */
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.75rem',
                margin: '1rem 0',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={32} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>No Staff Members Found</h3>
                <p style={{ margin: '0.375rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px' }}>
                  {searchTerm || selectedRoleTab !== 'ALL' || selectedDept !== 'ALL' || selectedStatus !== 'ALL'
                    ? 'No staff members matched your current filter criteria. Try adjusting or clearing filters.'
                    : 'Get started by inviting your first teacher or administrator to the school platform.'}
                </p>
              </div>
              <Button variant="primary" icon={UserPlus} onClick={() => setIsInviteModalOpen(true)}>
                Invite Staff Member
              </Button>
            </div>
          ) : (
            /* Responsive Table Container (UX Model Rule 11 & 12) */
            <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th
                      onClick={() => handleSort('displayName')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      Staff Member {sortField === 'displayName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('role')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('department')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      Contact
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer' }}
                    >
                      Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '0.875rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              flexShrink: 0,
                            }}
                          >
                            {(staff.displayName || staff.email || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {staff.displayName || 'No Name Set'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {staff.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {staff.department || 'General'}
                      </td>

                      {/* Contact Phone */}
                      <td style={{ padding: '0.875rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {staff.phone ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={13} /> {staff.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.875rem 1rem' }}>{renderStatusBadge(staff.status)}</td>

                      {/* Row Actions */}
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.375rem' }}>
                          
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setStaffToView(staff);
                              setIsDetailsModalOpen(true);
                            }}
                            title="View Staff Details"
                            aria-label={`View details for ${staff.displayName || staff.email}`}
                            style={{
                              padding: '0.375rem 0.625rem',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                            }}
                          >
                            <Eye size={14} /> View
                          </button>

                          {/* Edit Profile */}
                          <button
                            onClick={() => {
                              setStaffToEdit(staff);
                              setIsEditModalOpen(true);
                            }}
                            title="Edit Staff Member"
                            aria-label={`Edit ${staff.displayName || staff.email}`}
                            style={{
                              padding: '0.375rem 0.625rem',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-color)',
                              color: 'var(--primary-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                            }}
                          >
                            <Edit2 size={14} /> Edit
                          </button>

                          {/* Toggle Status Action */}
                          <button
                            onClick={() => setStaffToToggleStatus(staff)}
                            title={staff.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                            aria-label={`Change status for ${staff.displayName || staff.email}`}
                            style={{
                              padding: '0.375rem 0.625rem',
                              borderRadius: '0.375rem',
                              border: '1px solid var(--border-color)',
                              backgroundColor: staff.status === 'ACTIVE' ? 'var(--status-warning-bg, #fffbe6)' : 'var(--primary-light)',
                              color: staff.status === 'ACTIVE' ? 'var(--status-warning, #d97706)' : 'var(--primary-color)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                            }}
                          >
                            {staff.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
                            {staff.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls (UX Model Rule 8, 11) */}
          {!loading && sortedStaff.length > itemsPerPage && (
            <div
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, sortedStaff.length)} of {sortedStaff.length} staff
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', padding: '0 0.5rem' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Pending Invitations Card */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            <Mail size={20} color="var(--primary-color)" /> Pending Invitations ({invitations.filter((i) => i.status === 'PENDING').length})
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Invited staff members must log in and navigate to <strong>/setup-account</strong> to complete registration.
          </p>

          {invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
              No pending invitations. All invited staff members have registered.
            </p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Invited Email</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Assigned Role</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Department</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Invited By</th>
                    <th style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations
                    .filter((i) => i.status === 'PENDING')
                    .map((inv) => (
                      <tr key={inv.inviteId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {inv.email}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              backgroundColor: 'var(--primary-light)',
                              color: 'var(--primary-color)',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {inv.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {inv.department || 'General'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {inv.invitedBy}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setInviteToRevoke(inv)}
                            aria-label={`Revoke invitation for ${inv.email}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--status-danger, #ef4444)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.8125rem',
                              fontWeight: 600,
                            }}
                          >
                            <Trash2 size={14} /> Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invite Staff Modal (UX Model Rule 9, 21, 22) */}
        <Modal
          isOpen={isInviteModalOpen}
          onClose={() => !isInviting && setIsInviteModalOpen(false)}
          title="Invite New Staff Member"
        >
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <Input
                label="Staff Email Address *"
                type="email"
                placeholder="teacher@school.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                icon={Mail}
                autoFocus
              />
              {inviteEmail && !isValidEmail && (
                <p style={{ color: 'var(--status-danger, #ef4444)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                  Please enter a valid email address (e.g., user@domain.com).
                </p>
              )}
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                An invitation token will be generated. The staff member will complete account creation at /setup-account.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Shield size={14} color="var(--primary-color)" /> Role to Assign *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="TEACHER">TEACHER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="RECEPTIONIST">RECEPTIONIST</option>
                  <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <Building size={14} color="var(--primary-color)" /> Department
                </label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  {DEPARTMENTS.filter((d) => d !== 'ALL').map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button variant="outline" type="button" onClick={() => setIsInviteModalOpen(false)} disabled={isInviting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isInviting}
                disabled={isInviting || !isValidEmail}
              >
                {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Staff Profile Modal */}
        <EditStaffModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setStaffToEdit(null);
          }}
          staffMember={staffToEdit}
          onSave={handleSaveStaffEdit}
          isLoading={isSavingEdit}
        />

        {/* Staff Details Modal */}
        <StaffDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setStaffToView(null);
          }}
          staffMember={staffToView}
          onEdit={(staff) => {
            setStaffToEdit(staff);
            setIsEditModalOpen(true);
          }}
        />

        {/* Confirmation Modal for Revoking Invitation (UX Model Rule 7) */}
        <ConfirmationModal
          isOpen={!!inviteToRevoke}
          onClose={() => setInviteToRevoke(null)}
          onConfirm={confirmRevokeInvite}
          title="Revoke Staff Invitation"
          description={`Are you sure you want to revoke the invitation sent to ${inviteToRevoke?.email}? They will no longer be able to use this invitation link to register.`}
          confirmText="Yes, Revoke Invitation"
          cancelText="Keep Invitation"
          variant="danger"
          isLoading={isRevoking}
        />

        {/* Confirmation Modal for Status Toggle (UX Model Rule 7) */}
        <ConfirmationModal
          isOpen={!!staffToToggleStatus}
          onClose={() => setStaffToToggleStatus(null)}
          onConfirm={confirmToggleStatus}
          title={staffToToggleStatus?.status === 'ACTIVE' ? 'Suspend Staff Account' : 'Activate Staff Account'}
          description={
            staffToToggleStatus?.status === 'ACTIVE'
              ? `Are you sure you want to suspend access for ${staffToToggleStatus?.displayName || staffToToggleStatus?.email}? Suspended staff members cannot log in to the portal.`
              : `Are you sure you want to activate access for ${staffToToggleStatus?.displayName || staffToToggleStatus?.email}?`
          }
          confirmText={staffToToggleStatus?.status === 'ACTIVE' ? 'Suspend Access' : 'Activate Access'}
          cancelText="Cancel"
          variant={staffToToggleStatus?.status === 'ACTIVE' ? 'warning' : 'primary'}
          isLoading={isTogglingStatus}
        />

      </div>
    </ProtectedRoute>
  );
}
