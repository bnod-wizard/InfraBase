import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import '../styles/AccountList.css';

/**
 * Account List Component - Displays all accounts in a table
 */
function AccountList({ onAddClick, refreshKey }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const itemsPerPage = 10;

  // Fetch accounts on component mount and when refreshKey changes
  useEffect(() => {
    fetchAccounts();
  }, [refreshKey, currentPage]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await accountApi.getAllAccounts(skip, itemsPerPage);
      
      if (response.data.success) {
        setAccounts(response.data.data.data || []);
        setTotalAccounts(response.data.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1);

    if (term.length < 2) {
      fetchAccounts();
      return;
    }

    try {
      setLoading(true);
      const response = await accountApi.searchAccounts(term, 0, itemsPerPage);
      
      if (response.data.success) {
        setAccounts(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error searching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      accountApi.deleteAccount(accountId)
        .then(() => {
          fetchAccounts();
        })
        .catch((error) => {
          console.error('Error deleting account:', error);
          // Error handling can be improved with a toast notification system
        });
    }
  };

  const totalPages = Math.ceil(totalAccounts / itemsPerPage);

  if (loading && accounts.length === 0) {
    return <div className="loading">Loading accounts...</div>;
  }

  return (
    <div className="account-list-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search accounts (name, email, tax ID)..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {accounts.length === 0 ? (
        <div className="no-data">
          <p>No accounts found. Click "Add New Account" to create one.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="account-table">
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Business Type</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account._id}>
                    <td className="account-name">
                      <button
                        className="account-link-button"
                        onClick={() => navigate(`/home/accounts/${account._id}`)}
                      >
                        {account.account_name}
                      </button>
                    </td>
                    <td>{account.email}</td>
                    <td>{account.phone || '-'}</td>
                    <td>{account.business_type || '-'}</td>
                    <td>{account.city || '-'}</td>
                    <td>
                      <span className={`status-badge ${account.status}`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="btn-icon"
                        title="View Details"
                        aria-label="View account"
                        onClick={() => navigate(`/home/accounts/${account._id}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Delete"
                        aria-label="Delete account"
                        onClick={() => handleDeleteAccount(account._id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                ← First
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ← Prev
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
              <button
                className="page-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AccountList;
