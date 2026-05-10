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

const parseUtc = iso => {
  if (!iso) return null;
  // Python's isoformat() has no 'Z'; without a tz suffix JS treats it as local — force UTC.
  const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  return new Date(s);
};

const formatDate = iso => {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 4) pages.push('…');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('…');
  pages.push(total);
  return pages;
}

function AccountList({ onAddClick, refreshKey, statusFilters = [], searchTerm = '', selectedAccountId, onAccountSelect }) {
  const navigate     = useNavigate();
  const [accounts,      setAccounts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [currentPage,   setCurrentPage]   = useState(1);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const itemsPerPage = 6;

  // Fetch accounts whenever page, search, or filters change
  useEffect(() => {
    fetchAccountsWithFilters();
  }, [refreshKey, currentPage, searchTerm, statusFilters]);

  const fetchAccountsWithFilters = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * itemsPerPage;
      const res = await accountApi.getAccountsFiltered(searchTerm, statusFilters, skip, itemsPerPage);
      if (res.data.success) {
        setAccounts(res.data.data.data || []);
        setTotalAccounts(res.data.data.total || 0);
      }
    } catch {
      setAccounts([]);
      setTotalAccounts(0);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilters]);

  const handleDelete = id => {
    if (!window.confirm('Delete this account?')) return;
    accountApi.deleteAccount(id).then(fetchAccountsWithFilters).catch(console.error);
  };

  const getInitials = name => {
    if (!name) return 'AA';
    const p = name.trim().split(' ');
    return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  // All filtering now happens at the database level, just sort and display
  const displayed = [...accounts]
    .sort((a, b) => (parseUtc(b.created_at) || 0) - (parseUtc(a.created_at) || 0));

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
                  <th style={{ width: 40 }}>Select</th>
                  <th>Account Name</th>
                  <th className="acct-phone">Phone</th>
                  <th className="acct-date">Date Added</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(account => (
                  <tr key={account._id} className={`${rowStatusClass(account.status)}${selectedAccountId === account._id ? ' selected' : ''}`}>
                    <td className="acct-select">
                      <input
                        type="radio"
                        name="accountSelect"
                        checked={selectedAccountId === account._id}
                        onChange={() => onAccountSelect && onAccountSelect(account._id, account.account_name)}
                      />
                    </td>
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
                    <td className="acct-phone">{account.phone || '—'}</td>
                    <td className="acct-date">{formatDate(account.created_at)}</td>
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
                {buildPageNumbers(currentPage, totalPages).map((item, i) =>
                  item === '…'
                    ? <span key={`e${i}`} className="pager-ellipsis">…</span>
                    : <button key={item} className={currentPage === item ? 'on' : ''} onClick={() => setCurrentPage(item)}>{item}</button>
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
