import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import '../styles/AccountDetail.css';

function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
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
    country: '',
    logo_url: '',
    status: 'active',
    created_by: '',
    created_at: '',
    updated_at: ''
  });
  const [activeObjectEdit, setActiveObjectEdit] = useState({ type: null, id: null, data: null });

  const clientFields = [
    { accessor: 'first_name', label: 'First Name' },
    { accessor: 'last_name', label: 'Last Name' },
    { accessor: 'title', label: 'Title' },
    { accessor: 'designation', label: 'Designation' },
    { accessor: 'email', label: 'Email' },
    { accessor: 'phone', label: 'Phone' },
    { accessor: 'mobile', label: 'Mobile' },
    { accessor: 'fax', label: 'Fax' },
    { accessor: 'address', label: 'Address' },
    { accessor: 'city', label: 'City' },
    { accessor: 'state', label: 'State' },
    { accessor: 'zip_code', label: 'Zip Code' },
    { accessor: 'country', label: 'Country' },
    { accessor: 'notes', label: 'Notes' },
    { accessor: 'status', label: 'Status' }
  ];

  const propertyFields = [
    { accessor: 'property_name', label: 'Property Name' },
    { accessor: 'property_type', label: 'Property Type' },
    { accessor: 'property_status', label: 'Status' },
    { accessor: 'address', label: 'Address' },
    { accessor: 'city', label: 'City' },
    { accessor: 'state', label: 'State' },
    { accessor: 'zip_code', label: 'Zip Code' },
    { accessor: 'country', label: 'Country' },
    { accessor: 'latitude', label: 'Latitude' },
    { accessor: 'longitude', label: 'Longitude' },
    { accessor: 'total_area', label: 'Total Area' },
    { accessor: 'area_unit', label: 'Area Unit' },
    { accessor: 'built_area', label: 'Built Area' },
    { accessor: 'carpet_area', label: 'Carpet Area' },
    { accessor: 'land_area', label: 'Land Area' },
    { accessor: 'number_of_units', label: 'Units' },
    { accessor: 'bedrooms', label: 'Bedrooms' },
    { accessor: 'bathrooms', label: 'Bathrooms' },
    { accessor: 'parking_spaces', label: 'Parking Spaces' },
    { accessor: 'construction_year', label: 'Construction Year' },
    { accessor: 'property_age', label: 'Property Age' },
    { accessor: 'facing', label: 'Facing' },
    { accessor: 'furnishing', label: 'Furnishing' },
    { accessor: 'amenities', label: 'Amenities' },
    { accessor: 'landmark', label: 'Landmark' },
    { accessor: 'survey_number', label: 'Survey Number' },
    { accessor: 'property_id_number', label: 'Property ID' },
    { accessor: 'purchase_price', label: 'Purchase Price' },
    { accessor: 'estimated_value', label: 'Estimated Value' },
    { accessor: 'rental_value', label: 'Rental Value' },
    { accessor: 'currency', label: 'Currency' },
    { accessor: 'documents', label: 'Documents' },
    { accessor: 'photos', label: 'Photos' },
    { accessor: 'notes', label: 'Notes' }
  ];

  const ownerFields = [
    { accessor: 'owner_name', label: 'Owner Name' },
    { accessor: 'owner_type', label: 'Owner Type' },
    { accessor: 'title', label: 'Title' },
    { accessor: 'email', label: 'Email' },
    { accessor: 'phone', label: 'Phone' },
    { accessor: 'mobile', label: 'Mobile' },
    { accessor: 'fax', label: 'Fax' },
    { accessor: 'address', label: 'Address' },
    { accessor: 'city', label: 'City' },
    { accessor: 'state', label: 'State' },
    { accessor: 'zip_code', label: 'Zip Code' },
    { accessor: 'country', label: 'Country' },
    { accessor: 'id_type', label: 'ID Type' },
    { accessor: 'id_number', label: 'ID Number' },
    { accessor: 'pan_number', label: 'PAN Number' },
    { accessor: 'bank_account', label: 'Bank Account' },
    { accessor: 'bank_name', label: 'Bank Name' },
    { accessor: 'ifsc_code', label: 'IFSC Code' },
    { accessor: 'notes', label: 'Notes' },
    { accessor: 'status', label: 'Status' }
  ];

  const accountFields = [
    { accessor: 'account_name', label: 'Account Name' },
    { accessor: 'email', label: 'Email' },
    { accessor: 'phone', label: 'Phone' },
    { accessor: 'business_type', label: 'Business Type' },
    { accessor: 'company_registration', label: 'Company Reg.' },
    { accessor: 'registration_number', label: 'Registration No.' },
    { accessor: 'tax_id', label: 'Tax ID' },
    { accessor: 'website', label: 'Website' },
    { accessor: 'address', label: 'Address', fullWidth: true },
    { accessor: 'city', label: 'City' },
    { accessor: 'state', label: 'State' },
    { accessor: 'zip_code', label: 'Zip Code' },
    { accessor: 'country', label: 'Country' },
    { accessor: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'prospect'] }
  ];

  const renderFieldInput = (field) => {
    const value = formData[field.accessor] || '';

    if (field.type === 'select') {
      return (
        <select
          name={field.accessor}
          value={value}
          onChange={handleInputChange}
          disabled={!isEditing}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type || 'text'}
        name={field.accessor}
        value={value}
        onChange={handleInputChange}
        disabled={!isEditing}
      />
    );
  };

  const renderAccountInfo = () => (
    <div className="detail-section compact-section">
      <div className="section-header">
        <h2>Account Information</h2>
        <div className="section-actions">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              ✏️ Edit Account
            </button>
          )}
        </div>
      </div>
      <div className="object-card">
        <div className="object-card-header">
          <div>
            <strong>{formData.account_name || 'Account'}</strong>
          </div>
          <div className="object-card-status">{formData.status || '-'}</div>
        </div>
        <div className="object-grid account-info-grid">
          {accountFields.map((field) => (
            <div
              key={field.accessor}
              className={`field-row${field.fullWidth ? ' full-width' : ''}`}
            >
              <span className="field-key">{field.label}</span>
              {isEditing ? (
                renderFieldInput(field)
              ) : (
                <span className="field-value">{renderValue(formData[field.accessor])}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (accountId) {
      fetchAccountHierarchy();
    }
  }, [accountId]);

  const fetchAccountHierarchy = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await accountApi.getAccountHierarchy(accountId);
      if (response.data?.success) {
        const payload = response.data.data;
        setHierarchy(payload);
        setFormData(payload.account || {});
      } else {
        setError(response.data?.message || 'Unable to load account details.');
      }
    } catch (err) {
      console.error('Error fetching account hierarchy:', err);
      setError('Failed to load account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.account_name || !formData.email) {
      setError('Account name and email are required.');
      return;
    }

    try {
      const response = await accountApi.updateAccount(accountId, formData);
      if (response.data?.success) {
        const updatedAccount = response.data.data;
        setHierarchy((prev) => ({
          ...prev,
          account: updatedAccount,
        }));
        setFormData(updatedAccount);
        setIsEditing(false);
      } else {
        setError(response.data?.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Error saving account:', err);
      setError('Failed to save account changes.');
    }
  };

  const handleCancel = () => {
    setError(null);
    if (hierarchy?.account) {
      setFormData(hierarchy.account);
    }
    setIsEditing(false);
  };

  const handleObjectEditChange = (name, value) => {
    setActiveObjectEdit((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [name]: value,
      },
    }));
  };

  const startObjectEdit = (type, item) => {
    setActiveObjectEdit({
      type,
      id: item._id || item.id || null,
      data: { ...item },
    });
  };

  const cancelObjectEdit = () => {
    setActiveObjectEdit({ type: null, id: null, data: null });
  };

  const saveObjectEdit = () => {
    if (!activeObjectEdit.type || !activeObjectEdit.id) {
      cancelObjectEdit();
      return;
    }

    setHierarchy((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const list = Array.isArray(prev[activeObjectEdit.type]) ? prev[activeObjectEdit.type] : [];
      updated[activeObjectEdit.type] = list.map((item) =>
        (item._id || item.id) === activeObjectEdit.id ? activeObjectEdit.data : item
      );
      return updated;
    });

    setActiveObjectEdit({ type: null, id: null, data: null });
  };

  const renderObjectFieldInput = (field, value) => {
    if (field.type === 'select') {
      return (
        <select
          name={field.accessor}
          value={value || ''}
          onChange={(e) => handleObjectEditChange(field.accessor, e.target.value)}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type || 'text'}
        name={field.accessor}
        value={value || ''}
        onChange={(e) => handleObjectEditChange(field.accessor, e.target.value)}
      />
    );
  };

  const renderValue = (value) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    if (Array.isArray(value)) {
      return value.length ? value.join(', ') : '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getObjectHeader = (item, headerLabel, title) => {
    if (headerLabel === 'first_name') {
      const name = `${item.first_name || ''} ${item.last_name || ''}`.trim();
      return name || title;
    }
    return item[headerLabel] || title;
  };

  const renderObjects = (title, items, fields, headerLabel) => {
    const type = title.toLowerCase();

    return (
      <div className="detail-section compact-section">
        <div className="section-header">
          <h2>{title}</h2>
        </div>
        {items && items.length > 0 ? (
          <div className="object-list">
            {items.map((item) => {
              const itemId = item._id || item.id || null;
              const isEditingItem =
                activeObjectEdit.type === type && activeObjectEdit.id === itemId;
              const objectData = isEditingItem ? activeObjectEdit.data : item;

              return (
                <div key={itemId || Math.random()} className="object-card">
                  <div className="object-card-header">
                    <div>
                      <strong>{getObjectHeader(item, headerLabel, title.slice(0, -1))}</strong>
                    </div>
                    <div className="object-card-actions">
                      {isEditingItem ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={saveObjectEdit}>
                            Save
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={cancelObjectEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => startObjectEdit(type, item)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="object-grid">
                    {fields.map((field) => (
                      <div key={`${itemId}-${field.accessor}`} className="field-row">
                        <span className="field-key">{field.label}</span>
                        {isEditingItem ? (
                          renderObjectFieldInput(field, objectData[field.accessor])
                        ) : (
                          <span className="field-value">
                            {renderValue(objectData[field.accessor])}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">No {title.toLowerCase()} found for this account.</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-container">
          <div className="loading">Loading account details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-detail-page">
        <div className="account-detail-container">
          <div className="detail-header">
            <button className="btn btn-secondary btn-back" onClick={() => navigate('/home/accounts')}>
              ← Back to Accounts
            </button>
            <div>
              <h1>Account detail</h1>
              <p className="subtitle">There was an issue loading this account.</p>
            </div>
          </div>
          <div className="error-message">⚠️ {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-detail-page">
      <div className="account-detail-container">
        <div className="detail-header">
          <button className="btn btn-secondary btn-back" onClick={() => navigate('/home/accounts')}>
            ← Back to Accounts
          </button>
          <div>
            <h1>{formData.account_name || 'Account details'}</h1>
            <p className="subtitle">View and edit the full account hierarchy: account, clients, properties, owners.</p>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-main">
            <div className="main-card account-info-card">
              {renderAccountInfo()}
              <div className="account-meta-grid">
                <div className="meta-item">
                  <span className="meta-key">Created By</span>
                  <span className="meta-value">{renderValue(formData.created_by)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Created At</span>
                  <span className="meta-value">{formatDate(formData.created_at)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-key">Updated At</span>
                  <span className="meta-value">{formatDate(formData.updated_at)}</span>
                </div>
              </div>
              {error && <div className="error-message">⚠️ {error}</div>}
            </div>

            <div className="main-card object-box">
              {renderObjects('Clients', hierarchy.clients, clientFields, 'first_name')}
            </div>

            <div className="main-card object-box">
              {renderObjects('Properties', hierarchy.properties, propertyFields, 'property_name')}
            </div>

            <div className="main-card object-box">
              {renderObjects('Owners', hierarchy.owners, ownerFields, 'owner_name')}
            </div>
          </div>

          <aside className="detail-side">
            <div className="side-card">
              <p className="card-label">Account summary</p>
              <div className="summary-row single">
                <div>
                  <p>Account</p>
                  <h3>{formData.account_name || '-'}</h3>
                </div>
              </div>
              <div className="summary-row single">
                <div>
                  <p>Clients</p>
                  <h3>{hierarchy.clients?.length ?? 0}</h3>
                </div>
              </div>
              <div className="summary-row single">
                <div>
                  <p>Properties</p>
                  <h3>{hierarchy.properties?.length ?? 0}</h3>
                </div>
              </div>
              <div className="summary-row single">
                <div>
                  <p>Owners</p>
                  <h3>{hierarchy.owners?.length ?? 0}</h3>
                </div>
              </div>
            </div>
            <div className="side-card">
              <p className="card-label">Quick info</p>
              <div className="info-row">
                <span>Status</span>
                <strong>{formData.status || '-'}</strong>
              </div>
              <div className="info-row">
                <span>Tax ID</span>
                <strong>{renderValue(formData.tax_id)}</strong>
              </div>
              <div className="info-row">
                <span>City</span>
                <strong>{renderValue(formData.city)}</strong>
              </div>
              <div className="info-row">
                <span>Country</span>
                <strong>{renderValue(formData.country)}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AccountDetail;
