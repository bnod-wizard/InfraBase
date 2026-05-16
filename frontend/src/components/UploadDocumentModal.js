import React, { useState, useRef, useCallback, useEffect } from 'react';
import '../styles/UploadDocumentModal.css';
import { IconView, IconDelete, IconDownload, IconEdit, IconUpload } from './Icons';

const FILE_TYPES = [
  { value: 'lalpurja',         label: 'Lalpurja / Title Deed' },
  { value: 'citizenship',      label: 'Citizenship Certificate' },
  { value: 'blueprint',        label: 'Blueprint / Drawing' },
  { value: 'map',              label: 'Cadastral Map' },
  { value: 'tax_clearance',    label: 'Tax Clearance' },
  { value: 'boundary_cert',    label: 'Boundary Certificate' },
  { value: 'photo',            label: 'Site Photo' },
  { value: 'valuation_report', label: 'Valuation Report' },
  { value: 'pan_vat',          label: 'PAN / VAT Certificate' },
  { value: 'company_reg',      label: 'Company Registration' },
  { value: 'noc',              label: 'NOC / Permission Letter' },
  { value: 'agreement',        label: 'Agreement / Contract' },
  { value: 'other',            label: 'Other' },
];

const TYPE_LABEL = Object.fromEntries(FILE_TYPES.map(t => [t.value, t.label]));
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.tiff,.tif';

// ─── helpers ─────────────────────────────────────────────────────────────────
function fileIcon(nameOrExt) {
  const ext = (nameOrExt || '').split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','tiff','tif'].includes(ext)) return '🖼';
  if (ext === 'pdf') return '📄';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx'].includes(ext)) return '📊';
  return '📎';
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}

let _uid = 0;
const mkId = () => ++_uid;

