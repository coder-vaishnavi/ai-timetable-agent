import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, Printer, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getTimetable, updateStatus, exportPdf, exportExcel } from '../api/timetable';
import { generate } from '../api/agent';
import { useApp } from '../context/AppContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// 6 one-hour theory slots per day
const SLOTS = [
  { index: 0, label: '10:00–11:00' },
  { index: 1, label: '11:00–12:00' },
  { index: 2, label: '12:40–1:40'  },
  { index: 3, label: '1:40–2:40'   },
  { index: 4, label: '2:50–3:50'   },
  { index: 5, label: '3:50–4:50'   },
];
// Breaks appear after these slot indices
const BREAKS = [
  { afterSlot: 1, label: '12:00–12:40' },
  { afterSlot: 3, label: '2:40–2:50'   },
];
// Lab 2-hr windows: slot pair index → combined label
const LAB_LABELS = { 0: '10:00–12:00', 2: '12:40–2:40', 4: '2:50–4:50' };

function buildGrid(entries, divisionId) {
  const grid = {};
  DAYS.forEach((_, d) => {
    grid[d] = {};
    SLOTS.forEach(s => { grid[d][s.index] = null; });
  });
  entries.filter(e => e.division_id === divisionId).forEach(e => {
    // is_lab drives slot_span: lab=2 slots, theory=1 slot
    grid[e.day][e.slot] = { ...e, slot_span: e.is_lab ? 2 : 1 };
  });
  return grid;
}

