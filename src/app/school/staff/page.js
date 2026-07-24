'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal';
import { useAuth } from '@/hooks/useAuth';
import { getAllUsers } from '@/firebase/db/users';
import { createInvitation, getInvitations, revokeInvitation } from '@/firebase/db/staff';
import { Users, Mail, Trash2, UserPlus } from 'lucide-react';

export default function StaffManagementPage() {
  const { schoolId, currentUser } = useAuth();
  
  const [activeStaff, setActiveStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('TEACHER');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    const [users, invites] = await Promise.all([
      getAllUsers(schoolId),
      getInvitations(schoolId)
    ]);
    setActiveStaff(users);
    setInvitations(invites);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    try {
      await createInvitation(schoolId, inviteEmail, inviteRole, currentUser?.email);
      setInviteEmail('');
      setInviteRole('TEACHER');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to send invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (email) => {
    if (confirm(`Revoke invitation for ${email}?`)) {
      await revokeInvitation(email);
      loadData();
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
              <Users color="var(--primary-color)" /> Staff Management
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.25rem' }}>
              Manage school personnel and send invitations to new staff.
            </p>
          </div>
          <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Invite Staff
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          <Card>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
              Active Staff Members ({activeStaff.length})
            </h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStaff.map(staff => (
                    <tr key={staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{staff.email}</td>
                      <td style={{ padding: '1rem' }}>{staff.displayName || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          backgroundColor: 'var(--bg-secondary)', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {staff.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ color: staff.status === 'ACTIVE' ? 'var(--success-color)' : 'var(--danger)', fontWeight: 600, fontSize: '0.875rem' }}>
                          {staff.status || 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
              <Mail size={20} color="var(--primary-color)" /> Pending Invitations
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Staff members listed here must go to <strong>/setup-account</strong> to complete their registration.
            </p>
            
            {invitations.filter(i => i.status === 'PENDING').length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No pending invitations.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role to Assign</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Invited By</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.filter(i => i.status === 'PENDING').map(inv => (
                    <tr key={inv.inviteId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{inv.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          backgroundColor: 'var(--primary-light)', 
                          color: 'var(--primary-color)',
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {inv.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{inv.invitedBy}</td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={() => handleRevoke(inv.email)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Trash2 size={16} /> Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

        </div>

        <Modal isOpen={isModalOpen} onClose={() => !isInviting && setIsModalOpen(false)} title="Invite Staff Member">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input 
              label="Staff Email" 
              type="email" 
              placeholder="teacher@school.com" 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)} 
              icon={Mail}
            />
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>Role</label>
              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="TEACHER">TEACHER</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="RECEPTIONIST">RECEPTIONIST</option>
                <option value="SCHOOL_ADMIN">SCHOOL_ADMIN</option>
              </select>
            </div>

            <Button variant="primary" onClick={handleInvite} disabled={isInviting || !inviteEmail} style={{ marginTop: '0.5rem' }}>
              {isInviting ? 'Sending Invite...' : 'Send Invitation'}
            </Button>
          </div>
        </Modal>

      </div>
    </ProtectedRoute>
  );
}
