'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { getInvitationByEmail, acceptInvitation } from '@/firebase/db/staff';
import { createUserProfile } from '@/firebase/db/users';

import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import { Mail, Lock, UserCheck, AlertCircle } from 'lucide-react';

export default function SetupAccountPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

      // 4. Mark the invitation as ACCEPTED
      await acceptInvitation(email);

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
        <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
          <UserCheck size={48} color="var(--success-color)" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ marginBottom: '1rem' }}>Account Created Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You are being redirected to your dashboard...</p>
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
      background: 'radial-gradient(circle at 50% 0%, var(--primary-light) 0%, var(--app-bg) 70%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            Staff Account Setup
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Complete your registration using your invited email.
          </p>
        </div>

        <Card style={{ padding: '2rem' }}>
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
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Invited Email Address"
              type="email"
              placeholder="name@school.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Create a Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              Complete Setup
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
