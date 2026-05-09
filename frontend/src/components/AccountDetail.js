import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import GenerateDocModal from './GenerateDocModal';
import { useToast } from '../context';
import '../styles/AccountDetail.css';

const pillClass = status => {
  const s = (status || '').toLowerCase();
  if (s === 'active')                       return 'ok';
  if (s === 'pending' || s === 'review')    return 'review';
  if (s === 'overdue' || s === 'due')       return 'due';
  if (s === 'inactive' || s === 'closed')   return 'draft';
  return 'draft';
};

function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [hierarchy,        setHierarchy]        = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [isEditing,        setIsEditing]        = useState(false);
  const [formData,         setFormData]         = useState({
    account_name: '', company_registration: '', registration_number: '',
    tax_id: '', business_type: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', zip_code: '', country: '',
    logo_url: '', status: 'active', created_by: '', created_at: '', updated_at: ''
  });
  const [activeObjectEdit, setActiveObjectEdit] = useState({ type: null, id: null, data: null });
  const [isDocModalOpen,   setIsDocModalOpen]   = useState(false);

  const accountFields = [
    { accessor: 'account_name',         label: 'Account Name' },
    { accessor: 'email',                label: 'Email' },
    { accessor: 'phone',                label: 'Phone' },
    { accessor: 'business_type',        label: 'Business Type' },
    { accessor: 'company_registration', label: 'Company Reg.' },
    { accessor: 'registration_number',  label: 'Registration No.' },
    { accessor: 'tax_id',               label: 'Tax ID' },
    { accessor: 'website',              label: 'Website' },
    { accessor: 'address',              label: 'Address', fullWidth: true },
    { accessor: 'city',                 label: 'City' },
    { accessor: 'state',                label: 'State' },
    { accessor: 'zip_code',             label: 'Zip Code' },
    { accessor: 'country',              label: 'Country' },
    { accessor: 'status',               label: 'Status', type: 'select', options: ['active', 'inactive', 'prospect'] }
  ];

  const clientFields = [
    { accessor: 'first_name',  label: 'First Name' }, { accessor: 'last_name',   label: 'Last Name' },
    { accessor: 'title',       label: 'Title' },       { accessor: 'designation', label: 'Designation' },
    { accessor: 'email',       label: 'Email' },       { accessor: 'phone',       label: 'Phone' },
    { accessor: 'mobile',      label: 'Mobile' },      { accessor: 'address',     label: 'Address' },
    { accessor: 'city',        label: 'City' },        { accessor: 'state',       label: 'State' },
    { accessor: 'zip_code',    label: 'Zip Code' },    { accessor: 'country',     label: 'Country' },
    { accessor: 'notes',       label: 'Notes' },       { accessor: 'status',      label: 'Status' }
  ];

  const propertyFields = [
    { accessor: 'property_name',   label: 'Property Name' },  { accessor: 'property_type',   label: 'Type' },
    { accessor: 'property_status', label: 'Status' },         { accessor: 'address',         label: 'Address' },
    { accessor: 'city',            label: 'City' },           { accessor: 'state',           label: 'State' },
    { accessor: 'zip_code',        label: 'Zip Code' },       { accessor: 'country',         label: 'Country' },
    { accessor: 'total_area',      label: 'Total Area' },     { accessor: 'area_unit',       label: 'Area Unit' },
    { accessor: 'land_area',       label: 'Land Area' },      { accessor: 'built_area',      label: 'Built Area' },
    { accessor: 'bedrooms',        label: 'Bedrooms' },       { accessor: 'bathrooms',       label: 'Bathrooms' },
    { accessor: 'construction_year', label: 'Built Year' },   { accessor: 'estimated_value', label: 'Estimated Value' },
    { accessor: 'notes',           label: 'Notes' }
  ];

  const ownerFields = [
    { accessor: 'owner_name',  label: 'Owner Name' },  { accessor: 'owner_type', label: 'Owner Type' },
    { accessor: 'title',       label: 'Title' },       { accessor: 'email',      label: 'Email' },
    { accessor: 'phone',       label: 'Phone' },       { accessor: 'mobile',     label: 'Mobile' },
    { accessor: 'address',     label: 'Address' },     { accessor: 'city',       label: 'City' },
    { accessor: 'state',       label: 'State' },       { accessor: 'zip_code',   label: 'Zip Code' },
    { accessor: 'country',     label: 'Country' },     { accessor: 'id_type',    label: 'ID Type' },
    { accessor: 'id_number',   label: 'ID Number' },   { accessor: 'pan_number', label: 'PAN Number' },
    { accessor: 'notes',       label: 'Notes' },       { accessor: 'status',     label: 'Status' }
  ];

  useEffect(() => { if (accountId) fetchAccountHierarchy(); }, [accountId]);

  const fetchAccountHierarchy = async () => {
    setLoading(true); setError(null);
    try {
      const res = await accountApi.getAccountHierarchy(accountId);
      if (res.data?.success) {
        setHierarchy(res.data.data);
        setFormData(res.data.data.account || {});
      } else {
        setError(res.data?.message || 'Unable to load account details.');
      }
    } catch {
      setError('Failed to load account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.account_name || !formData.email) { setError('Account name and email are required.'); return; }
    try {
      const res = await accountApi.updateAccount(accountId, formData);
      if (res.data?.success) {
        setHierarchy(prev => ({ ...prev, account: res.data.data }));
        setFormData(res.data.data);
        setIsEditing(false);
        toast('Account details saved');
      } else {
        setError(res.data?.message || 'Failed to save changes.');
      }
    } catch { setError('Failed to save account changes.'); }
  };

  const handleCancel = () => {
    setError(null);
    if (hierarchy?.account) setFormData(hierarchy.account);
    setIsEditing(false);
  };

  const startObjectEdit  = (type, item) => setActiveObjectEdit({ type, id: item._id || item.id || null, data: { ...item } });
  const cancelObjectEdit = () => setActiveObjectEdit({ type: null, id: null, data: null });
  const handleObjectEditChange = (name, value) => setActiveObjectEdit(prev => ({ ...prev, data: { ...prev.data, [name]: value } }));

  const saveObjectEdit = () => {
    if (!activeObjectEdit.type || !activeObjectEdit.id) { cancelObjectEdit(); return; }
    const typeLabel = activeObjectEdit.type.replace(/s$/, ''); // clients→client, etc.
    setHierarchy(prev => {
      if (!prev) return prev;
      const list = Array.isArray(prev[activeObjectEdit.type]) ? prev[activeObjectEdit.type] : [];
      return { ...prev, [activeObjectEdit.type]: list.map(item => (item._id || item.id) === activeObjectEdit.id ? activeObjectEdit.data : item) };
    });
    cancelObjectEdit();
    toast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} updated`);
  };

  const renderValue = value => {
    if (value === undefined || value === null || value === '') return '—';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatDate = value => {
    if (!value) return '—';
    const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(value) ? value : value + 'Z';
    const d = new Date(s);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getObjectHeader = (item, headerLabel, fallback) => {
    if (headerLabel === 'first_name') return `${item.first_name || ''} ${item.last_name || ''}`.trim() || fallback;
    return item[headerLabel] || fallback;
  };

  const renderFieldInput = field => {
    const value = formData[field.accessor] || '';
    if (field.type === 'select') return (
      <select name={field.accessor} value={value} onChange={handleInputChange}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    return <input type={field.type || 'text'} name={field.accessor} value={value} onChange={handleInputChange} />;
  };

  const renderObjectFieldInput = (field, value) => {
    if (field.type === 'select') return (
      <select name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    return <input type={field.type || 'text'} name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)} />;
  };

  const renderSection = (title, items, fields, headerLabel) => {
    const type = title.toLowerCase();
    return (
      <div>
        <div className="ad-section-head">
          <h3>{title}</h3>
        </div>
        {items && items.length > 0 ? (
          <div className="ad-obj-list">
            {items.map(item => {
              const itemId = item._id || item.id || null;
              const isEditingItem = activeObjectEdit.type === type && activeObjectEdit.id === itemId;
              const data = isEditingItem ? activeObjectEdit.data : item;
              return (
                <div key={itemId || Math.random()} className="ad-obj-card">
                  <div className="ad-obj-head">
                    <strong>{getObjectHeader(item, headerLabel, title.slice(0, -1))}</strong>
                    <div className="ad-obj-actions">
                      {isEditingItem ? (
                        <>
                          <button className="btn btn-sm" onClick={saveObjectEdit}>Save</button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelObjectEdit}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-sm btn-secondary" onClick={() => startObjectEdit(type, item)}>Edit</button>
                      )}
                    </div>
                  </div>
                  <div className="ad-grid-2">
                    {fields.map(field => (
                      <div key={`${itemId}-${field.accessor}`} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
                        <label>{field.label}</label>
                        {isEditingItem
                          ? renderObjectFieldInput(field, data[field.accessor])
                          : <span>{renderValue(data[field.accessor])}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="ad-empty">No {title.toLowerCase()} found for this account.</p>
        )}
      </div>
    );
  };

  if (loading) return (
    <>
      <div className="topbar">
        <div className="crumbs"><span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span><span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span><b>Loading…</b></div>
      </div>
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--ink-mute)' }}>Loading account details…</div>
    </>
  );

  if (error && !hierarchy) return (
    <>
      <div className="topbar">
        <div className="crumbs"><span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span><span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span><b>Error</b></div>
        <button className="btn btn-secondary btn-sm" style={{marginLeft:'auto'}} onClick={() => navigate('/home/accounts')}>← Back</button>
      </div>
      <div className="ad-error" style={{marginTop:'24px'}}>⚠ {error}</div>
    </>
  );

  return (
    <div className="page-shell">

      {/* ── Topbar — matches AccountsPage ── */}
      <div className="topbar">
        <div className="crumbs">
          <span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>Customer Accounts</span>
          <span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span>
          <b>{formData.account_name || 'Account Details'}</b>
          {formData.status && (
            <>
              <span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span>
              <span className={`pill ${pillClass(formData.status)}`}>{formData.status}</span>
            </>
          )}
        </div>
        <div className="right">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/home/accounts')}>← Back</button>
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button className="btn" onClick={handleSave}>Save Changes</button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>✏ Edit</button>
          )}
          <button className="btn" onClick={() => setIsDocModalOpen(true)}>⎙ Generate Document</button>
        </div>
      </div> 

      {/* ── Main layout ── */}
      <div className="layout">
        <div className="stack">

          {/* Account Info */}
          <div className="panel ad-panel">
            <div className="ad-section-head">
              <h3>Account Information</h3>
              <div className="ad-obj-actions">
                {isEditing ? (
                  <>
                    <button className="btn btn-sm" onClick={handleSave}>Save</button>
                    <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-secondary" onClick={() => setIsEditing(true)}>✏ Edit</button>
                )}
              </div>
            </div>
            <div className="ad-grid-2">
              {accountFields.map(field => (
                <div key={field.accessor} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
                  <label>{field.label}</label>
                  {isEditing
                    ? renderFieldInput(field)
                    : <span>{renderValue(formData[field.accessor])}</span>}
                </div>
              ))}
            </div>
            <div className="ad-meta">
              {[
                { label: 'Created By', val: renderValue(formData.created_by) },
                { label: 'Created At', val: formatDate(formData.created_at) },
                { label: 'Updated At', val: formatDate(formData.updated_at) },
              ].map(m => (
                <div key={m.label} className="ad-meta-item">
                  <span>{m.label}</span>
                  <strong>{m.val}</strong>
                </div>
              ))}
            </div>
            {error && <div className="ad-error">⚠ {error}</div>}
          </div>

          {/* Clients */}
          <div className="panel ad-panel">
            {renderSection('Clients', hierarchy.clients, clientFields, 'first_name')}
          </div>

          {/* Properties */}
          <div className="panel ad-panel">
            {renderSection('Properties', hierarchy.properties, propertyFields, 'property_name')}
          </div>

          {/* Owners */}
          <div className="panel ad-panel">
            {renderSection('Owners', hierarchy.owners, ownerFields, 'owner_name')}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="stack">
          <div className="panel">
            <div className="panel-head"><h3>Account Summary</h3></div>
            <div className="activity">
              {[
                { cls: '',     label: formData.account_name || '—', note: 'Account name' },
                { cls: 'ok',   label: `${hierarchy.clients?.length ?? 0} Clients`,     note: 'On this account' },
                { cls: 'info', label: `${hierarchy.properties?.length ?? 0} Properties`, note: 'Linked' },
                { cls: '',     label: `${hierarchy.owners?.length ?? 0} Owners`,        note: 'Registered' },
              ].map(row => (
                <div key={row.note} className={`act${row.cls ? ' ' + row.cls : ''}`}>
                  <div className="swatch" />
                  <div className="body"><b>{row.label}</b><small>{row.note}</small></div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Quick Info</h3></div>
            <div className="ad-info-rows">
              {[
                { label: 'Status',  val: formData.status || '—' },
                { label: 'Tax ID',  val: renderValue(formData.tax_id) },
                { label: 'City',    val: renderValue(formData.city) },
                { label: 'Country', val: renderValue(formData.country) },
                { label: 'Created', val: formatDate(formData.created_at) },
                { label: 'Updated', val: formatDate(formData.updated_at) },
              ].map(row => (
                <div key={row.label} className="ad-info-row">
                  <span>{row.label}</span>
                  <strong>{row.val}</strong>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <GenerateDocModal
        accountId={accountId}
        accountName={formData.account_name || 'Account'}
        hierarchy={hierarchy}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
}

export default AccountDetail;