export default function GeneratedTimetable() {
  const { id }               = useParams();
  const [tt, setTt]          = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDiv, setActiveDiv] = useState(null);
  const [nlInput, setNlInput] = useState('');
  const [regen, setRegen]    = useState(false);
  const { lastGenerated }    = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    getTimetable(id).then(res => {
      setTt(res.data);
      setEntries(res.data.entries || []);
      const divIds = [...new Set((res.data.entries || []).map(e => e.division_id))];
      if (divIds.length) setActiveDiv(divIds[0]);
    }).catch(() => toast.error('Timetable not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    try { await updateStatus(id, 'saved'); toast.success('Saved'); setTt(p => ({ ...p, status: 'saved' })); }
    catch { toast.error('Save failed'); }
  }

  async function handleExportPdf() {
    try {
      const res = await exportPdf(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `timetable_${id}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('PDF export failed'); }
  }

  async function handleExportExcel() {
    try {
      const res = await exportExcel(id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = `timetable_${id}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Excel export failed'); }
  }

  if (loading) return <LoadingSpinner full />;
  if (!tt)     return <div className="card"><p>Timetable not found.</p></div>;

  const divisions = [...new Map(entries.map(e => [e.division_id, { id: e.division_id, name: e.division_name }])).values()];
  const divEntries = entries.filter(e => e.division_id === activeDiv);
  const grid = activeDiv ? buildGrid(entries, activeDiv) : {};
  const conflicts = lastGenerated?.conflicts || [];
  const score = parseFloat(tt.optimization_score || 0).toFixed(1);
  const agentSteps = lastGenerated?.agent_steps || [];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{tt.name}</h2>
          <p className="page-subtitle">
            {tt.class_name} · Score: {score}% · {tt.conflicts_count} conflict(s)
            <span className="badge badge-green" style={{ marginLeft: 8 }}>{tt.status}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tt.status !== 'saved' && (
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Timetable</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleExportPdf}><Download size={13} /> PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}><Download size={13} /> Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Printer size={13} /> Print</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/conflicts/' + id)}>
            <AlertTriangle size={13} /> Conflicts ({tt.conflicts_count})
          </button>
        </div>
      </div>

      {/* Score badge */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#dcfce7', borderRadius: 8 }}>
          <Zap size={15} color="#16a34a" />
          <span style={{ fontWeight: 700, color: '#16a34a' }}>Optimization Score: {score}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: tt.conflicts_count > 0 ? '#fee2e2' : '#dcfce7', borderRadius: 8 }}>
          {tt.conflicts_count > 0 ? <AlertTriangle size={15} color="#dc2626" /> : <CheckCircle size={15} color="#16a34a" />}
          <span style={{ fontWeight: 700, color: tt.conflicts_count > 0 ? '#dc2626' : '#16a34a' }}>
            {tt.conflicts_count} Conflict(s)
          </span>
        </div>
      </div>

      {/* Division tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
        {divisions.map(d => (
          <button key={d.id} onClick={() => setActiveDiv(d.id)} style={{
            padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 14,
            color: activeDiv === d.id ? 'var(--color-primary)' : 'var(--color-muted)',
            borderBottom: activeDiv === d.id ? '2px solid var(--color-primary)' : '2px solid transparent',
          }}>
            Division {d.name}
          </button>
        ))}
      </div>

      {/* Timetable grid */}
      {activeDiv && (
        <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="tt-grid" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>TIME</th>
                {DAYS.map(d => <th key={d}>{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map(({ index: s, label: slotLabel }) => {
                const breakAfter = BREAKS.find(b => b.afterSlot === s);
                // Check if any column has a lab that started at s-1 (this row is its second slot)
                // We still render the row for theory cells in that row, but skip spanned cells
                const isLabSecondSlot = s % 2 === 1 &&
                  DAYS.some((_, d) => grid[d]?.[s - 1]?.slot_span === 2);

                // For the TIME column: if a lab starts here, span 2 rows and show lab label
                // If this is the second row of a lab block, skip the TIME cell entirely
                const anyLabStartsHere = s % 2 === 0 &&
                  DAYS.some((_, d) => grid[d]?.[s]?.slot_span === 2);
                const anyLabCoveredHere = s % 2 === 1 &&
                  DAYS.some((_, d) => grid[d]?.[s - 1]?.slot_span === 2);

                return (
                  <React.Fragment key={s}>
                    <tr>
                      {/* TIME cell */}
                      {!anyLabCoveredHere && (
                        <td rowSpan={anyLabStartsHere ? 2 : 1}
                          style={{ fontWeight: 700, background: '#f8fafc', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {anyLabStartsHere ? LAB_LABELS[s] : slotLabel}
                        </td>
                      )}
                      {DAYS.map((_, d) => {
                        const cell = grid[d]?.[s];
                        // If a lab block started at slot s-1, this slot is already covered by rowSpan
                        const prevCell = grid[d]?.[s - 1];
                        if (prevCell?.slot_span === 2) return null;
                        const span = cell?.slot_span || 1;
                        return (
                          <td key={d} rowSpan={span}
                            style={{
                              verticalAlign: 'middle', padding: '10px',
                              background: cell && span === 2 ? '#f5f3ff' : '',
                              borderLeft: cell && span === 2 ? '3px solid #7c3aed' : '',
                            }}>
                            {cell ? (
                              <>
                                <div className="tt-cell-subject">{cell.subject_name}</div>
                                <div className="tt-cell-teacher">{cell.teacher_name}</div>
                                <div className="tt-cell-room">{cell.classroom_name}</div>
                                <div style={{ marginTop: 4 }}>
                                  {span === 2
                                    ? <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', padding: '1px 6px', borderRadius: 4 }}>Lab · 2hr</span>
                                    : <span style={{ fontSize: 10, fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>Theory · 1hr</span>
                                  }
                                </div>
                              </>
                            ) : (
                              <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {breakAfter && (
                      <tr className="tt-break-row">
                        <td style={{ fontWeight: 600, padding: '6px 10px', fontSize: 12 }}>{breakAfter.label}</td>
                        {DAYS.map((_, d) => <td key={d}>BREAK</td>)}
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* AI explanation */}
      {agentSteps.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>How the AI Agent Generated This Timetable</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {agentSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < agentSteps.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: step.status === 'success' ? '#dcfce7' : step.status === 'error' ? '#fee2e2' : '#fef9c3',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                  color: step.status === 'success' ? '#16a34a' : step.status === 'error' ? '#dc2626' : '#854d0e',
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{step.step}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>{step.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Natural language modification */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Modify with Natural Language</h3>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10 }}>
          Describe changes and regenerate. e.g. "Move DBMS to mornings only"
        </p>
        <textarea className="form-input" rows={3} value={nlInput} onChange={e => setNlInput(e.target.value)}
          placeholder="Type your modification request…" style={{ resize: 'vertical' }} />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} disabled={regen}
          onClick={async () => {
            if (!nlInput.trim()) return;
            setRegen(true);
            try {
              const res = await generate({ class_id: tt.class_id, nl_input: nlInput, name: tt.name + ' (Modified)', time_limit: 60 });
              if (res.data.status === 'success') {
                toast.success('Regenerated!');
                navigate('/timetable/' + res.data.timetable_id);
              } else { toast.error(res.data.message); }
            } catch { toast.error('Regeneration failed'); }
            finally { setRegen(false); }
          }}>
          {regen ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>
    </div>
  );
}
