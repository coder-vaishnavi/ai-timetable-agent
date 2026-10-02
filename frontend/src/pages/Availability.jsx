import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getTeachers, getTeacherAvail, setTeacherAvail } from '../api/teachers';
import { getClassrooms, getClassroomAvail, setClassroomAvail } from '../api/classrooms';

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOTS = ['10:00–12:00', '12:40–2:40', '2:50–4:50'];

function buildGrid(rows) {
  // returns {day: {slot: bool}}
  const grid = {};
  for (let d = 0; d < 5; d++) {
    grid[d] = {};
    for (let s = 0; s < 3; s++) grid[d][s] = true;
  }
  rows.forEach(r => { grid[r.day][r.slot] = !!r.available; });
  return grid;
}

function gridToRows(grid) {
  const rows = [];
  for (let d = 0; d < 5; d++)
    for (let s = 0; s < 3; s++)
      rows.push({ day: d, slot: s, available: grid[d][s] ? 1 : 0 });
  return rows;
}

function AvailGrid({ grid, onChange }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>Slot / Day</th>
            {DAYS.map(d => <th key={d} style={{ padding: '6px 16px', background: '#f1f5f9', border: '1px solid #e2e8f0' }}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map((slotLabel, s) => (
            <tr key={s}>
              <td style={{ padding: '6px 10px', border: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' }}>{slotLabel}</td>
              {DAYS.map((_, d) => (
                <td key={d} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <input type="checkbox" checked={!!grid[d]?.[s]} onChange={e => onChange(d, s, e.target.checked)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Availability() {
  const [tab, setTab]         = useState('teachers');
  const [teachers, setTeachers]     = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [grid, setGrid]         = useState({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([getTeachers(), getClassrooms()])
      .then(([t, c]) => { setTeachers(t.data); setClassrooms(c.data); })
      .finally(() => setLoading(false));
  }, []);

  async function selectEntity(entity) {
    setSelected(entity);
    const fn = tab === 'teachers' ? getTeacherAvail : getClassroomAvail;
    const res = await fn(entity.id);
    setGrid(buildGrid(res.data));
  }

  function handleToggle(d, s, val) {
    setGrid(prev => ({ ...prev, [d]: { ...prev[d], [s]: val } }));
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const rows = gridToRows(grid);
      const fn = tab === 'teachers' ? setTeacherAvail : setClassroomAvail;
      await fn(selected.id, { availability: rows });
      toast.success('Availability saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  }

  const entities = tab === 'teachers' ? teachers : classrooms;

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Availability</h2><p className="page-subtitle">Set available teaching slots</p></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
        {['teachers', 'classrooms'].map(t => (
          <button key={t} onClick={() => { setTab(t); setSelected(null); setGrid({}); }} style={{
            padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
            color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
            borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* List */}
        <div className="card" style={{ padding: 0, height: 'fit-content' }}>
          {entities.map(e => (
            <div key={e.id} onClick={() => selectEntity(e)} style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: 13,
              background: selected?.id === e.id ? 'var(--color-primary-l)' : '',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: selected?.id === e.id ? 600 : 400,
              color: selected?.id === e.id ? 'var(--color-primary)' : 'var(--color-text)',
            }}>{e.name}</div>
          ))}
        </div>

        {/* Grid */}
        {selected ? (
          <div className="card">
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>{selected.name} — Availability</h3>
            <AvailGrid grid={grid} onChange={handleToggle} />
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Availability'}
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
            Select a {tab === 'teachers' ? 'teacher' : 'classroom'} to edit availability
          </div>
        )}
      </div>
    </div>
  );
}
