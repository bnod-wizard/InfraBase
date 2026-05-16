import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { API_ENDPOINTS } from '../constants';
import '../styles/CustomerDetail.css';

/**
 * CustomerDetail Component - View, edit, and delete a customer
 */
function CustomerDetail({ customerId: customIdProp, onClose, isModal }) {
  const params = useParams();
  const customerId = customIdProp || params.customerId;
  const navigate = useNavigate();
  const { token } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(!customerId || customerId === 'new');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    website: '',
    industry: '',
    notes: '',
    status: 'active',
  });

  useEffect(() => {
    if (customerId && customerId !== 'new') {
      fetchCustomer();
    } else if (customerId === 'new') {
      setLoading(false);
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.CUSTOMERS}/${customerId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer');
      }

      const result = await response.json();
      setCustomer(result.data);
      setFormData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customer:', err);
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

    if (!formData.name || !formData.email || !formData.phone) {
      setError('Name, email, and phone are required fields');
      return;
    }

    try {
      const method = customerId && customerId !== 'new' ? 'PUT' : 'POST';
      const url =
        customerId && customerId !== 'new'
          ? `${API_ENDPOINTS.CUSTOMERS}/${customerId}`
          : API_ENDPOINTS.CUSTOMERS;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save customer');
      }

      const result = await response.json();
      setCustomer(result.data);
      setIsEditing(false);

      if (customerId === 'new') {
        if (isModal && onClose) {
          onClose();
        } else {
          navigate(`/home/customers/${result.data._id}`);
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Error saving customer:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.CUSTOMERS}/${customerId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      navigate('/home/customers');
    } catch (err) {
      setError(`Error deleting customer: ${err.message}`);
      console.error('Error deleting customer:', err);
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else if (customerId && customerId !== 'new') {
      setFormData(customer);
      setIsEditing(false);
    } else {
      navigate('/home/customers');
    }
  };

  const downloadPDF = (type) => {
    const url =
      type === 'letterhead'
        ? `${API_ENDPOINTS.CUSTOMERS}/${customerId}/pdf/letterhead`
        : type === 'cover'
        ? `${API_ENDPOINTS.CUSTOMERS}/${customerId}/pdf/cover`
        : `${API_ENDPOINTS.CUSTOMERS}/${customerId}/pdf/report`;

    fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${type}_${formData.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      })
      .catch((err) => {
        setError(`Error downloading ${type} PDF: ${err.message}`);
      });
  };

  if (loading) {
    return (
      <div className="customer-detail-container">
        <div className="loading">Loading customer...</div>
      </div>
    );
  }

  return (
    <div className="customer-detail-container">
      {!isModal && (
        <div className="topbar">
          <div className="crumbs">
            <span style={{color:'var(--ink-dim)',cursor:'pointer'}} onClick={() => navigate('/home/customers')}>Customers</span>
            <span style={{margin:'0 6px',color:'var(--ink-mute)'}}>/</span>
            <b>{isEditing ? 'New Customer' : formData.name}</b>
          </div>
          <div className="right">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/home/customers')}>← Back</button>
            {!isEditing && (
              <>
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>✏ Edit</button>
                <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete</button>
              </>
            )}
            {isEditing && (
              <>
                <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                <button className="btn" onClick={handleSave}>Save Customer</button>
              </>
            )}
          </div>
        </div>
      )}
      {isModal && (
        <h1 style={{ marginBottom: '20px', color: '#2c3e50' }}>
          {isEditing ? 'New Customer' : formData.name}
        </h1>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="detail-content">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter customer name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter email address"
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter company name"
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter job position"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Address Information</h2>
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter city"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter state/province"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter postal code"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter country"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter website URL"
              />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Enter industry type"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter additional notes"
              rows="4"
            />
          </div>
        </div>
      </div>

      <div className="detail-actions">
        {!isEditing && customerId && customerId !== 'new' && (
          <>
            <div className="pdf-buttons">
              <h3>Generate Documents</h3>
              <button
                className="btn btn-info"
                onClick={() => downloadPDF('letterhead')}
              >
                📄 Download Letterhead PDF
              </button>
              <button
                className="btn btn-info"
                onClick={() => downloadPDF('cover')}
              >
                📋 Download Cover PDF
              </button>
              <button
                className="btn btn-info"
                onClick={() => downloadPDF('report')}
              >
                📑 Download Report PDF
              </button>
            </div>
          </>
        )}

        <div className="action-buttons">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>
                💾 Save
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                ❌ Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Customer
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
              >
                🗑️ Delete Customer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerDetail;
