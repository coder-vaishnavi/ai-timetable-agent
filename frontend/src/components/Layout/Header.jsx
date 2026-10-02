import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TITLES = {
  '/dashboard':    'Dashboard',
  '/teachers':     'Teachers',
  '/subjects':     'Subjects',
  '/classrooms':   'Classrooms',
  '/classes':      'Classes',
  '/divisions':    'Divisions',
  '/availability': 'Availability',
  '/requirements': 'Requirements',
  '/generate':     'Timetable Generator',
  '/saved':        'Saved Timetables',
  '/settings':     'Settings',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user }     = useAuth();
  const title = Object.entries(TITLES).find(([p]) => pathname.startsWith(p))?.[1] || 'AI Timetable Agent';

  return (
    <header style={{
      height: 'var(--header-h)',
      background: '#fff',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
    }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          {user?.email || ''}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--color-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
        }}>
          {(user?.username || 'A')[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
