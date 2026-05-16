import React, { useState } from 'react';
import accountApi from '../services/accountApi';
import { useToast } from '../context';
import AreaCalculatorModal from './AreaCalculatorModal';
import '../styles/AccountModal.css';

// ── Shared helpers (mirrors AccountModal) ─────────────────────────────────────

const formatRequiredPlaceholder = (placeholder) => {
  if (!placeholder) return 'This field is required';
  const labelText = placeholder.split('(')[0].trim().replace(/\s*\*$/, '');
  return `${labelText} is required`;
};

const ClearInput = ({ name, value, onChange, error, className, placeholder, ...rest }) => {
  const isDate = rest.type === 'date';
  const displayPlaceholder = error && !value ? formatRequiredPlaceholder(placeholder) : ' ';
  return (
    <div className={`field-wrap${className ? ` ${className}` : ''}${error ? ' has-error' : ''}`}>
      <input name={name} value={value} onChange={onChange} placeholder={displayPlaceholder} {...rest} />
      {placeholder && <label>{placeholder}</label>}
      {!isDate && value ? (
        <button type="button" className="field-clear" tabIndex={-1}
          onClick={() => onChange({ target: { name, value: '' } })}>✕</button>
      ) : null}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};

const SelectInput = ({ name, value, onChange, label, error, children }) => (
  <div className={`field-wrap${error ? ' has-error' : ''}`}>
    <select name={name} value={value} onChange={onChange}><option value="" disabled hidden></option>{children}</select>
    {label && <label>{label}</label>}
    {error && <span className="field-error">{error}</span>}
  </div>
);

const SectionHead = ({ children }) => <div className="section-head"><span>{children}</span></div>;

// ── Empty state ────────────────────────────────────────────────────────────────

const EMPTY_AREA_OBJ = { triangles: [], total_sqft: '', total_sqm: '', total_aana: '', rapd: '' };

const EMPTY_CLIENT = {
  entity_type: 'individual', gender: 'male', title: '', first_name: '', last_name: '',
  designation: '', email: '', phone: '', mobile: '',
  address: '', ward_no: '', vdc_municipality: '', district: '', city: '', state: '', zip_code: '', country: '',
  citizenship_no: '', citizenship_issued_date: '', citizenship_issued_office: '',
  father_name: '', grandfather_name: '', husband_name: '', pan_no: '',
};

const EMPTY_OWNER = {
  owner_name: '', owner_type: 'individual', title: '', email: '', phone: '',
  mobile: '', address: '', city: '', state: '', zip_code: '', country: '',
  id_type: 'passport', id_number: '', pan_number: '', bank_account: '', bank_name: '',
  property_id: '',
};

const EMPTY_PROPERTY = {
  property_name: '', property_type: 'land', plot_no: '',
  district: '', vdc_municipality: '', ward_no: '', sabik_vdc: '', sabik_ward_no: '', address: '',
  gps_coordinates: '', nearest_landmark: '', nearest_market: '', public_transport_distance: '',
  // Land
  mode_of_acquisition: '', lorc_registration_date: '', land_revenue_payment_date: '',
  sheet_no: '', tole: '', land_shape: '', land_topography: '',
  road_access_blueprint: '', road_access_field: '', frontage: '', facing: '',
  positive_features: '', negative_features: '', location_merits: '',
  construction_on_land: '',
  land_area_as_per_measurement: { ...EMPTY_AREA_OBJ },
  land_area_as_per_lalpurja:    { ...EMPTY_AREA_OBJ },
  land_area_after_deduction:    { ...EMPTY_AREA_OBJ },
  // Boundaries
  north_boundary: '', south_boundary: '', east_boundary: '', west_boundary: '',
  legal_reference_no: '',
  // Legal
  ownership_type: '', hold_type: '',
  // Building
  structural_system: '', purpose_of_building: '', no_of_floors: '', total_sqft_drawing: '',
  total_area: '', built_area: '', area_unit: 'sqft',
  thickness_of_slab: '', thickness_of_wall: '', height_each_floor: '', total_height_building: '',
  breadth_of_building: '', length_of_building: '', foundation_type: '', expected_life: '',
  building_age: '', construction_year: '', bedrooms: '', bathrooms: '',
  remarkable_defects: '', repair_maintenance: '', estimated_value: '', purchase_price: '',
  underground_water_tank: false, overhead_water_tank: false,
  solar_panel: false, deep_boring_tube_well: false,
  // Services
  motorable_access: false, water_supply: false, sewerage: false,
  electricity_line: false, telephone: false, tv_cable: false,
  // Influencing
  near_river_stream: false, near_high_tension_line: false, near_fuel_depot: false,
  near_temple: false, water_logging: false, near_cremation_area: false,
  near_army_barracks: false, near_monument: false, near_hazardous_factory: false,
  near_dumping_site: false,
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function AddToAccountModal({ type, accountId, existingProperties = [], isOpen, onClose, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [areaDrawerType, setAreaDrawerType] = useState(null);

  const [client,   setClient]   = useState(EMPTY_CLIENT);
  const [owner,    setOwner]    = useState(EMPTY_OWNER);
  const [property, setProperty] = useState(EMPTY_PROPERTY);

  if (!isOpen) return null;

  const titles = { client: 'Add Client (ग्राहक थप्नुहोस्)', owner: 'Add Owner (मालिक थप्नुहोस्)', property: 'Add Property (सम्पत्ति थप्नुहोस्)' };

  const hc  = e => setClient(p  => ({ ...p, [e.target.name]: e.target.value }));
  const ho  = e => setOwner(p   => ({ ...p, [e.target.name]: e.target.value }));
  const hp  = e => setProperty(p => ({ ...p, [e.target.name]: e.target.value }));
  const hpb = (name, val) => setProperty(p => ({ ...p, [name]: val }));

  const handleAreaCalcSave = ({ land_area, triangles, total_sqft, total_sqm, total_aana, rapd, unit, area_unit }) => {
    const structured = { triangles: triangles || [], total_sqft: total_sqft || '', total_sqm: total_sqm || land_area || '', total_aana: total_aana || '', rapd: rapd || '', unit: unit || 'Feet' };
    setProperty(p => {
      const base = area_unit ? { ...p, area_unit } : { ...p };
      if (areaDrawerType === 'measurement') return { ...base, land_area_as_per_measurement: structured, land_area_measured: land_area, land_area_meas_trad: rapd || '' };
      if (areaDrawerType === 'lalpurja')    return { ...base, land_area_as_per_lalpurja: structured, land_area_lorc: land_area, land_area_lorc_trad: rapd || '' };
      if (areaDrawerType === 'deduction')   return { ...base, land_area_after_deduction: structured, land_area_deducted: land_area, land_area_ded_trad: rapd || '', considered_area: land_area };
      return base;
    });
    setAreaDrawerType(null);
  };

  const validate = () => {
    const e = {};
    if (type === 'client') {
      if (!client.first_name.trim()) e.first_name = 'Required';
      if (!client.email.trim()) e.email = 'Required';
    }
    if (type === 'owner') {
      if (!owner.owner_name.trim()) e.owner_name = 'Required';
      if (!owner.email.trim()) e.email = 'Required';
    }
    if (type === 'property') {
      if (!property.property_name.trim()) e.property_name = 'Required';
      if (!property.address.trim()) e.address = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (type === 'client')   await accountApi.createClient(accountId, client);
      if (type === 'owner')    await accountApi.createOwner(accountId, owner);
      if (type === 'property') await accountApi.createProperty(accountId, property);
      toast(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`);
      onSaved();
      onClose();
      if (type === 'client')   setClient(EMPTY_CLIENT);
      if (type === 'owner')    setOwner(EMPTY_OWNER);
      if (type === 'property') setProperty(EMPTY_PROPERTY);
      setErrors({});
    } catch (err) {
      toast('Failed to save — ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AreaCalculatorModal
        key={areaDrawerType || 'closed'}
        isOpen={!!areaDrawerType}
        onClose={() => setAreaDrawerType(null)}
        asDrawer
        drawerTitle={areaDrawerType === 'measurement' ? 'Measurement Area (नापी)' : areaDrawerType === 'lalpurja' ? 'Lalpurja Area (लालपुर्जा)' : 'Area After Deduction'}
        accountData={{ area_unit: 'sqft' }}
        initialAreaData={
          areaDrawerType === 'measurement' ? (property.land_area_as_per_measurement || null) :
          areaDrawerType === 'lalpurja'    ? (property.land_area_as_per_lalpurja    || null) :
          areaDrawerType === 'deduction'   ? (property.land_area_after_deduction    || null) : null
        }
        onSave={handleAreaCalcSave}
      />

      <div className="account-modal-overlay" onClick={onClose}>
        <div className="account-modal" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="account-modal-header">
            <div className="modal-header-left">
              <p className="modal-eyebrow">{accountId}</p>
              <h2>{titles[type]}</h2>
            </div>
            <div className="modal-header-right">
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="account-modal-content">
            <div className="form-step">

              {/* ── CLIENT FORM ── */}
              {type === 'client' && (<>
                <SectionHead>Identity</SectionHead>
                <div className="form-grid">
                  <SelectInput name="entity_type" value={client.entity_type} onChange={hc} label="Client Type (ग्राहक प्रकार)">
                    <option value="individual">Individual (व्यक्तिगत)</option>
                    <option value="company">Company (कम्पनी)</option>
                  </SelectInput>
                  <SelectInput name="gender" value={client.gender} onChange={hc} label="Gender (लिङ्ग)">
                    <option value="male">Male (पुरुष)</option>
                    <option value="female">Female (महिला)</option>
                  </SelectInput>
                  <ClearInput type="text" name="title" placeholder="Title (उपाधि – Mr., Ms., Dr.)" value={client.title} onChange={hc} />
                  <ClearInput type="text" name="first_name" placeholder="First Name (पहिलो नाम) *" value={client.first_name} onChange={hc} error={errors.first_name} />
                  <ClearInput type="text" name="last_name" placeholder="Last Name (थर)" value={client.last_name} onChange={hc} />
                  <ClearInput type="text" name="designation" placeholder="Designation (पद)" value={client.designation} onChange={hc} />
                </div>
                <SectionHead>Contact</SectionHead>
                <div className="form-grid">
                  <ClearInput type="email" name="email" placeholder="Email (इमेल) *" value={client.email} onChange={hc} error={errors.email} />
                  <ClearInput type="tel" name="phone" placeholder="Contact No. (सम्पर्क नं.)" value={client.phone} onChange={hc} />
                  <ClearInput type="tel" name="mobile" placeholder="Mobile (मोबाइल)" value={client.mobile} onChange={hc} />
                </div>
                <SectionHead>Address</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="address" placeholder="Address (ठेगाना)" value={client.address} onChange={hc} />
                  <ClearInput type="text" name="ward_no" placeholder="Ward No. (वडा नं.)" value={client.ward_no} onChange={hc} />
                  <ClearInput type="text" name="vdc_municipality" placeholder="Municipality / VDC (नगरपालिका / गाविस)" value={client.vdc_municipality} onChange={hc} />
                  <ClearInput type="text" name="district" placeholder="District (जिल्ला)" value={client.district} onChange={hc} />
                  <ClearInput type="text" name="city" placeholder="City (शहर)" value={client.city} onChange={hc} />
                  <ClearInput type="text" name="state" placeholder="State (प्रदेश)" value={client.state} onChange={hc} />
                  <ClearInput type="text" name="zip_code" placeholder="Zip Code (हुलाक संकेत)" value={client.zip_code} onChange={hc} />
                  <ClearInput type="text" name="country" placeholder="Country (देश)" value={client.country} onChange={hc} />
                </div>
                <SectionHead>Citizenship</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="citizenship_no" placeholder="Citizenship No. (नागरिकता नं.)" value={client.citizenship_no} onChange={hc} />
                  <ClearInput type="date" name="citizenship_issued_date" placeholder="Citizenship Issued Date" value={client.citizenship_issued_date} onChange={hc} />
                  <ClearInput type="text" name="citizenship_issued_office" placeholder="Citizenship Issued Office (नागरिकता जारी कार्यालय)" value={client.citizenship_issued_office} onChange={hc} className="form-col-2" />
                </div>
                <SectionHead>Family / Tax</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="father_name" placeholder="Father's Name (बुबाको नाम)" value={client.father_name} onChange={hc} />
                  <ClearInput type="text" name="grandfather_name" placeholder="Grandfather's Name (हजुरबुबाको नाम)" value={client.grandfather_name} onChange={hc} />
                  <ClearInput type="text" name="husband_name" placeholder="Husband's Name (पतिको नाम)" value={client.husband_name} onChange={hc} />
                  <ClearInput type="text" name="pan_no" placeholder="PAN No. (स्थायी लेखा नं.)" value={client.pan_no} onChange={hc} />
                </div>
              </>)}

              {/* ── OWNER FORM ── */}
              {type === 'owner' && (<>
                {existingProperties.length > 0 && (
                  <div className="property-selector" style={{ marginBottom: 12 }}>
                    <SelectInput name="property_id" value={owner.property_id} onChange={ho} label="Link to Property (सम्पत्तिसँग जोड्नुहोस्)">
                      <option value="">-- Select property (वैकल्पिक) --</option>
                      {existingProperties.map(p => (
                        <option key={p._id} value={p._id}>{p.property_name} – {p.plot_no || p.address}</option>
                      ))}
                    </SelectInput>
                  </div>
                )}
                <SectionHead>Owner Identity</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="owner_name" placeholder="Owner Name (मालिकको नाम) *" value={owner.owner_name} onChange={ho} error={errors.owner_name} />
                  <SelectInput name="owner_type" value={owner.owner_type} onChange={ho} label="Owner Type (मालिक प्रकार)">
                    <option value="individual">Individual (व्यक्तिगत)</option>
                    <option value="corporation">Corporation (निगम)</option>
                    <option value="partnership">Partnership (साझेदारी)</option>
                  </SelectInput>
                  <ClearInput type="text" name="title" placeholder="Title (उपाधि)" value={owner.title} onChange={ho} />
                </div>
                <SectionHead>Contact</SectionHead>
                <div className="form-grid">
                  <ClearInput type="email" name="email" placeholder="Email (इमेल) *" value={owner.email} onChange={ho} error={errors.email} />
                  <ClearInput type="tel" name="phone" placeholder="Phone (फोन)" value={owner.phone} onChange={ho} />
                  <ClearInput type="tel" name="mobile" placeholder="Mobile (मोबाइल)" value={owner.mobile} onChange={ho} />
                </div>
                <SectionHead>Address</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="address" placeholder="Address (ठेगाना)" value={owner.address} onChange={ho} />
                  <ClearInput type="text" name="city" placeholder="City (शहर)" value={owner.city} onChange={ho} />
                  <ClearInput type="text" name="state" placeholder="State (प्रदेश)" value={owner.state} onChange={ho} />
                  <ClearInput type="text" name="zip_code" placeholder="Zip Code (हुलाक संकेत)" value={owner.zip_code} onChange={ho} />
                  <ClearInput type="text" name="country" placeholder="Country (देश)" value={owner.country} onChange={ho} />
                </div>
                <SectionHead>Identification</SectionHead>
                <div className="form-grid">
                  <SelectInput name="id_type" value={owner.id_type} onChange={ho} label="ID Type (पहिचान प्रकार)">
                    <option value="passport">Passport (राहदानी)</option>
                    <option value="id_card">ID Card (परिचयपत्र)</option>
                    <option value="driving_license">Driving License (सवारी अनुमतिपत्र)</option>
                    <option value="other">Other (अन्य)</option>
                  </SelectInput>
                  <ClearInput type="text" name="id_number" placeholder="ID Number (परिचयपत्र नं.)" value={owner.id_number} onChange={ho} />
                  <ClearInput type="text" name="pan_number" placeholder="PAN / Tax ID (स्थायी लेखा नं.)" value={owner.pan_number} onChange={ho} />
                  <ClearInput type="text" name="bank_account" placeholder="Bank Account (बैंक खाता नं.)" value={owner.bank_account} onChange={ho} />
                  <ClearInput type="text" name="bank_name" placeholder="Bank Name (बैंकको नाम)" value={owner.bank_name} onChange={ho} />
                </div>
              </>)}

              {/* ── PROPERTY FORM ── */}
              {type === 'property' && (<>
                <SectionHead>Location of Site (सम्पत्तिको स्थान)</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="property_name" placeholder="Property Name (सम्पत्तिको नाम) *" value={property.property_name} onChange={hp} error={errors.property_name} />
                  <SelectInput name="property_type" value={property.property_type} onChange={hp} label="Property Type (सम्पत्ति प्रकार)">
                    <option value="land">Land (जग्गा)</option>
                    <option value="building">Building (भवन)</option>
                  </SelectInput>
                  <ClearInput type="text" name="plot_no" placeholder="Plot No. (कित्ता नं.)" value={property.plot_no} onChange={hp} />
                  <ClearInput type="text" name="district" placeholder="District (जिल्ला)" value={property.district} onChange={hp} />
                  <ClearInput type="text" name="vdc_municipality" placeholder="Present Municipality / VDC" value={property.vdc_municipality} onChange={hp} />
                  <ClearInput type="text" name="ward_no" placeholder="Present Ward No. (वर्तमान वडा नं.)" value={property.ward_no} onChange={hp} />
                  <ClearInput type="text" name="sabik_vdc" placeholder="Sabik VDC (साबिक गाविस)" value={property.sabik_vdc} onChange={hp} />
                  <ClearInput type="text" name="sabik_ward_no" placeholder="Sabik Ward No. (साबिक वडा नं.)" value={property.sabik_ward_no} onChange={hp} />
                  <ClearInput type="text" name="address" placeholder="Property Address (सम्पत्तिको ठेगाना) *" value={property.address} onChange={hp} error={errors.address} className="form-col-2" />
                  <ClearInput type="text" name="gps_coordinates" placeholder="GPS Co-ordinates (जीपीएस निर्देशांक)" value={property.gps_coordinates} onChange={hp} className="form-col-2" />
                  <ClearInput type="text" name="nearest_landmark" placeholder="Nearest Landmark (नजिकको ल्यान्डमार्क)" value={property.nearest_landmark} onChange={hp} className="form-col-2" />
                  <ClearInput type="text" name="nearest_market" placeholder="Nearest Market (नजिकको बजार)" value={property.nearest_market} onChange={hp} />
                  <ClearInput type="text" name="public_transport_distance" placeholder="Public Transport Distance (सार्वजनिक यातायात दूरी)" value={property.public_transport_distance} onChange={hp} />
                </div>

                {property.property_type !== 'building' && (<>
                  <SectionHead>Land Details (जग्गा विवरण)</SectionHead>
                  <div className="form-grid">
                    <ClearInput type="text" name="mode_of_acquisition" placeholder="Mode of Acquisition (प्राप्तिको तरिका)" value={property.mode_of_acquisition} onChange={hp} />
                    <ClearInput type="date" name="land_revenue_payment_date" placeholder="Land Revenue Payment Date" value={property.land_revenue_payment_date} onChange={hp} />
                    <ClearInput type="text" name="sheet_no" placeholder="Sheet No. (सिट नं.)" value={property.sheet_no} onChange={hp} />
                    <ClearInput type="text" name="tole" placeholder="Locality / Tole (स्थानीयता / टोल)" value={property.tole} onChange={hp} />
                    <ClearInput type="text" name="land_shape" placeholder="Shape of the Land (जग्गाको आकार)" value={property.land_shape} onChange={hp} />
                    <ClearInput type="text" name="land_topography" placeholder="Topography of Land (जग्गाको भूगोल)" value={property.land_topography} onChange={hp} />
                    <ClearInput type="text" name="road_access_blueprint" placeholder="Road Access as per Blueprint" value={property.road_access_blueprint} onChange={hp} className="form-col-2" />
                    <ClearInput type="text" name="road_access_field" placeholder="Road Access as per Field" value={property.road_access_field} onChange={hp} className="form-col-2" />
                    <ClearInput type="text" name="frontage" placeholder="Frontage of the Land (जग्गाको सामुन्ने)" value={property.frontage} onChange={hp} />
                    <ClearInput type="text" name="facing" placeholder="Face of the Land (जग्गाको फेस)" value={property.facing} onChange={hp} />
                    <ClearInput type="text" name="construction_on_land" placeholder="Any Construction on Land (जग्गामा निर्माण)" value={property.construction_on_land} onChange={hp} />
                    <ClearInput type="text" name="positive_features" placeholder="Positive Features (सकारात्मक विशेषताहरू)" value={property.positive_features} onChange={hp} />
                    <ClearInput type="text" name="negative_features" placeholder="Any Negative Features (नकारात्मक विशेषताहरू)" value={property.negative_features} onChange={hp} />
                  </div>
                  <div className="area-calc-group">
                    {[
                      { type: 'lalpurja',    label: 'Lalpurja Area', hint: 'As per legal document (लालपुर्जा)', obj: property.land_area_as_per_lalpurja },
                      { type: 'measurement', label: 'Measurement Area', hint: 'As per field survey (नापी)', obj: property.land_area_as_per_measurement },
                      { type: 'deduction',   label: 'After Deduction', hint: 'Net area after road/other deductions', obj: property.land_area_after_deduction },
                    ].map(({ type: t, label, hint, obj }) => (
                      <div key={t} className="area-calc-card">
                        <div className="area-calc-card-info">
                          <span className="area-calc-card-label">{label}</span>
                          <span className="area-calc-card-hint">{hint}</span>
                          {obj && obj.triangles && obj.triangles.length > 0 && (
                            <span className="area-calc-card-result">
                              {obj.triangles.length} triangle{obj.triangles.length > 1 ? 's' : ''} ·{' '}
                              {obj.unit === 'Meter' ? `${obj.total_sqm} m²` : `${obj.total_sqft} sqft`} · {obj.rapd}
                            </span>
                          )}
                        </div>
                        <button type="button" className="area-calc-card-btn" onClick={() => setAreaDrawerType(t)}>
                          {obj && obj.triangles && obj.triangles.length > 0 ? '✏ Edit' : '⊞ Calculate'}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="field-wrap form-col-2" style={{ marginTop: 12 }}>
                    <textarea name="location_merits" rows={3} placeholder=" " value={property.location_merits} onChange={hp}
                      style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 'inherit' }} />
                    <label>Merits of Location (स्थानका विशेषताहरू) — one per line</label>
                  </div>
                </>)}

                {property.property_type === 'building' && (<>
                  <SectionHead>Building Details (भवन विवरण)</SectionHead>
                  <div className="form-grid">
                    <ClearInput type="text" name="structural_system" placeholder="Type of Structure (RCC Frame Structure)" value={property.structural_system} onChange={hp} />
                    <ClearInput type="text" name="purpose_of_building" placeholder="Purpose of Building (Residential)" value={property.purpose_of_building} onChange={hp} />
                    <ClearInput type="text" name="no_of_floors" placeholder="No. of Floors (3 & Half Floors)" value={property.no_of_floors} onChange={hp} />
                    <ClearInput type="text" name="total_sqft_drawing" placeholder="Total Sq.Ft in Drawing" value={property.total_sqft_drawing} onChange={hp} />
                    <ClearInput type="text" name="total_area" placeholder="Total Built Area (कुल निर्मित क्षेत्रफल)" value={property.total_area} onChange={hp} />
                    <ClearInput type="text" name="built_area" placeholder="Built Area (निर्मित क्षेत्रफल)" value={property.built_area} onChange={hp} />
                    <ClearInput type="text" name="thickness_of_slab" placeholder='Thickness of Slab (4")' value={property.thickness_of_slab} onChange={hp} />
                    <ClearInput type="text" name="thickness_of_wall" placeholder='Thickness of Wall (9")' value={property.thickness_of_wall} onChange={hp} />
                    <ClearInput type="text" name="height_each_floor" placeholder="Height of Each Floor (9′-4″)" value={property.height_each_floor} onChange={hp} />
                    <ClearInput type="text" name="total_height_building" placeholder="Total Height of Building (40′-10″)" value={property.total_height_building} onChange={hp} />
                    <ClearInput type="text" name="breadth_of_building" placeholder="Breadth of Building (28′-08″)" value={property.breadth_of_building} onChange={hp} />
                    <ClearInput type="text" name="length_of_building" placeholder="Length of Building (40′-08″)" value={property.length_of_building} onChange={hp} />
                    <ClearInput type="text" name="foundation_type" placeholder="Foundation Type (Isolated)" value={property.foundation_type} onChange={hp} />
                    <ClearInput type="text" name="building_age" placeholder="Age of Building (2.5 Years)" value={property.building_age} onChange={hp} />
                    <ClearInput type="text" name="expected_life" placeholder="Expected Life of Building (45 Years)" value={property.expected_life} onChange={hp} />
                    <ClearInput type="text" name="construction_on_land" placeholder="Any Construction on Land" value={property.construction_on_land} onChange={hp} />
                    <ClearInput type="number" name="bedrooms" placeholder="Bedrooms (शयनकक्ष)" value={property.bedrooms} onChange={hp} />
                    <ClearInput type="number" name="bathrooms" placeholder="Bathrooms (शौचालय)" value={property.bathrooms} onChange={hp} />
                    <ClearInput type="number" name="construction_year" placeholder="Construction Year (निर्माण वर्ष)" value={property.construction_year} onChange={hp} />
                    <ClearInput type="text" name="remarkable_defects" placeholder="Any Defects (dampness, cracks)" value={property.remarkable_defects} onChange={hp} />
                    <ClearInput type="text" name="repair_maintenance" placeholder="Repair & Maintenance (मर्मत सम्भार)" value={property.repair_maintenance} onChange={hp} />
                  </div>
                  <div className="check-grid" style={{ marginTop: 8 }}>
                    {[
                      ['underground_water_tank', 'Underground Water Tank (भूमिगत पानी ट्याङ्की)'],
                      ['overhead_water_tank', 'Overhead Water Tank (माथिल्लो पानी ट्याङ्की)'],
                      ['solar_panel', 'Solar Panel (सौर्य प्यानल)'],
                      ['deep_boring_tube_well', 'Deep Boring / Tube Well (डिप बोरिङ)'],
                    ].map(([name, label]) => (
                      <label key={name} className="check-label">
                        <input type="checkbox" checked={!!property[name]} onChange={e => hpb(name, e.target.checked)} /> {label}
                      </label>
                    ))}
                  </div>
                  <div className="field-wrap form-col-2" style={{ marginTop: 12 }}>
                    <textarea name="location_merits" rows={3} placeholder=" " value={property.location_merits} onChange={hp}
                      style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 'inherit' }} />
                    <label>Merits of Location (स्थानका विशेषताहरू) — one per line</label>
                  </div>
                </>)}

                <SectionHead>Parameters of the Four Boundaries (चार किल्ला)</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="north_boundary" placeholder="North Boundary (उत्तर किल्ला)" value={property.north_boundary} onChange={hp} />
                  <ClearInput type="text" name="south_boundary" placeholder="South Boundary (दक्षिण किल्ला)" value={property.south_boundary} onChange={hp} />
                  <ClearInput type="text" name="east_boundary" placeholder="East Boundary (पूर्व किल्ला)" value={property.east_boundary} onChange={hp} />
                  <ClearInput type="text" name="west_boundary" placeholder="West Boundary (पश्चिम किल्ला)" value={property.west_boundary} onChange={hp} />
                  <ClearInput type="date" name="lorc_registration_date" placeholder="Date of Certification (प्रमाणीकरण मिति)" value={property.lorc_registration_date} onChange={hp} />
                  <ClearInput type="text" name="legal_reference_no" placeholder="Reference No. (सन्दर्भ नं.)" value={property.legal_reference_no} onChange={hp} />
                </div>
                <SectionHead>Services (सेवाहरू)</SectionHead>
                <div className="check-grid">
                  {[['motorable_access','Motorable Access'],['water_supply','Water Supply Line'],['sewerage','Sewerage Pipe Line'],['electricity_line','Electricity Line'],['telephone','Telephone Line'],['tv_cable','TV Cable']].map(([name, label]) => (
                    <label key={name} className="check-label">
                      <input type="checkbox" checked={!!property[name]} onChange={e => hpb(name, e.target.checked)} /> {label}
                    </label>
                  ))}
                </div>
                <SectionHead>Influencing Factors (प्रभावकारी तत्वहरू)</SectionHead>
                <div className="check-grid">
                  {[['near_river_stream','River / Stream nearby'],['near_high_tension_line','High-tension Line nearby'],['near_fuel_depot','Fuel Depot nearby'],['near_temple','Temple / Shrine nearby'],['water_logging','Water Logging'],['near_cremation_area','Cremation Area nearby'],['near_army_barracks','Army Barracks nearby'],['near_monument','Monument nearby'],['near_hazardous_factory','Hazardous Factory nearby'],['near_dumping_site','Dumping Site nearby']].map(([name, label]) => (
                    <label key={name} className="check-label">
                      <input type="checkbox" checked={!!property[name]} onChange={e => hpb(name, e.target.checked)} /> {label}
                    </label>
                  ))}
                </div>
                <SectionHead>Legal (कानूनी पक्ष)</SectionHead>
                <div className="form-grid">
                  <ClearInput type="text" name="ownership_type" placeholder="Ownership Type (स्वामित्व प्रकार – Joint)" value={property.ownership_type} onChange={hp} />
                  <ClearInput type="text" name="hold_type" placeholder="Hold Type (होल्ड प्रकार – Freehold)" value={property.hold_type} onChange={hp} />
                </div>
              </>)}

            </div>
          </div>

          {/* Footer */}
          <div className="account-modal-footer">
            <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
