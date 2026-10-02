import React from 'react';
import Modal from './Modal';

/**
 * Drop-in replacement for window.confirm().
 * Usage:
 *   <ConfirmModal
 *     message="Delete this teacher?"
 *     onConfirm={() => doDelete()}
 *     onClose={() => setConfirm(null)}
 *   />
 */
export default function ConfirmModal({ message, onConfirm, onClose, danger = true }) {
  return (
    <Modal
      title="Confirm"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => { onConfirm(); onClose(); }}
          >
            Delete
          </button>
        </>
      }
    >
      <p style={{ fontSize: 14, color: '#1f2328' }}>{message}</p>
    </Modal>
  );
}
