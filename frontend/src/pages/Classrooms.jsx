import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../components/Common/Table';
import Modal from '../components/Common/Modal';
import ConfirmModal from '../components/Common/ConfirmModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getClassrooms, createClassroom, updateClassroom, deleteClassroom } from '../api/classrooms';

const EMPTY = { name: '', capacity: 60, is_lab: false };

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [editId, setEditId]         = useState(null);
  const [saving, setSaving]         = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  function load() { getClassrooms().then(r => setClassrooms(r.data)).finally(() => setLoading(false)); }
  useEffect(load, []);

  function openAdd()   { setForm(EMPTY); setEditId(null); setModal('form'); }
  function openEdit(c) { setForm({ name: c.name, capacity: c.capacity, is_lab: !!c.is_lab }); setEditId(c.id); setModal('form'); }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      if (editId) { await updateClassroom(editId, form); toast.success('Updated'); }
      else        { await createClassroom(form);          toast.success('Classroom added'); }
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function doDelete(c) {
    try { await deleteClassroom(c.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  }

  const columns = [
    { key: 'name',     label: 'Name',     render: r => <strong>{r.name}</strong> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'is_lab',   label: 'Type',     render: r => r.is_lab ? <span className="badge badge-purple">Lab</span> : <span className="badge badge-gray">Classroom</span> },
    { key: 'actions',  label: '', render: r => (
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
        <div><h2 className="page-title">Classrooms</h2><p className="page-subtitle">{classrooms.length} room(s)</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Classroom</button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={classrooms} />
      </div>

      {confirmItem && (
        <ConfirmModal
          message={`Delete ${confirmItem.name}?`}
          onConfirm={() => doDelete(confirmItem)}
          onClose={() => setConfirmItem(null)}
        />
      )}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Classroom' : 'Add Classroom'} onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}
        >
          <div className="form-group"><label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Capacity</label>
            <input className="form-input" type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: +e.target.value }))} /></div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="is_lab_c" checked={form.is_lab} onChange={e => setForm(p => ({ ...p, is_lab: e.target.checked }))} />
            <label htmlFor="is_lab_c" className="form-label" style={{ marginBottom: 0 }}>Is Lab</label>
          </div>
        </Modal>
      )}
    </div>
  );
}
