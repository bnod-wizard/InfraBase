import React, { useEffect, useRef } from 'react';
import '../styles/DocumentPreviewModal.css';

const DOC_LABELS = { cover: 'Cover Page', letterhead: 'Letterhead', proposal: 'Full Proposal' };

/* Full HTML page injected into the iframe */
function buildPage(html) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: #e8e5e0;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #111;
  }
  .page-wrap {
    padding: 32px 24px 60px;
  }
  .a4 {
    background: #fff;
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 18mm 20mm;
    box-shadow: 0 8px 32px rgba(0,0,0,.22);
    border-radius: 2px;
  }

  /* ── typography ─── */
  p  { margin: 3px 0; text-align: center; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin: 6px 0 2px; }
  h2 { font-size: 14pt; font-weight: bold; text-align: center; margin: 6px 0 2px; }
  h3 { font-size: 12pt; font-weight: bold; text-align: center; margin: 4px 0 2px; }
  strong { font-weight: bold; }
  em     { font-style: italic; }
  u      { text-decoration: underline; }

  /* ── tables (grid from cover template) ─── */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0;
  }
  td, th {
    border: 1px solid #B8CCE4;
    padding: 3px 6px;
    vertical-align: top;
  }
  td p { text-align: center; }

  /* ── images (logo) ─── */
  img {
    display: block;
    margin: 8px auto;
    max-width: 180px;
  }
</style>
</head>
<body>
  <div class="page-wrap">
    <div class="a4">${html}</div>
  </div>
</body>
</html>`;
}

export default function DocumentPreviewModal({
  isOpen, onClose, onDownload,
  html, docType, accountName, loading, error,
}) {
  const iframeRef = useRef(null);

  /* Write HTML into iframe on content change */
  useEffect(() => {
    if (!isOpen || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html ? buildPage(html) : '<html><body></body></html>');
    doc.close();
  }, [isOpen, html]);

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const label = DOC_LABELS[docType] || docType;

  return (
    <div className="dpm-overlay" onClick={onClose}>
      <div className="dpm-shell" onClick={e => e.stopPropagation()}>

        {/* ── toolbar ── */}
        <div className="dpm-toolbar">
          <div className="dpm-toolbar-left">
            <span className="dpm-doc-chip">{label}</span>
            <span className="dpm-account-name">{accountName}</span>
          </div>
          <div className="dpm-toolbar-right">
            {onDownload && (
              <button className="dpm-btn-download" onClick={onDownload} title="Download .docx">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </button>
            )}
            <button className="dpm-btn-close" onClick={onClose} title="Close (Esc)">✕</button>
          </div>
        </div>

        {/* ── content ── */}
        <div className="dpm-body">
          {loading && (
            <div className="dpm-state">
              <div className="dpm-spinner"/>
              <p>Generating preview…</p>
            </div>
          )}
          {!loading && error && (
            <div className="dpm-state dpm-error">
              <p>⚠ {error}</p>
            </div>
          )}
          {!loading && !error && html && (
            <iframe
              ref={iframeRef}
              className="dpm-frame"
              title={`${label} preview`}
              sandbox="allow-same-origin"
            />
          )}
        </div>

      </div>
    </div>
  );
}
