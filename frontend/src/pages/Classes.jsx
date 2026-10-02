import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../components/Common/Table';
import Modal from '../components/Common/Modal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getClasses, createClass, updateClass, deleteClass } from '../api/divisions';

const EMPTY = { name: '', year: '', department: '' };

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);

  function load() { getClasses().then(r => setClasses(r.data)).finally(() => setLoading(false)); }
  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditId(null); setModal('form'); }
  function openEdit(c) { setForm({ name: c.name, year: c.year || '', department: c.department || '' }); setEditId(c.id); setModal('form'); }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editId) { await updateClass(editId, form); toast.success('Class updated'); }
      else        { await createClass(form);          toast.success('Class added'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete ${c.name}? This will also delete its divisions.`)) return;
    try { await deleteClass(c.id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const columns = [
    { key: 'name',       label: 'Class Name', render: r => <strong>{r.name}</strong> },
    { key: 'year',       label: 'Year',       render: r => r.year || '—' },
    { key: 'department', label: 'Department', render: r => r.department || '—' },
    { key: 'actions', label: '', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><Pencil size={13} /></button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={13} /></button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Classes</h2><p className="page-subtitle">{classes.length} class(es)</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Class</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={classes} emptyMessage="No classes yet." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Class' : 'Add Class'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}
        >
          {['name','year','department'].map(f => (
            <div key={f} className="form-group">
              <label className="form-label" style={{ textTransform: 'capitalize' }}>{f}</label>
              <input className="form-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}
