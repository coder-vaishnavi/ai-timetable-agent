import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Table from '../components/Common/Table';
import { getTimetables, deleteTimetable, updateStatus } from '../api/timetable';

export default function SavedTimetables() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  function load() { getTimetables().then(r => setTimetables(r.data)).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function handleDelete(tt) {
    if (!window.confirm(`Delete "${tt.name}"?`)) return;
    try { await deleteTimetable(tt.id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  async function handleArchive(tt) {
    try { await updateStatus(tt.id, 'archived'); toast.success('Archived'); load(); }
    catch { toast.error('Archive failed'); }
  }

  const statusColor = { generated: 'badge-blue', saved: 'badge-green', archived: 'badge-gray' };

  const columns = [
    { key: 'name',               label: 'Name',       render: r => <strong>{r.name}</strong> },
    { key: 'class_name',         label: 'Class' },
    { key: 'optimization_score', label: 'Score',      render: r => `${parseFloat(r.optimization_score).toFixed(1)}%` },
    { key: 'conflicts_count',    label: 'Conflicts' },
    { key: 'status',             label: 'Status',     render: r => <span className={`badge ${statusColor[r.status] || 'badge-gray'}`}>{r.status}</span> },
    { key: 'created_at',         label: 'Created',    render: r => new Date(r.created_at).toLocaleDateString() },
    { key: 'actions', label: '', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/timetable/${r.id}`)}><Eye size={13} /></button>
        {r.status !== 'archived' && (
          <button className="btn btn-ghost btn-sm" onClick={() => handleArchive(r)}><Archive size={13} /></button>
        )}
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={13} /></button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Saved Timetables</h2><p className="page-subtitle">{timetables.length} timetable(s)</p></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={timetables} emptyMessage="No timetables yet. Generate one!" />
      </div>
    </div>
  );
}
