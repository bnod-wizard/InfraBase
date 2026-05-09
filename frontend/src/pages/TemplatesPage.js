import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import templateApi from '../services/templateApi';
import NewTemplateModal from '../components/NewTemplateModal';
import { STORAGE_KEYS } from '../constants/api';
import '../styles/TemplatesPage.css';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchTemplates = useCallback(() => {
    templateApi.getAll()
      .then(res => setTemplates(res.data.data || []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleDownload = (templateId) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    fetch(templateApi.getDownloadUrl(templateId), {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Not available');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${templateId}_template.docx`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('No downloadable file for this template.'));
  };

  const handleCreate = async (name, description, icon) => {
    await templateApi.createTemplate(name, description, icon);
    setLoading(true);
    fetchTemplates();
  };

  const handleDelete = async (templateId, name) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    await templateApi.deleteTemplate(templateId);
    setTemplates(prev => prev.filter(t => t.template_id !== templateId));
  };

  const builtIn  = templates.filter(t => !t.is_custom);
  const custom   = templates.filter(t => t.is_custom);

  return (
    <>
      <div className="topbar">
        <div className="crumbs"><b>Templates</b></div>
        <button className="new-btn" style={{marginLeft:'auto'}} onClick={() => setShowModal(true)}>
          ＋ New Template
        </button>
      </div>

      <div className="page-shell">
        <div className="page-head">
          <div>
            <h1>Document Templates</h1>
            <p className="sub">
              Customize boilerplate text for generated documents · each save creates a new version
            </p>
          </div>
        </div>

        {loading ? (
          <div className="tpl-loading">Loading templates…</div>
        ) : (
          <>
            {builtIn.length > 0 && (
              <>
                <p className="tpl-group-label">Built-in Templates</p>
                <div className="tpl-grid">
                  {builtIn.map(t => (
                    <TemplateCard
                      key={t.template_id}
                      t={t}
                      onOpen={() => handleDownload(t.template_id)}
                      onBuilder={() => navigate(`/home/templates/${t.template_id}`)}
                    />
                  ))}
                </div>
              </>
            )}

            {custom.length > 0 && (
              <>
                <p className="tpl-group-label" style={{marginTop: 32}}>Custom Templates</p>
                <div className="tpl-grid">
                  {custom.map(t => (
                    <TemplateCard
                      key={t.template_id}
                      t={t}
                      onBuilder={() => navigate(`/home/templates/${t.template_id}`)}
                      onDelete={() => handleDelete(t.template_id, t.name)}
                      isCustom
                    />
                  ))}
                </div>
              </>
            )}

            {templates.length === 0 && (
              <div className="tpl-empty">No templates found.</div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <NewTemplateModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreate}
        />
      )}
    </>
  );
};

const TemplateCard = ({ t, onOpen, onBuilder, onDelete, isCustom }) => {
  const activeVersion = t.active_version || 1;
  const versions = t.versions || [];
  const activeV = versions.find(v => v.version === activeVersion);
  const sectionCount = activeV?.sections?.length ?? t.active_sections?.length ?? 0;
  const versionCount = t.version_count || versions.length;

  return (
    <div className="tpl-card">
      <div className="tpl-card-icon">{t.icon}</div>
      <div className="tpl-card-body">
        <h3>{t.name}</h3>
        <p>{t.description || 'No description'}</p>
        <div className="tpl-card-meta">
          <span>{sectionCount} section{sectionCount !== 1 ? 's' : ''}</span>
          <span className="tpl-card-dot">·</span>
          <span>{versionCount} version{versionCount !== 1 ? 's' : ''}</span>
          <span className="tpl-card-dot">·</span>
          <span className="tpl-active-badge">v{activeVersion} active</span>
        </div>
      </div>
      <div className="tpl-card-actions">
        {!isCustom && (
          <button className="btn btn-secondary btn-sm" onClick={onOpen}>
            ↓ Open
          </button>
        )}
        <button className="btn btn-primary btn-sm" onClick={onBuilder}>
          ✎ Builder
        </button>
        {isCustom && (
          <button className="btn btn-sm tpl-del-btn" onClick={onDelete} title="Delete template">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplatesPage;
