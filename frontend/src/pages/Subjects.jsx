import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../components/Common/Table';
import Modal from '../components/Common/Modal';
import ConfirmModal from '../components/Common/ConfirmModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjects';

const EMPTY = { name: '', code: '', is_lab: false, sessions_per_week: 3 };

// Default sessions per type
const TYPE_DEFAULTS = { theory: 3, lab: 1 };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  function load() {
    getSubjects().then(r => setSubjects(r.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditId(null); setModal('form'); }
  function openEdit(s) { setForm({ name: s.name, code: s.code, is_lab: !!s.is_lab, sessions_per_week: s.sessions_per_week }); setEditId(s.id); setModal('form'); }

  function handleTypeChange(isLab) {
    setForm(p => ({
      ...p,
      is_lab: isLab,
      sessions_per_week: isLab ? TYPE_DEFAULTS.lab : TYPE_DEFAULTS.theory,
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) return toast.error('Name and code are required');
    setSaving(true);
    try {
      if (editId) { await updateSubject(editId, form); toast.success('Subject updated'); }
      else        { await createSubject(form);          toast.success('Subject added'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function doDelete(s) {
    try { await deleteSubject(s.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  }

  const columns = [
    { key: 'name',              label: 'Name',     render: r => <strong>{r.name}</strong> },
    { key: 'code',              label: 'Code',     render: r => <span className="badge badge-blue">{r.code}</span> },
    { key: 'is_lab',            label: 'Type',     render: r => r.is_lab
        ? <span className="badge badge-purple">Lab · 2hr/slot</span>
        : <span className="badge badge-gray">Theory · 1hr/slot</span> },
    { key: 'sessions_per_week', label: 'Sess/Week', render: r => `${r.sessions_per_week}×/week` },
    { key: 'actions', label: '', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Pencil size={13} /></button>
        <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem(r)}><Trash2 size={13} /></button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Subjects</h2>
          <p className="page-subtitle">{subjects.length} subject(s)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Subject</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={subjects} emptyMessage="No subjects yet." />
      </div>

      {confirmItem && (
        <ConfirmModal
          message={`Delete ${confirmItem.name}?`}
          onConfirm={() => doDelete(confirmItem)}
          onClose={() => setConfirmItem(null)}
        />
      )}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Subject' : 'Add Subject'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Code</label>
            <input className="form-input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Session Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Theory (1 hr/slot)', value: false },
                { label: 'Lab (2 hrs/slot)',   value: true  },
              ].map(opt => (
                <label key={String(opt.value)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  border: `2px solid ${form.is_lab === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: form.is_lab === opt.value ? 'var(--color-primary-l)' : '',
                  fontWeight: form.is_lab === opt.value ? 600 : 400,
                  color: form.is_lab === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="session_type" style={{ display: 'none' }}
                    checked={form.is_lab === opt.value}
                    onChange={() => handleTypeChange(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Sessions per week</label>
            <input className="form-input" type="number" min={1} max={15} value={form.sessions_per_week}
              onChange={e => setForm(p => ({ ...p, sessions_per_week: +e.target.value }))} />
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4 }}>
              {form.is_lab
                ? 'Each lab session occupies 2 consecutive slots (4 hrs total).'
                : 'Each theory session occupies 1 slot (1 hr).'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
