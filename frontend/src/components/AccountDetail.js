import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import GenerateDocModal from './GenerateDocModal';
import PropertyMapModal from './PropertyMapModal';
import AccountStagePath from './AccountStagePath';
import AreaCalculatorModal from './AreaCalculatorModal';
import { useToast } from '../context';
import '../styles/AccountDetail.css';

const STATUS_OPTIONS = [
  'Active', 'Prospect', 'Bank Verification', 'Bank Verified',
  'Payment Pending', 'Paid', 'Lost', 'Archived', 'Inactive',
];

const pillClass = status => {
  switch ((status || '').toLowerCase()) {
    case 'active':            return 'ok';
    case 'paid':              return 'ok';
    case 'bank verified':     return 'info';
    case 'bank verification': return 'review';
    case 'prospect':          return 'review';
    case 'payment pending':   return 'warn';
    case 'pending':           return 'warn';
    case 'lost':
    case 'overdue':           return 'due';
    case 'deleted':
    case 'archived':
    case 'inactive':
    case 'closed':            return 'draft';
    default:                  return 'draft';
  }
};

function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [hierarchy,        setHierarchy]        = useState(null);
  const [changelog,         setChangelog]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [isEditing,        setIsEditing]        = useState(false);
  const [formData,         setFormData]         = useState({
    account_name: '', company_registration: '', registration_number: '',
    tax_id: '', business_type: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', zip_code: '', country: '',
    logo_url: '', status: 'active', created_by: '', created_at: '', updated_at: '',
  });
  const [activeObjectEdit, setActiveObjectEdit] = useState({ type: null, id: null, data: null });
  const [isDocModalOpen,    setIsDocModalOpen]    = useState(false);
  const [areaCalcCtx,       setAreaCalcCtx]       = useState(null); // { property, type: 'measurement'|'lalpurja'|'deduction' }
  const [mapProperty,       setMapProperty]       = useState(null);
  const [stageSaving,       setStageSaving]       = useState(false);

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
    { accessor: 'status',               label: 'Status', type: 'select', options: STATUS_OPTIONS },
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
      { accessor: 'land_area_lorc',      label: 'As per Lalpurja',    type: 'area_sq', sqftSource: 'land_area_as_per_lalpurja' },
      { accessor: 'land_area_lorc_trad', label: 'Lalpurja (R-A-P-D)' },
      { accessor: 'land_area_measured',  label: 'As per Measurement', type: 'area_sq', sqftSource: 'land_area_as_per_measurement' },
      { accessor: 'land_area_meas_trad', label: 'Measurement (R-A-P-D)' },
      { accessor: 'land_area_deducted',  label: 'After Deduction',    type: 'area_sq', sqftSource: 'land_area_after_deduction' },
      { accessor: 'land_area_ded_trad',  label: 'After Deduction (R-A-P-D)' },
      { accessor: 'considered_area',     label: 'Area Considered',    type: 'area_sq', sqftSource: 'land_area_after_deduction' },
      { accessor: 'land_shape',          label: 'Land Shape' },
      { accessor: 'land_topography',     label: 'Topography' },
      { accessor: 'land_level',          label: 'Level of Land' },
      { accessor: 'nature_of_soil',      label: 'Nature of Soil' },
      { accessor: 'construction_on_land', label: 'Any Construction on Land' },
      { accessor: 'frontage',            label: 'Frontage (ft)' },
    ]},
    { title: 'Land Features', fields: [
      { accessor: 'positive_features', label: 'Positive Features', fullWidth: true },
      { accessor: 'negative_features', label: 'Negative Features', fullWidth: true },
    ]},
    { title: 'Field Survey — Triangles', fields: [
      { accessor: 'land_area_as_per_measurement', label: 'Measurement Area (नापी)',       type: 'triangle_group', calcType: 'measurement' },
      { accessor: 'land_area_as_per_lalpurja',    label: 'Lalpurja Area (लालपुर्जा)',     type: 'triangle_group', calcType: 'lalpurja' },
      { accessor: 'land_area_after_deduction',    label: 'After Deduction (कटाई पछि)',    type: 'triangle_group', calcType: 'deduction' },
    ]},
    { title: 'Boundaries', fields: [
      { accessor: 'north_boundary', label: 'North' },
      { accessor: 'south_boundary', label: 'South' },
      { accessor: 'east_boundary',  label: 'East' },
      { accessor: 'west_boundary',  label: 'West' },
    ]},
    { title: 'Building', fields: [
      { accessor: 'total_area',        label: 'Total Area' },
      { accessor: 'area_unit',         label: 'Area Unit', type: 'select', options: ['sqm', 'sqft', 'aana', 'ropani'] },
      { accessor: 'built_area',        label: 'Built Area' },
      { accessor: 'bedrooms',          label: 'Bedrooms' },
      { accessor: 'bathrooms',         label: 'Bathrooms' },
      { accessor: 'construction_year', label: 'Built Year' },
    ]},
    { title: 'Road & Access', fields: [
      { accessor: 'road_access_field',          label: 'Road Access (full description)', fullWidth: true },
      { accessor: 'road_width',                 label: 'Road Width (ft)' },
      { accessor: 'road_type',                  label: 'Road Type', type: 'select', options: ['Pitched Road', 'Concrete Slab Road', 'Gravelled Road', 'Earthen Road', 'Block Paved Road', 'Stone Paved Road', 'Foot Trail'] },
      { accessor: 'road_side',                  label: 'Road Side', type: 'select', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'] },
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
      { accessor: 'land_area_aana_decimal',     label: 'Land Area (Aana, decimal)' },
      { accessor: 'market_value_land',          label: 'Market Value — Land' },
      { accessor: 'market_value_building',      label: 'Market Value — Building' },
      { accessor: 'govt_value_remarks',         label: 'Govt Value Remarks' },
      { accessor: 'market_value_remarks',       label: 'Market Value Remarks', fullWidth: true },
      { accessor: 'fair_market_value_land',     label: 'FMV — Land' },
      { accessor: 'fair_market_value_building', label: 'FMV — Building' },
      { accessor: 'fair_market_value_total',    label: 'FMV — Total' },
      { accessor: 'distress_value_total',       label: 'Distress Value' },
      { accessor: 'valuation_in_words',         label: 'Value in Words', fullWidth: true },
      { accessor: 'summary_remarks',            label: 'Summary Remarks', fullWidth: true },
    ]},
    { title: 'Legal — Land Ownership', fields: [
      { accessor: 'ownership_type',      label: 'Type of Ownership' },
      { accessor: 'hold_type',           label: 'Ownership of Land' },
      { accessor: 'ownership_comments',  label: 'Comments' },
    ]},
    { title: 'Legal — Land Revenue (Malpot)', fields: [
      { accessor: 'land_revenue_paid',         label: 'Current Revenue Paid', type: 'bool' },
      { accessor: 'land_revenue_payment_date', label: 'Date of Payment' },
      { accessor: 'land_revenue_comments',     label: 'Comments' },
    ]},
    { title: 'Legal — Land Registration', fields: [
      { accessor: 'mode_of_acquisition',        label: 'Normal Sale / Gift' },
      { accessor: 'lorc_registration_date',     label: 'Date of Registration' },
      { accessor: 'sale_gift_elapsed',          label: '6-Month 35-Day Period Elapsed', type: 'bool' },
      { accessor: 'land_registration_comments', label: 'Comments' },
    ]},
    { title: 'Legal — Survey Maps', fields: [
      { accessor: 'maps_plots_indicated', label: 'Plots Indicated on Map',          type: 'bool' },
      { accessor: 'maps_access_marked',   label: 'Access Clearly Marked on Map',    type: 'bool' },
      { accessor: 'maps_shape_tallies',   label: 'Field Shape Tallies with Map',    type: 'bool' },
      { accessor: 'maps_comments',        label: 'Comments' },
      { accessor: 'area_change_comments', label: 'Area Change Comments' },
    ]},
    { title: 'Legal — Boundary Certificate', fields: [
      { accessor: 'boundary_cert_available', label: 'Boundary Certificate Available', type: 'bool' },
      { accessor: 'boundary_cert_date',      label: 'Date of Certification' },
      { accessor: 'boundary_cert_comments',  label: 'Comments' },
    ]},
    { title: 'Legal — General', fields: [
      { accessor: 'free_access_available',   label: 'Free Access Available',            type: 'bool' },
      { accessor: 'acquisition_notice',      label: 'Govt Acquisition Notice Issued',   type: 'bool' },
      { accessor: 'boundary_clearly_defined', label: 'Boundary Clearly Defined on Site', type: 'bool' },
      { accessor: 'general_legal_comments',  label: 'Comments' },
      { accessor: 'legal_reference_no',      label: 'Reference No.' },
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
        await fetchChangelog(); // Fetch changelog after hierarchy
      } else {
        setError(res.data?.message || 'Unable to load account details.');
      }
    } catch {
      setError('Failed to load account details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChangelog = async () => {
    try {
      const res = await accountApi.getAccountChangelog(accountId);
      if (res.data?.success) {
        setChangelog(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load changelog:', err);
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
        await fetchChangelog(); // Refresh changelog after status change
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

  const handleStageChange = async newStatus => {
    setStageSaving(true);
    try {
      const payload = { ...formData, status: newStatus };
      const res = await accountApi.updateAccount(accountId, payload);
      if (res.data?.success) {
        setFormData(res.data.data);
        setHierarchy(prev => ({ ...prev, account: res.data.data }));
        toast(`Status moved to ${newStatus}`);
        await fetchChangelog();
      } else {
        toast(res.data?.message || 'Failed to update status.');
      }
    } catch {
      toast('Network error — status not updated.');
    } finally {
      setStageSaving(false);
    }
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
        </label>
      );
    }
    return <input type={field.type || 'text'} name={field.accessor} value={value || ''} onChange={e => handleObjectEditChange(field.accessor, e.target.value)} />;
  };

  const fmtAreaByUnit = (sqmVal, areaUnit, structuredObj) => {
    const sqm = parseFloat(sqmVal) || 0;
    const obj = structuredObj || {};
    switch (areaUnit) {
      case 'sqft': {
        const v = parseFloat(obj.total_sqft) || (sqm * 10.7639);
        return { value: v > 0 ? v.toFixed(2) : '—', unit: 'Sq.Ft' };
      }
      case 'aana': {
        const v = parseFloat(obj.total_aana) || (sqm > 0 ? sqm / 31.8 : 0);
        return { value: v > 0 ? v.toFixed(2) : '—', unit: 'Aana' };
      }
      case 'ropani': {
        const v = sqm / 508.72;
        return { value: v > 0 ? v.toFixed(4) : '—', unit: 'Ropani' };
      }
      default:
        return { value: sqm > 0 ? sqm.toFixed(2) : '—', unit: 'Sq.M' };
    }
  };

  const renderTriangleGroup = (field, areaObj, item) => {
    const obj = areaObj || { triangles: [], total_sqft: '', total_sqm: '', total_aana: '', rapd: '' };
    const tris = obj.triangles || [];
    return (
      <div key={`tg-${field.accessor}`} className="ad-tri-group full">
        <div className="ad-tri-group-head">
          <span className="ad-tri-group-label">{field.label}</span>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--brand,#1f3a2e)', color: '#fff', border: 'none', fontSize: 12 }}
            onClick={() => setAreaCalcCtx({ property: item, type: field.calcType })}
          >
            {tris.length > 0 ? '✏ Recalculate' : '⊞ Calculate'}
          </button>
        </div>
        {tris.length > 0 ? (
          <>
            {(() => {
              const triUnitLabel = obj.unit === 'Meter' ? 'm' : obj.unit === 'Feet' ? 'ft' : obj.unit === 'Centimeter' ? 'cm' : 'ft';
              const primaryTotal = obj.unit === 'Meter'
                ? `${obj.total_sqm} m²`
                : obj.unit === 'Centimeter'
                ? `${obj.total_sqm} m²`
                : `${obj.total_sqft} sqft`;
              return (
                <>
                  <table className="ad-tri-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>a ({triUnitLabel})</th>
                        <th>b ({triUnitLabel})</th>
                        <th>c ({triUnitLabel})</th>
                        <th>s ({triUnitLabel})</th>
                        <th>Sqft</th>
                        <th>Aana</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tris.map((t, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{t.side_a}</td><td>{t.side_b}</td><td>{t.side_c}</td>
                          <td>{t.semi_perimeter}</td>
                          <td>{t.area_sqft}</td><td>{t.aana}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5}><strong>Total</strong></td>
                        <td><strong>{obj.total_sqft}</strong></td>
                        <td><strong>{obj.total_aana}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="ad-tri-summary">
                    {primaryTotal} · {obj.total_sqm} m² · R-A-P-D: {obj.rapd}
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <p className="ad-tri-empty">No triangles calculated yet.</p>
        )}
      </div>
    );
  };

  const renderFieldGrid = (fieldDefs, itemId, isEditingItem, data, item) => {
    const isGrouped = fieldDefs.length > 0 && 'fields' in fieldDefs[0];
    const renderOneField = field => {
      if (field.type === 'triangle_group') {
        return renderTriangleGroup(field, data[field.accessor], item);
      }
      if (field.type === 'area_sq') {
        const { value: displayValue, unit: unitSuffix } = fmtAreaByUnit(
          data[field.accessor],
          data.area_unit || 'sqm',
          field.sqftSource ? data[field.sqftSource] : null
        );
        return (
          <div key={`${itemId}-${field.accessor}`} className="ad-field">
            <label>{field.label} ({unitSuffix})</label>
            {isEditingItem
              ? renderObjectFieldInput(field, data[field.accessor])
              : <span>{displayValue}</span>}
          </div>
        );
      }
      return (
        <div key={`${itemId}-${field.accessor}`} className={`ad-field${field.fullWidth ? ' full' : ''}`}>
          <label>{field.label}</label>
          {isEditingItem
            ? renderObjectFieldInput(field, data[field.accessor])
            : <span>{renderValue(data[field.accessor])}</span>}
        </div>
      );
    };
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
                  {renderFieldGrid(fields, itemId, isEditingItem, data, item)}
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

      {/* ── Stage Path ── */}
      <div style={{ marginTop: '20px' }}>
        <AccountStagePath
          currentStatus={formData.status}
          changelog={changelog}
          onStatusChange={handleStageChange}
          saving={stageSaving}
        />
      </div>

      {/* ── Main layout ── */}
      <div className="layout" style={{ marginTop: '18px' }}>
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
                { label: 'Created By', val: renderValue(formData.created_by_name || formData.created_by) },
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
                <>
                  <button
                    key="map"
                    className="btn btn-sm"
                    style={{ background: 'rgba(31,58,46,0.08)', color: 'var(--brand,#1f3a2e)', border: 'none' }}
                    onClick={() => setMapProperty(item)}
                  >
                    📍 Map
                  </button>
                </>
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

          <div className="panel">
            <div className="panel-head"><h3>Recent Activity</h3></div>
            <div className="activity">
              {changelog.length > 0 ? changelog.map((log, idx) => {
                const actor = log.changed_by_name || log.changed_by || 'System';
                const acctName = log.account_name || formData.account_name || 'this account';
                const isCreation = !log.old_status;

                const title = isCreation
                  ? `An account for ${acctName} has been added by ${actor}`
                  : `${actor} changed status to ${log.new_status}`;

                const subtitle = isCreation
                  ? `Status of the account is ${log.new_status}`
                  : `Previous status was ${log.old_status}`;

                return (
                  <div key={idx} className={`act ${pillClass(log.new_status)}`}>
                    <div className="swatch" />
                    <div className="body">
                      <b>{title}</b>
                      <small style={{display:'flex',flexDirection:'column',gap:'2px',marginTop:'3px'}}>
                        <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
                          <span className={`pill ${pillClass(log.new_status)}`}
                            style={{padding:'2px 8px',fontSize:'10px',display:'inline-flex'}}>
                            {log.new_status}
                          </span>
                          <span style={{color:'var(--ink-mute)'}}>{subtitle}</span>
                        </span>
                        <span style={{color:'var(--ink-mute)',fontSize:'11px'}}>
                          {formatDate(log.changed_at)}
                        </span>
                      </small>
                    </div>
                  </div>
                );
              }) : (
                <div className="act">
                  <div className="swatch" />
                  <div className="body">
                    <b>No activity yet</b>
                    <small>Status changes will appear here</small>
                  </div>
                </div>
              )}
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

      <AreaCalculatorModal
        key={areaCalcCtx ? `${areaCalcCtx.property?._id || 'p'}-${areaCalcCtx.type}` : 'closed'}
        isOpen={!!areaCalcCtx}
        onClose={() => setAreaCalcCtx(null)}
        asDrawer
        drawerTitle={
          areaCalcCtx?.type === 'measurement' ? 'Measurement Area (नापी)' :
          areaCalcCtx?.type === 'lalpurja'    ? 'Lalpurja Area (लालपुर्जा)' :
          'Area After Deduction'
        }
        accountData={areaCalcCtx?.property || null}
        initialAreaData={
          areaCalcCtx?.type === 'measurement' ? (areaCalcCtx.property?.land_area_as_per_measurement || null) :
          areaCalcCtx?.type === 'lalpurja'    ? (areaCalcCtx.property?.land_area_as_per_lalpurja    || null) :
          areaCalcCtx?.type === 'deduction'   ? (areaCalcCtx.property?.land_area_after_deduction    || null) : null
        }
        onSave={async ({ land_area, triangles, total_sqft, total_sqm, total_aana, rapd, unit, area_unit }) => {
          if (!areaCalcCtx) return;
          const { property, type } = areaCalcCtx;
          const propId = property._id || property.id;
          const structured = { triangles: triangles || [], total_sqft: total_sqft || '', total_sqm: total_sqm || land_area || '', total_aana: total_aana || '', rapd: rapd || '', unit: unit || 'Feet' };
          const patch = { ...property };
          if (area_unit) patch.area_unit = area_unit;
          if (type === 'measurement') {
            patch.land_area_as_per_measurement = structured;
            patch.land_area_measured = land_area;
            patch.land_area_meas_trad = rapd || '';
          } else if (type === 'lalpurja') {
            patch.land_area_as_per_lalpurja = structured;
            patch.land_area_lorc = land_area;
            patch.land_area_lorc_trad = rapd || '';
          } else if (type === 'deduction') {
            patch.land_area_after_deduction = structured;
            patch.land_area_deducted = land_area;
            patch.land_area_ded_trad = rapd || '';
            patch.considered_area = land_area;
          }
          try {
            const res = await accountApi.updateProperty(propId, patch);
            if (res.data?.success) {
              setHierarchy(prev => ({
                ...prev,
                properties: prev.properties.map(p =>
                  (p._id || p.id) === propId ? res.data.data : p
                ),
              }));
              toast('Area saved to property');
              setAreaCalcCtx(null);
            }
          } catch {
            toast('Failed to save area');
          }
        }}
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
