'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { Mail, Lock, GraduationCap, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, sendResetEmail } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await sendResetEmail(email);
      setSuccessMessage('Password reset link sent! Check your inbox.');
    } catch (err) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoPreset = (presetRole, demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setSuccessMessage(`Loaded ${presetRole} credentials. Click Sign In to test.`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: 'var(--app-bg)',
    }}>
      {/* Brand Panel -- solid ink fill, no gradient. This is where each school's
          own primary color reads strongest. */}
      <div style={{ flex: '1 1 42%' }} className="login-brand-panel">
        <div style={{
          minHeight: '100vh',
          backgroundColor: 'var(--ink-900)',
          color: '#ffffff',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* subtle repeating rule pattern for texture, not a gradient */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 64px)',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3rem',
              height: '3rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--primary-color)',
              color: '#ffffff',
              marginBottom: '2rem'
            }}>
              <GraduationCap size={26} />
            </div>
            <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.55)' }}>Multi-Tenant Platform</span>
            <h1 style={{ fontSize: '2.25rem', color: '#ffffff', marginTop: '0.5rem', maxWidth: '20ch', lineHeight: 1.15 }}>
              Run the whole school from one portal.
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.65)', marginTop: '1rem', maxWidth: '32ch', lineHeight: 1.6 }}>
              Admissions, attendance, fees, and staff -- one system of record for every role in the building.
            </p>
          </div>
          <div style={{ position: 'relative', display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Secure</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Role-based access</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600 }}>Unified</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>One record per student</div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Panel */}
      <div style={{ flex: '1 1 58%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} className="login-auth-panel">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Header Branding (shown on narrow viewports where brand panel is hidden) */}
          <div className="login-mobile-header" style={{ textAlign: 'left', marginBottom: '2rem', display: 'none' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>School Portal</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Sign in to continue
            </p>
          </div>
          <div style={{ marginBottom: '1.75rem' }}>
            <span className="eyebrow">Welcome back</span>
            <h2 style={{ fontSize: '1.5rem', marginTop: '0.375rem' }}>Sign in to your portal</h2>
          </div>

          {/* Auth Card */}
          <Card accentRule style={{ padding: '2rem' }}>
            {/* Navigation Tabs */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--surface-hover)',
              padding: '0.25rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'login' ? 'var(--surface-bg)' : 'transparent',
                  color: activeTab === 'login' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'login' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('reset'); setError(''); setSuccessMessage(''); }}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'reset' ? 'var(--surface-bg)' : 'transparent',
                  color: activeTab === 'reset' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'reset' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                Reset Password
              </button>
            </div>

            {/* Error & Success Messages */}
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

            {successMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--status-success-bg)',
                color: 'var(--status-success)',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}>
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@school.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  icon={ArrowRight}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Sign In to Portal
                </Button>
              </form>
            ) : (
              /* Forgot Password Form */
              <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="name@school.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                >
                  Send Reset Link
                </Button>
              </form>
            )}

            {/* Quick Demo Presets */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Quick Demo Accounts
                </span>
                <Badge variant="info" icon={ShieldCheck}>Phase 1 Setup</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDemoPreset('Super Admin', 'superadmin@devtechnoz.com', 'admin123')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  ⚙️ Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPreset('School Admin', 'admin@apexschool.com', 'school123')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  🏫 School Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPreset('Accountant', 'accountant@apexschool.com', 'accountant123')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  💰 Accountant
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPreset('Receptionist', 'receptionist@apexschool.com', 'reception123')}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid var(--surface-border)',
                    backgroundColor: 'var(--surface-bg)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    textAlign: 'left'
                  }}
                >
                  📋 Receptionist
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}