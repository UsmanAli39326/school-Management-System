/**
 * Brand personalization with mathematical WCAG 2.1 AA contrast calculations
 * for primary and configurable secondary colors.
 */

export const DEFAULT_PRIMARY_COLOR = '#dc2626'; // Default primary red
export const DEFAULT_SECONDARY_COLOR = '#7c3aed'; // Default secondary purple

export const CURATED_PRIMARY_SWATCHES = [
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Lime Green', hex: '#aeff00' },
  { name: 'Deep Navy', hex: '#1e40af' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Indigo', hex: '#4f46e5' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Slate Gray', hex: '#334155' },
  { name: 'Amber Gold', hex: '#d97706' },
];

export const CURATED_SECONDARY_SWATCHES = [
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Violet', hex: '#9333ea' },
  { name: 'Sky Cyan', hex: '#0284c7' },
  { name: 'Teal Accent', hex: '#0d9488' },
  { name: 'Amber Warmth', hex: '#d97706' },
  { name: 'Coral Rose', hex: '#f43f5e' },
  { name: 'Emerald Soft', hex: '#10b981' },
  { name: 'Indigo Deep', hex: '#4338ca' },
  { name: 'Slate Cool', hex: '#475569' },
];

/**
 * Normalizes hex string to #RRGGBB format.
 */
export function normalizeHex(colorStr, fallback = DEFAULT_PRIMARY_COLOR) {
  if (!colorStr) return fallback;
  let hex = String(colorStr).trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return fallback;
  }
  return `#${hex.toLowerCase()}`;
}

/**
 * Converts hex color to RGB object.
 */
export function hexToRgb(hex) {
  const cleanHex = normalizeHex(hex).replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Converts RGB object to hex string.
 */
export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates WCAG relative luminance of an RGB color.
 * L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
 */
export function getLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 */
export function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const max = Math.max(lum1, lum2);
  const min = Math.min(lum1, lum2);
  return parseFloat(((max + 0.05) / (min + 0.05)).toFixed(2));
}

/**
 * Mathematically calculates guaranteed readable text color (min 4.5:1 WCAG AA contrast).
 * Evaluates contrast of #ffffff vs #0f172a, and falls back to mathematical extremum (#000000 or #ffffff)
 * to guarantee optimal text legibility on ANY background color.
 */
export function calculateMathematicalTextColor(bgHex) {
  const { r, g, b } = hexToRgb(bgHex);
  const bgLum = getLuminance(r, g, b);

  const whiteContrast = (1.0 + 0.05) / (bgLum + 0.05);
  const darkInkLum = getLuminance(15, 23, 42); // #0f172a
  const darkInkContrast = (bgLum + 0.05) / (darkInkLum + 0.05);

  if (whiteContrast >= 4.5) {
    return '#ffffff';
  }
  if (darkInkContrast >= 4.5) {
    return '#0f172a';
  }

  // If neither standard white nor dark ink reaches 4.5, pick pure black (#000000) or pure white (#ffffff)
  // based on which mathematical side provides higher relative luminance difference.
  return bgLum > 0.179 ? '#000000' : '#ffffff';
}

/**
 * Derives a mathematical complementary/analogous secondary color if none is supplied.
 */
export function deriveSecondaryFromPrimary(primaryHex) {
  const { r, g, b } = hexToRgb(primaryHex);
  // Shift RGB channels mathematically to create a harmonious complementary secondary color
  const secR = Math.round(g * 0.8 + b * 0.2);
  const secG = Math.round(b * 0.8 + r * 0.2);
  const secB = Math.round(r * 0.8 + g * 0.2);
  return rgbToHex(secR, secG, secB);
}

/**
 * Programmatically generates supporting shades (hover, light tint, and dynamic text color)
 * for both Primary and Secondary configurable brand colors.
 */
export function generateBrandShades(primaryInputHex, secondaryInputHex = null) {
  const primaryColor = normalizeHex(primaryInputHex, DEFAULT_PRIMARY_COLOR);
  const secondaryColor = normalizeHex(
    secondaryInputHex || deriveSecondaryFromPrimary(primaryColor),
    DEFAULT_SECONDARY_COLOR
  );

  // --- Primary Color Calculations ---
  const pRgb = hexToRgb(primaryColor);
  const pLum = getLuminance(pRgb.r, pRgb.g, pRgb.b);
  const primaryText = calculateMathematicalTextColor(primaryColor);
  const primaryContrastRatio = Math.max(
    getContrastRatio(primaryColor, '#ffffff'),
    getContrastRatio(primaryColor, '#0f172a')
  );

  const isPrimaryLight = pLum > 0.4;
  const pHoverFactor = isPrimaryLight ? 0.78 : 0.85;
  const primaryHover = rgbToHex(
    Math.round(pRgb.r * pHoverFactor),
    Math.round(pRgb.g * pHoverFactor),
    Math.round(pRgb.b * pHoverFactor)
  );

  const primaryLight = rgbToHex(
    Math.round(pRgb.r * 0.12 + 255 * 0.88),
    Math.round(pRgb.g * 0.12 + 255 * 0.88),
    Math.round(pRgb.b * 0.12 + 255 * 0.88)
  );

  // --- Secondary Color Calculations ---
  const sRgb = hexToRgb(secondaryColor);
  const sLum = getLuminance(sRgb.r, sRgb.g, sRgb.b);
  const secondaryText = calculateMathematicalTextColor(secondaryColor);
  const secondaryContrastRatio = Math.max(
    getContrastRatio(secondaryColor, '#ffffff'),
    getContrastRatio(secondaryColor, '#0f172a')
  );

  const isSecondaryLight = sLum > 0.4;
  const sHoverFactor = isSecondaryLight ? 0.78 : 0.85;
  const secondaryHover = rgbToHex(
    Math.round(sRgb.r * sHoverFactor),
    Math.round(sRgb.g * sHoverFactor),
    Math.round(sRgb.b * sHoverFactor)
  );

  const secondaryLight = rgbToHex(
    Math.round(sRgb.r * 0.12 + 255 * 0.88),
    Math.round(sRgb.g * 0.12 + 255 * 0.88),
    Math.round(sRgb.b * 0.12 + 255 * 0.88)
  );

  return {
    primaryColor,
    primaryHover,
    primaryLight,
    primaryText,
    primaryContrastRatio,

    secondaryColor,
    secondaryHover,
    secondaryLight,
    secondaryText,
    secondaryContrastRatio,
  };
}

/**
 * Applies generated primary and secondary brand shades to root document CSS custom properties.
 */
export function applyBrandToDOM(shades) {
  if (typeof document === 'undefined') return;

  const validShades = shades || generateBrandShades(DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR);
  const root = document.documentElement;

  // Primary Tokens
  root.style.setProperty('--primary-color', validShades.primaryColor);
  root.style.setProperty('--primary-hover', validShades.primaryHover);
  root.style.setProperty('--primary-light', validShades.primaryLight);
  root.style.setProperty('--primary-text', validShades.primaryText);

  // Secondary Tokens
  root.style.setProperty('--secondary-accent', validShades.secondaryColor);
  root.style.setProperty('--secondary-hover', validShades.secondaryHover);
  root.style.setProperty('--secondary-light', validShades.secondaryLight);
  root.style.setProperty('--secondary-text', validShades.secondaryText);
}
