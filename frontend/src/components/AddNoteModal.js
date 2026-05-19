import React, { useState, useEffect, useRef } from 'react';
import '../styles/AccountModal.css';

function AddNoteModal({ isOpen, onConfirm, onCancel, loading }) {
  const [content, setContent] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (isOpen) { setContent(''); setTimeout(() => ref.current?.focus(), 80); }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="account-modal-overlay">
      <div className="account-modal" style={{ maxWidth: 480, height: 'auto' }}>

        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">Account Notes</p>
            <h2>Add Note</h2>
          </div>
          <div className="modal-header-right">
            <button className="close-btn" onClick={onCancel} disabled={loading}>✕</button>
          </div>
        </div>

        <div className="account-modal-content">
          <div className="form-step">
            <textarea
              ref={ref}
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your note here…"
              style={{
                width: '100%', resize: 'vertical',
                padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid var(--line)',
                font: 'inherit', fontSize: 13,
                outline: 'none', lineHeight: 1.6,
                boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--brand)'; }}
              onBlur={e  => { e.target.style.borderColor = 'var(--line)'; }}
            />
            <p style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 6 }}>
              {content.trim().length} characters
            </p>
          </div>
        </div>

        <div className="account-modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>← Cancel</button>
          <button
            className="btn-primary"
            disabled={!content.trim() || loading}
            onClick={() => onConfirm(content.trim())}
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            {loading ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddNoteModal;
