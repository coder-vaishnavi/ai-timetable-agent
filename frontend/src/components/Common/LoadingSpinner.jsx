import React from 'react';

export default function LoadingSpinner({ text = 'Loading…', full = false }) {
  if (full) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 12 }}>
        <div className="spinner" />
        <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>{text}</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
      <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>{text}</span>
    </div>
  );
}
