import React, { useState, useEffect } from 'react';
import accountApi from '../services/accountApi';
import { useToast } from '../context';
import DocumentPreviewModal from './DocumentPreviewModal';
import '../styles/GenerateDocModal.css';

const EMPTY_VALUATION = {
  ref_no: '', fiscal_year: '', inspection_date: '', certification_date: '',
  bank_id: '', bank_name: '', bank_branch: '', bank_address: '',
  certifier_id: '', certifier_name: '', certifier_phone: '', nec_no: '', nec_class: 'A', nec_type: 'Civil',
  firm_name: '', firm_address: '', firm_phone: '', firm_email: '',
  visitor_id: '', site_visited_by: '', site_visitor_phone: '', remarks: '',
};

function GenerateDocModal({ accountId, accountName, hierarchy, isOpen, onClose }) {
  const toast = useToast();
  const [valuation, setValuation]   = useState(EMPTY_VALUATION);
  const [saving,      setSaving]      = useState(false);
  const [generating,  setGenerating]  = useState(null);
  const [preview,     setPreview]     = useState({ open: false, html: null, docType: null, loading: false, error: null });

  // Settings lists
  const [certifiers, setCertifiers] = useState([]);
  const [banks,      setBanks]      = useState([]);
  const [visitors,   setVisitors]   = useState([]);
  // Selected setting IDs (for dropdowns)
  const [selCertifier, setSelCertifier] = useState('');
  const [selBank,      setSelBank]      = useState('');
  const [selVisitor,   setSelVisitor]   = useState('');

  useEffect(() => {
    if (!isOpen || !accountId) return;

    // Load settings lists
    accountApi.getSettings('certifier').then(r => { if (r.data?.success) setCertifiers(r.data.data || []); }).catch(() => {});
    accountApi.getSettings('bank').then(r => { if (r.data?.success) setBanks(r.data.data || []); }).catch(() => {});
    accountApi.getSettings('visitor').then(r => { if (r.data?.success) setVisitors(r.data.data || []); }).catch(() => {});

    if (hierarchy?.account) {
      const acct = hierarchy.account;
      setValuation(v => ({
        ...v,
        firm_name:    v.firm_name    || acct.account_name || '',
        firm_phone:   v.firm_phone   || acct.phone        || '',
        firm_email:   v.firm_email   || acct.email        || '',
        firm_address: v.firm_address || acct.address      || '',
      }));
    }

    accountApi.getValuation(accountId).then(res => {
      if (res.data.success && res.data.data) {
        setValuation(v => ({ ...v, ...res.data.data }));
        setSelBank(res.data.data.bank_id || '');
        setSelCertifier(res.data.data.certifier_id || '');
        setSelVisitor(res.data.data.visitor_id || '');
      }
    }).catch(() => {});
  }, [isOpen, accountId, hierarchy]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { [name]: value };

    if (['bank_name', 'bank_branch', 'bank_address'].includes(name)) {
      updates.bank_id = '';
      setSelBank('');
    }
    if (['certifier_name', 'certifier_phone', 'nec_no', 'nec_class', 'nec_type', 'firm_name', 'firm_address', 'firm_phone', 'firm_email'].includes(name)) {
      updates.certifier_id = '';
      setSelCertifier('');
    }
    if (['site_visited_by', 'site_visitor_phone'].includes(name)) {
      updates.visitor_id = '';
      setSelVisitor('');
    }

    setValuation(v => ({ ...v, ...updates }));
  };

  const handleSelectCertifier = (id) => {
    setSelCertifier(id);
    if (!id) {
      setValuation(v => ({ ...v, certifier_id: '' }));
      return;
    }
    const c = certifiers.find(x => x._id === id);
    if (c) setValuation(v => ({
      ...v,
      certifier_id: id,
      certifier_name: c.name || '', certifier_phone: c.phone || '',
      nec_no: c.nec_no || '', nec_class: c.nec_class || 'A', nec_type: c.nec_type || 'Civil',
      firm_name: c.firm_name || v.firm_name, firm_address: c.firm_address || v.firm_address,
      firm_phone: c.firm_phone || v.firm_phone, firm_email: c.firm_email || v.firm_email,
    }));
  };

  const handleSelectBank = (id) => {
    setSelBank(id);
    if (!id) {
      setValuation(v => ({ ...v, bank_id: '' }));
      return;
    }
    const b = banks.find(x => x._id === id);
    if (b) setValuation(v => ({
      ...v,
      bank_id: id,
      bank_name: b.name || '', bank_branch: b.branch || '', bank_address: b.address || '',
    }));
  };

  const handleSelectVisitor = (id) => {
    setSelVisitor(id);
    if (!id) {
      setValuation(v => ({ ...v, visitor_id: '' }));
      return;
    }
    const vis = visitors.find(x => x._id === id);
    if (vis) setValuation(v => ({
      ...v,
      visitor_id: id,
      site_visited_by: vis.name || '', site_visitor_phone: vis.phone || '',
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await accountApi.saveValuation(accountId, valuation);
      toast('Valuation info saved');
    } catch {} finally { setSaving(false); }
  };

  const handlePreview = async (docType) => {
    setPreview({ open: true, html: null, docType, loading: true, error: null });
    try {
      await accountApi.saveValuation(accountId, valuation);
      const res = await accountApi.previewDocument(accountId, docType);
      if (res.data.success) setPreview(p => ({ ...p, html: res.data.html, loading: false }));
      else setPreview(p => ({ ...p, loading: false, error: res.data.message || 'Preview failed' }));
    } catch { setPreview(p => ({ ...p, loading: false, error: 'Preview generation failed' })); }
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
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast(`${docType.charAt(0).toUpperCase() + docType.slice(1)} document generated`);
    } catch (err) {
      alert('Document generation failed.'); console.error(err);
    } finally { setGenerating(null); }
  };

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
          <button className="gdm-close" onClick={onClose}>&#10005;</button>
        </div>

        <div className="gdm-body">
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

          {/* Report Info */}
          <section className="gdm-section">
            <p className="gdm-section-label">Report Info</p>
            <div className="gdm-grid-2">
              <Field label="Reference No."     name="ref_no"             value={valuation.ref_no}             onChange={handleChange} />
              <Field label="Fiscal Year"        name="fiscal_year"        value={valuation.fiscal_year}        onChange={handleChange} placeholder="e.g. 2082/83" />
              <Field label="Inspection Date"    name="inspection_date"    value={valuation.inspection_date}    onChange={handleChange} placeholder="e.g. Apr 30, 2026" />
              <Field label="Certification Date" name="certification_date" value={valuation.certification_date} onChange={handleChange} placeholder="e.g. May 05, 2026" />
            </div>
          </section>

          {/* Bank */}
          <section className="gdm-section">
            <p className="gdm-section-label">Bank / Recipient</p>
            {banks.length > 0 && (
              <div className="gdm-field">
                <label className="gdm-label">Select saved bank</label>
                <select className="gdm-select" value={selBank} onChange={e => handleSelectBank(e.target.value)}>
                  <option value="">— type manually —</option>
                  {banks.map(b => <option key={b._id} value={b._id}>{b.name}{b.branch ? ` · ${b.branch}` : ''}</option>)}
                </select>
              </div>
            )}
            <div className="gdm-grid-2">
              <Field label="Bank Name"   name="bank_name"   value={valuation.bank_name}   onChange={handleChange} />
              <Field label="Branch"      name="bank_branch" value={valuation.bank_branch} onChange={handleChange} />
            </div>
            <Field label="Bank Address" name="bank_address" value={valuation.bank_address} onChange={handleChange} />
          </section>

          {/* Certifier & Firm */}
          <section className="gdm-section">
            <p className="gdm-section-label">Certifier &amp; Firm</p>
            {certifiers.length > 0 && (
              <div className="gdm-field">
                <label className="gdm-label">Select saved certifier</label>
                <select className="gdm-select" value={selCertifier} onChange={e => handleSelectCertifier(e.target.value)}>
                  <option value="">— type manually —</option>
                  {certifiers.map(c => <option key={c._id} value={c._id}>{c.name}{c.nec_no ? ` (${c.nec_no})` : ''}</option>)}
                </select>
              </div>
            )}
            <div className="gdm-grid-2">
              <Field label="Certifier Name"  name="certifier_name"  value={valuation.certifier_name}  onChange={handleChange} />
              <Field label="Certifier Phone" name="certifier_phone" value={valuation.certifier_phone} onChange={handleChange} />
              <Field label="NEC No."         name="nec_no"          value={valuation.nec_no}          onChange={handleChange} />
              <Field label="NEC Class"      name="nec_class"      value={valuation.nec_class}      onChange={handleChange} placeholder="A" />
              <Field label="NEC Type"       name="nec_type"       value={valuation.nec_type}       onChange={handleChange} placeholder="Civil" />
              <Field label="Firm Name"      name="firm_name"      value={valuation.firm_name}      onChange={handleChange} />
            </div>
            <div className="gdm-grid-2">
              <Field label="Firm Address" name="firm_address" value={valuation.firm_address} onChange={handleChange} />
              <Field label="Firm Phone"   name="firm_phone"   value={valuation.firm_phone}   onChange={handleChange} />
              <Field label="Firm Email"   name="firm_email"   value={valuation.firm_email}   onChange={handleChange} />
            </div>
          </section>

          {/* Site Visit */}
          <section className="gdm-section">
            <p className="gdm-section-label">Site Visit (for Proposal)</p>
            {visitors.length > 0 && (
              <div className="gdm-field">
                <label className="gdm-label">Select saved visitor</label>
                <select className="gdm-select" value={selVisitor} onChange={e => handleSelectVisitor(e.target.value)}>
                  <option value="">— type manually —</option>
                  {visitors.map(v => <option key={v._id} value={v._id}>{v.name}{v.phone ? ` · ${v.phone}` : ''}</option>)}
                </select>
              </div>
            )}
            <div className="gdm-grid-2">
              <Field label="Site Visited By"   name="site_visited_by"    value={valuation.site_visited_by}    onChange={handleChange} />
              <Field label="Visitor Phone"     name="site_visitor_phone" value={valuation.site_visitor_phone} onChange={handleChange} />
            </div>
          </section>

          {/* Notes */}
          <section className="gdm-section">
            <p className="gdm-section-label">Notes</p>
            <textarea
              className="gdm-textarea"
              name="remarks"
              value={valuation.remarks || ''}
              onChange={handleChange}
              rows={3}
              placeholder="Optional notes..."
            />
          </section>
        </div>

        <div className="gdm-footer">
          <div className="gdm-footer-left">
            <button className="gdm-btn-secondary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Info'}
            </button>
          </div>
          <div className="gdm-footer-right">
            <div className="gdm-btn-group">
              <button className="gdm-btn-doc" onClick={() => handlePreview('proposal')} disabled={generating !== null} title="Preview Full Proposal">&#128065;</button>
              <button className="gdm-btn-doc gdm-btn-primary" onClick={() => handleGenerate('proposal')} disabled={generating !== null} title="Download Full Proposal">
                {generating === 'proposal' ? '&#8635; Generating...' : '⎔ Full Proposal'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={preview.open}
        onClose={() => setPreview(p => ({ ...p, open: false }))}
        onDownload={preview.docType ? () => handleGenerate(preview.docType) : null}
        html={preview.html}
        docType={preview.docType}
        accountName={accountName}
        loading={preview.loading}
        error={preview.error}
      />
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
      <input className="gdm-input" type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder || ''} />
    </div>
  );
}

export default GenerateDocModal;
