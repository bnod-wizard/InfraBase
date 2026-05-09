import React, { useState } from 'react';
import '../styles/AccountModal.css';
import accountApi from '../services/accountApi';
import { useToast } from '../context';

const AccountModal = ({ isOpen, onClose, onSubmit }) => {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Error states for field-level validation
  const [accountErrors, setAccountErrors] = useState({});
  const [clientErrors, setClientErrors] = useState({});
  const [propertyErrors, setPropertyErrors] = useState({});
  const [ownerErrors, setOwnerErrors] = useState({});
  const [stepError, setStepError] = useState('');

  // Account Data
  const [account, setAccount] = useState({
    account_name: '',
    company_registration: '',
    registration_number: '',
    tax_id: '',
    business_type: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: ''
  });

  // Clients List
  const [clients, setClients] = useState([]);
  const [currentClient, setCurrentClient] = useState({
    first_name: '',
    last_name: '',
    title: '',
    designation: '',
    email: '',
    phone: '',
    mobile: '',
    fax: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: ''
  });

  // Properties List
  const [properties, setProperties] = useState([]);
  const [currentProperty, setCurrentProperty] = useState({
    property_name: '',
    property_type: 'residential',
    property_status: 'vacant',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    total_area: '',
    area_unit: 'sqft',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    construction_year: '',
    furnishing: 'unfurnished',
    purchase_price: '',
    estimated_value: '',
    rental_value: '',
    survey_number: ''
  });

  // Owners List
  const [owners, setOwners] = useState([]);
  const [currentOwner, setCurrentOwner] = useState({
    owner_name: '',
    owner_type: 'individual',
    title: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    id_type: 'passport',
    id_number: '',
    pan_number: '',
    bank_account: '',
    bank_name: ''
  });

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setCurrentClient(prev => ({ ...prev, [name]: value }));
  };

  const handlePropertyChange = (e) => {
    const { name, value } = e.target;
    setCurrentProperty(prev => ({ ...prev, [name]: value }));
  };

  const handleOwnerChange = (e) => {
    const { name, value } = e.target;
    setCurrentOwner(prev => ({ ...prev, [name]: value }));
  };

  const addClient = () => {
    const errors = {};
    if (!currentClient.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!currentClient.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(currentClient.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setClientErrors(errors);

    if (Object.keys(errors).length === 0) {
      setClients([...clients, { ...currentClient, id: Date.now() }]);
      setCurrentClient({
        first_name: '',
        last_name: '',
        title: '',
        designation: '',
        email: '',
        phone: '',
        mobile: '',
        fax: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: ''
      });
      setClientErrors({});
    }
  };

  const removeClient = (id) => {
    setClients(clients.filter(c => c.id !== id));
  };

  const addProperty = () => {
    const errors = {};
    if (!currentProperty.property_name.trim()) {
      errors.property_name = 'Property name is required';
    }
    if (!currentProperty.address.trim()) {
      errors.address = 'Address is required';
    }

    setPropertyErrors(errors);

    if (Object.keys(errors).length === 0) {
      setProperties([...properties, { ...currentProperty, id: Date.now() }]);
      setCurrentProperty({
        property_name: '',
        property_type: 'residential',
        property_status: 'vacant',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        total_area: '',
        area_unit: 'sqft',
        bedrooms: '',
        bathrooms: '',
        parking_spaces: '',
        construction_year: '',
        furnishing: 'unfurnished',
        purchase_price: '',
        estimated_value: '',
        rental_value: '',
        survey_number: ''
      });
      setPropertyErrors({});
    }
  };

  const removeProperty = (id) => {
    setProperties(properties.filter(p => p.id !== id));
    setSelectedPropertyId(null);
  };

  const addOwner = () => {
    const errors = {};

    if (!selectedPropertyId) {
      errors.property_selection = 'Please select a property';
    }
    if (!currentOwner.owner_name.trim()) {
      errors.owner_name = 'Owner name is required';
    }
    if (!currentOwner.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(currentOwner.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setOwnerErrors(errors);

    if (Object.keys(errors).length === 0) {
      setOwners([...owners, { ...currentOwner, property_id: selectedPropertyId, id: Date.now() }]);
      setCurrentOwner({
        owner_name: '',
        owner_type: 'individual',
        title: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        id_type: 'passport',
        id_number: '',
        pan_number: '',
        bank_account: '',
        bank_name: ''
      });
      setOwnerErrors({});
    }
  };

  const removeOwner = (id) => {
    setOwners(owners.filter(o => o.id !== id));
  };

  const handleSubmit = () => {
    const payload = {
      account: {
        account_name: account.account_name,
        company_registration: account.company_registration,
        registration_number: account.registration_number,
        tax_id: account.tax_id,
        business_type: account.business_type,
        phone: account.phone,
        email: account.email,
        website: account.website,
        address: account.address,
        city: account.city,
        state: account.state,
        zip_code: account.zip_code,
        country: account.country
      },
      clients: clients.map(({ id, ...rest }) => rest),
      properties: properties.map(({ id, ...rest }) => rest),
      owners: owners.map(({ id, ...rest }) => rest)
    };

    setIsLoading(true);

    // Call API
    accountApi.createAccountWithHierarchy(payload)
      .then((response) => {
        setIsLoading(false);
        toast('Account created successfully');
        onSubmit(response.data.data);
        resetForm();
      })
      .catch((error) => {
        setIsLoading(false);
        console.error('Error creating account:', error);
        // Error handling can be improved with a toast notification system
        // For now, we'll keep it simple
      });
  };

  const resetForm = () => {
    setCurrentStep(1);
    setAccount({
      account_name: '',
      company_registration: '',
      registration_number: '',
      tax_id: '',
      business_type: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    });
    setClients([]);
    setCurrentClient({
      first_name: '',
      last_name: '',
      title: '',
      designation: '',
      email: '',
      phone: '',
      mobile: '',
      fax: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: ''
    });
    setProperties([]);
    setCurrentProperty({
      property_name: '',
      property_type: 'residential',
      property_status: 'vacant',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      total_area: '',
      area_unit: 'sqft',
      bedrooms: '',
      bathrooms: '',
      parking_spaces: '',
      construction_year: '',
      furnishing: 'unfurnished',
      purchase_price: '',
      estimated_value: '',
      rental_value: '',
      survey_number: ''
    });
    setOwners([]);
    setCurrentOwner({
      owner_name: '',
      owner_type: 'individual',
      title: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      id_type: 'passport',
      id_number: '',
      pan_number: '',
      bank_account: '',
      bank_name: ''
    });
    setSelectedPropertyId(null);
    // Clear all error states
    setAccountErrors({});
    setClientErrors({});
    setPropertyErrors({});
    setOwnerErrors({});
    setStepError('');
  };

  if (!isOpen) return null;

  return (
    <div className="account-modal-overlay">
      <div className="account-modal">
        <div className="account-modal-header">
          <div>
            <p className="modal-eyebrow">Accounts</p>
            <h2>Add New Account</h2>
            <p className="modal-sub">Create account with clients, properties and owners</p>
          </div>
          <button className="close-btn" onClick={() => { onClose(); resetForm(); }}>✕</button>
        </div>

        <div className="account-modal-stepper">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`step ${currentStep === n ? 'active' : currentStep > n ? 'completed' : ''}`}
            >
              {currentStep > n ? '✓' : n}
            </div>
          ))}
        </div>

        <div className="account-modal-step-labels">
          <div className="step-label">Account</div>
          <div className="step-label">Clients</div>
          <div className="step-label">Properties</div>
          <div className="step-label">Owners</div>
        </div>

        <div className="account-modal-content">
          {/* Step 1: Account Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Account Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <input type="text" name="account_name" placeholder="Account Name *" value={account.account_name} onChange={handleAccountChange} required />
                  {accountErrors.account_name && <span className="error-message">{accountErrors.account_name}</span>}
                </div>
                <input type="text" name="company_registration" placeholder="Company Registration" value={account.company_registration} onChange={handleAccountChange} />
                <input type="text" name="registration_number" placeholder="Registration Number" value={account.registration_number} onChange={handleAccountChange} />
                <input type="text" name="tax_id" placeholder="Tax ID" value={account.tax_id} onChange={handleAccountChange} />
                <input type="text" name="business_type" placeholder="Business Type" value={account.business_type} onChange={handleAccountChange} />
                <div className="form-field">
                  <input type="email" name="email" placeholder="Email *" value={account.email} onChange={handleAccountChange} required />
                  {accountErrors.email && <span className="error-message">{accountErrors.email}</span>}
                </div>
                <input type="tel" name="phone" placeholder="Phone" value={account.phone} onChange={handleAccountChange} />
                <input type="text" name="website" placeholder="Website" value={account.website} onChange={handleAccountChange} />
                <input type="text" name="address" placeholder="Address" value={account.address} onChange={handleAccountChange} />
                <input type="text" name="city" placeholder="City" value={account.city} onChange={handleAccountChange} />
                <input type="text" name="state" placeholder="State" value={account.state} onChange={handleAccountChange} />
                <input type="text" name="zip_code" placeholder="Zip Code" value={account.zip_code} onChange={handleAccountChange} />
                <input type="text" name="country" placeholder="Country" value={account.country} onChange={handleAccountChange} />
              </div>
            </div>
          )}

          {/* Step 2: Clients */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Add Clients</h3>
              <div className="form-grid">
                <div className="form-field">
                  <input type="text" name="first_name" placeholder="First Name *" value={currentClient.first_name} onChange={handleClientChange} required />
                  {clientErrors.first_name && <span className="error-message">{clientErrors.first_name}</span>}
                </div>
                <input type="text" name="last_name" placeholder="Last Name" value={currentClient.last_name} onChange={handleClientChange} />
                <input type="text" name="title" placeholder="Title (Mr., Ms., Dr.)" value={currentClient.title} onChange={handleClientChange} />
                <input type="text" name="designation" placeholder="Designation (Manager, Director)" value={currentClient.designation} onChange={handleClientChange} />
                <div className="form-field">
                  <input type="email" name="email" placeholder="Email *" value={currentClient.email} onChange={handleClientChange} required />
                  {clientErrors.email && <span className="error-message">{clientErrors.email}</span>}
                </div>
                <input type="tel" name="phone" placeholder="Phone" value={currentClient.phone} onChange={handleClientChange} />
                <input type="tel" name="mobile" placeholder="Mobile" value={currentClient.mobile} onChange={handleClientChange} />
                <input type="tel" name="fax" placeholder="Fax" value={currentClient.fax} onChange={handleClientChange} />
                <input type="text" name="address" placeholder="Address" value={currentClient.address} onChange={handleClientChange} />
                <input type="text" name="city" placeholder="City" value={currentClient.city} onChange={handleClientChange} />
                <input type="text" name="state" placeholder="State" value={currentClient.state} onChange={handleClientChange} />
                <input type="text" name="zip_code" placeholder="Zip Code" value={currentClient.zip_code} onChange={handleClientChange} />
                <input type="text" name="country" placeholder="Country" value={currentClient.country} onChange={handleClientChange} />
              </div>
              <button className="add-btn" onClick={addClient}>+ Add Client</button>

              <div className="items-list">
                <h4>Clients Added: {clients.length}</h4>
                {clients.map((client, idx) => (
                  <div key={client.id} className="item-card">
                    <div className="item-info">
                      <strong>{client.first_name} {client.last_name}</strong>
                      <p>{client.designation || client.title} - {client.email}</p>
                    </div>
                    <button className="remove-btn" onClick={() => removeClient(client.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Properties */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Add Properties</h3>
              <div className="form-grid">
                <div className="form-field">
                  <input type="text" name="property_name" placeholder="Property Name *" value={currentProperty.property_name} onChange={handlePropertyChange} required />
                  {propertyErrors.property_name && <span className="error-message">{propertyErrors.property_name}</span>}
                </div>
                <select name="property_type" value={currentProperty.property_type} onChange={handlePropertyChange}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
                <select name="property_status" value={currentProperty.property_status} onChange={handlePropertyChange}>
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="under_development">Under Development</option>
                </select>
                <div className="form-field">
                  <input type="text" name="address" placeholder="Address *" value={currentProperty.address} onChange={handlePropertyChange} required />
                  {propertyErrors.address && <span className="error-message">{propertyErrors.address}</span>}
                </div>
                <input type="text" name="city" placeholder="City" value={currentProperty.city} onChange={handlePropertyChange} />
                <input type="text" name="state" placeholder="State" value={currentProperty.state} onChange={handlePropertyChange} />
                <input type="text" name="zip_code" placeholder="Zip Code" value={currentProperty.zip_code} onChange={handlePropertyChange} />
                <input type="text" name="country" placeholder="Country" value={currentProperty.country} onChange={handlePropertyChange} />
                <input type="number" name="total_area" placeholder="Total Area" value={currentProperty.total_area} onChange={handlePropertyChange} />
                <select name="area_unit" value={currentProperty.area_unit} onChange={handlePropertyChange}>
                  <option value="sqft">sq ft</option>
                  <option value="sqm">sq m</option>
                </select>
                <input type="number" name="bedrooms" placeholder="Bedrooms" value={currentProperty.bedrooms} onChange={handlePropertyChange} />
                <input type="number" name="bathrooms" placeholder="Bathrooms" value={currentProperty.bathrooms} onChange={handlePropertyChange} />
                <input type="number" name="parking_spaces" placeholder="Parking Spaces" value={currentProperty.parking_spaces} onChange={handlePropertyChange} />
                <input type="number" name="construction_year" placeholder="Construction Year" value={currentProperty.construction_year} onChange={handlePropertyChange} />
                <select name="furnishing" value={currentProperty.furnishing} onChange={handlePropertyChange}>
                  <option value="unfurnished">Unfurnished</option>
                  <option value="semi_furnished">Semi-furnished</option>
                  <option value="furnished">Furnished</option>
                </select>
                <input type="number" name="purchase_price" placeholder="Purchase Price" value={currentProperty.purchase_price} onChange={handlePropertyChange} />
                <input type="number" name="estimated_value" placeholder="Estimated Value" value={currentProperty.estimated_value} onChange={handlePropertyChange} />
                <input type="number" name="rental_value" placeholder="Rental Value" value={currentProperty.rental_value} onChange={handlePropertyChange} />
                <input type="text" name="survey_number" placeholder="Survey Number" value={currentProperty.survey_number} onChange={handlePropertyChange} />
              </div>
              <button className="add-btn" onClick={addProperty}>+ Add Property</button>

              <div className="items-list">
                <h4>Properties Added: {properties.length}</h4>
                {properties.map((prop, idx) => (
                  <div key={prop.id} className="item-card">
                    <div className="item-info">
                      <strong>{prop.property_name}</strong>
                      <p>{prop.property_type} - {prop.address}, {prop.city}</p>
                      {prop.total_area && <p>Area: {prop.total_area} {prop.area_unit}</p>}
                    </div>
                    <button className="remove-btn" onClick={() => removeProperty(prop.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Owners */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Add Owners</h3>
              
              {properties.length === 0 ? (
                <p className="info-text">No properties added. Please go back and add at least one property.</p>
              ) : (
                <>
                  <div className="property-selector">
                    <label>Select Property for Owner *</label>
                    <select value={selectedPropertyId || ''} onChange={(e) => setSelectedPropertyId(Number(e.target.value))}>
                      <option value="">-- Select a property --</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.property_name} - {prop.address}
                        </option>
                      ))}
                    </select>
                    {ownerErrors.property_selection && <span className="error-message">{ownerErrors.property_selection}</span>}
                  </div>

                  <div className="form-grid">
                    <div className="form-field">
                      <input type="text" name="owner_name" placeholder="Owner Name *" value={currentOwner.owner_name} onChange={handleOwnerChange} required />
                      {ownerErrors.owner_name && <span className="error-message">{ownerErrors.owner_name}</span>}
                    </div>
                    <select name="owner_type" value={currentOwner.owner_type} onChange={handleOwnerChange}>
                      <option value="individual">Individual</option>
                      <option value="corporation">Corporation</option>
                      <option value="partnership">Partnership</option>
                    </select>
                    <input type="text" name="title" placeholder="Title" value={currentOwner.title} onChange={handleOwnerChange} />
                    <div className="form-field">
                      <input type="email" name="email" placeholder="Email *" value={currentOwner.email} onChange={handleOwnerChange} required />
                      {ownerErrors.email && <span className="error-message">{ownerErrors.email}</span>}
                    </div>
                    <input type="tel" name="phone" placeholder="Phone" value={currentOwner.phone} onChange={handleOwnerChange} />
                    <input type="tel" name="mobile" placeholder="Mobile" value={currentOwner.mobile} onChange={handleOwnerChange} />
                    <input type="text" name="address" placeholder="Address" value={currentOwner.address} onChange={handleOwnerChange} />
                    <input type="text" name="city" placeholder="City" value={currentOwner.city} onChange={handleOwnerChange} />
                    <input type="text" name="state" placeholder="State" value={currentOwner.state} onChange={handleOwnerChange} />
                    <input type="text" name="zip_code" placeholder="Zip Code" value={currentOwner.zip_code} onChange={handleOwnerChange} />
                    <input type="text" name="country" placeholder="Country" value={currentOwner.country} onChange={handleOwnerChange} />
                    <select name="id_type" value={currentOwner.id_type} onChange={handleOwnerChange}>
                      <option value="passport">Passport</option>
                      <option value="id_card">ID Card</option>
                      <option value="driving_license">Driving License</option>
                      <option value="other">Other</option>
                    </select>
                    <input type="text" name="id_number" placeholder="ID Number" value={currentOwner.id_number} onChange={handleOwnerChange} />
                    <input type="text" name="pan_number" placeholder="PAN/Tax ID" value={currentOwner.pan_number} onChange={handleOwnerChange} />
                    <input type="text" name="bank_account" placeholder="Bank Account" value={currentOwner.bank_account} onChange={handleOwnerChange} />
                    <input type="text" name="bank_name" placeholder="Bank Name" value={currentOwner.bank_name} onChange={handleOwnerChange} />
                  </div>
                  <button className="add-btn" onClick={addOwner}>+ Add Owner</button>

                  <div className="items-list">
                    <h4>Owners Added: {owners.length}</h4>
                    {owners.length === 0 ? (
                      <p className="info-text">No owners added yet.</p>
                    ) : (
                      owners.map((owner, idx) => {
                        const ownerProperty = properties.find(p => p.id === owner.property_id);
                        return (
                          <div key={owner.id} className="item-card">
                            <div className="item-info">
                              <strong>{owner.owner_name}</strong>
                              <p>{owner.owner_type} - {owner.email}</p>
                              {ownerProperty && <p className="property-tag">Property: {ownerProperty.property_name}</p>}
                            </div>
                            <button className="remove-btn" onClick={() => removeOwner(owner.id)}>Remove</button>
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
            onClick={() => {
              if (currentStep > 1) {
                setStepError('');
                setCurrentStep(currentStep - 1);
              }
            }}
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
                    if (!account.account_name.trim()) {
                      errors.account_name = 'Account name is required';
                    }
                    if (!account.email.trim()) {
                      errors.email = 'Email is required';
                    } else if (!/\S+@\S+\.\S+/.test(account.email)) {
                      errors.email = 'Please enter a valid email address';
                    }

                    setAccountErrors(errors);

                    if (Object.keys(errors).length === 0) {
                      setStepError('');
                      setCurrentStep(currentStep + 1);
                    }
                    return;
                  }
                  if (currentStep === 2 && clients.length === 0) {
                    setStepError('Please add at least one client before continuing.');
                    return;
                  }
                  if (currentStep === 3 && properties.length === 0) {
                    setStepError('Please add at least one property before continuing.');
                    return;
                  }
                  setStepError('');
                  setCurrentStep(currentStep + 1);
                }}
                disabled={isLoading}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn-success"
                onClick={() => {
                  if (owners.length === 0) {
                    setStepError('Please add at least one owner before saving.');
                    return;
                  }
                  setStepError('');
                  handleSubmit();
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save All'}
              </button>
            )}
            <button className="btn-cancel" onClick={() => { onClose(); resetForm(); }} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;
