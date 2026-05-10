import React, { useEffect } from 'react';
import '../styles/ConfirmModal.css';

function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'default' }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {title && <h3 className="cm-title">{title}</h3>}
        {message && <p className="cm-message">{message}</p>}
        <div className="cm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn cm-confirm${variant === 'danger' ? ' cm-confirm--danger' : ''}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
