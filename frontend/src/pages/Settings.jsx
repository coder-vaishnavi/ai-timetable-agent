import React from 'react';
import { Zap, Database, Server, Globe } from 'lucide-react';

export default function Settings() {
  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div><h2 className="page-title">Settings</h2><p className="page-subtitle">System information and configuration</p></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>System Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Application',    value: 'AI Timetable Agent v1.0.0',  icon: Zap },
            { label: 'Backend',        value: 'Python Flask + OR-Tools',    icon: Server },
            { label: 'Frontend',       value: 'React 18',                   icon: Globe },
            { label: 'Database',       value: 'MySQL',                      icon: Database },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
              <item.icon size={16} color="var(--color-primary)" />
              <span style={{ color: 'var(--color-muted)', minWidth: 120 }}>{item.label}</span>
              <span style={{ fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Schedule Configuration</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Working Days</span>
            <span>Monday – Friday</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Period 1</span>
            <span>10:00 AM – 12:00 PM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Break 1</span>
            <span>12:00 PM – 12:40 PM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Period 2</span>
            <span>12:40 PM – 2:40 PM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-muted)' }}>Break 2</span>
            <span>2:40 PM – 2:50 PM</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0' }}>
            <span style={{ color: 'var(--color-muted)' }}>Period 3</span>
            <span>2:50 PM – 4:50 PM</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Optimizer</h3>
        <p style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.7 }}>
          Timetable generation uses <strong>OR-Tools CP-SAT</strong> solver by Google.
          Hard constraints are strictly enforced. Soft constraints are maximized via an
          objective function. Default solver time limit: <strong>60 seconds</strong>.
        </p>
      </div>
    </div>
  );
}
