import React, { useState } from 'react';
import '../styles/AccountModal.css';
import accountApi from '../services/accountApi';
import { useToast } from '../context';
import AreaCalculatorModal from './AreaCalculatorModal';

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
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={displayPlaceholder}
        {...rest}
      />
      {placeholder && <label>{placeholder}</label>}
      {!isDate && value ? (
        <button
          type="button"
          className="field-clear"
          tabIndex={-1}
          onClick={() => onChange({ target: { name, value: '' } })}
        >✕</button>
      ) : null}
    </div>
  );
};

const SelectInput = ({ name, value, onChange, error, label, children }) => (
  <div className={`field-wrap${error ? ' has-error' : ''}`}>
    <select name={name} value={value} onChange={onChange}>
      {children}
    </select>
    <label>{label}</label>
  </div>
);

const SectionHead = ({ children }) => (
  <p className="form-section-head">{children}</p>
);

const AccountModal = ({ isOpen, onClose, onSubmit }) => {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [accountErrors, setAccountErrors] = useState({});
  const [clientErrors, setClientErrors] = useState({});
  const [propertyErrors, setPropertyErrors] = useState({});
  const [ownerErrors, setOwnerErrors] = useState({});
  const [stepError, setStepError] = useState('');

  const [account, setAccount] = useState({
    account_name: '', company_registration: '', registration_number: '',
    tax_id: '', business_type: '', phone: '', email: '', website: '',
    address: '', city: '', state: '', zip_code: '', country: '',
  });

  const [clients, setClients] = useState([]);
  const EMPTY_CLIENT = {
    entity_type: 'individual', gender: 'male', title: '', first_name: '', last_name: '',
    designation: '', email: '', phone: '', mobile: '', address: '', ward_no: '',
    vdc_municipality: '', district: '', city: '', state: '', zip_code: '', country: '',
    citizenship_no: '', citizenship_issued_date: '', citizenship_issued_office: '',
    father_name: '', grandfather_name: '', husband_name: '', pan_no: '',
  };
  const [currentClient, setCurrentClient] = useState(EMPTY_CLIENT);

  const [properties, setProperties] = useState([]);
  const [areaDrawerType, setAreaDrawerType] = useState(null); // 'measurement' | 'lalpurja' | 'deduction'
  const EMPTY_AREA_OBJ = { triangles: [], total_sqft: '', total_sqm: '', total_aana: '', rapd: '' };
  const EMPTY_PROPERTY = {
    // Identity
    property_name: '', property_type: 'land', property_status: 'vacant',
    // Location
    plot_no: '', district: '', vdc_municipality: '', ward_no: '',
    sabik_vdc: '', sabik_ward_no: '', tole: '', address: '',
    city: '', state: '', zip_code: '', country: '',
    // Land detail
    mode_of_acquisition: '', lorc_registration_date: '', land_revenue_payment_date: '',
    sheet_no: '', gps_coordinates: '', land_shape: '', land_topography: '',
    road_access_blueprint: '', road_access_field: '', frontage: '', facing: '',
    nearest_landmark: '', nearest_market: '', public_transport_distance: '',
    land_area_lorc: '', land_area_lorc_trad: '',
    land_area_measured: '', land_area_meas_trad: '',
    land_area_deducted: '', land_area_ded_trad: '',
    considered_area: '',
    land_area_as_per_measurement: { ...EMPTY_AREA_OBJ },
    land_area_as_per_lalpurja:    { ...EMPTY_AREA_OBJ },
    land_area_after_deduction:    { ...EMPTY_AREA_OBJ },
    // Boundaries
    north_boundary: '', south_boundary: '', east_boundary: '', west_boundary: '',
    legal_reference_no: '',
    // Legal
    ownership_type: '', hold_type: '',
    // Building / Other
    total_area: '', area_unit: 'sqft', bedrooms: '', bathrooms: '',
    construction_year: '', estimated_value: '', purchase_price: '',
    rental_value: '', survey_number: '',
    // Services (boolean)
    motorable_access: false, water_supply: false, sewerage: false,
    electricity_line: false, telephone: false, tv_cable: false,
    // Influencing Factors (boolean)
    near_river_stream: false, near_high_tension_line: false, near_fuel_depot: false,
    near_temple: false, water_logging: false, near_cremation_area: false,
    near_army_barracks: false, near_monument: false, near_hazardous_factory: false,
    near_dumping_site: false,
  };
  const [currentProperty, setCurrentProperty] = useState(EMPTY_PROPERTY);

  const handleAreaCalcSave = ({ land_area, triangles, total_sqft, total_sqm, total_aana, rapd, unit, area_unit }) => {
    const structured = {
      triangles: triangles || [],
      total_sqft: total_sqft || '',
      total_sqm: total_sqm || land_area || '',
      total_aana: total_aana || '',
      rapd: rapd || '',
      unit: unit || 'Feet',
    };
    setCurrentProperty(p => {
      const base = area_unit ? { ...p, area_unit } : { ...p };
      if (areaDrawerType === 'measurement') {
        return { ...base, land_area_as_per_measurement: structured, land_area_measured: land_area, land_area_meas_trad: rapd || '' };
      }
      if (areaDrawerType === 'lalpurja') {
        return { ...base, land_area_as_per_lalpurja: structured, land_area_lorc: land_area, land_area_lorc_trad: rapd || '' };
      }
      if (areaDrawerType === 'deduction') {
        return { ...base, land_area_after_deduction: structured, land_area_deducted: land_area, land_area_ded_trad: rapd || '', considered_area: land_area };
      }
      return base;
    });
    setAreaDrawerType(null);
  };

  const [owners, setOwners] = useState([]);
  const EMPTY_OWNER = {
    owner_name: '', owner_type: 'individual', title: '', email: '', phone: '',
    mobile: '', address: '', city: '', state: '', zip_code: '', country: '',
    id_type: 'passport', id_number: '', pan_number: '', bank_account: '', bank_name: ''
  };
  const [currentOwner, setCurrentOwner] = useState(EMPTY_OWNER);

  const handleAccountChange  = e => { const { name, value } = e.target; setAccount(prev => ({ ...prev, [name]: value })); };
  const handleClientChange   = e => { const { name, value } = e.target; setCurrentClient(prev => ({ ...prev, [name]: value })); };
  const handlePropertyChange = e => { const { name, value } = e.target; setCurrentProperty(prev => ({ ...prev, [name]: value })); };
  const handleOwnerChange    = e => { const { name, value } = e.target; setCurrentOwner(prev => ({ ...prev, [name]: value })); };

  const addClient = () => {
    const errors = {};
    if (!currentClient.first_name.trim()) errors.first_name = 'First name is required';
    if (currentClient.email && !/\S+@\S+\.\S+/.test(currentClient.email)) errors.email = 'Please enter a valid email address';
    setClientErrors(errors);
    if (Object.keys(errors).length === 0) {
      setClients([...clients, { ...currentClient, id: Date.now() }]);
      setCurrentClient(EMPTY_CLIENT);
      setClientErrors({});
    }
  };

  const removeClient = id => setClients(clients.filter(c => c.id !== id));

  const addProperty = () => {
    const errors = {};
    if (!currentProperty.property_name.trim()) errors.property_name = 'Property name is required';
    if (!currentProperty.address.trim()) errors.address = 'Address is required';
    setPropertyErrors(errors);
    if (Object.keys(errors).length === 0) {
      setProperties([...properties, { ...currentProperty, id: Date.now() }]);
      setCurrentProperty(EMPTY_PROPERTY);
      setPropertyErrors({});
    }
  };

  const removeProperty = id => { setProperties(properties.filter(p => p.id !== id)); setSelectedPropertyId(null); };

  const addOwner = () => {
    const errors = {};
    if (!selectedPropertyId) errors.property_selection = 'Please select a property';
    if (!currentOwner.owner_name.trim()) errors.owner_name = 'Owner name is required';
    if (!currentOwner.email.trim()) { errors.email = 'Email is required'; }
    else if (!/\S+@\S+\.\S+/.test(currentOwner.email)) { errors.email = 'Please enter a valid email address'; }
    setOwnerErrors(errors);
    if (Object.keys(errors).length === 0) {
      setOwners([...owners, { ...currentOwner, property_id: selectedPropertyId, id: Date.now() }]);
      setCurrentOwner(EMPTY_OWNER);
      setOwnerErrors({});
    }
  };

  const removeOwner = id => setOwners(owners.filter(o => o.id !== id));

  const handleSubmit = () => {
    const payload = {
      account,
      clients: clients.map(({ id, ...rest }) => rest),
      properties: properties.map(({ id, ...rest }) => rest),
      owners: owners.map(({ id, ...rest }) => rest)
    };
    setIsLoading(true);
    accountApi.createAccountWithHierarchy(payload)
      .then(response => { setIsLoading(false); toast('Account created successfully'); onSubmit(response.data.data); resetForm(); })
      .catch(error => { setIsLoading(false); console.error('Error creating account:', error); });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAccount({ account_name: '', company_registration: '', registration_number: '', tax_id: '', business_type: '', phone: '', email: '', website: '', address: '', city: '', state: '', zip_code: '', country: '' });
    setClients([]); setCurrentClient(EMPTY_CLIENT);
    setProperties([]); setCurrentProperty(EMPTY_PROPERTY);
    setOwners([]); setCurrentOwner(EMPTY_OWNER);
    setSelectedPropertyId(null);
    setAccountErrors({}); setClientErrors({}); setPropertyErrors({}); setOwnerErrors({}); setStepError('');
  };

  if (!isOpen) return null;

  return (
    <>
    <AreaCalculatorModal
      key={areaDrawerType || 'closed'}
      isOpen={!!areaDrawerType}
      onClose={() => setAreaDrawerType(null)}
      asDrawer
      drawerTitle={
        areaDrawerType === 'measurement' ? 'Measurement Area (नापी)' :
        areaDrawerType === 'lalpurja'    ? 'Lalpurja Area (लालपुर्जा)' :
        'Area After Deduction'
      }
      accountData={{ area_unit: 'sqft' }}
      initialAreaData={
        areaDrawerType === 'measurement' ? (currentProperty.land_area_as_per_measurement || null) :
        areaDrawerType === 'lalpurja'    ? (currentProperty.land_area_as_per_lalpurja    || null) :
        areaDrawerType === 'deduction'   ? (currentProperty.land_area_after_deduction    || null) : null
      }
      onSave={handleAreaCalcSave}
    />
    <div className="account-modal-overlay">
      <div className="account-modal">
        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">Accounts (खाताहरू)</p>
            <h2>Add New Account (नयाँ खाता थप्नुहोस्)</h2>
          </div>
          <div className="modal-header-right">
            <div className="hstepper">
              {[
                { n: 1, label: 'Account\n(खाता)' },
                { n: 2, label: 'Clients\n(ग्राहक)' },
                { n: 3, label: 'Properties\n(सम्पत्ति)' },
                { n: 4, label: 'Owners\n(मालिक)' },
              ].map(({ n, label }, i) => (
                <React.Fragment key={n}>
                  {i > 0 && <span className={`hstep-line${currentStep > n ? ' done' : ''}`} />}
                  <div className={`hstep${currentStep === n ? ' active' : currentStep > n ? ' completed' : ''}`}
                       title={label.replace('\n', ' ')}>
                    {currentStep > n ? '✓' : n}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="hstep-label">
              {['Account (खाता)', 'Clients (ग्राहक)', 'Properties (सम्पत्ति)', 'Owners (मालिक)'][currentStep - 1]}
            </p>
            <button className="close-btn" onClick={() => { onClose(); resetForm(); }}>✕</button>
          </div>
        </div>

        <div className="account-modal-content">

          {/* ── Step 1: Account ── */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Account Information (खाता जानकारी)</h3>
              <SectionHead>Primary Details</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="account_name" placeholder="Account Name (खाता नाम) *" value={account.account_name} onChange={handleAccountChange} error={accountErrors.account_name} />
                <ClearInput type="text" name="company_registration" placeholder="Company Registration (कम्पनी दर्ता)" value={account.company_registration} onChange={handleAccountChange} />
                <ClearInput type="text" name="registration_number" placeholder="Registration Number (दर्ता नम्बर)" value={account.registration_number} onChange={handleAccountChange} />
                <ClearInput type="text" name="tax_id" placeholder="Tax ID (कर परिचय पत्र)" value={account.tax_id} onChange={handleAccountChange} />
                <ClearInput type="text" name="business_type" placeholder="Business Type (व्यापार प्रकार)" value={account.business_type} onChange={handleAccountChange} />
                <ClearInput type="email" name="email" placeholder="Email (इमेल) *" value={account.email} onChange={handleAccountChange} error={accountErrors.email} />
                <ClearInput type="tel" name="phone" placeholder="Phone (फोन)" value={account.phone} onChange={handleAccountChange} />
                <ClearInput type="text" name="website" placeholder="Website (वेबसाइट)" value={account.website} onChange={handleAccountChange} />
              </div>
              <SectionHead>Address</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="address" placeholder="Address (ठेगाना)" value={account.address} onChange={handleAccountChange} />
                <ClearInput type="text" name="city" placeholder="City (शहर)" value={account.city} onChange={handleAccountChange} />
                <ClearInput type="text" name="state" placeholder="State (प्रदेश)" value={account.state} onChange={handleAccountChange} />
                <ClearInput type="text" name="zip_code" placeholder="Zip Code (हुलाक संकेत)" value={account.zip_code} onChange={handleAccountChange} />
                <ClearInput type="text" name="country" placeholder="Country (देश)" value={account.country} onChange={handleAccountChange} />
              </div>
            </div>
          )}

          {/* ── Step 2: Clients ── */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Add Clients (ग्राहक थप्नुहोस्)</h3>
              <SectionHead>Identity</SectionHead>
              <div className="form-grid">
                <SelectInput name="entity_type" value={currentClient.entity_type} onChange={handleClientChange} label="Client Type (ग्राहक प्रकार)">
                  <option value="individual">Individual (व्यक्तिगत)</option>
                  <option value="company">Company (कम्पनी)</option>
                </SelectInput>
                <SelectInput name="gender" value={currentClient.gender} onChange={handleClientChange} label="Gender (लिङ्ग)">
                  <option value="male">Male (पुरुष)</option>
                  <option value="female">Female (महिला)</option>
                </SelectInput>
                <ClearInput type="text" name="title" placeholder="Title (उपाधि – Mr., Ms., Dr.)" value={currentClient.title} onChange={handleClientChange} />
                <ClearInput type="text" name="first_name" placeholder="First Name (पहिलो नाम) *" value={currentClient.first_name} onChange={handleClientChange} error={clientErrors.first_name} />
                <ClearInput type="text" name="last_name" placeholder="Last Name (थर)" value={currentClient.last_name} onChange={handleClientChange} />
                <ClearInput type="text" name="designation" placeholder="Designation (पद)" value={currentClient.designation} onChange={handleClientChange} />
              </div>
              <SectionHead>Contact</SectionHead>
              <div className="form-grid">
                <ClearInput type="email" name="email" placeholder="Email (इमेल)" value={currentClient.email} onChange={handleClientChange} error={clientErrors.email} />
                <ClearInput type="tel" name="phone" placeholder="Contact No. (सम्पर्क नं.)" value={currentClient.phone} onChange={handleClientChange} />
                <ClearInput type="tel" name="mobile" placeholder="Mobile (मोबाइल)" value={currentClient.mobile} onChange={handleClientChange} />
              </div>
              <SectionHead>Address</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="address" placeholder="Address (ठेगाना)" value={currentClient.address} onChange={handleClientChange} />
                <ClearInput type="text" name="ward_no" placeholder="Ward No. (वडा नं.)" value={currentClient.ward_no} onChange={handleClientChange} />
                <ClearInput type="text" name="vdc_municipality" placeholder="Municipality / VDC (नगरपालिका / गाविस)" value={currentClient.vdc_municipality} onChange={handleClientChange} />
                <ClearInput type="text" name="district" placeholder="District (जिल्ला)" value={currentClient.district} onChange={handleClientChange} />
                <ClearInput type="text" name="city" placeholder="City (शहर)" value={currentClient.city} onChange={handleClientChange} />
                <ClearInput type="text" name="state" placeholder="State (प्रदेश)" value={currentClient.state} onChange={handleClientChange} />
                <ClearInput type="text" name="zip_code" placeholder="Zip Code (हुलाक संकेत)" value={currentClient.zip_code} onChange={handleClientChange} />
                <ClearInput type="text" name="country" placeholder="Country (देश)" value={currentClient.country} onChange={handleClientChange} />
              </div>
              <SectionHead>Citizenship</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="citizenship_no" placeholder="Citizenship No. (नागरिकता नं.)" value={currentClient.citizenship_no} onChange={handleClientChange} />
                <ClearInput type="date" name="citizenship_issued_date" placeholder="Citizenship Issued Date (नागरिकता जारी मिति)" value={currentClient.citizenship_issued_date} onChange={handleClientChange} />
                <ClearInput type="text" name="citizenship_issued_office" placeholder="Citizenship Issued Office (नागरिकता जारी कार्यालय)" value={currentClient.citizenship_issued_office} onChange={handleClientChange} className="form-col-2" />
              </div>
              <SectionHead>Family / Tax</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="father_name" placeholder="Father's Name (बुबाको नाम)" value={currentClient.father_name} onChange={handleClientChange} />
                <ClearInput type="text" name="grandfather_name" placeholder="Grandfather's Name (हजुरबुबाको नाम)" value={currentClient.grandfather_name} onChange={handleClientChange} />
                <ClearInput type="text" name="husband_name" placeholder="Husband's Name (पतिको नाम)" value={currentClient.husband_name} onChange={handleClientChange} />
                <ClearInput type="text" name="pan_no" placeholder="PAN No. (स्थायी लेखा नं.)" value={currentClient.pan_no} onChange={handleClientChange} />
              </div>
              <button className="add-btn" onClick={addClient}>+ Add Client (ग्राहक थप्नुहोस्)</button>
              <div className="items-list">
                <h4>Clients Added (थपिएका ग्राहक): {clients.length}</h4>
                {clients.map(client => (
                  <div key={client.id} className="item-card">
                    <div className="item-info">
                      <strong>{client.first_name} {client.last_name}</strong>
                      <p>{client.designation || client.title} - {client.email}</p>
                    </div>
                    <button className="remove-btn" onClick={() => removeClient(client.id)}>Remove (हटाउनुहोस्)</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Properties ── */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Add Properties (सम्पत्ति थप्नुहोस्)</h3>

              {/* — Location of Site — */}
              <SectionHead>Location of Site (सम्पत्तिको स्थान)</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="property_name" placeholder="Property Name (सम्पत्तिको नाम) *" value={currentProperty.property_name} onChange={handlePropertyChange} error={propertyErrors.property_name} />
                <SelectInput name="property_type" value={currentProperty.property_type} onChange={handlePropertyChange} label="Property Type (सम्पत्ति प्रकार)">
                  <option value="land">Land (जग्गा)</option>
                  <option value="building">Building (भवन)</option>
                  <option value="land_and_building">Land &amp; Building (जग्गा र भवन)</option>
                  <option value="apartment">Apartment (अपार्टमेन्ट)</option>
                  <option value="commercial">Commercial (व्यावसायिक)</option>
                </SelectInput>
                <ClearInput type="text" name="plot_no" placeholder="Plot No. (कित्ता नं.)" value={currentProperty.plot_no} onChange={handlePropertyChange} />
                <ClearInput type="text" name="district" placeholder="District (जिल्ला)" value={currentProperty.district} onChange={handlePropertyChange} />
                <ClearInput type="text" name="vdc_municipality" placeholder="Present Municipality / VDC (वर्तमान नगरपालिका / गाविस)" value={currentProperty.vdc_municipality} onChange={handlePropertyChange} />
                <ClearInput type="text" name="ward_no" placeholder="Present Ward No. (वर्तमान वडा नं.)" value={currentProperty.ward_no} onChange={handlePropertyChange} />
                <ClearInput type="text" name="sabik_vdc" placeholder="Sabik VDC (साबिक गाविस – जस्तै Jorpati VDC)" value={currentProperty.sabik_vdc} onChange={handlePropertyChange} />
                <ClearInput type="text" name="sabik_ward_no" placeholder="Sabik Ward No. (साबिक वडा नं.)" value={currentProperty.sabik_ward_no} onChange={handlePropertyChange} />
                <ClearInput type="text" name="address" placeholder="Property Address (सम्पत्तिको ठेगाना) *" value={currentProperty.address} onChange={handlePropertyChange} error={propertyErrors.address} className="form-col-2" />
              </div>

              {/* — Land Detail Information — */}
              <SectionHead>Land Detail Information (जग्गा विवरण)</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="mode_of_acquisition" placeholder="Mode of Acquisition (प्राप्तिको तरिका – जस्तै Sale)" value={currentProperty.mode_of_acquisition} onChange={handlePropertyChange} />
                <ClearInput type="date" name="land_revenue_payment_date" placeholder="Land Revenue Payment Date (मालपोत तिरेको मिति)" value={currentProperty.land_revenue_payment_date} onChange={handlePropertyChange} />
                <ClearInput type="text" name="sheet_no" placeholder="Sheet No. (सिट नं.)" value={currentProperty.sheet_no} onChange={handlePropertyChange} />
                <ClearInput type="text" name="tole" placeholder="Locality / Tole (स्थानीयता / टोल)" value={currentProperty.tole} onChange={handlePropertyChange} />
                <ClearInput type="text" name="gps_coordinates" placeholder='GPS Co-ordinates (जीपीएस निर्देशांक – जस्तै 27°43′23.40"N, 85°22′35.91"E)' value={currentProperty.gps_coordinates} onChange={handlePropertyChange} className="form-col-2" />
                <ClearInput type="text" name="land_shape" placeholder="Shape of the Land (जग्गाको आकार – जस्तै Regular)" value={currentProperty.land_shape} onChange={handlePropertyChange} />
                <ClearInput type="text" name="land_topography" placeholder="Topography of Land (जग्गाको भूगोल – जस्तै Plain)" value={currentProperty.land_topography} onChange={handlePropertyChange} />
                <ClearInput type="text" name="road_access_blueprint" placeholder="Road Access as per Blueprint / Trace Map (नक्शाअनुसार सडक पहुँच)" value={currentProperty.road_access_blueprint} onChange={handlePropertyChange} className="form-col-2" />
                <ClearInput type="text" name="road_access_field" placeholder="Road Access as per Field (स्थलगत सडक पहुँच)" value={currentProperty.road_access_field} onChange={handlePropertyChange} className="form-col-2" />
                <ClearInput type="text" name="frontage" placeholder='Frontage of the Land (जग्गाको सामुन्ने – जस्तै 28′-00")' value={currentProperty.frontage} onChange={handlePropertyChange} />
                <ClearInput type="text" name="facing" placeholder='Face of the Land (जग्गाको फेस – जस्तै 28′-00" West Side)' value={currentProperty.facing} onChange={handlePropertyChange} />
                <ClearInput type="text" name="nearest_landmark" placeholder="Nearest Landmark (नजिकको ल्यान्डमार्क)" value={currentProperty.nearest_landmark} onChange={handlePropertyChange} className="form-col-2" />
                <ClearInput type="text" name="nearest_market" placeholder="Nearest Market (नजिकको बजार)" value={currentProperty.nearest_market} onChange={handlePropertyChange} />
                <ClearInput type="text" name="public_transport_distance" placeholder="Public Transport Distance (सार्वजनिक यातायात दूरी)" value={currentProperty.public_transport_distance} onChange={handlePropertyChange} />
                {/* ── Area Calculator Buttons ── */}
              </div>
              <div className="area-calc-group">
                {[
                  { type: 'lalpurja',    label: 'Lalpurja Area', hint: 'As per legal document (लालपुर्जा)', obj: currentProperty.land_area_as_per_lalpurja },
                  { type: 'measurement', label: 'Measurement Area', hint: 'As per field survey (नापी)', obj: currentProperty.land_area_as_per_measurement },
                  { type: 'deduction',   label: 'After Deduction', hint: 'Net area after road/other deductions', obj: currentProperty.land_area_after_deduction },
                ].map(({ type, label, hint, obj }) => (
                  <div key={type} className="area-calc-card">
                    <div className="area-calc-card-info">
                      <span className="area-calc-card-label">{label}</span>
                      <span className="area-calc-card-hint">{hint}</span>
                      {obj && obj.triangles && obj.triangles.length > 0 && (
                        <span className="area-calc-card-result">
                          {obj.triangles.length} triangle{obj.triangles.length > 1 ? 's' : ''} ·{' '}
                          {obj.unit === 'Meter' || obj.unit === 'Centimeter'
                            ? `${obj.total_sqm} m²`
                            : `${obj.total_sqft} sqft`} · {obj.rapd}
                        </span>
                      )}
                    </div>
                    <button type="button" className="area-calc-card-btn" onClick={() => setAreaDrawerType(type)}>
                      {obj && obj.triangles && obj.triangles.length > 0 ? '✏ Edit' : '⊞ Calculate'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="form-grid">
              </div>

              {/* — Boundaries — */}
              <SectionHead>Parameters of the Four Boundaries (चार किल्ला)</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="north_boundary" placeholder="North Boundary (उत्तर किल्ला)" value={currentProperty.north_boundary} onChange={handlePropertyChange} />
                <ClearInput type="text" name="south_boundary" placeholder="South Boundary (दक्षिण किल्ला)" value={currentProperty.south_boundary} onChange={handlePropertyChange} />
                <ClearInput type="text" name="east_boundary" placeholder="East Boundary (पूर्व किल्ला)" value={currentProperty.east_boundary} onChange={handlePropertyChange} />
                <ClearInput type="text" name="west_boundary" placeholder="West Boundary (पश्चिम किल्ला)" value={currentProperty.west_boundary} onChange={handlePropertyChange} />
                <ClearInput type="date" name="lorc_registration_date" placeholder="Date of Certification (प्रमाणीकरण मिति)" value={currentProperty.lorc_registration_date} onChange={handlePropertyChange} />
                <ClearInput type="text" name="legal_reference_no" placeholder="Reference No. (सन्दर्भ नं.)" value={currentProperty.legal_reference_no} onChange={handlePropertyChange} />
              </div>

              {/* — Services — */}
              <SectionHead>Services (सेवाहरू)</SectionHead>
              <div className="check-grid">
                {[
                  ['motorable_access','Motorable Access (मोटर पहुँच)'],
                  ['water_supply','Water Supply Line (खानेपानी)'],
                  ['sewerage','Sewerage Pipe Line (ढलपाइप)'],
                  ['electricity_line','Electricity Line (बिजुली)'],
                  ['telephone','Telephone Line (टेलिफोन)'],
                  ['tv_cable','TV Cable (टिभी केबल)'],
                ].map(([name, label]) => (
                  <label key={name} className="check-label">
                    <input type="checkbox" name={name} checked={!!currentProperty[name]}
                      onChange={e => setCurrentProperty(p => ({...p, [name]: e.target.checked}))} />
                    {label}
                  </label>
                ))}
              </div>

              {/* — Influencing Factors — */}
              <SectionHead>Influencing Factors (प्रभावकारी तत्वहरू)</SectionHead>
              <div className="check-grid">
                {[
                  ['near_river_stream','River / Stream nearby (नदी / खोला नजिक)'],
                  ['near_high_tension_line','High-tension Line nearby (उच्च तनाव लाइन नजिक)'],
                  ['near_fuel_depot','Fuel Depot nearby (इन्धन डिपो नजिक)'],
                  ['near_temple','Temple / Shrine nearby (मन्दिर / धर्मस्थल नजिक)'],
                  ['water_logging','Water Logging (पानी जमिने)'],
                  ['near_cremation_area','Cremation Area nearby (शमशान घाट नजिक)'],
                  ['near_army_barracks','Army Barracks nearby (सेना ब्यारेक नजिक)'],
                  ['near_monument','Monument nearby (स्मारक नजिक)'],
                  ['near_hazardous_factory','Hazardous Factory nearby (हानिकारक कारखाना नजिक)'],
                  ['near_dumping_site','Dumping Site nearby (फोहोर डम्पिङ नजिक)'],
                ].map(([name, label]) => (
                  <label key={name} className="check-label">
                    <input type="checkbox" name={name} checked={!!currentProperty[name]}
                      onChange={e => setCurrentProperty(p => ({...p, [name]: e.target.checked}))} />
                    {label}
                  </label>
                ))}
              </div>

              {/* — Land Legal Aspect — */}
              <SectionHead>Land Legal Aspect (जग्गाको कानूनी पक्ष)</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="ownership_type" placeholder="Ownership Type (स्वामित्व प्रकार – जस्तै Joint)" value={currentProperty.ownership_type} onChange={handlePropertyChange} />
                <ClearInput type="text" name="hold_type" placeholder="Hold Type (होल्ड प्रकार – जस्तै Freehold)" value={currentProperty.hold_type} onChange={handlePropertyChange} />
              </div>

              {/* — Building / Other — */}
              <SectionHead>Building / Other Details (भवन / अन्य विवरण)</SectionHead>
              <div className="form-grid">
                <ClearInput type="text" name="total_area" placeholder="Total Built Area (कुल निर्मित क्षेत्रफल)" value={currentProperty.total_area} onChange={handlePropertyChange} />
                <SelectInput name="area_unit" value={currentProperty.area_unit} onChange={handlePropertyChange} label="Area Unit (क्षेत्रफल एकाइ)">
                  <option value="sqft">Sq. Feet (वर्ग फिट)</option>
                  <option value="sqm">Sq. Meter (वर्ग मिटर)</option>
                  <option value="aana">Aana (आना)</option>
                  <option value="ropani">Ropani (रोपनी)</option>
                </SelectInput>
                <ClearInput type="number" name="bedrooms" placeholder="Bedrooms (शयनकक्ष)" value={currentProperty.bedrooms} onChange={handlePropertyChange} />
                <ClearInput type="number" name="bathrooms" placeholder="Bathrooms (शौचालय)" value={currentProperty.bathrooms} onChange={handlePropertyChange} />
                <ClearInput type="number" name="construction_year" placeholder="Construction Year (निर्माण वर्ष)" value={currentProperty.construction_year} onChange={handlePropertyChange} />
                <ClearInput type="number" name="estimated_value" placeholder="Estimated Value (अनुमानित मूल्य)" value={currentProperty.estimated_value} onChange={handlePropertyChange} />
                <ClearInput type="number" name="purchase_price" placeholder="Purchase Price (खरिद मूल्य)" value={currentProperty.purchase_price} onChange={handlePropertyChange} />
              </div>

              <button className="add-btn" onClick={addProperty}>+ Add Property (सम्पत्ति थप्नुहोस्)</button>
              <div className="items-list">
                <h4>Properties Added (थपिएका सम्पत्ति): {properties.length}</h4>
                {properties.map(prop => (
                  <div key={prop.id} className="item-card">
                    <div className="item-info">
                      <strong>{prop.property_name}</strong>
                      <p>{prop.property_type} · {prop.vdc_municipality}{prop.ward_no ? `-${prop.ward_no}` : ''}{prop.district ? `, ${prop.district}` : ''}</p>
                    </div>
                    <button className="remove-btn" onClick={() => removeProperty(prop.id)}>Remove (हटाउनुहोस्)</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Owners ── */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Add Owners (मालिक थप्नुहोस्)</h3>
              {properties.length === 0 ? (
                <p className="info-text">No properties added. Please go back and add at least one property.</p>
              ) : (
                <>
                  <div className="property-selector">
                    <SelectInput
                      name="property_selection"
                      value={selectedPropertyId || ''}
                      onChange={e => setSelectedPropertyId(Number(e.target.value))}
                      label="Select Property for Owner (मालिकको लागि सम्पत्ति छान्नुहोस्)"
                      error={ownerErrors.property_selection}
                    >
                      <option value="">-- Select a property (सम्पत्ति छान्नुहोस्) --</option>
                      {properties.map(prop => (
                        <option key={prop.id} value={prop.id}>{prop.property_name} - {prop.address}</option>
                      ))}
                    </SelectInput>
                  </div>
                  <SectionHead>Owner Identity</SectionHead>
                  <div className="form-grid">
                    <ClearInput type="text" name="owner_name" placeholder="Owner Name (मालिकको नाम) *" value={currentOwner.owner_name} onChange={handleOwnerChange} error={ownerErrors.owner_name} />
                    <SelectInput name="owner_type" value={currentOwner.owner_type} onChange={handleOwnerChange} label="Owner Type (मालिक प्रकार)">
                      <option value="individual">Individual (व्यक्तिगत)</option>
                      <option value="corporation">Corporation (निगम)</option>
                      <option value="partnership">Partnership (साझेदारी)</option>
                    </SelectInput>
                    <ClearInput type="text" name="title" placeholder="Title (उपाधि)" value={currentOwner.title} onChange={handleOwnerChange} />
                  </div>
                  <SectionHead>Contact</SectionHead>
                  <div className="form-grid">
                    <ClearInput type="email" name="email" placeholder="Email (इमेल) *" value={currentOwner.email} onChange={handleOwnerChange} error={ownerErrors.email} />
                    <ClearInput type="tel" name="phone" placeholder="Phone (फोन)" value={currentOwner.phone} onChange={handleOwnerChange} />
                    <ClearInput type="tel" name="mobile" placeholder="Mobile (मोबाइल)" value={currentOwner.mobile} onChange={handleOwnerChange} />
                  </div>
                  <SectionHead>Address</SectionHead>
                  <div className="form-grid">
                    <ClearInput type="text" name="address" placeholder="Address (ठेगाना)" value={currentOwner.address} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="city" placeholder="City (शहर)" value={currentOwner.city} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="state" placeholder="State (प्रदेश)" value={currentOwner.state} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="zip_code" placeholder="Zip Code (हुलाक संकेत)" value={currentOwner.zip_code} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="country" placeholder="Country (देश)" value={currentOwner.country} onChange={handleOwnerChange} />
                  </div>
                  <SectionHead>Identification</SectionHead>
                  <div className="form-grid">
                    <SelectInput name="id_type" value={currentOwner.id_type} onChange={handleOwnerChange} label="ID Type (पहिचान प्रकार)">
                      <option value="passport">Passport (राहदानी)</option>
                      <option value="id_card">ID Card (परिचयपत्र)</option>
                      <option value="driving_license">Driving License (सवारी अनुमतिपत्र)</option>
                      <option value="other">Other (अन्य)</option>
                    </SelectInput>
                    <ClearInput type="text" name="id_number" placeholder="ID Number (परिचयपत्र नं.)" value={currentOwner.id_number} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="pan_number" placeholder="PAN / Tax ID (स्थायी लेखा नं. / कर)" value={currentOwner.pan_number} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="bank_account" placeholder="Bank Account (बैंक खाता नं.)" value={currentOwner.bank_account} onChange={handleOwnerChange} />
                    <ClearInput type="text" name="bank_name" placeholder="Bank Name (बैंकको नाम)" value={currentOwner.bank_name} onChange={handleOwnerChange} />
                  </div>
                  <button className="add-btn" onClick={addOwner}>+ Add Owner (मालिक थप्नुहोस्)</button>
                  <div className="items-list">
                    <h4>Owners Added (थपिएका मालिक): {owners.length}</h4>
                    {owners.length === 0 ? (
                      <p className="info-text">No owners added yet.</p>
                    ) : (
                      owners.map(owner => {
                        const ownerProperty = properties.find(p => p.id === owner.property_id);
                        return (
                          <div key={owner.id} className="item-card">
                            <div className="item-info">
                              <strong>{owner.owner_name}</strong>
                              <p>{owner.owner_type} - {owner.email}</p>
                              {ownerProperty && <p className="property-tag">Property: {ownerProperty.property_name}</p>}
                            </div>
                            <button className="remove-btn" onClick={() => removeOwner(owner.id)}>Remove (हटाउनुहोस्)</button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="account-modal-footer">
          <button
            className="btn-secondary"
            onClick={() => { if (currentStep > 1) { setStepError(''); setCurrentStep(currentStep - 1); } }}
            disabled={currentStep === 1 || isLoading}
          >
            ← Back
          </button>

          {stepError && <span className="error-message step-error-message">{stepError}</span>}

          <div className="button-group">
            {currentStep < 4 ? (
              <button
                className="btn-primary"
                onClick={() => {
                  if (currentStep === 1) {
                    const errors = {};
                    if (!account.account_name.trim()) errors.account_name = 'Account name is required';
                    if (!account.email.trim()) { errors.email = 'Email is required'; }
                    else if (!/\S+@\S+\.\S+/.test(account.email)) { errors.email = 'Please enter a valid email address'; }
                    setAccountErrors(errors);
                    if (Object.keys(errors).length === 0) { setStepError(''); setCurrentStep(currentStep + 1); }
                    return;
                  }
                  if (currentStep === 2 && clients.length === 0) { setStepError('Please add at least one client before continuing.'); return; }
                  if (currentStep === 3 && properties.length === 0) { setStepError('Please add at least one property before continuing.'); return; }
                  setStepError('');
                  setCurrentStep(currentStep + 1);
                }}
                disabled={isLoading}
              >Next →</button>
            ) : (
              <button
                className="btn-success"
                onClick={() => {
                  if (owners.length === 0) { setStepError('Please add at least one owner before saving.'); return; }
                  setStepError('');
                  handleSubmit();
                }}
                disabled={isLoading}
              >{isLoading ? 'Saving... (सुरक्षित गर्दै...)' : 'Save All (सबै सुरक्षित गर्नुहोस्)'}</button>
            )}
            <button className="btn-cancel" onClick={() => { onClose(); resetForm(); }} disabled={isLoading}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AccountModal;
