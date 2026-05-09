import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import templateApi from '../services/templateApi';
import '../styles/TemplateBuilder.css';

const MERGE_FIELDS = [
  { group: 'Firm',      fields: ['firm_name', 'firm_address', 'firm_phone', 'firm_email'] },
  { group: 'Report',    fields: ['ref_no', 'fiscal_year', 'inspection_date', 'certification_date'] },
  { group: 'Bank',      fields: ['bank_name', 'bank_branch', 'bank_address'] },
  { group: 'Client',    fields: ['client_name', 'client_address_full', 'client_district_country'] },
  { group: 'Owner',     fields: ['owners_plain', 'owners_block'] },
  { group: 'Property',  fields: ['property_location_full', 'kitta_no', 'sheet_no', 'land_type'] },
  { group: 'Valuation', fields: ['land_total_value', 'building_total_value', 'grand_total_value', 'land_rate_sqft'] },
  { group: 'Certifier', fields: ['certifier_name', 'nec_no', 'nec_class'] },
];

// ── Add Section modal (inline) ────────────────────────────────────────────────
const AddSectionModal = ({ onAdd, onClose }) => {
  const [label, setLabel] = useState('');
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);

  const handleSubmit = e => {
    e.preventDefault();
    if (!label.trim()) return;
    const id = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Date.now();
    onAdd({ id, label: label.trim(), content: '' });
    onClose();
  };

  return (
    <div className="tb-modal-overlay" onClick={onClose}>
      <div className="tb-modal" onClick={e => e.stopPropagation()}>
        <h4>Add Section</h4>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="tb-modal-input"
            placeholder="Section label, e.g. Introduction"
            value={label}
            onChange={e => setLabel(e.target.value)}
          />
          <div className="tb-modal-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!label.trim()}>Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main builder ──────────────────────────────────────────────────────────────
const TemplateBuilder = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate]       = useState(null);
  const [viewVersion, setViewVersion] = useState(null); // version number being viewed
  const [sections, setSections]       = useState([]);   // working copy
  const [dirty, setDirty]             = useState(false);
  const [activeIdx, setActiveIdx]     = useState(0);
  const [saving, setSaving]           = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [savedMsg, setSavedMsg]       = useState('');
  const [loading, setLoading]         = useState(true);
  const [showVersionDrop, setShowVersionDrop] = useState(false);
  const [showAddSection, setShowAddSection]   = useState(false);
  const textareaRef = useRef(null);
  const versionDropRef = useRef(null);

  // Close version dropdown on outside click
  useEffect(() => {
    const h = e => {
      if (versionDropRef.current && !versionDropRef.current.contains(e.target))
        setShowVersionDrop(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadTemplate = useCallback(() => {
    return templateApi.getById(templateId)
      .then(res => {
        const t = res.data.data;
        setTemplate(t);
        return t;
      })
      .catch(() => navigate('/home/templates'));
  }, [templateId, navigate]);

  const loadVersion = useCallback((t, vNum) => {
    const versions = t.versions || [];
    const active = t.active_version;
    const num = vNum ?? active;
    const v = versions.find(x => x.version === num) || versions[versions.length - 1];
    if (!v) return;
    setViewVersion(v.version);
    setSections(v.sections.map(s => ({ ...s })));
    setActiveIdx(0);
    setDirty(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadTemplate()
      .then(t => { if (t) loadVersion(t, null); })
      .finally(() => setLoading(false));
  }, [loadTemplate, loadVersion]);

  const switchVersion = (vNum) => {
    if (dirty && !window.confirm('You have unsaved changes. Switch version and discard them?')) return;
    loadVersion(template, vNum);
    setShowVersionDrop(false);
  };

  // ── Editing ─────────────────────────────────────────────────────────────────
  const updateContent = (content) => {
    setSections(prev => prev.map((s, i) => i === activeIdx ? { ...s, content } : s));
    setDirty(true);
  };

  const insertMergeField = (field) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const token = `{{${field}}}`;
    const current = sections[activeIdx]?.content || '';
    const next = current.slice(0, start) + token + current.slice(end);
    updateContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const addSection = (section) => {
    setSections(prev => [...prev, section]);
    setActiveIdx(sections.length);
    setDirty(true);
  };

  const deleteSection = (idx) => {
    if (sections.length === 1) return; // keep at least 1
    const next = sections.filter((_, i) => i !== idx);
    setSections(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
    setDirty(true);
  };

  // ── Save new version ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await templateApi.saveVersion(templateId, sections);
      const t = await loadTemplate();
      if (t) loadVersion(t, null); // jump to newly created (now active) version
      flash('✓ New version saved and set as active');
    } catch {
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Set active version ───────────────────────────────────────────────────
  const handleSetActive = async () => {
    if (!viewVersion || viewVersion === template?.active_version) return;
    setSettingActive(true);
    try {
      await templateApi.setActive(templateId, viewVersion);
      const t = await loadTemplate();
      if (t) { setTemplate(t); }
      flash(`✓ v${viewVersion} is now active`);
    } catch {
      alert('Failed to set active version.');
    } finally {
      setSettingActive(false);
    }
  };

  const flash = (msg) => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3000);
  };

  if (loading) return <div className="tb-loading">Loading…</div>;
  if (!template) return null;

  const versions = template.versions || [];
  const activeVersion = template.active_version;
  const viewingActive = viewVersion === activeVersion;
  const currentV = versions.find(v => v.version === viewVersion);
  const activeSection = sections[activeIdx];

  const versionLabel = (v) => {
    let label = `v${v.version}`;
    if (v.label && v.label !== 'Default') label += ` — ${v.label}`;
    else if (v.version === 1) label += ' — Default';
    return label;
  };

  return (
    <div className="tb-shell">
      {showAddSection && (
        <AddSectionModal onAdd={addSection} onClose={() => setShowAddSection(false)} />
      )}

      {/* ── Top bar ── */}
      <div className="tb-topbar">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/home/templates')}>
          ← Templates
        </button>
        <div className="tb-title">
          <span className="tb-icon">{template.icon}</span>
          <span>{template.name}</span>
        </div>

        {savedMsg && <span className="tb-flash">{savedMsg}</span>}

        {/* Version picker */}
        <div className="tb-version-wrap" ref={versionDropRef}>
          <button
            className="tb-version-btn"
            onClick={() => setShowVersionDrop(o => !o)}
          >
            {currentV ? versionLabel(currentV) : `v${viewVersion}`}
            {viewingActive && <span className="tb-v-active-dot" title="Active" />}
            <span className="tb-v-caret">▾</span>
          </button>
          {showVersionDrop && (
            <div className="tb-version-drop">
              {[...versions].reverse().map(v => (
                <button
                  key={v.version}
                  className={`tb-version-opt ${v.version === viewVersion ? 'selected' : ''}`}
                  onClick={() => switchVersion(v.version)}
                >
                  <span>{versionLabel(v)}</span>
                  {v.version === activeVersion && <span className="tb-v-badge">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {!viewingActive && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSetActive}
            disabled={settingActive}
          >
            {settingActive ? 'Setting…' : `Set v${viewVersion} Active`}
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save as New Version'}
        </button>
      </div>

      <div className="tb-body">
        {/* ── Section list ── */}
        <aside className="tb-sections">
          <p className="tb-section-label">Sections</p>
          {sections.map((s, i) => (
            <div
              key={s.id || i}
              className={`tb-section-item ${i === activeIdx ? 'active' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              <span className="tb-section-name">{s.label}</span>
              <div className="tb-section-right">
                <span className="tb-section-chars">{s.content?.length || 0}</span>
                {sections.length > 1 && (
                  <button
                    className="tb-section-del"
                    title="Remove section"
                    onClick={e => { e.stopPropagation(); deleteSection(i); }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="tb-add-section" onClick={() => setShowAddSection(true)}>
            + Add Section
          </button>
        </aside>

        {/* ── Editor ── */}
        <div className="tb-editor">
          {activeSection ? (
            <>
              <div className="tb-editor-head">
                <h3>{activeSection.label}</h3>
                <p className="tb-editor-hint">
                  Use <code>{'{{field_name}}'}</code> to insert dynamic values from the account record.
                  {dirty && <span className="tb-dirty"> · Unsaved changes</span>}
                </p>
              </div>
              <textarea
                ref={textareaRef}
                key={`${viewVersion}-${activeIdx}`}
                className="tb-textarea"
                value={activeSection.content}
                onChange={e => updateContent(e.target.value)}
                spellCheck={false}
                placeholder="Enter section content…"
              />
            </>
          ) : (
            <div className="tb-empty">Select a section to edit</div>
          )}
        </div>

        {/* ── Merge field palette ── */}
        <aside className="tb-palette">
          <p className="tb-section-label">Merge Fields</p>
          <p className="tb-palette-hint">Click to insert at cursor</p>
          {MERGE_FIELDS.map(({ group, fields }) => (
            <div key={group} className="tb-field-group">
              <p className="tb-field-group-label">{group}</p>
              {fields.map(f => (
                <button
                  key={f}
                  className="tb-field-chip"
                  onClick={() => insertMergeField(f)}
                  title={`Insert {{${f}}}`}
                >
                  {`{{${f}}}`}
                </button>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
};

export default TemplateBuilder;
