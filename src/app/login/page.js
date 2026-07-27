'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Footer from '@/components/common/Footer';
import {
  Mail,
  Lock,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Users,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [activeRolePreset, setActiveRolePreset] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, sendResetEmail } = useAuth();
  const router = useRouter();

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('school_portal_remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (e) {
      // localStorage may not be available in some private windows
    }
  }, []);

  const handleKeyDownPassword = (e) => {
    if (e.getModifierState) {
      setIsCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('school_portal_remembered_email', email);
      } else {
        localStorage.removeItem('school_portal_remembered_email');
      }

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
      setSuccessMessage('Password reset instructions sent to your email address.');
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
    setActiveRolePreset(presetRole);
    setError('');
    setSuccessMessage(`Loaded ${presetRole} credentials. Click "Sign In to Portal" to test.`);
  };

  return (
    <div className="login-container">
      {/* Brand Hero Panel */}
      <div className="login-brand-panel">
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '3.5rem 3rem 2.5rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle ambient radial glow behind brand icon */}
          <div
            className="animate-pulse-glow"
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '350px',
              height: '350px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--primary-color) 0%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
            }}
          />

          {/* Grid lines overlay for texture */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 64px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 64px)',
              pointerEvents: 'none',
            }}
          />

          {/* Top Brand Header */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.625rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '0.375rem 0.875rem',
                borderRadius: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '2rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.9)' }}>
                Multi-Tenant Enterprise Portal
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--primary-color)',
                color: '#ffffff',
                marginBottom: '1.75rem',
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4)',
              }}
            >
              <GraduationCap size={28} />
            </div>

            <h1
              style={{
                fontSize: '2.5rem',
                color: '#ffffff',
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                maxWidth: '18ch',
              }}
            >
              Unified School Management Platform
            </h1>
            <p
              style={{
                fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '1.125rem',
                maxWidth: '36ch',
                lineHeight: 1.6,
              }}
            >
              Admissions, attendance, academic records, and fee management — built for modern school administration.
            </p>
          </div>

          {/* Floating Live Metric Cards */}
          <div style={{ position: 'relative', zIndex: 1, margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div
              className="brand-glass-card animate-float-slow"
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '340px',
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>1,450+ Active Students</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Real-time attendance & profile tracking</div>
              </div>
            </div>

            <div
              className="brand-glass-card"
              style={{
                padding: '1rem 1.25rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                maxWidth: '340px',
                marginLeft: '1.5rem',
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>Role-Based Access Control</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Admin, Accountant, Teacher & Staff portals</div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Indicators & DevTechnoz Branding */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                gap: '2.5rem',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                paddingTop: '1.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: '#ffffff' }}>99.9%</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Platform Uptime</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: '#ffffff' }}>Encrypted</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Firebase Data Protection</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span>Powered by</span>
              <a
                href="https://devtechnoz.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}
              >
                DevTechnoz
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Panel */}
      <div className="login-auth-panel">
        {/* Soft background glow */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)',
            opacity: 0.5,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
          {/* Mobile Header Branding */}
          <div className="login-mobile-header" style={{ textAlign: 'center', marginBottom: '1.75rem', display: 'none' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '0.875rem',
                backgroundColor: 'var(--primary-color)',
                color: '#ffffff',
                marginBottom: '0.75rem',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <GraduationCap size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              School Management System
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
              Multi-Tenant Enterprise Portal
            </p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span className="eyebrow">Welcome back</span>
            <h2 style={{ fontSize: '1.625rem', marginTop: '0.375rem', fontWeight: 700 }}>
              {activeTab === 'login' ? 'Sign in to your portal' : 'Reset your password'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
              {activeTab === 'login'
                ? 'Enter your school credentials to access your dashboard'
                : "Enter your registered email and we'll send reset instructions"}
            </p>
          </div>

          {/* Auth Card */}
          <Card accentRule style={{ padding: '2.25rem', boxShadow: 'var(--shadow-lg)' }}>
            {/* Navigation Tabs */}
            <div
              role="tablist"
              aria-label="Authentication Options"
              style={{
                display: 'flex',
                backgroundColor: 'var(--surface-hover)',
                padding: '0.3125rem',
                borderRadius: '0.625rem',
                marginBottom: '1.5rem',
              }}
            >
              <button
                role="tab"
                aria-selected={activeTab === 'login'}
                aria-controls="login-panel"
                id="login-tab"
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  flex: 1,
                  minHeight: '42px',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'login' ? 'var(--surface-bg)' : 'transparent',
                  color: activeTab === 'login' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'login' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Sign In
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'reset'}
                aria-controls="reset-panel"
                id="reset-tab"
                type="button"
                onClick={() => {
                  setActiveTab('reset');
                  setError('');
                  setSuccessMessage('');
                }}
                style={{
                  flex: 1,
                  minHeight: '42px',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'reset' ? 'var(--surface-bg)' : 'transparent',
                  color: activeTab === 'reset' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  boxShadow: activeTab === 'reset' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Reset Password
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  backgroundColor: 'var(--status-danger-bg)',
                  color: 'var(--status-danger)',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(225, 29, 72, 0.2)',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  backgroundColor: 'var(--status-success-bg)',
                  color: 'var(--status-success)',
                  padding: '0.875rem 1rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.875rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(5, 150, 105, 0.2)',
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Caps Lock Alert Warning */}
            {isCapsLockOn && activeTab === 'login' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--status-warning-bg)',
                  color: 'var(--status-warning)',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  marginBottom: '1.25rem',
                }}
              >
                <ShieldAlert size={16} />
                <span>Caps Lock is ON</span>
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === 'login' ? (
              <form
                id="login-panel"
                role="tabpanel"
                aria-labelledby="login-tab"
                onSubmit={handleLoginSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@school.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDownPassword}
                  onKeyUp={handleKeyDownPassword}
                  required
                  autoComplete="current-password"
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
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        transition: 'color var(--transition-fast)',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  }
                />

                {/* Form Options: Remember Me & Forgot Password Link */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '-0.25rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--primary-color)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    />
                    <span>Remember email</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reset');
                      setError('');
                      setSuccessMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-color)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.8125rem',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  icon={ArrowRight}
                  style={{ marginTop: '0.5rem', width: '100%', minHeight: '46px', fontSize: '0.9375rem', fontWeight: 600 }}
                >
                  Sign In to Portal
                </Button>
              </form>
            ) : (
              /* Forgot Password Form */
              <form
                id="reset-panel"
                role="tabpanel"
                aria-labelledby="reset-tab"
                onSubmit={handleResetSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="name@school.com"
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  style={{ marginTop: '0.5rem', width: '100%', minHeight: '46px', fontSize: '0.9375rem', fontWeight: 600 }}
                >
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    marginTop: '0.25rem',
                    textAlign: 'center',
                    textDecoration: 'underline',
                  }}
                >
                  Return to Sign In
                </button>
              </form>
            )}

            {/* Quick Demo Accounts Section */}
            <div style={{ marginTop: '2.25rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Quick Demo Accounts
                </span>
                <Badge variant="info" icon={Sparkles}>
                  One-Click Fill
                </Badge>
              </div>

              <div className="login-demo-grid">
                {[
                  { title: 'School Admin', email: 'admin@apexschool.com', pass: 'school123', icon: '🏫', roleTag: 'Admin' },
                  { title: 'Accountant', email: 'accountant@apexschool.com', pass: 'accountant123', icon: '💰', roleTag: 'Finance' },
                  { title: 'Receptionist', email: 'receptionist@apexschool.com', pass: 'reception123', icon: '📋', roleTag: 'Desk' },
                  { title: 'Teacher', email: 'teacher@apexschool.com', pass: 'teacher123', icon: '👨‍🏫', roleTag: 'Academic' },
                ].map((demo) => {
                  const isActive = activeRolePreset === demo.title;
                  return (
                    <button
                      key={demo.title}
                      type="button"
                      onClick={() => handleDemoPreset(demo.title, demo.email, demo.pass)}
                      aria-label={`Fill ${demo.title} credentials`}
                      style={{
                        minHeight: '46px',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: isActive ? '1px solid var(--primary-color)' : '1px solid var(--surface-border)',
                        backgroundColor: isActive ? 'var(--primary-light)' : 'var(--surface-bg)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all var(--transition-fast)',
                        boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span>{demo.icon}</span>
                        <span>{demo.title}</span>
                      </span>
                      {isActive ? (
                        <Check size={16} color="var(--primary-color)" />
                      ) : (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--surface-hover)',
                            padding: '0.125rem 0.375rem',
                            borderRadius: '0.25rem',
                          }}
                        >
                          {demo.roleTag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
          <Footer style={{ borderTop: 'none', marginTop: '1rem', paddingTop: '0.5rem' }} />
        </div>
      </div>
    </div>
  );
}