// ─── Pending upload row ───────────────────────────────────────────────────────
function PendingRow({ entry, onRemove, onTypeChange, onDescChange }) {
  return (
    <div className="udm-row udm-row--pending">
      <span className="udm-row-icon">{fileIcon(entry.file.name)}</span>
      <div className="udm-row-name">
        <span className="udm-name-text">{entry.file.name}</span>
        <span className="udm-meta-text">{fmtSize(entry.file.size)}</span>
      </div>
      <div className="field-wrap udm-field-wrap--select">
        <select className="udm-select" value={entry.doc_type} onChange={e => onTypeChange(entry.id, e.target.value)}>
          {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label>Document Type</label>
      </div>
      <div className="field-wrap">
        <input className="udm-input" placeholder=" " value={entry.description}
          onChange={e => onDescChange(entry.id, e.target.value)} />
        <label>Description (optional)</label>
      </div>
      <div className="udm-row-actions">
        {entry.status === 'uploading' && <div className="udm-spinner" />}
        {entry.status === 'done'      && <span className="udm-badge udm-badge--ok">✓ Done</span>}
        {entry.status === 'error'     && <span className="udm-badge udm-badge--err" title={entry.error}>✕ Error</span>}
        {!entry.status && (
          <button className="udm-icon-btn udm-icon-btn--del" title="Remove" onClick={() => onRemove(entry.id)}><IconDelete size={14} /></button>
        )}
      </div>
    </div>
  );
}

// ─── Existing document row ────────────────────────────────────────────────────
function DocRow({ doc, accountId, onDeleted, onUpdated }) {
  const [editing,   setEditing]   = useState(false);
  const [editData,  setEditData]  = useState({ doc_type: doc.doc_type, description: doc.description || '', original_name: doc.original_name });
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  const token = () => localStorage.getItem('authToken');

  const handleDownload = () => {
    window.location.href = `http://localhost:5001/api/accounts/${accountId}/documents/${doc._id}/download?token=${token()}`;
  };

  const handleView = () => {
    window.open(`http://localhost:5001/api/accounts/${accountId}/documents/${doc._id}/view?token=${token()}`, '_blank');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:5001/api/accounts/${accountId}/documents/${doc._id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
      });
      if (res.ok) onDeleted(doc._id);
    } finally { setDeleting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5001/api/accounts/${accountId}/documents/${doc._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (res.ok && data.success) { onUpdated(data.data); setEditing(false); }
    } finally { setSaving(false); }
  };

  if (editing) {
    return (
      <div className="udm-row udm-row--edit">
        <span className="udm-row-icon">{fileIcon(doc.file_ext)}</span>
        <div className="udm-row-edit-fields">
          <div className="field-wrap">
            <input className="udm-input" placeholder=" " value={editData.original_name}
              onChange={e => setEditData(p => ({ ...p, original_name: e.target.value }))} />
            <label>File Name</label>
          </div>
          <div className="field-wrap udm-field-wrap--select">
            <select className="udm-select" value={editData.doc_type}
              onChange={e => setEditData(p => ({ ...p, doc_type: e.target.value }))}>
              {FILE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label>Document Type</label>
          </div>
          <div className="field-wrap">
            <input className="udm-input" placeholder=" " value={editData.description}
              onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} />
            <label>Description</label>
          </div>
        </div>
        <div className="udm-row-actions">
          <button className="udm-action-btn udm-action-btn--save" onClick={handleSave} disabled={saving}>
            {saving ? '…' : 'Save'}
          </button>
          <button className="udm-action-btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="udm-row udm-row--saved">
      <span className="udm-row-icon">{fileIcon(doc.file_ext)}</span>
      <div className="udm-row-name">
        <span className="udm-name-text">{doc.original_name}</span>
        <span className="udm-meta-text">
          <span className="udm-type-badge">{TYPE_LABEL[doc.doc_type] || doc.doc_type}</span>
          {doc.description && <span className="udm-desc-text"> · {doc.description}</span>}
        </span>
      </div>
      <div className="udm-row-info">
        <span>{fmtSize(doc.file_size)}</span>
        <span>{fmtDate(doc.created_at)}</span>
        {doc.uploaded_by_name && <span>by {doc.uploaded_by_name}</span>}
      </div>
      <div className="udm-row-actions">
        <button className="udm-icon-btn" title="View"     onClick={handleView}><IconView size={14} /></button>
        <button className="udm-icon-btn" title="Download" onClick={handleDownload}><IconDownload size={14} /></button>
        <button className="udm-icon-btn" title="Edit"     onClick={() => setEditing(true)}><IconEdit size={14} /></button>
        <button className="udm-icon-btn udm-icon-btn--del" title="Delete" onClick={handleDelete} disabled={deleting}>
          {deleting ? '…' : <IconDelete size={14} />}
        </button>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function UploadDocumentModal({ isOpen, onClose, accountId, accountName }) {
  const [pending,   setPending]   = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const inputRef = useRef();


  const addFiles = useCallback(fileList => {
    const entries = Array.from(fileList).map(f => ({
      id: mkId(), file: f, doc_type: 'other', description: '', status: null, error: null,
    }));
    setPending(prev => [...prev, ...entries]);
  }, []);

  const onDrop      = e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); };
  const onDragOver  = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const removePending = id => setPending(prev => prev.filter(f => f.id !== id));
  const setType       = (id, v) => setPending(prev => prev.map(f => f.id === id ? { ...f, doc_type: v } : f));
  const setDesc       = (id, v) => setPending(prev => prev.map(f => f.id === id ? { ...f, description: v } : f));
  const setStatus     = (id, status, error = null) =>
    setPending(prev => prev.map(f => f.id === id ? { ...f, status, error } : f));

  const handleUpload = async () => {
    const queue = pending.filter(f => f.status !== 'done');
    if (!queue.length) return;
    setUploading(true);
    const token = localStorage.getItem('authToken');
    for (const entry of queue) {
      setStatus(entry.id, 'uploading');
      try {
        const form = new FormData();
        form.append('file', entry.file);
        form.append('doc_type', entry.doc_type);
        form.append('description', entry.description);
        const res  = await fetch(`http://localhost:5001/api/accounts/${accountId}/documents`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus(entry.id, 'done');
        } else {
          setStatus(entry.id, 'error', data.message || 'Upload failed');
        }
      } catch (err) {
        setStatus(entry.id, 'error', err.message);
      }
    }
    setUploading(false);
    // Clear done entries after a moment
    setTimeout(() => setPending(prev => prev.filter(f => f.status !== 'done')), 1200);
  };

  const handleClose = () => {
    if (uploading) return;
    setPending([]);
    onClose();
  };

  if (!isOpen) return null;

  const uploadable = pending.filter(f => f.status !== 'done');

  return (
    <div className="udm-overlay" onClick={handleClose}>
      <div className="udm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="udm-header">
          <div>
            <h2 className="udm-title">Documents</h2>
            <p className="udm-subtitle">{accountName}</p>
          </div>
          <button className="udm-close" onClick={handleClose} disabled={uploading} style={{ fontSize:'1.4rem', lineHeight:1 }}>×</button>
        </div>

        <div className="udm-body">
          {/* Drop zone */}
          <div
            className={`udm-dropzone${dragging ? ' udm-dropzone--over' : ''}`}
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <div className="udm-drop-icon"><IconUpload size={36} color="#1f3a2e" style={{ opacity:0.5 }} /></div>
            <p className="udm-drop-text">Drag &amp; drop files, or <span className="udm-drop-link">browse</span></p>
            <p className="udm-drop-hint">PDF · Word · Excel · JPG · PNG — max 50 MB each</p>
            <input ref={inputRef} type="file" multiple accept={ACCEPT} style={{ display:'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Pending queue */}
          {pending.length > 0 && (
            <div className="udm-section">
              <div className="udm-section-head">
                <span className="udm-section-title">Ready to Upload</span>
                <button className="udm-btn-upload" onClick={handleUpload}
                  disabled={uploading || uploadable.length === 0}
                  style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <IconUpload size={14} color="#fff" />
                  {uploading ? 'Uploading…' : `Upload ${uploadable.length} file${uploadable.length !== 1 ? 's' : ''}`}
                </button>
              </div>
              <div className="udm-list">
                {pending.map(e => (
                  <PendingRow key={e.id} entry={e}
                    onRemove={removePending} onTypeChange={setType} onDescChange={setDesc} />
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="udm-footer">
          <button className="udm-btn-cancel" onClick={handleClose} disabled={uploading}>Close</button>
        </div>
      </div>
    </div>
  );
}
