'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { getInvitationByEmail, acceptInvitation } from '@/firebase/db/staff';
import { createUserProfile } from '@/firebase/db/users';

import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Mail, Lock, UserCheck, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';

export default function SetupAccountPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const savedName = sessionStorage.getItem('setup_fullName');
      const savedEmail = sessionStorage.getItem('setup_email');
      if (savedName) setFullName(savedName);
      if (savedEmail) setEmail(savedEmail);
    } catch (e) {
      // sessionStorage might be restricted
    }
  }, []);

  // Save inputs to sessionStorage
  const handleNameChange = (val) => {
    setFullName(val);
    try { sessionStorage.setItem('setup_fullName', val); } catch (e) {}
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    try { sessionStorage.setItem('setup_email', val); } catch (e) {}
  };

  // Real-time password criteria
  const pwdCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const isPasswordValid = pwdCriteria.minLength && pwdCriteria.hasUpper && pwdCriteria.hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements before completing setup.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify invitation exists and is PENDING
      const invite = await getInvitationByEmail(email);
      if (!invite) {
        throw new Error('No valid pending invitation found for this email.');
      }

      // 2. Create the Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Create the user profile in Firestore using the role and schoolId from the invite
      await createUserProfile(user.uid, {
        email: user.email,
        displayName: fullName,
        role: invite.role,
        schoolId: invite.schoolId,
        status: 'ACTIVE'
      });

      // 3.5. Update Custom Claims by calling our API with the user's token
      const idToken = await user.getIdToken();
      const claimsRes = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid: user.uid,
          role: invite.role,
          schoolId: invite.schoolId
        })
      });

      if (!claimsRes.ok) {
        const errorData = await claimsRes.json();
        console.warn('Failed to set custom claims:', errorData.error);
      }

      // 4. Mark the invitation as ACCEPTED
      await acceptInvitation(email);

      // Clear draft
      try {
        sessionStorage.removeItem('setup_fullName');
        sessionStorage.removeItem('setup_email');
      } catch (e) {}

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to setup account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--app-bg)' }}>
        <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '420px' }}>
          <UserCheck size={48} color="var(--status-success)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Account Created Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You are being redirected to your portal dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--app-bg)',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Badge variant="neutral" style={{ marginBottom: '0.75rem' }}>
            Step 1 of 1 • Account Setup
          </Badge>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Staff Account Setup
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Complete your registration using your invited email.
          </p>
        </div>

        <Card accentRule style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <Input
              label="Invited Email Address"
              type="email"
              placeholder="name@school.com"
              icon={Mail}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
            />
            
            <div>
              <Input
                label="Create a Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                rightElement={
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {/* Password Requirements Live Checklist */}
              {password.length > 0 && (
                <div style={{
                  marginTop: '0.625rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--surface-hover)',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.375rem'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.125rem' }}>
                    Password must contain:
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: pwdCriteria.minLength ? 'var(--status-success)' : 'var(--text-muted)' }}>
                    {pwdCriteria.minLength ? <Check size={14} /> : <X size={14} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: pwdCriteria.hasUpper ? 'var(--status-success)' : 'var(--text-muted)' }}>
                    {pwdCriteria.hasUpper ? <Check size={14} /> : <X size={14} />}
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: pwdCriteria.hasNumber ? 'var(--status-success)' : 'var(--text-muted)' }}>
                    {pwdCriteria.hasNumber ? <Check size={14} /> : <X size={14} />}
                    <span>At least one number (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              style={{ marginTop: '0.5rem', width: '100%', minHeight: '44px' }}
            >
              Complete Setup
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
