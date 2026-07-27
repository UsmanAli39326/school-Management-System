'use client';

import React from 'react';

export default function Footer({ className = '', style = {} }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`devtechnoz-footer ${className}`} style={style}>
      <div className="devtechnoz-badge">
        <span>Powered by</span>
        <a
          href="https://devtechnoz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="devtechnoz-brand-link"
        >
          DevTechnoz
        </a>
      </div>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>•</span>
      <span>Enterprise School Management Platform</span>
      <span aria-hidden="true" style={{ opacity: 0.5 }}>•</span>
      <span>© {currentYear} All Rights Reserved</span>
    </footer>
  );
}
