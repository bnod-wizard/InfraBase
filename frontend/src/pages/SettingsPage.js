import React, { useState, useEffect, useCallback } from 'react';
import accountApi from '../services/accountApi';
import { useToast } from '../context';
import '../styles/SettingsPage.css';

const CERTIFIER_EMPTY = { name: '', phone: '', nec_no: '', nec_class: 'A', nec_type: 'Civil', firm_name: '', firm_address: '', firm_phone: '', firm_email: '' };
const BANK_EMPTY      = { name: '', branch: '', address: '' };
const VISITOR_EMPTY   = { name: '', phone: '' };

const DEFAULTS = { certifier: CERTIFIER_EMPTY, bank: BANK_EMPTY, visitor: VISITOR_EMPTY };

function SettingsPage() {
  const toast = useToast();
  const [data, setData] = useState({ certifier: [], bank: [], visitor: [] });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state: { type, isOpen, isEditing, form, editId }
  const [modal, setModal] = useState({ type: null, isOpen: false, isEditing: false, form: {}, editId: null });

  const load = useCallback((type) => {
    accountApi.getSettings(type).then(res => {
      if (res.data?.success) setData(prev => ({ ...prev, [type]: res.data.data || [] }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    load('certifier');
    load('bank');
    load('visitor');
  }, [load]);

  const openAddModal = (type) => {
    setModal({ type, isOpen: true, isEditing: false, form: { ...DEFAULTS[type] }, editId: null });
  };

  const openEditModal = (type, item) => {
    setModal({ type, isOpen: true, isEditing: true, form: { ...item }, editId: item._id });
  };

  const closeModal = () => {
    setModal({ type: null, isOpen: false, isEditing: false, form: {}, editId: null });
  };

  const handleFormChange = (updates) => {
    setModal(prev => ({ ...prev, form: { ...prev.form, ...updates } }));
  };

  const handleSave = async () => {
    if (!modal.type) return;
    setSaving(true);
    try {
      if (modal.isEditing && modal.editId) {
        const res = await accountApi.updateSetting(modal.editId, modal.form);
        if (res.data?.success) {
          setData(prev => ({
            ...prev,
            [modal.type]: prev[modal.type].map(e => e._id === modal.editId ? res.data.data : e)
          }));
          toast('Updated');
        }
      } else {
        const res = await accountApi.createSetting(modal.type, modal.form);
        if (res.data?.success) {
          setData(prev => ({ ...prev, [modal.type]: [...prev[modal.type], res.data.data] }));
          toast('Added successfully');
        }
      }
      closeModal();
    } catch { 
      toast('Failed to save'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await accountApi.deleteSetting(id);
      setData(prev => ({ ...prev, [type]: prev[type].filter(e => e._id !== id) }));
      toast('Deleted');
    } catch { toast('Failed to delete'); }
  };

  const modalTitle = modal.type === 'certifier' ? 'Certifier'
    : modal.type === 'bank' ? 'Bank'
    : 'Site Visitor';

  // Filter items across all types based on search term
  const searchLower = searchTerm.toLowerCase();
  const filterItems = (items, columns) => {
    if (!searchTerm) return items;
    return items.filter(item =>
      columns.some(col => String(item[col.key] || '').toLowerCase().includes(searchLower))
    );
  };

  const filteredCertifiers = filterItems(data.certifier, CERT_COLS);
  const filteredBanks = filterItems(data.bank, BANK_COLS);
  const filteredVisitors = filterItems(data.visitor, VISITOR_COLS);

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="crumbs"><b>Settings</b></div>
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="Search certifiers, banks, visitors…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              style={{background:'none',border:'none',color:'var(--ink-mute)',cursor:'pointer',padding:'0 2px',fontSize:'14px'}}
              onClick={() => setSearchTerm('')}
            >×</button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}

      {/* ── Content Grid ── */}
      <div className="layout">
        <div className="stack">
          {/* ── Certifiers Card ── */}
          <CardSection
            title="Certifiers"
            type="certifier"
            items={filteredCertifiers}
            columns={CERT_COLS}
            onAdd={() => openAddModal('certifier')}
            onEdit={item => openEditModal('certifier', item)}
            onDelete={id => handleDelete('certifier', id)}
          />

          {/* ── Banks Card ── */}
          <CardSection
            title="Banks"
            type="bank"
            items={filteredBanks}
            columns={BANK_COLS}
            onAdd={() => openAddModal('bank')}
            onEdit={item => openEditModal('bank', item)}
            onDelete={id => handleDelete('bank', id)}
          />

          {/* ── Site Visitors Card ── */}
          <CardSection
            title="Site Visitors"
            type="visitor"
            items={filteredVisitors}
            columns={VISITOR_COLS}
            onAdd={() => openAddModal('visitor')}
            onEdit={item => openEditModal('visitor', item)}
            onDelete={id => handleDelete('visitor', id)}
          />
        </div>
      </div>

      {/* ── Modal ── */}
      {modal.isOpen && (
        <FormModal
          title={`${modal.isEditing ? 'Edit' : 'Add'} ${modalTitle}`}
          type={modal.type}
          form={modal.form}
          saving={saving}
          onFormChange={handleFormChange}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </>
  );
}

function CardSection({ title, type, items, columns, onAdd, onEdit, onDelete }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>{title}</h3>
        <button className="btn btn-primary btn-sm" onClick={onAdd} style={{marginLeft:'auto'}}>＋ Add</button>
      </div>

      {items.length === 0 ? (
        <div style={{padding:'20px 18px', textAlign:'center', color:'var(--ink-mute)', fontSize:'13px'}}>No {title.toLowerCase()} added yet.</div>
      ) : (
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13.5px', margin:0}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(203,213,225,.8)', background:'#f7f9fb'}}>
              {columns.map(c => (
                <th key={c.key} style={{textAlign:'left', fontWeight:700, color:'var(--ink-mute)', fontFamily:'var(--mono)', fontSize:'10.5px', letterSpacing:'.14em', textTransform:'uppercase', padding:'18px 18px 10px'}}>
                  {c.label}
                </th>
              ))}
              <th style={{width:'1%'}}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item._id} style={{borderBottom:'1px solid rgba(226,232,240,.8)'}}>
                {columns.map(c => (
                  <td key={c.key} style={{padding:'18px 18px', verticalAlign:'middle', background:idx % 2 === 0 ? '#fff' : '#fff'}}>
                    {item[c.key] || '—'}
                  </td>
                ))}
                <td style={{textAlign:'right', whiteSpace:'nowrap', width:'1%', padding:'18px 18px'}}>
                  <button className="icon-btn" onClick={() => onEdit(item)} title="Edit" style={{marginRight:'6px'}}>✎</button>
                  <button className="icon-btn" onClick={() => onDelete(item._id)} title="Delete" style={{color:'var(--danger)'}}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function FormModal({ title, type, form, saving, onFormChange, onSave, onClose }) {
  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={e => e.stopPropagation()}>
        <div className="panel-head" style={{borderBottom:'1px solid var(--line)'}}>
          <h3 style={{margin:0}}>{title}</h3>
          <button className="icon-btn" onClick={onClose} style={{marginLeft:'auto', background:'transparent', border:'none'}}>✕</button>
        </div>

        <div style={{padding:'20px 24px', flex:1, overflowY:'auto'}}>
          {type === 'certifier' && <CertifierForm data={form} onChange={onFormChange} />}
          {type === 'bank' && <BankForm data={form} onChange={onFormChange} />}
          {type === 'visitor' && <VisitorForm data={form} onChange={onFormChange} />}
        </div>

        <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', padding:'16px 24px', borderTop:'1px solid var(--line)', background:'var(--bg)'}}>
          <button className="btn btn-cancel btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, detail }) {
  return (
    <div className="kpi">
      <span className="icon-tl">{icon}</span>
      <p className="lab">{label}</p>
      <div className="val">{value}</div>
      <p className="delta">{detail}</p>
    </div>
  );
}

function SInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
      <label style={{fontSize:'11px', fontWeight:600, color:'var(--ink-mute)', fontFamily:'var(--mono)', textTransform:'uppercase', letterSpacing:'.06em'}}>
        {label}
      </label>
      <input 
        style={{padding:'8px 12px', border:'1.5px solid var(--line)', borderRadius:'8px', fontSize:'13px', color:'var(--ink)', background:'var(--surface)', fontFamily:'var(--sans)', outline:'none'}} 
        value={value || ''} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder || ''} 
        onFocus={(e) => e.target.style.borderColor = 'var(--brand)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
      />
    </div>
  );
}

function CertifierForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ [k]: v });
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px'}}>
      <SInput label="Name"         value={data.name}         onChange={s('name')} />
      <SInput label="Phone"        value={data.phone}        onChange={s('phone')} />
      <SInput label="NEC No."      value={data.nec_no}       onChange={s('nec_no')} />
      <SInput label="NEC Class"    value={data.nec_class}    onChange={s('nec_class')}   placeholder="A" />
      <SInput label="NEC Type"     value={data.nec_type}     onChange={s('nec_type')}    placeholder="Civil" />
      <SInput label="Firm Name"    value={data.firm_name}    onChange={s('firm_name')} />
      <SInput label="Firm Address" value={data.firm_address} onChange={s('firm_address')} />
      <SInput label="Firm Phone"   value={data.firm_phone}   onChange={s('firm_phone')} />
      <SInput label="Firm Email"   value={data.firm_email}   onChange={s('firm_email')} />
    </div>
  );
}

function BankForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ [k]: v });
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'12px'}}>
      <SInput label="Bank Name" value={data.name}    onChange={s('name')} />
      <SInput label="Branch"    value={data.branch}  onChange={s('branch')} />
      <SInput label="Address"   value={data.address} onChange={s('address')} />
    </div>
  );
}

function VisitorForm({ data, onChange }) {
  const s = (k) => (v) => onChange({ [k]: v });
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'12px'}}>
      <SInput label="Name"  value={data.name}  onChange={s('name')} />
      <SInput label="Phone" value={data.phone} onChange={s('phone')} />
    </div>
  );
}

const CERT_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'nec_no', label: 'NEC No.' },
  { key: 'nec_class', label: 'Class' },
  { key: 'nec_type', label: 'Type' },
  { key: 'firm_name', label: 'Firm' },
];
const BANK_COLS = [
  { key: 'name', label: 'Bank Name' },
  { key: 'branch', label: 'Branch' },
  { key: 'address', label: 'Address' },
];
const VISITOR_COLS = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
];

export default SettingsPage;

