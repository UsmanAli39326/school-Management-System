'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SchoolBrandSetup from '@/components/common/SchoolBrandSetup';
import { useAuthContext } from '@/context/AuthContext';
import { Settings, ShieldCheck, Sparkles } from 'lucide-react';

export default function SchoolSettingsPage() {
  const { schoolDetails, updateSchoolBranding } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveBrand = async ({ primaryColor, secondaryColor, logoUrl }) => {
    setIsSubmitting(true);
    try {
      await updateSchoolBranding({ primaryColor, secondaryColor, logoUrl });
    } catch (err) {
      console.error('Error saving brand settings:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['SCHOOL_ADMIN']}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--primary-color)', marginBottom: '0.25rem' }}>
              Administration & Branding
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              School Brand & Appearance
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Customize your portal's visual identity, primary action buttons, secondary accents, and official school logo.
            </p>
          </div>
        </div>

        {/* Brand Setup Component */}
        <SchoolBrandSetup
          initialColor={schoolDetails?.theme?.primaryColor}
          initialSecondaryColor={schoolDetails?.theme?.secondaryColor}
          initialLogoUrl={schoolDetails?.logoUrl}
          schoolName={schoolDetails?.name || 'School Portal'}
          onSave={handleSaveBrand}
          isSubmitting={isSubmitting}
        />
      </div>
    </ProtectedRoute>
  );
}
