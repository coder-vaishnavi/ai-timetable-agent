import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Table from '../components/Common/Table';
import Modal from '../components/Common/Modal';
import ConfirmModal from '../components/Common/ConfirmModal';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { getClasses, getDivisions, createDivision, deleteDivision } from '../api/divisions';

export default function Divisions() {
  const [classes, setClasses]     = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({ class_id: '', name: '', strength: 60 });
  const [saving, setSaving]       = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  function load() {
    Promise.all([getClasses(), getDivisions()])
      .then(([c, d]) => { setClasses(c.data); setDivisions(d.data); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleSave() {
    if (!form.class_id || !form.name.trim()) return toast.error('Class and division name are required');
    setSaving(true);
    try {
      await createDivision({ class_id: form.class_id, name: form.name.trim(), strength: form.strength });
      toast.success('Division created');
      load(); setModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function doDelete(d) {
    try { await deleteDivision(d.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  }

  const columns = [
    { key: 'class_name', label: 'Class', render: r => <strong>{r.class_name}</strong> },
    { key: 'name',       label: 'Division' },
    { key: 'strength',   label: 'Strength' },
    { key: 'actions', label: '', render: r => (
      <button className="btn btn-danger btn-sm" onClick={() => setConfirmItem(r)}><Trash2 size={13} /></button>
    )},
  ];

  if (loading) return <LoadingSpinner full />;

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Divisions</h2><p className="page-subtitle">{divisions.length} division(s)</p></div>
        <button className="btn btn-primary" onClick={() => { setForm({ class_id: classes[0]?.id || '', name: '', strength: 60 }); setModal('form'); }}>
          <Plus size={15} /> Add Division
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <Table columns={columns} data={divisions} emptyMessage="No divisions yet." />
      </div>

      {confirmItem && (
        <ConfirmModal
          message={`Delete Division ${confirmItem.name}?`}
          onConfirm={() => doDelete(confirmItem)}
          onClose={() => setConfirmItem(null)}
        />
      )}
      {modal === 'form' && (
        <Modal title="Add Division" onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
          </>}
        >
          <div className="form-group">
            <label className="form-label">Class</label>
            <select className="form-input form-select" value={form.class_id} onChange={e => setForm(p => ({ ...p, class_id: e.target.value }))}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Division Name (e.g. A, B)</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Strength</label>
            <input className="form-input" type="number" min={1} value={form.strength} onChange={e => setForm(p => ({ ...p, strength: +e.target.value }))} />
          </div>
        </Modal>
      )}
    </div>
  );
}
