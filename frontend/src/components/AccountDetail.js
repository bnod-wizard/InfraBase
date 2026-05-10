import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import GenerateDocModal from './GenerateDocModal';
import PropertyMapModal from './PropertyMapModal';
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
  const [mapProperty,      setMapProperty]      = useState(null);

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
    { title: 'Identity', fields: [
      { accessor: 'entity_type', label: 'Entity Type', type: 'select', options: ['individual', 'company'] },
      { accessor: 'gender',      label: 'Gender',      type: 'select', options: ['male', 'female'] },
      { accessor: 'title',       label: 'Title' },
      { accessor: 'first_name',  label: 'First Name' },
      { accessor: 'last_name',   label: 'Last Name' },
      { accessor: 'designation', label: 'Designation' },
      { accessor: 'status',      label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ]},
    { title: 'Contact', fields: [
      { accessor: 'email',  label: 'Email' },
      { accessor: 'phone',  label: 'Contact No.' },
      { accessor: 'mobile', label: 'Mobile' },
    ]},
    { title: 'Address', fields: [
      { accessor: 'address',          label: 'Address', fullWidth: true },
      { accessor: 'ward_no',          label: 'Ward No.' },
      { accessor: 'vdc_municipality', label: 'Municipality / VDC' },
      { accessor: 'district',         label: 'District' },
      { accessor: 'city',             label: 'City' },
      { accessor: 'state',            label: 'State' },
      { accessor: 'zip_code',         label: 'Zip Code' },
      { accessor: 'country',          label: 'Country' },
    ]},
    { title: 'Citizenship', fields: [
      { accessor: 'citizenship_no',            label: 'Citizenship No.' },
      { accessor: 'citizenship_issued_date',   label: 'Issued Date' },
      { accessor: 'citizenship_issued_office', label: 'Issued Office', fullWidth: true },
    ]},
    { title: 'Family', fields: [
      { accessor: 'father_name',      label: "Father's Name" },
      { accessor: 'grandfather_name', label: "Grandfather's Name" },
      { accessor: 'husband_name',     label: "Husband's Name" },
    ]},
    { title: 'Other', fields: [
      { accessor: 'pan_no', label: 'PAN No.' },
      { accessor: 'notes',  label: 'Notes', fullWidth: true },
    ]},
  ];

  const propertyFields = [
    { title: 'Property Info', fields: [
      { accessor: 'property_name',      label: 'Property Name' },
      { accessor: 'property_type',      label: 'Type',      type: 'select', options: ['land', 'building', 'land_and_building', 'apartment', 'commercial', 'industrial'] },
      { accessor: 'property_mortgaged', label: 'Mortgaged', type: 'select', options: ['Land', 'Building', 'Both'] },
      { accessor: 'property_status',    label: 'Status',    type: 'select', options: ['active', 'inactive', 'vacant', 'occupied'] },
      { accessor: 'plot_no',            label: 'Plot No.' },
      { accessor: 'sheet_no',           label: 'Sheet No.' },
    ]},
    { title: 'Location', fields: [
      { accessor: 'district',         label: 'District' },
      { accessor: 'ward_no',          label: 'Present Ward No.' },
      { accessor: 'vdc_municipality', label: 'Present Municipality / VDC' },
      { accessor: 'sabik_vdc',        label: 'Sabik VDC' },
      { accessor: 'sabik_ward_no',    label: 'Sabik Ward No.' },
      { accessor: 'tole',             label: 'Tole / Locality' },
      { accessor: 'address',          label: 'Address', fullWidth: true },
      { accessor: 'gps_coordinates',  label: 'GPS Coordinates' },
    ]},
    { title: 'Land Area', fields: [
      { accessor: 'land_area_lorc',      label: 'LORC Area (Sq.M)' },
      { accessor: 'land_area_lorc_trad', label: 'LORC (R-A-P-D)' },
      { accessor: 'land_area_measured',  label: 'Measured Area (Sq.M)' },
      { accessor: 'land_area_meas_trad', label: 'Measured (R-A-P-D)' },
      { accessor: 'land_shape',          label: 'Land Shape' },
      { accessor: 'land_topography',     label: 'Topography' },
      { accessor: 'frontage',            label: 'Frontage (ft)' },
    ]},
    { title: 'Boundaries', fields: [
      { accessor: 'north_boundary', label: 'North' },
      { accessor: 'south_boundary', label: 'South' },
      { accessor: 'east_boundary',  label: 'East' },
      { accessor: 'west_boundary',  label: 'West' },
    ]},
    { title: 'Building', fields: [
      { accessor: 'total_area',        label: 'Total Area' },
      { accessor: 'built_area',        label: 'Built Area' },
      { accessor: 'bedrooms',          label: 'Bedrooms' },
      { accessor: 'bathrooms',         label: 'Bathrooms' },
      { accessor: 'construction_year', label: 'Built Year' },
    ]},
    { title: 'Road & Access', fields: [
      { accessor: 'road_access_field',          label: 'Road Access' },
      { accessor: 'road_width',                 label: 'Road Width (ft)' },
      { accessor: 'road_type',                  label: 'Road Type' },
      { accessor: 'road_side',                  label: 'Road Side' },
      { accessor: 'nearest_landmark',    label: 'Nearest Landmark' },
      { accessor: 'landmark_coordinates', label: 'Landmark GPS' },
      { accessor: 'nearest_market',       label: 'Nearest Market' },
      { accessor: 'public_transport_distance',  label: 'Public Transport Distance' },
    ]},
    { title: 'Services', fields: [
      { accessor: 'motorable_access', label: 'Motorable Access',   type: 'bool' },
      { accessor: 'water_supply',     label: 'Water Supply Line',  type: 'bool' },
      { accessor: 'sewerage',         label: 'Sewerage Pipe Line', type: 'bool' },
      { accessor: 'electricity_line', label: 'Electricity Line',   type: 'bool' },
      { accessor: 'telephone',        label: 'Telephone Line',     type: 'bool' },
      { accessor: 'tv_cable',         label: 'TV Cable',           type: 'bool' },
    ]},
    { title: 'Influencing Factors', fields: [
      { accessor: 'near_river_stream',      label: 'River / Stream nearby',      type: 'bool' },
      { accessor: 'near_high_tension_line', label: 'High-tension Line nearby',   type: 'bool' },
      { accessor: 'near_fuel_depot',        label: 'Fuel Depot nearby',          type: 'bool' },
      { accessor: 'near_temple',            label: 'Temple / Shrine nearby',     type: 'bool' },
      { accessor: 'water_logging',          label: 'Water Logging',              type: 'bool' },
      { accessor: 'near_cremation_area',    label: 'Cremation Area nearby',      type: 'bool' },
      { accessor: 'near_army_barracks',     label: 'Army Barracks nearby',       type: 'bool' },
      { accessor: 'near_monument',          label: 'Monument nearby',            type: 'bool' },
      { accessor: 'near_hazardous_factory', label: 'Hazardous Factory nearby',   type: 'bool' },
      { accessor: 'near_dumping_site',      label: 'Dumping Site nearby',        type: 'bool' },
    ]},
    { title: 'Valuation', fields: [
      { accessor: 'government_rate_per_aana',   label: 'Govt Rate / Aana' },
      { accessor: 'commercial_rate_per_aana',   label: 'Market Rate / Aana' },
      { accessor: 'fair_market_value_land',     label: 'FMV — Land' },
      { accessor: 'fair_market_value_building', label: 'FMV — Building' },
      { accessor: 'fair_market_value_total',    label: 'FMV — Total' },
      { accessor: 'distress_value_total',       label: 'Distress Value' },
      { accessor: 'valuation_in_words',         label: 'Value in Words', fullWidth: true },
    ]},
    { title: 'Legal', fields: [
      { accessor: 'ownership_type',            label: 'Ownership Type' },
      { accessor: 'hold_type',                 label: 'Hold Type' },
      { accessor: 'mode_of_acquisition',       label: 'Mode of Acquisition' },
      { accessor: 'lorc_registration_date',    label: 'Date of Certification' },
      { accessor: 'land_revenue_payment_date', label: 'Land Revenue Paid' },
      { accessor: 'legal_reference_no',        label: 'Reference No.' },
    ]},
    { title: 'Notes', fields: [
      { accessor: 'notes', label: 'Notes', fullWidth: true },
    ]},
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

  const saveObjectEdit = async () => {
    if (!activeObjectEdit.type || !activeObjectEdit.id) { cancelObjectEdit(); return; }
    const { type, id, data } = activeObjectEdit;
    const typeLabel = type.replace(/s$/, ''); // clients→client, owners→owner, properties→propert…

    // Map collection name → API method
    const apiCall = {
      clients:    () => accountApi.updateClient(id, data),
      owners:     () => accountApi.updateOwner(id, data),
      properties: () => accountApi.updateProperty(id, data),
    }[type];

    if (!apiCall) { cancelObjectEdit(); return; }

    try {
      const res = await apiCall();
      if (res.data?.success) {
        const updated = res.data.data;
        setHierarchy(prev => {
          if (!prev) return prev;
          const list = Array.isArray(prev[type]) ? prev[type] : [];
          return { ...prev, [type]: list.map(item => (item._id || item.id) === id ? updated : item) };
        });
        cancelObjectEdit();
        toast(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} saved`);
      } else {
        toast(res.data?.message || 'Save failed — please try again.');
      }
    } catch (err) {
      toast('Network error — changes not saved.');
    }
  };

  const renderValue = value => {
    if (value === undefined || value === null || value === '') return '—';
    if (value === true  || value === 'true')  return 'Yes';
    if (value === false || value === 'false') return 'No';
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const handleBoolChange = (name, checked) =>
    setFormData(prev => ({ ...prev, [name]: checked }));

  const handleObjectBoolChange = (name, checked) =>
    handleObjectEditChange(name, checked);

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
    const raw   = formData[field.accessor];
    const value = raw ?? '';
    if (field.type === 'select') return (
      <select name={field.accessor} value={value} onChange={handleInputChange}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    if (field.type === 'bool') {
      const checked = raw === true || raw === 'true';
      return (
        <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
          <input type="checkbox" checked={checked} onChange={e => handleBoolChange(field.accessor, e.target.checked)} />
          {checked ? 'Yes' : 'No'}
        </label>
      );
    }
    return <input type={field.type || 'text'} name={field.accessor} value={value} onChange={handleInputChange} />;
  };

  const renderObjectFieldInput = (field, value) => {
    if (field.type === 'select') return (
      <select name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)}>
        {field.options.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
      </select>
    );
    if (field.type === 'bool') {
      const checked = value === true || value === 'true';
      return (
        <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
          <input type="checkbox" checked={checked} onChange={e => handleObjectBoolChange(field.accessor, e.target.checked)} />
          {checked ? 'Yes' : 'No'}
        </label>
      );
    }
    return <input type={field.type || 'text'} name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)} />;
  };

  const renderFieldGrid = (fieldDefs, itemId, isEditingItem, data) => {
    const isGrouped = fieldDefs.length > 0 && 'fields' in fieldDefs[0];
    const renderOneField = field => (
      <div key={`${itemId}-${field.accessor}`} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
        <label>{field.label}</label>
        {isEditingItem
          ? renderObjectFieldInput(field, data[field.accessor])
          : <span>{renderValue(data[field.accessor])}</span>}
      </div>
    );
    if (!isGrouped) return <div className="ad-grid-2">{fieldDefs.map(renderOneField)}</div>;
    return fieldDefs.map(group => (
      <div key={group.title} className="ad-field-group">
        <div className="ad-group-label">{group.title}</div>
        <div className="ad-grid-2">{group.fields.map(renderOneField)}</div>
      </div>
    ));
  };

  const renderSection = (title, items, fields, headerLabel, getExtraActions) => {
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
                        <>
                          {getExtraActions && getExtraActions(item)}
                          <button className="btn btn-sm btn-secondary" onClick={() => startObjectEdit(type, item)}>Edit</button>
                        </>
                      )}
                    </div>
                  </div>
                  {renderFieldGrid(fields, itemId, isEditingItem, data)}
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
            {renderSection('Properties', hierarchy.properties, propertyFields, 'property_name',
              item => (
                <button
                  key="map"
                  className="btn btn-sm"
                  style={{ background: 'rgba(31,58,46,0.08)', color: 'var(--brand,#1f3a2e)', border: 'none' }}
                  onClick={() => setMapProperty(item)}
                >
                  📍 Map
                </button>
              )
            )}
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

      {mapProperty && (
        <PropertyMapModal
          property={mapProperty}
          onClose={() => setMapProperty(null)}
          onPropertyUpdate={(updated) => {
            setMapProperty(updated);
            setHierarchy(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                properties: prev.properties.map(p =>
                  (p._id || p.id) === (updated._id || updated.id) ? updated : p
                ),
              };
            });
          }}
        />
      )}
    </div>
  );
}

export default AccountDetail;
