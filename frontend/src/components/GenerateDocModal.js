import React, { useState, useEffect } from 'react';
import accountApi from '../services/accountApi';
import '../styles/GenerateDocModal.css';

const EMPTY_VALUATION = {
  ref_no: '',
  fiscal_year: '',
  inspection_date: '',
  certification_date: '',
  bank_name: '',
  bank_branch: '',
  bank_address: '',
  certifier_name: '',
  nec_no: '',
  nec_class: 'A',
  firm_name: '',
  firm_address: '',
  firm_phone: '',
  firm_email: '',
  site_visited_by: '',
  site_visitor_phone: '',
  remarks: '',
};

function GenerateDocModal({ accountId, accountName, hierarchy, isOpen, onClose }) {
  const [valuation, setValuation]   = useState(EMPTY_VALUATION);
  const [saving, setSaving]         = useState(false);
  const [generating, setGenerating] = useState(null);
  const [saveMsg, setSaveMsg]       = useState('');

  // Pre-fill from account hierarchy and saved valuation on open
  useEffect(() => {
    if (!isOpen || !accountId) return;

    // Pre-fill firm info from account if available
    if (hierarchy?.account) {
      const acct = hierarchy.account;
      setValuation(v => ({
        ...v,
        firm_name:    v.firm_name    || acct.account_name    || '',
        firm_phone:   v.firm_phone   || acct.phone           || '',
        firm_email:   v.firm_email   || acct.email           || '',
        firm_address: v.firm_address || acct.address         || '',
      }));
    }

    // Load saved valuation metadata from DB
    accountApi.getValuation(accountId).then(res => {
      if (res.data.success && res.data.data && res.data.data.ref_no) {
        setValuation(v => ({ ...v, ...res.data.data }));
      }
    }).catch(() => {});
  }, [isOpen, accountId, hierarchy]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValuation(v => ({ ...v, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await accountApi.saveValuation(accountId, valuation);
      setSaveMsg('Saved.');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (docType) => {
    setGenerating(docType);
    try {
      await accountApi.saveValuation(accountId, valuation);
      const res = await accountApi.generateDocument(accountId, docType);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${accountName.replace(/\s+/g, '_')}_${docType}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Document generation failed. Check console for details.');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  // Build read-only prefill summary from hierarchy
  const prefillSummary = buildPrefillSummary(hierarchy);

  return (
    <div className="gdm-overlay" onClick={onClose}>
      <div className="gdm-modal" onClick={e => e.stopPropagation()}>
        <div className="gdm-header">
          <div>
            <p className="gdm-eyebrow">Documents</p>
            <h2 className="gdm-title">Generate Document</h2>
            <p className="gdm-sub">{accountName}</p>
          </div>
          <button className="gdm-close" onClick={onClose}>✕</button>
        </div>

        <div className="gdm-body">
          {/* ── Pre-filled data summary ── */}
          {prefillSummary && (
            <section className="gdm-prefill-box">
              <p className="gdm-section-label">Pre-filled from account data</p>
              <div className="gdm-prefill-grid">
                {prefillSummary.map(item => (
                  <div key={item.label} className="gdm-prefill-item">
                    <span className="gdm-prefill-label">{item.label}</span>
                    <span className="gdm-prefill-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Report metadata ── */}
          <section className="gdm-section">
            <p className="gdm-section-label">Report Info</p>
            <div className="gdm-grid-2">
              <Field label="Reference No."     name="ref_no"             value={valuation.ref_no}             onChange={handleChange} />
              <Field label="Fiscal Year"        name="fiscal_year"        value={valuation.fiscal_year}        onChange={handleChange} placeholder="e.g. 2082/83" />
              <Field label="Inspection Date"    name="inspection_date"    value={valuation.inspection_date}    onChange={handleChange} placeholder="e.g. Apr 30, 2026" />
              <Field label="Certification Date" name="certification_date" value={valuation.certification_date} onChange={handleChange} placeholder="e.g. May 05, 2026" />
            </div>
          </section>

          {/* ── Bank ── */}
          <section className="gdm-section">
            <p className="gdm-section-label">Bank / Recipient</p>
            <div className="gdm-grid-2">
              <Field label="Bank Name"   name="bank_name"   value={valuation.bank_name}   onChange={handleChange} />
              <Field label="Branch"      name="bank_branch" value={valuation.bank_branch} onChange={handleChange} />
            </div>
            <Field label="Bank Address" name="bank_address" value={valuation.bank_address} onChange={handleChange} />
          </section>

          {/* ── Certifier & Firm ── */}
          <section className="gdm-section">
            <p className="gdm-section-label">Certifier & Firm</p>
            <div className="gdm-grid-2">
              <Field label="Certifier Name" name="certifier_name" value={valuation.certifier_name} onChange={handleChange} />
              <Field label="NEC No."        name="nec_no"         value={valuation.nec_no}         onChange={handleChange} />
              <Field label="NEC Class"      name="nec_class"      value={valuation.nec_class}      onChange={handleChange} placeholder="A" />
              <Field label="Firm Name"      name="firm_name"      value={valuation.firm_name}      onChange={handleChange} />
            </div>
            <div className="gdm-grid-2">
              <Field label="Firm Address" name="firm_address" value={valuation.firm_address} onChange={handleChange} />
              <Field label="Firm Phone"   name="firm_phone"   value={valuation.firm_phone}   onChange={handleChange} />
              <Field label="Firm Email"   name="firm_email"   value={valuation.firm_email}   onChange={handleChange} />
            </div>
          </section>

          {/* ── Site visitor (for Proposal certification) ── */}
          <section className="gdm-section">
            <p className="gdm-section-label">Site Visit (for Proposal)</p>
            <div className="gdm-grid-2">
              <Field label="Site Visited By"   name="site_visited_by"    value={valuation.site_visited_by}    onChange={handleChange} />
              <Field label="Visitor Phone"     name="site_visitor_phone" value={valuation.site_visitor_phone} onChange={handleChange} />
            </div>
          </section>

          {/* ── Remarks ── */}
          <section className="gdm-section">
            <p className="gdm-section-label">Remarks</p>
            <textarea
              className="gdm-textarea"
              name="remarks"
              value={valuation.remarks || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Optional remarks…"
            />
          </section>
        </div>

        <div className="gdm-footer">
          <div className="gdm-footer-left">
            <button className="gdm-btn-secondary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Info'}
            </button>
            {saveMsg && <span className="gdm-save-msg">{saveMsg}</span>}
          </div>
          <div className="gdm-footer-right">
            <button className="gdm-btn-doc" onClick={() => handleGenerate('cover')} disabled={generating !== null}>
              {generating === 'cover' ? '⟳' : '⎙'} Cover
            </button>
            <button className="gdm-btn-doc" onClick={() => handleGenerate('letterhead')} disabled={generating !== null}>
              {generating === 'letterhead' ? '⟳' : '⎙'} Letterhead
            </button>
            <button className="gdm-btn-doc gdm-btn-primary" onClick={() => handleGenerate('proposal')} disabled={generating !== null}>
              {generating === 'proposal' ? '⟳ Generating…' : '⎙ Full Proposal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildPrefillSummary(hierarchy) {
  if (!hierarchy) return null;
  const items = [];
  const clients = hierarchy.clients || [];
  const owners  = hierarchy.owners  || [];
  const props   = hierarchy.properties || [];

  if (clients[0]) {
    const c = clients[0];
    const name = [c.title, c.first_name, c.last_name].filter(Boolean).join(' ');
    items.push({ label: 'Client', value: name || '—' });
    if (c.vdc_municipality) items.push({ label: 'Client Municipality', value: `${c.vdc_municipality}${c.district ? ', ' + c.district : ''}` });
    if (c.citizenship_no)   items.push({ label: 'Citizenship No.', value: c.citizenship_no });
  }
  owners.forEach((o, i) => {
    const name = [o.title, o.owner_name].filter(Boolean).join(' ');
    items.push({ label: `Owner ${i + 1}`, value: name || '—' });
  });
  if (props[0]) {
    const p = props[0];
    if (p.plot_no)          items.push({ label: 'Plot No.', value: p.plot_no });
    if (p.vdc_municipality) items.push({ label: 'Property Location', value: `${p.vdc_municipality}${p.district ? ', ' + p.district : ''}` });
    if (p.fair_market_value_total) items.push({ label: 'Fair Market Value', value: `NRs. ${parseFloat(p.fair_market_value_total).toLocaleString()}` });
  }
  return items.length > 0 ? items : null;
}

function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div className="gdm-field">
      <label className="gdm-label">{label}</label>
      <input
        className="gdm-input"
        type="text"
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder || ''}
      />
    </div>
  );
}

export default GenerateDocModal;
