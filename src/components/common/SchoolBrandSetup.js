'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import {
  CURATED_PRIMARY_SWATCHES,
  CURATED_SECONDARY_SWATCHES,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  generateBrandShades,
} from '@/utils/brand';
import {
  Palette,
  Upload,
  Check,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  X,
  Eye,
  Sliders,
} from 'lucide-react';

export default function SchoolBrandSetup({
  initialColor = DEFAULT_PRIMARY_COLOR,
  initialSecondaryColor = DEFAULT_SECONDARY_COLOR,
  initialLogoUrl = '',
  schoolName = 'Oakridge Academy',
  onSave,
  isSubmitting = false,
  embeddedInModal = false,
  onChange,
}) {
  const [primaryColor, setPrimaryColor] = useState(initialColor || DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(initialSecondaryColor || DEFAULT_SECONDARY_COLOR);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logoPreview, setLogoPreview] = useState(initialLogoUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialColor) setPrimaryColor(initialColor);
    if (initialSecondaryColor) setSecondaryColor(initialSecondaryColor);
    if (initialLogoUrl) {
      setLogoUrl(initialLogoUrl);
      setLogoPreview(initialLogoUrl);
    }
  }, [initialColor, initialSecondaryColor, initialLogoUrl]);

  // Compute primary & secondary shades with mathematical WCAG text contrast
  const shades = generateBrandShades(primaryColor, secondaryColor);

  const handlePrimarySelect = (hex) => {
    setPrimaryColor(hex);
    const updatedShades = generateBrandShades(hex, secondaryColor);
    if (onChange) {
      onChange({ primaryColor: hex, secondaryColor, logoUrl, shades: updatedShades });
    }
  };

  const handleSecondarySelect = (hex) => {
    setSecondaryColor(hex);
    const updatedShades = generateBrandShades(primaryColor, hex);
    if (onChange) {
      onChange({ primaryColor, secondaryColor: hex, logoUrl, shades: updatedShades });
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        setLogoPreview(result);
        setLogoUrl(result);
        if (onChange) {
          onChange({ primaryColor, secondaryColor, logoUrl: result, shades });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setLogoUrl('');
    if (onChange) {
      onChange({ primaryColor, secondaryColor, logoUrl: '', shades });
    }
  };

  const handleSave = async () => {
    if (onSave) {
      await onSave({
        primaryColor: shades.primaryColor,
        secondaryColor: shades.secondaryColor,
        logoUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Helper Banner */}
      {!embeddedInModal && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              backgroundColor: shades.primaryLight,
              color: shades.primaryColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Palette size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              School Brand & Secondary Color Personalization
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
              Configure your school's Primary Brand Color and Secondary Accent Color. Text colors are mathematically calculated to guarantee WCAG 2.1 AA readability.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: embeddedInModal ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 1. Primary Brand Color Card */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>Primary Brand Color</h3>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: shades.primaryColor,
                  color: shades.primaryText,
                  border: '1px solid var(--surface-border)',
                }}
              >
                {shades.primaryColor.toUpperCase()}
              </span>
            </div>

            {/* Primary Swatches Grid */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                Curated Primary Swatches
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.625rem' }}>
                {CURATED_PRIMARY_SWATCHES.map((swatch) => {
                  const isSelected = primaryColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => handlePrimarySelect(swatch.hex)}
                      title={`${swatch.name} (${swatch.hex})`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '0.5rem',
                        backgroundColor: swatch.hex,
                        border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                        outline: isSelected ? `2px solid ${swatch.hex}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.1)',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {isSelected && <Check size={16} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Primary Color Picker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--app-bg)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <input
                  type="color"
                  value={shades.primaryColor}
                  onChange={(e) => handlePrimarySelect(e.target.value)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                  id="primary-color-picker-input"
                />
                <label htmlFor="primary-color-picker-input" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Custom Primary Color
                </label>
              </div>
              <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Contrast: {shades.primaryContrastRatio}:1 (Passes WCAG)
              </span>
            </div>
          </Card>

          {/* 2. Secondary Accent Color Card */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>Secondary Accent Color</h3>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: shades.secondaryColor,
                  color: shades.secondaryText,
                  border: '1px solid var(--surface-border)',
                }}
              >
                {shades.secondaryColor.toUpperCase()}
              </span>
            </div>

            {/* Secondary Swatches Grid */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '0.625rem' }}>
                Curated Secondary Swatches
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.625rem' }}>
                {CURATED_SECONDARY_SWATCHES.map((swatch) => {
                  const isSelected = secondaryColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => handleSecondarySelect(swatch.hex)}
                      title={`${swatch.name} (${swatch.hex})`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: '0.5rem',
                        backgroundColor: swatch.hex,
                        border: isSelected ? '2px solid #ffffff' : '2px solid transparent',
                        outline: isSelected ? `2px solid ${swatch.hex}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.1)',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {isSelected && <Check size={16} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Secondary Color Picker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--app-bg)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <input
                  type="color"
                  value={shades.secondaryColor}
                  onChange={(e) => handleSecondarySelect(e.target.value)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                  }}
                  id="secondary-color-picker-input"
                />
                <label htmlFor="secondary-color-picker-input" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Custom Secondary Accent
                </label>
              </div>
              <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                Contrast: {shades.secondaryContrastRatio}:1 (Passes WCAG)
              </span>
            </div>
          </Card>

          {/* 3. Logo Upload Card */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Upload size={18} style={{ color: 'var(--text-secondary)' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>School Logo</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '0.5rem',
                  border: '1px dashed var(--ink-300)',
                  backgroundColor: 'var(--app-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <GraduationCap size={24} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <label
                    htmlFor="school-logo-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.4375rem 0.875rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--surface-bg)',
                      border: '1px solid var(--surface-border)',
                      fontSize: '0.78125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Upload size={14} /> Upload Logo
                  </label>
                  <input
                    type="file"
                    id="school-logo-input"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.4375rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--status-danger-bg)',
                        border: 'none',
                        fontSize: '0.78125rem',
                        fontWeight: 600,
                        color: 'var(--status-danger)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                  PNG, SVG or JPG (max 2MB). Placed next to school name in the top header.
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons (when not embedded) */}
          {!embeddedInModal && onSave && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSubmitting}
                icon={Check}
                style={{
                  backgroundColor: shades.primaryColor,
                  color: shades.primaryText,
                }}
              >
                Save Brand Settings
              </Button>

              {savedSuccess && (
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--status-success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <CheckCircle2 size={16} /> Saved successfully!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div>
          <Card style={{ padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} style={{ color: 'var(--text-secondary)' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>Interactive Live Preview</h3>
              </div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                Real-Time Render
              </span>
            </div>

            {/* Preview Canvas Container */}
            <div
              style={{
                borderRadius: '0.75rem',
                border: '1px solid var(--surface-border)',
                backgroundColor: 'var(--app-bg)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                paddingBottom: '1.25rem',
              }}
            >
              {/* 1. Header Mock with Top Accent Border & Logo */}
              <div
                style={{
                  backgroundColor: 'var(--surface-bg)',
                  borderTop: `3px solid ${shades.primaryColor}`,
                  borderBottom: '1px solid var(--surface-border)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      backgroundColor: shades.primaryColor,
                      color: shades.primaryText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <GraduationCap size={16} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.84375rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {schoolName}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Dashboard Overview</div>
                  </div>
                </div>

                {/* Role Badge in Brand Light Tint */}
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: shades.primaryLight,
                    color: shades.primaryColor,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  SCHOOL ADMIN
                </span>
              </div>

              {/* 2. Active Tab, Primary Button & Secondary Accent Badge */}
              <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Active Tab Mock */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', gap: '1rem' }}>
                  <div
                    style={{
                      padding: '0.5rem 0.25rem',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: shades.primaryColor,
                      borderBottom: `2px solid ${shades.primaryColor}`,
                    }}
                  >
                    Overview Tab
                  </div>
                  <div style={{ padding: '0.5rem 0.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Academics
                  </div>
                  <div style={{ padding: '0.5rem 0.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Finance
                  </div>
                </div>

                {/* Primary Button & Configurable Secondary Accent Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Primary Action & Secondary Accent</div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: shades.secondaryLight,
                        color: shades.secondaryColor,
                        border: `1px solid ${shades.secondaryColor}30`,
                      }}
                    >
                      Secondary Tag: Configurable Accent
                    </span>
                  </div>
                  <button
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.625rem',
                      backgroundColor: shades.primaryColor,
                      color: shades.primaryText,
                      fontWeight: 600,
                      fontSize: '0.78125rem',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    <BookOpen size={14} /> Primary Action
                  </button>
                </div>

                {/* 3. Proof of Semantic Isolation (Fixed System Colors) */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, uppercase: true, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    UNTOUCHED SEMANTIC SYSTEM COLORS
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Monthly Fee Collection</span>
                    <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>$42,850 (Always Green)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78125rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pending Overdue Fees</span>
                    <span style={{ fontWeight: 700, color: 'var(--status-danger)' }}>$3,420 (Always Red)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
