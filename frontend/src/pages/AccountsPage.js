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
    // Refresh the account list
    setRefreshKey(prev => prev + 1);
    setIsModalOpen(false);
  };

  return (
    <div className="accounts-page">
      <div className="accounts-header">
        <h1>Accounts Management</h1>
        <button className="btn-add-account" onClick={handleAddClick}>
          + Add New Account
        </button>
      </div>

      <AccountList onAddClick={handleAddClick} refreshKey={refreshKey} />

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onSubmit={handleAccountSubmit}
      />
    </div>
  );
}

export default AccountsPage;
