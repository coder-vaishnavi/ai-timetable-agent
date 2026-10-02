import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getTimetable } from '../api/timetable';
import { useApp } from '../context/AppContext';

export default function ConflictReport() {
  const { id }          = useParams();
  const [tt, setTt]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastGenerated } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    getTimetable(id).then(res => setTt(res.data)).finally(() => setLoading(false));
  }, [id]);

  const conflicts = lastGenerated?.conflicts || [];

  if (loading) return <LoadingSpinner full />;
  if (!tt)     return <div className="card"><p>Not found.</p></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Conflict Report</h2>
          <p className="page-subtitle">{tt.name}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> Back
        </button>
      </div>

      <div className="card">
        {conflicts.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#16a34a' }}>
            <CheckCircle size={20} />
            <span style={{ fontWeight: 600 }}>No conflicts detected. Timetable is valid.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conflicts.map((c, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                background: c.severity === 'hard' ? '#fef2f2' : '#fffbeb',
                borderRadius: 6, borderLeft: `3px solid ${c.severity === 'hard' ? '#dc2626' : '#d97706'}`,
              }}>
                <AlertTriangle size={16} color={c.severity === 'hard' ? '#dc2626' : '#d97706'} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.type.replace(/_/g,' ').toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text)', marginTop: 2 }}>{c.description}</div>
                  <span className={`badge ${c.severity === 'hard' ? 'badge-red' : 'badge-yellow'}`} style={{ marginTop: 4 }}>
                    {c.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
