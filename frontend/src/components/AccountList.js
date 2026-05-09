import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import '../styles/AccountList.css';

const AVATAR_COLORS = [
  '#1f3a2e', '#3b6fb6', '#e8743b', '#7c3f8e',
  '#c0392b', '#166534', '#9c4a1a', '#1a5276',
];

const avatarColor = name => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const pillClass = status => {
  const s = (status || '').toLowerCase();
  if (s === 'active')                        return 'ok';
  if (s === 'pending' || s === 'review' || s === 'in review') return 'review';
  if (s === 'overdue' || s === 'due')        return 'due';
  if (s === 'inactive' || s === 'closed')    return 'draft';
  return 'draft';
};

const rowStatusClass = status => {
  const s = (status || '').toLowerCase();
  if (s === 'active')                        return 'status-ok';
  if (s === 'pending' || s === 'review')     return 'status-review';
  if (s === 'overdue' || s === 'due')        return 'status-due';
  return 'status-draft';
};

function AccountList({ onAddClick, refreshKey, statusFilter = 'all', searchTerm = '' }) {
  const navigate     = useNavigate();
  const [accounts,      setAccounts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => { fetchAccounts(); }, [refreshKey, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    if (searchTerm.length >= 2) {
      setLoading(true);
      accountApi.searchAccounts(searchTerm, 0, itemsPerPage)
        .then(res => { if (res.data.success) setAccounts(res.data.data.data || []); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (searchTerm.length === 0) {
      fetchAccounts();
    }
  }, [searchTerm]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const res  = await accountApi.getAllAccounts(skip, itemsPerPage);
      if (res.data.success) {
        setAccounts(res.data.data.data || []);
        setTotalAccounts(res.data.data.total || 0);
      }
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = id => {
    if (!window.confirm('Delete this account?')) return;
    accountApi.deleteAccount(id).then(fetchAccounts).catch(console.error);
  };

  const getInitials = name => {
    if (!name) return 'AA';
    const p = name.trim().split(' ');
    return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const displayed = (statusFilter === 'all' || !statusFilter)
    ? accounts
    : accounts.filter(a => (a.status || '').toLowerCase() === statusFilter.toLowerCase());

  const totalPages = Math.ceil(totalAccounts / itemsPerPage);

  if (loading && accounts.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-dim)' }}>Loading accounts…</div>;
  }

  return (
    <div className="account-list-wrap">
      {displayed.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-mute)' }}>
          No accounts found.{' '}
          <button style={{ color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onClick={onAddClick}>
            Add one
          </button>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table className="accounts" style={{ width: 'calc(100% - 48px)' }}>
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th className="acct-email">Email</th>
                  <th className="acct-phone">Phone</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(account => (
                  <tr key={account._id} className={rowStatusClass(account.status)}>
                    <td>
                      <div className="cust">
                        <div
                          className="av"
                          style={{ background: avatarColor(account.account_name) }}
                        >
                          {getInitials(account.account_name)}
                        </div>
                        <div>
                          <b
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/home/accounts/${account._id}`)}
                          >
                            {account.account_name}
                          </b>
                          <small>{account.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="acct-email">{account.email || '—'}</td>
                    <td className="acct-phone">{account.phone || '—'}</td>
                    <td>
                      <span className={`pill ${pillClass(account.status)}`}>
                        {account.status || 'draft'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-btn small"
                          title="View"
                          onClick={() => navigate(`/home/accounts/${account._id}`)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        <button
                          className="icon-btn small"
                          title="Delete"
                          onClick={() => handleDelete(account._id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel-foot">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalAccounts)}–{Math.min(currentPage * itemsPerPage, totalAccounts)} of {totalAccounts} accounts
            {totalPages > 1 && (
              <div className="pager">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                  <button key={n} className={currentPage === n ? 'on' : ''} onClick={() => setCurrentPage(n)}>{n}</button>
                ))}
                {totalPages > 5 && <button disabled>…</button>}
                {totalPages > 5 && (
                  <button className={currentPage === totalPages ? 'on' : ''} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                )}
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AccountList;
