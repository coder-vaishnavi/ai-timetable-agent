import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Building2, GitBranch, CalendarDays, Zap } from 'lucide-react';
import StatsCard from '../components/Common/StatsCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getStats } from '../api/timetable';
import { getTimetables } from '../api/timetable';

export default function Dashboard() {
  const [stats, setStats]         = useState(null);
  const [recent, setRecent]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getStats(), getTimetables()])
      .then(([s, t]) => { setStats(s.data); setRecent(t.data.slice(0, 5)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner full text="Loading dashboard…" />;

  const s = stats || {};

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatsCard title="Teachers"         value={s.total_teachers   || 0} icon={Users}       color="#1e40af" />
        <StatsCard title="Subjects"         value={s.total_subjects   || 0} icon={BookOpen}    color="#7c3aed" />
        <StatsCard title="Classrooms"       value={s.total_classrooms || 0} icon={Building2}   color="#0891b2" />
        <StatsCard title="Divisions"        value={s.total_divisions  || 0} icon={GitBranch}   color="#059669" />
        <StatsCard title="Timetables"       value={s.total_timetables || 0} icon={CalendarDays} color="#d97706" />
        <StatsCard title="Avg. Score"       value={`${parseFloat(s.avg_score || 0).toFixed(1)}%`} icon={Zap} color="#16a34a" subtitle="Optimization score" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate('/generate')}>
              <Zap size={15} /> Generate New Timetable
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/teachers')}>
              <Users size={15} /> Manage Teachers
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/requirements')}>
              <BookOpen size={15} /> Configure Requirements
            </button>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recent Timetables</h2>
          {recent.length === 0 ? (
            <p style={{ color: 'var(--color-muted)', fontSize: 13 }}>No timetables generated yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map(tt => (
                <div key={tt.id}
                  onClick={() => navigate(`/timetable/${tt.id}`)}
                  style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--color-border)', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{tt.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                    {tt.class_name} · Score: {parseFloat(tt.optimization_score).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>About AI Timetable Agent</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: 13, lineHeight: 1.7 }}>
          This system uses a single AI agent powered by <strong>OR-Tools CP-SAT</strong> to automatically generate
          optimized academic timetables. It enforces all hard constraints (teacher/classroom conflicts, availability,
          session counts) and maximizes soft constraints (session spread, teacher preferences) to produce a
          conflict-free schedule.
        </p>
      </div>
    </div>
  );
}
