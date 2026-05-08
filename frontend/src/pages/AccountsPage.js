import React, { useState, useEffect } from 'react';
import AccountList from '../components/AccountList';
import AccountModal from '../components/AccountModal';
import '../styles/AccountsPage.css';

/**
 * Accounts Page - Main page for managing accounts
 */
function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAccountSubmit = (data) => {
    setRefreshKey((prev) => prev + 1);
    setIsModalOpen(false);
  };

  return (
    <div className="accounts-page page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Accounts management</h1>
          <p className="page-copy">Track, view and manage company accounts with client, owner, and property details.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleAddClick}>
            + Add New Account
          </button>
        </div>
      </div>

      <div className="page-grid">
        <div className="accounts-main">
          <div className="list-card">
            <AccountList onAddClick={handleAddClick} refreshKey={refreshKey} />
          </div>
        </div>

        <aside className="accounts-side">
          <div className="side-card">
            <p className="card-label">Quick actions</p>
            <div className="action-list">
              <button className="ghost-button">Filter accounts</button>
              <button className="ghost-button">Export data</button>
              <button className="ghost-button">Refresh list</button>
            </div>
          </div>
          <div className="side-card info-card">
            <p className="card-label">Accounts summary</p>
            <div className="summary-row">
              <div>
                <p>Total accounts</p>
                <h3>128</h3>
              </div>
            </div>
            <div className="summary-row">
              <div>
                <p>Active</p>
                <h3>94</h3>
              </div>
              <div>
                <p>Pending</p>
                <h3>18</h3>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAccountSubmit}
      />
    </div>
  );
}

export default AccountsPage;
