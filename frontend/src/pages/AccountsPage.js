import React, { useState, useEffect } from 'react';
import AccountList from '../components/AccountList';
import AccountModal from '../components/AccountModal';
import accountApi from '../services/accountApi';
import '../styles/AccountsPage.css';

/**
 * Accounts Page - Main page for managing accounts
 */
function AccountsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusSummary, setStatusSummary] = useState({ total_accounts: 0, status_counts: {} });

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

  const statusCards = [
    {
      key: 'total',
      title: 'Total accounts',
      value: statusSummary.total_accounts,
      note: 'Included across all statuses',
      variant: 'feature',
      icon: '▤'
    },
    {
      key: 'active',
      title: 'Active accounts',
      value: statusSummary.status_counts.active || 0,
      note: 'Currently active',
      variant: 'ok',
      icon: '✓'
    },
    {
      key: 'review',
      title: 'In review',
      value: statusSummary.status_counts.review || statusSummary.status_counts.pending || 0,
      note: 'Awaiting approval',
      variant: 'info',
      icon: '⟳'
    },
    {
      key: 'overdue',
      title: 'Overdue accounts',
      value: statusSummary.status_counts.due || statusSummary.status_counts.warn || 0,
      note: 'Needs immediate attention',
      variant: 'warn',
      icon: '!'
    }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await accountApi.getAccountStats();
        if (response.data.success) {
          setStatusSummary({ total_accounts: 0, status_counts: {}, ...response.data.data });
        }
      } catch (error) {
        console.error('Error fetching account stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="accounts-page page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1>Accounts management</h1>
          <p className="page-copy">Track, view and manage company accounts with client, owner, and property details.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleAddClick}>
            + Add New Account
          </button>
        </div>
      </div>

      <div className="status-grid">
        {statusCards.map((card) => (
          <div key={card.key} className={`status-card ${card.variant}`}>
            <div className="status-card-head">
              <p>{card.title}</p>
              <div className="status-card-icon">{card.icon}</div>
            </div>
            <div className="status-card-value">{card.value}</div>
            <div className="status-card-note">{card.note}</div>
          </div>
        ))}
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
            <p className="card-label">Account status summary</p>
            <div className="summary-row">
              <div>
                <p>Total accounts</p>
                <h3>{statusSummary.total_accounts}</h3>
              </div>
            </div>
            <div className="summary-row">
              <div>
                <p>Active</p>
                <h3>{statusSummary.status_counts.active || 0}</h3>
              </div>
              <div>
                <p>Pending</p>
                <h3>{statusSummary.status_counts.pending || statusSummary.status_counts.review || 0}</h3>
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
