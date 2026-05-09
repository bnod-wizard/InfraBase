import React, { useState, useEffect, useRef } from 'react';

const ICONS = ['⎙', '▤', '▥', '⊡', '▦', '◈', '⊞', '✎', '⊟', '◉'];

const NewTemplateModal = ({ onClose, onCreated }) => {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [icon, setIcon]       = useState('⎙');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const inputRef = useRef(null);

  useEffect(() => inputRef.current?.focus(), []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onCreated(name.trim(), desc.trim(), icon);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create template');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth: 440}} onClick={e => e.stopPropagation()}>
        <div className="account-modal-header">
          <div>
            <p className="modal-eyebrow">Templates</p>
            <h2>New Template</h2>
            <p className="modal-sub">Create a custom template with your own sections</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{padding: '0 24px 24px'}}>
          <div className="form-group">
            <label>Template Name</label>
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="e.g. Bank Appraisal Report"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="Short description of this template"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="nt-icon-grid">
              {ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  className={`nt-icon-opt ${icon === ic ? 'selected' : ''}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div style={{display:'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20}}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !name.trim()}>
              {saving ? 'Creating…' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTemplateModal;
