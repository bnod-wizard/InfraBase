import React, { useState, useEffect } from 'react';
import AccountList from '../components/AccountList';
import AccountModal from '../components/AccountModal';
import accountApi from '../services/accountApi';
import '../styles/AccountsPage.css';

const FILTERS = ['All', 'Active', 'Pending', 'Overdue', 'Closed', 'Added Today'];

const FILTER_KEY = 'accounts_filter';

const DOC_TEMPLATES = [
  { tag: 'Cover',    name: 'Cover Page',    pages: '1 page'    },
  { tag: 'Header',   name: 'Letterhead',    pages: '1 page'    },
  { tag: 'Proposal', name: 'Full Proposal', pages: '11 pages'  },
];

function AccountsPage() {
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [statusSummary, setStatusSummary] = useState({ total_accounts: 0, status_counts: {} });
  const [activeFilters, setActiveFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FILTER_KEY)) || []; } catch { return []; }
  });
  const [searchTerm,    setSearchTerm]    = useState('');

  const handleFilterToggle = f => {
    setActiveFilters(prev => {
      const next = prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f];
      localStorage.setItem(FILTER_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleAddClick      = () => setIsModalOpen(true);
  const handleCloseModal    = () => setIsModalOpen(false);
  const handleAccountSubmit = () => { setRefreshKey(k => k + 1); setIsModalOpen(false); };

  useEffect(() => {
    accountApi.getAccountStats()
      .then(res => {
        if (res.data.success)
          setStatusSummary({ total_accounts: 0, status_counts: {}, ...res.data.data });
      })
      .catch(() => {});
  }, []);

  const sc      = statusSummary.status_counts;
  const active  = sc.active  || 0;
  const pending = sc.pending || sc.review || 0;
  const overdue = sc.due     || sc.warn   || 0;

  const kpis = [
    { key: 'total',   variant: 'feature', icon: '▤', label: 'Total Accounts',  val: statusSummary.total_accounts, delta: 'Across all statuses',    deltaClass: '' },
    { key: 'active',  variant: 'ok',      icon: '✓', label: 'Active Accounts', val: active,                       delta: 'Currently active',         deltaClass: '' },
    { key: 'review',  variant: 'info',    icon: '⟳', label: 'In Review',       val: pending,                      delta: 'Awaiting approval',        deltaClass: 'dim' },
    { key: 'overdue', variant: 'warn',    icon: '!', label: 'Overdue',          val: overdue,                      delta: 'Needs immediate attention', deltaClass: 'warn' },
  ];

  const statusSideRows = [
    { cls: '',     label: 'Total accounts', note: statusSummary.total_accounts },
    { cls: 'ok',   label: 'Active',         note: active  },
    { cls: 'info', label: 'Pending',        note: pending },
    { cls: 'warn', label: 'Overdue',        note: overdue },
  ];

  return (
    <>
      {/* ── Topbar — matches Dashboard ── */}
      <div className="topbar">
        <div className="crumbs"><b>Customer Accounts</b></div>
        <div className="search">
          <span>⌕</span>
          <input
            placeholder="Search by name, email, tax ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              style={{background:'none',border:'none',color:'var(--ink-mute)',cursor:'pointer',padding:'0 2px',fontSize:'14px'}}
              onClick={() => setSearchTerm('')}
            >×</button>
          )}
        </div>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {FILTERS.map(f => {
            const key = f.toLowerCase().replace(/ /g, '-');
            return (
              <button
                key={f}
                className={`chip${activeFilters.includes(key) ? ' active' : ''}`}
                onClick={() => handleFilterToggle(key)}
              >{f}</button>
            );
          })}
          {activeFilters.length > 0 && (
            <button
              className="chip"
              style={{opacity:.55}}
              onClick={() => { setActiveFilters([]); localStorage.setItem(FILTER_KEY, JSON.stringify([])); }}
            >✕ Clear</button>
          )}
        </div>
        <button className="new-btn" onClick={handleAddClick}>＋ New Account</button>
      </div>

      {/* ── KPI row ── */}
      <div className="kpis" style={{marginTop:'28px'}}>
        {kpis.map(k => (
          <div key={k.key} className={`kpi${k.variant === 'feature' ? ' feature' : ''}`}>
            <span className="icon-tl">{k.icon}</span>
            <p className="lab">{k.label}</p>
            <div className={`val kpi-val-${k.variant}`}>{k.val}</div>
            <p className={`delta${k.deltaClass ? ' ' + k.deltaClass : ''}`}>{k.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div className="layout" style={{marginTop:'18px'}}>
        <div className="panel accounts-card">
          <AccountList
            onAddClick={handleAddClick}
            refreshKey={refreshKey}
            statusFilters={activeFilters}
            searchTerm={searchTerm}
          />
        </div>

        <div className="stack">
          {/* Document generation widget */}
          <div className="panel">
            <div className="doc-gen">
              <h3>Generate Document</h3>
              <p className="hint">Open any account to auto-fill and download valuation documents.</p>
              <div className="templates">
                {DOC_TEMPLATES.map(t => (
                  <div key={t.name} className="tpl">
                    <span className="tag">{t.tag}</span>
                    <b>{t.name}</b>
                    <span className="pages">{t.pages}</span>
                  </div>
                ))}
              </div>
              <button className="gen-btn" disabled>
                ⎙ Open an account to generate
              </button>
            </div>
          </div>

          {/* Account status summary */}
          <div className="panel">
            <div className="panel-head"><h3>Account Status</h3></div>
            <div className="activity">
              {statusSideRows.map(row => (
                <div key={row.label} className={`act${row.cls ? ' ' + row.cls : ''}`}>
                  <div className="swatch" />
                  <div className="body">
                    <b>{row.label}</b>
                    <small>{row.note}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleAccountSubmit}
      />
    </>
  );
}

export default AccountsPage;
