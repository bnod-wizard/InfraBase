import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import accountApi from '../services/accountApi';
import { useAuth } from '../hooks';
import { useToast } from '../context';
import '../styles/AccountsPage.css';
import '../styles/AccountList.css';

const parseUtc = iso => {
  if (!iso) return null;
  const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  return new Date(s);
};

const fmtDate = iso => {
  const d = parseUtc(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getInitials = name => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ── Modals ────────────────────────────────────────────────────────────────

function RejectModal({ isOpen, accountName, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="account-modal-overlay">
      <div className="account-modal" style={{ maxWidth: 440, height: 'auto' }}>
        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">Review Queue</p>
            <h2>Reject Account</h2>
            {accountName && <p style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2, fontFamily: 'var(--mono)' }}>{accountName}</p>}
          </div>
          <div className="modal-header-right">
            <button className="close-btn" onClick={onCancel} disabled={loading}>✕</button>
          </div>
        </div>
        <div className="account-modal-content">
          <div className="form-step">
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-dim)', marginBottom: 6, display: 'block' }}>
              Rejection reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={3}
              style={{ width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--line)', font: 'inherit', fontSize: 13 }}
              placeholder="Explain why this account is being rejected…"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="account-modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>← Cancel</button>
          <div className="button-group">
            <button
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: loading || !reason.trim() ? 'not-allowed' : 'pointer', opacity: loading || !reason.trim() ? 0.6 : 1 }}
              onClick={() => reason.trim() && onConfirm(reason)}
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ isOpen, accountName, onConfirm, onCancel, loading }) {
  const [note, setNote] = useState('');
  useEffect(() => { if (isOpen) setNote(''); }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="account-modal-overlay">
      <div className="account-modal" style={{ maxWidth: 440, height: 'auto' }}>
        <div className="account-modal-header">
          <div className="modal-header-left">
            <p className="modal-eyebrow">Review Queue</p>
            <h2>Approve Account</h2>
            {accountName && <p style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2, fontFamily: 'var(--mono)' }}>{accountName}</p>}
          </div>
          <div className="modal-header-right">
            <button className="close-btn" onClick={onCancel} disabled={loading}>✕</button>
          </div>
        </div>
        <div className="account-modal-content">
          <div className="form-step">
            <textarea
              rows={3}
              style={{ width: '100%', resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--line)', font: 'inherit', fontSize: 13 }}
              placeholder="Optional note…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="account-modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={loading}>← Cancel</button>
          <div className="button-group">
            <button className="btn-success" onClick={() => onConfirm(note)} disabled={loading}>
              {loading ? 'Approving…' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

function ReviewQueuePage() {
  const { user }  = useAuth();
  const toast     = useToast();
  const navigate  = useNavigate();

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [approving,  setApproving]  = useState(null); // { account_id, account_name }
  const [appLoading, setAppLoading] = useState(false);
  const [rejecting,  setRejecting]  = useState(null); // { account_id, account_name }
  const [rejLoading, setRejLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    accountApi.getMyAssignedReviews()
      .then(res => { if (res.data?.success) setItems(res.data.data || []); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(v => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      v.account_name?.toLowerCase().includes(q) ||
      v.reviewer_name?.toLowerCase().includes(q) ||
      v.assigned_by_name?.toLowerCase().includes(q)
    );
  });

  const handleApprove = async note => {
    if (!approving) return;
    setAppLoading(true);
    try {
      const res = await accountApi.approveReview(approving.account_id, note);
      if (res.data?.success) {
        toast(`${approving.account_name} approved`);
        setApproving(null);
        load();
      } else {
        toast(res.data?.message || 'Failed to approve', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setAppLoading(false);
    }
  };

  const handleReject = async reason => {
    if (!rejecting) return;
    setRejLoading(true);
    try {
      const res = await accountApi.rejectReview(rejecting.account_id, reason);
      if (res.data?.success) {
        toast(`${rejecting.account_name} rejected`);
        setRejecting(null);
        load();
      } else {
        toast(res.data?.message || 'Failed to reject', 'error');
      }
    } catch {
      toast('Network error', 'error');
    } finally {
      setRejLoading(false);
    }
  };

  const pendingCount   = items.filter(i => i.status === 'pending').length;
  const approvedCount  = items.filter(i => i.status === 'approved').length;
  const rejectedCount  = items.filter(i => i.status === 'rejected').length;
  const role = user?.role || 'user';

  const kpis = [
    { label: 'Assigned to Me',  val: items.length,    variant: 'feature', icon: '◈' },
    { label: 'Pending Review',  val: pendingCount,    variant: 'warn',    icon: '⏳' },
    { label: 'Approved',        val: approvedCount,   variant: 'ok',      icon: '✓' },
    { label: 'Rejected',        val: rejectedCount,   variant: 'due',     icon: '✕' },
  ];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="crumbs"><b>Review Queue</b></div>
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="Search by account, reviewer…"
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
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginTop: 28 }}>
        {kpis.map(k => (
          <div key={k.label} className={`kpi${k.variant === 'feature' ? ' feature' : ''}`}>
            <span className="icon-tl">{k.icon}</span>
            <p className="lab">{k.label}</p>
            <div className={`val kpi-val-${k.variant}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="layout" style={{ marginTop: 18, gridTemplateColumns: '1fr' }}>
        <div className="panel accounts-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-dim)' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-mute)' }}>
              No accounts assigned for review.
            </div>
          ) : (
            <div className="account-list-wrap">
              <div style={{ overflowX: 'auto' }}>
                <table className="accounts" style={{ width: 'calc(100% - 48px)' }}>
                  <thead>
                    <tr>
                      <th>Account</th>
                      <th>Reviewer</th>
                      <th>Assigned By</th>
                      <th>Status</th>
                      <th className="acct-date">Assigned On</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.review_id} className={item.status === 'approved' ? 'status-ok' : item.status === 'rejected' ? 'status-due' : 'status-review'}>
                        <td>
                          <div className="cust" style={{ cursor: 'pointer' }} onClick={() => navigate(`/home/accounts/${item.account_id}`)}>
                            <div className="av" style={{ background: 'var(--brand)', color: 'var(--accent)', fontWeight: 700, fontSize: 12, fontFamily: 'var(--mono)' }}>
                              {getInitials(item.account_name)}
                            </div>
                            <div>
                              <b>
                                {item.account_name || <span style={{ color: 'var(--ink-mute)', fontWeight: 400, fontStyle: 'italic' }}>Unnamed account</span>}
                              </b>
                              <small style={{ color: 'var(--ink-dim)', fontSize: 11 }}>
                                {item.account_status || '—'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{item.reviewer_name || '—'}</td>
                        <td style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{item.assigned_by_name || '—'}</td>
                        <td>
                          <span className={`pill ${item.status === 'approved' ? 'ok' : item.status === 'rejected' ? 'due' : 'warn'}`}>
                            {item.status === 'approved' ? 'Approved' : item.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="acct-date">{fmtDate(item.assigned_at)}</td>
                        <td>
                          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="icon-btn small"
                              title="View account"
                              style={{ borderColor: '#2563eb', color: '#2563eb' }}
                              onClick={() => navigate(`/home/accounts/${item.account_id}`)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            </button>
                            {item.status === 'pending' && (role === 'reviewer' || role === 'admin') && (
                              <>
                                <button
                                  className="icon-btn small"
                                  title="Approve"
                                  style={{ borderColor: '#16a34a', color: '#16a34a', width: 'auto', padding: '0 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600 }}
                                  onClick={() => setApproving({ account_id: item.account_id, account_name: item.account_name })}
                                >
                                  Approve
                                </button>
                                <button
                                  className="icon-btn small"
                                  title="Reject"
                                  style={{ borderColor: '#dc2626', color: '#dc2626', width: 'auto', padding: '0 10px', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600 }}
                                  onClick={() => setRejecting({ account_id: item.account_id, account_name: item.account_name })}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="panel-foot">
                {filtered.length} assignment{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>

      <ApproveModal
        isOpen={!!approving}
        accountName={approving?.account_name}
        loading={appLoading}
        onConfirm={handleApprove}
        onCancel={() => setApproving(null)}
      />
      <RejectModal
        isOpen={!!rejecting}
        accountName={rejecting?.account_name}
        loading={rejLoading}
        onConfirm={handleReject}
        onCancel={() => setRejecting(null)}
      />
    </>
  );
}

export default ReviewQueuePage;
