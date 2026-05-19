import React, { useState, useEffect, useRef, useCallback } from 'react';
import usersApi from '../services/usersApi';
import '../styles/AccountModal.css';

const getInitials = name => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

function AssignReviewerModal({ isOpen, accountName, onConfirm, onCancel, loading }) {
  const [users,    setUsers]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [fetching, setFetching] = useState(false);
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) { setSearch(''); setSelected(null); setUsers([]); return; }
    setTimeout(() => inputRef.current?.focus(), 80);
    fetchUsers('');
  }, [isOpen]);

  const fetchUsers = useCallback(q => {
    setFetching(true);
    usersApi.search(q || undefined, 20)
      .then(res => { if (res.data?.success) setUsers(res.data.data || []); })
      .catch(() => setUsers([]))
      .finally(() => setFetching(false));
  }, []);

  const handleSearchChange = e => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchUsers(val.trim()), 250);
  };

  if (!isOpen) return null;

  return (
    <div className="account-modal-overlay">
      <div className="account-modal" style={{ maxWidth: 480, height: 'auto', maxHeight: 'calc(100vh - 32px)' }}>

        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">Review Assignment</p>
            <h2>Assign Reviewer</h2>
            {accountName && (
              <p style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2, fontFamily: 'var(--mono)' }}>
                {accountName}
              </p>
            )}
          </div>
          <div className="modal-header-right">
            <button className="close-btn" onClick={onCancel} disabled={loading}>✕</button>
          </div>
        </div>

        <div className="account-modal-content">
          <div className="form-step">
            {/* Search — topbar style */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 9, padding: '8px 12px',
              fontSize: 13, color: 'var(--ink-dim)',
            }}>
              <span style={{ flexShrink: 0, fontSize: 15 }}>⌕</span>
              <input
                ref={inputRef}
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name or email…"
                style={{
                  background: 'transparent', border: 0, outline: 0,
                  color: 'var(--ink)', width: '100%', font: 'inherit', fontSize: 13,
                }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); fetchUsers(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-mute)', padding: '0 2px', fontSize: 14, lineHeight: 1 }}
                >×</button>
              )}
            </div>

            {/* User list */}
            <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {fetching && (
                <p style={{ color: 'var(--ink-mute)', fontSize: 13, padding: '8px 0' }}>Searching…</p>
              )}
              {!fetching && users.length === 0 && (
                <p style={{ color: 'var(--ink-mute)', fontSize: 13, padding: '8px 0' }}>No users found.</p>
              )}
              {!fetching && users.map(u => {
                const isSelected = selected?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelected(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${isSelected ? 'var(--brand)' : 'var(--line)'}`,
                      background: isSelected ? 'rgba(31,58,46,0.05)' : 'var(--surface)',
                      transition: '.15s',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? 'var(--brand)' : 'var(--line)',
                      display: 'grid', placeItems: 'center',
                      color: isSelected ? '#fff' : 'var(--ink-dim)',
                      fontWeight: 700, fontSize: 12, fontFamily: 'var(--mono)',
                    }}>
                      {getInitials(u.username)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{u.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--mono)' }}>{u.email}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)', textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 99,
                      background: u.role === 'admin' ? '#1f3a2e22' : u.role === 'reviewer' ? '#e7f3ff' : '#f3f1f0',
                      color:      u.role === 'admin' ? 'var(--brand)'  : u.role === 'reviewer' ? '#1e4d8c'  : 'var(--ink-dim)',
                    }}>{u.role}</span>
                  </div>
                );
              })}
            </div>

            {selected && (
              <p style={{ fontSize: 12, color: 'var(--ok)', fontWeight: 600, marginTop: 6 }}>
                ✓ {selected.username} selected as reviewer
              </p>
            )}
          </div>
        </div>

        <div className="account-modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>← Cancel</button>
          <div className="button-group">
            <button
              className="btn-primary"
              disabled={!selected || loading}
              onClick={() => onConfirm(selected)}
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              {loading ? 'Assigning…' : 'Assign & Set In-Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignReviewerModal;
