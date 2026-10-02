import React from 'react';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = '#1e40af' }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      {Icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={20} color={color} />
        </div>
      )}
      <div>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: 'var(--color-text)' }}>{value}</p>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
