import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { API_ENDPOINTS } from '../constants';
import '../styles/CustomerList.css';

/**
 * CustomerList Component - Displays all customers in a table
 */
function CustomerList({ onAddClick, refreshKey }) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchCustomers();
  }, [page, statusFilter, refreshKey]);

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const skip = page * ITEMS_PER_PAGE;
      let url = `${API_ENDPOINTS.CUSTOMERS}?skip=${skip}&limit=${ITEMS_PER_PAGE}`;

      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const result = await response.json();
      setCustomers(result.data.customers);
      setTotalCount(result.data.total_count);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.CUSTOMERS}/search?q=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search customers');
      }

      const result = await response.json();
      setCustomers(result.data);
      setTotalCount(result.data.length);
      setPage(0);
    } catch (err) {
      setError(err.message);
      console.error('Error searching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(0);
    fetchCustomers();
  };

  const handleAddCustomer = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      navigate('/home/customers/new');
    }
  };

  const handleViewCustomer = (customerId) => {
    navigate(`/home/customers/${customerId}`);
  };

  const handleDeleteCustomer = async (customerId) => {
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

      // Refresh the list
      fetchCustomers();
    } catch (err) {
      setError(`Error deleting customer: ${err.message}`);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="customer-list-container">
      <div className="customer-list-header">
        <h1>Customers</h1>
        <button
          className="btn btn-primary"
          onClick={handleAddCustomer}
        >
          ➕ Add New Customer
        </button>
      </div>

      <div className="customer-list-filters">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name, email, company, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-search">
            🔍 Search
          </button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>

        <div className="filter-group">
          <label>Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <p>No customers found. Start by adding a new customer!</p>
          <button className="btn btn-primary" onClick={handleAddCustomer}>
            ➕ Add Your First Customer
          </button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="cell-name">{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.company || '-'}</td>
                    <td>
                      <span className={`status-badge status-${customer.status}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => handleViewCustomer(customer._id)}
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteCustomer(customer._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="btn btn-secondary"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {page + 1} of {totalPages || 1} ({totalCount} total customers)
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="btn btn-secondary"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CustomerList;
