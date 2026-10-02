import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import Modal from '../components/Common/Modal';
import ConfirmModal from '../components/Common/ConfirmModal';
import { getDivisions } from '../api/divisions';
import { getSubjects } from '../api/subjects';
import { getTeachers } from '../api/teachers';
import { getRequirements, setRequirement, deleteRequirement } from '../api/divisions';

export default function Requirements() {
  const [divisions, setDivisions] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [teachers, setTeachers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selDiv, setSelDiv]       = useState(null);
  const [reqs, setReqs]           = useState([]);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({ subject_id: '', teacher_id: '', sessions_per_week: 3, is_lab: false });
  const [saving, setSaving]       = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  useEffect(() => {
    Promise.all([getDivisions(), getSubjects(), getTeachers()])
      .then(([d, s, t]) => { setDivisions(d.data); setSubjects(s.data); setTeachers(t.data); })
      .finally(() => setLoading(false));
  }, []);

  async function selectDivision(div) {
    setSelDiv(div);
    const res = await getRequirements(div.id);
    setReqs(res.data);
  }

  async function handleSave() {
    if (!form.subject_id || !form.teacher_id) return toast.error('Subject and teacher are required');
    setSaving(true);
    try {
      await setRequirement(selDiv.id, { subject_id: +form.subject_id, teacher_id: +form.teacher_id, sessions_per_week: +form.sessions_per_week });
      toast.success('Requirement saved');
      const res = await getRequirements(selDiv.id);
      setReqs(res.data);
      setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function doDelete(req) {
    try {
      await deleteRequirement(selDiv.id, req.subject_id);
      toast.success('Removed');
      const res = await getRequirements(selDiv.id);
      setReqs(res.data);
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  }

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Subject Requirements</h2><p className="page-subtitle">Map subjects + teachers to divisions</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Division list */}
        <div className="card" style={{ padding: 0, height: 'fit-content' }}>
          {divisions.map(d => (
            <div key={d.id} onClick={() => selectDivision(d)} style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: 13,
              background: selDiv?.id === d.id ? 'var(--color-primary-l)' : '',
              borderBottom: '1px solid var(--color-border)',
              fontWeight: selDiv?.id === d.id ? 600 : 400,
              color: selDiv?.id === d.id ? 'var(--color-primary)' : 'var(--color-text)',
            }}>
              {d.class_name} — Div {d.name}
            </div>
          ))}
        </div>

        {/* Requirements table */}
        {selDiv ? (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Division {selDiv.name} Requirements</h3>
              <button className="btn btn-primary btn-sm" onClick={() => { setForm({ subject_id: '', teacher_id: '', sessions_per_week: 3, is_lab: false }); setModal('form'); }}>
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Subject</th><th>Code</th><th>Type</th><th>Teacher</th><th>Sess/Week</th><th></th></tr></thead>
                <tbody>
                  {reqs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 24 }}>No requirements yet.</td></tr>
                  ) : reqs.map(r => (
                    <tr key={r.id}>
                      <td><strong>{r.subject_name}</strong></td>
                      <td><span className="badge badge-blue">{r.code}</span></td>
                      <td>{r.is_lab
                        ? <span className="badge badge-purple">Lab · 2hr</span>
                        : <span className="badge badge-gray">Theory · 1hr</span>}
                      </td>
                      <td>{r.teacher_name}</td>
                      <td>{r.sessions_per_week}×/week</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => setConfirmItem(r)}><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
            Select a division to view/edit requirements
          </div>
        )}
      </div>

      {confirmItem && (
        <ConfirmModal
          message={`Remove ${confirmItem.subject_name} from requirements?`}
          onConfirm={() => doDelete(confirmItem)}
          onClose={() => setConfirmItem(null)}
        />
      )}
      {modal === 'form' && (
        <Modal title="Add Requirement" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-input form-select" value={form.subject_id}
              onChange={e => {
                const sub = subjects.find(s => s.id === +e.target.value);
                const isLab = sub ? !!sub.is_lab : false;
                setForm(p => ({
                  ...p,
                  subject_id: e.target.value,
                  is_lab: isLab,
                  sessions_per_week: isLab ? 1 : 3,
                }));
              }}>
              <option value="">-- select --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_lab ? '(Lab · 2hr)' : '(Theory · 1hr)'}
                </option>
              ))}
            </select>
            {form.subject_id && (
              <p style={{ fontSize: 11, marginTop: 4, color: form.is_lab ? '#7c3aed' : 'var(--color-muted)' }}>
                {form.is_lab
                  ? '📐 Lab subject — each session occupies 2 consecutive slots (4 hrs).'
                  : '📖 Theory subject — each session occupies 1 slot (1 hr).'}
              </p>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Teacher</label>
            <select className="form-input form-select" value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}>
              <option value="">-- select --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sessions per week</label>
            <input className="form-input" type="number" min={1} max={15} value={form.sessions_per_week}
              onChange={e => setForm(p => ({ ...p, sessions_per_week: +e.target.value }))} />
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              {form.is_lab
                ? `${form.sessions_per_week} lab session(s)/week × 2 slots = ${form.sessions_per_week * 2} slots used`
                : `${form.sessions_per_week} theory session(s)/week × 1 slot = ${form.sessions_per_week} slots used`}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
