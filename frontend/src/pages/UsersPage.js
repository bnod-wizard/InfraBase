import React, { useState, useEffect, useCallback } from 'react';
import usersApi from '../services/usersApi';
import AddUserModal from '../components/AddUserModal';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../hooks';
import { useToast } from '../context';
import '../styles/AccountList.css';
import '../styles/AccountsPage.css';

const PROTECTED_EMAIL = 'admin@infrabase.com';

const AVATAR_COLORS = [
  '#1f3a2e', '#3b6fb6', '#e8743b', '#7c3f8e',
  '#c0392b', '#166534', '#9c4a1a', '#1a5276',
];

const avatarColor = name => {
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const getInitials = name => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const parseUtc = iso => {
  if (!iso) return null;
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
  const pages = [1];
  if (current > 4) pages.push('…');
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push('…');
  pages.push(total);
  return pages;
}

const ITEMS_PER_PAGE = 6;

function UsersPage() {
  const { user }   = useAuth();
  const toast      = useToast();
  const isAdmin    = user?.role === 'admin';

  const [users,        setUsers]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editUser,     setEditUser]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [currentPage,  setCurrentPage]  = useState(1);

  const loadUsers = useCallback(() => {
    setLoading(true);
    usersApi.getAll()
      .then(res => { if (res.data?.success) setUsers(res.data.data || []); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Sort latest first, then filter
  const filtered = [...users]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .filter(u => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await usersApi.deleteUser(deleteTarget);
      if (res.data?.success) {
        toast('User deleted');
        loadUsers();
      } else {
        toast(res.data?.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount  = users.filter(u => u.role === 'user').length;

  const kpis = [
    { key: 'total',  variant: 'feature', icon: '▤', label: 'Total Users',    val: totalUsers, delta: 'All registered users'    },
    { key: 'admin',  variant: 'ok',      icon: '✓', label: 'Admins',         val: adminCount, delta: 'Role = Admin'             },
    { key: 'users',  variant: 'info',    icon: '◉', label: 'Regular Users',  val: userCount,  delta: 'Role = User'              },
  ];

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div className="crumbs"><b>Users</b></div>
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="Search by username, email, role…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', cursor: 'pointer', padding: '0 2px', fontSize: 14 }}
              onClick={() => setSearchTerm('')}
            >×</button>
          )}
        </div>
        {isAdmin && (
          <button className="new-btn" onClick={() => { setEditUser(null); setModalOpen(true); }}>＋ New User</button>
        )}
      </div>

      {/* ── KPI row ── */}
      <div className="kpis" style={{ marginTop: 28 }}>
        {kpis.map(k => (
          <div key={k.key} className={`kpi${k.variant === 'feature' ? ' feature' : ''}`}>
            <span className="icon-tl">{k.icon}</span>
            <p className="lab">{k.label}</p>
            <div className={`val kpi-val-${k.variant}`}>{k.val}</div>
            <p className="delta">{k.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className="layout" style={{ marginTop: 18, gridTemplateColumns: '1fr' }}>
        <div className="panel accounts-card">
          <ConfirmModal
            isOpen={!!deleteTarget}
            title="Delete user?"
            message="This will permanently delete the user account. This action cannot be undone."
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="danger"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-dim)' }}>Loading users…</div>
          ) : paginated.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-mute)' }}>
              No users found.{' '}
              {isAdmin && (
                <button
                  style={{ color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setModalOpen(true)}
                >
                  Add one
                </button>
              )}
            </div>
          ) : (
            <div className="account-list-wrap">
              <div style={{ overflowX: 'auto' }}>
                <table className="accounts" style={{ width: 'calc(100% - 48px)' }}>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th className="acct-date">Date Added</th>
                      {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(u => (
                      <tr key={u.id} className="status-ok">
                        <td>
                          <div className="cust">
                            <div className="av" style={{ background: avatarColor(u.username) }}>
                              {getInitials(u.username)}
                            </div>
                            <div>
                              <b>{u.username}</b>
                              <small>{u.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={`pill ${u.role === 'admin' ? 'ok' : 'review'}`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="acct-date">{formatDate(u.created_at)}</td>
                        {isAdmin && (
                          <td>
                            <div className="table-actions">
                              <button
                                className="icon-btn small"
                                title="Edit"
                                style={{ borderColor: '#2563eb', color: '#2563eb' }}
                                onClick={() => { setEditUser(u); setModalOpen(true); }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="icon-btn small"
                                title="Delete"
                                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                                onClick={() => setDeleteTarget(u.id)}
                                disabled={u.id === user?.id || u.email?.toLowerCase() === PROTECTED_EMAIL}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel-foot">
                Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
                {totalPages > 1 && (
                  <div className="pager">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</button>
                    {buildPageNumbers(currentPage, totalPages).map((p, i) =>
                      p === '…'
                        ? <span key={`e${i}`} className="pager-ellipsis">…</span>
                        : <button key={p} className={currentPage === p ? 'on' : ''} onClick={() => setCurrentPage(p)}>{p}</button>
                    )}
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <AddUserModal
          isOpen={modalOpen}
          editUser={editUser}
          canEditRole={isAdmin}
          onClose={() => { setModalOpen(false); setEditUser(null); }}
          onSuccess={loadUsers}
        />
      )}
    </>
  );
}

export default UsersPage;
