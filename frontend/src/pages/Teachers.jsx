import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../components/Common/Table';
import Modal from '../components/Common/Modal';
import ConfirmModal from '../components/Common/ConfirmModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../api/teachers';

const EMPTY = { name: '', email: '', department: '', max_hours: 20 };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [confirmItem, setConfirmItem] = useState(null);

  function load() {
    getTeachers().then(r => setTeachers(r.data)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function openAdd()    { setForm(EMPTY); setEditId(null); setModal('form'); }
  function openEdit(t)  { setForm({ name: t.name, email: t.email || '', department: t.department || '', max_hours: t.max_hours }); setEditId(t.id); setModal('form'); }
  function closeModal() { setModal(null); }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editId) {
        await updateTeacher(editId, form);
        toast.success('Teacher updated');
      } else {
        await createTeacher(form);
        toast.success('Teacher added');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  }

  async function doDelete(t) {
    try {
      await deleteTeacher(t.id);
      toast.success('Teacher deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  }

  const columns = [
    { key: 'name',       label: 'Name',        render: r => <strong>{r.name}</strong> },
    { key: 'email',      label: 'Email',        render: r => r.email || '—' },
    { key: 'department', label: 'Department',   render: r => r.department || '—' },
    { key: 'max_hours',  label: 'Max hrs/week', render: r => r.max_hours },
    { key: 'actions',    label: '', render: r => (
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
          <h2 className="page-title">Teachers</h2>
          <p className="page-subtitle">{teachers.length} teacher(s) registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Teacher</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={teachers} emptyMessage="No teachers yet. Add one to get started." />
      </div>

      {confirmItem && (
        <ConfirmModal
          message={`Delete ${confirmItem.name}?`}
          onConfirm={() => doDelete(confirmItem)}
          onClose={() => setConfirmItem(null)}
        />
      )}
      {modal === 'form' && (
        <Modal
          title={editId ? 'Edit Teacher' : 'Add Teacher'}
          onClose={closeModal}
          footer={<>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}
        >
          {['name','email','department'].map(f => (
            <div key={f} className="form-group">
              <label className="form-label" style={{ textTransform: 'capitalize' }}>{f}</label>
              <input className="form-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Max hours / week</label>
            <input className="form-input" type="number" min={1} max={40} value={form.max_hours}
              onChange={e => setForm(p => ({ ...p, max_hours: +e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}
