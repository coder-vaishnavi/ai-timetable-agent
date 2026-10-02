import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Building2, GraduationCap,
  GitBranch, Clock, ClipboardList, Zap,
  Archive, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { section: 'Data' },
  { to: '/teachers',     label: 'Teachers',       icon: Users },
  { to: '/subjects',     label: 'Subjects',       icon: BookOpen },
  { to: '/classrooms',   label: 'Classrooms',     icon: Building2 },
  { to: '/classes',      label: 'Classes',        icon: GraduationCap },
  { to: '/divisions',    label: 'Divisions',      icon: GitBranch },
  { section: 'Setup' },
  { to: '/availability', label: 'Availability',   icon: Clock },
  { to: '/requirements', label: 'Requirements',   icon: ClipboardList },
  { section: 'Timetable' },
  { to: '/generate',     label: 'Generate',       icon: Zap },
  { to: '/saved',        label: 'Saved Timetables', icon: Archive },
  { section: 'System' },
  { to: '/settings',     label: 'Settings',       icon: Settings },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Zap size={20} className="brand-icon" />
        <span>AI Timetable</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, idx) => {
          if (item.section) {
            return <p key={idx} className="nav-section">{item.section}</p>;
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{(user?.username || 'A')[0].toUpperCase()}</div>
          <span className="user-name">{user?.username || 'Admin'}</span>
        </div>
        <button className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout}>
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
