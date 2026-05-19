import React, { useState, useEffect, useCallback, useRef } from 'react';
import AccountList from '../components/AccountList';
import AccountModal from '../components/AccountModal';
import GenerateDocModal from '../components/GenerateDocModal';
import accountApi from '../services/accountApi';
import '../styles/AccountsPage.css';

const FILTER_KEY = 'accounts_filter';

// Each chip label is the exact status value stored in the DB
const STATUS_CHIPS = [
  'Prospect', 'In-Review', 'Approved', 'Bank Verification', 'Active', 'Lost',
];

const DOC_TEMPLATES = [
  { tag: 'Proposal', name: 'Full Proposal', pages: '11 pages'  },
];

const PILL_COLOR = {
  Prospect:           { bg: '#e7f3ff', color: '#1e4d8c' },
  'In-Review':        { bg: '#fff0ed', color: '#c2410c' },
  Approved:           { bg: '#e0f2f1', color: '#00695c' },
  'Bank Verification':{ bg: '#e7f3ff', color: '#1e4d8c' },
  Active:             { bg: '#e6f3ec', color: '#166534' },
  Lost:               { bg: '#fde3e0', color: '#991b1b' },
};

function FilterDropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = val =>
    onChange(selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]);

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-trigger${open ? ' open' : ''}${selected.length > 0 ? ' has-filters' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        ⊟ {selected.length > 0 ? `${selected.length} filter${selected.length > 1 ? 's' : ''} active` : 'Filter by status'}
        <span className="caret">▾</span>
      </button>

      {open && (
        <div className="filter-menu">
          {options.map(opt => (
            <label key={opt} className="filter-menu-item">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
              />
              <span
                className="status-dot"
                style={{ background: PILL_COLOR[opt]?.color || '#9ca3af' }}
              />
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <div className="filter-menu-footer">
              <button onClick={() => onChange([])}>Clear all</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountsPage() {
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [stats,         setStats]         = useState({ total_accounts: 0, active: 0, in_process: 0, lost: 0, status_counts: {} });
  const [activeFilters, setActiveFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FILTER_KEY)) || []; } catch { return []; }
  });
  const [searchTerm,    setSearchTerm]    = useState('');
  const [selectedAccountId,        setSelectedAccountId]        = useState(null);
  const [selectedAccountName,      setSelectedAccountName]      = useState('');
  const [selectedAccountHierarchy, setSelectedAccountHierarchy] = useState(null);
  const [selectedDocType,          setSelectedDocType]          = useState('');
  const [isDocModalOpen,           setIsDocModalOpen]           = useState(false);

  const loadStats = useCallback(() => {
    accountApi.getAccountStats()
      .then(res => { if (res.data.success) setStats(res.data.data); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadStats(); }, [loadStats, refreshKey]);

  const handleAddClick      = () => setIsModalOpen(true);
  const handleCloseModal    = () => setIsModalOpen(false);
  const handleAccountSubmit = () => { setRefreshKey(k => k + 1); setIsModalOpen(false); };

  const handleAccountSelect = (accountId, accountName) => {
    setSelectedAccountId(accountId);
    setSelectedAccountName(accountName);
  };

  const handleOpenDocModal = async () => {
    if (!selectedAccountId || !selectedDocType) return;
    setIsDocModalOpen(true);
    try {
      const res = await accountApi.getAccountHierarchy(selectedAccountId);
      if (res.data.success) setSelectedAccountHierarchy(res.data.data);
    } catch {
      setSelectedAccountHierarchy(null);
    }
  };

  const kpis = [
    { key: 'total',      variant: 'feature', icon: '▤', label: 'Total Accounts', val: stats.total_accounts, delta: 'Across all statuses',          deltaClass: '' },
    { key: 'active',     variant: 'ok',      icon: '✓', label: 'Active',         val: stats.active,         delta: 'Status = Active',               deltaClass: '' },
    { key: 'in_process', variant: 'info',    icon: '⟳', label: 'In-Process',     val: stats.in_process,     delta: 'Pipeline — excl. lost/archived', deltaClass: 'dim' },
    { key: 'lost',       variant: 'warn',    icon: '✕', label: 'Lost / Closed',  val: stats.lost,           delta: 'Lost, Deleted, Archived',        deltaClass: 'warn' },
  ];

  // Build sidebar rows from live status_counts
  const sideRows = STATUS_CHIPS.map(label => ({
    label,
    note: stats.status_counts[label] || 0,
    style: PILL_COLOR[label] || {},
  }));

  return (
    <>
      {/* ── Topbar ── */}
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

        <FilterDropdown
          options={STATUS_CHIPS}
          selected={activeFilters}
          onChange={next => {
            setActiveFilters(next);
            localStorage.setItem(FILTER_KEY, JSON.stringify(next));
          }}
        />

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
            selectedAccountId={selectedAccountId}
            onAccountSelect={handleAccountSelect}
          />
        </div>

        <div className="stack">
          {/* Document generation widget */}
          <div className="panel">
            <div className="doc-gen">
              <h3>Generate Document</h3>
              <p className="hint">Select one account and one document type, then open the generator.</p>
              <div className="templates">
                {DOC_TEMPLATES.map(t => (
                  <label key={t.name} className={`tpl${selectedDocType === t.tag.toLowerCase() ? ' selected' : ''}`}>
                    <input
                      type="radio"
                      name="documentType"
                      value={t.tag.toLowerCase()}
                      checked={selectedDocType === t.tag.toLowerCase()}
                      onChange={() => setSelectedDocType(t.tag.toLowerCase())}
                    />
                    <b>{t.name}</b>
                    <span className="pages">{t.pages}</span>
                  </label>
                ))}
              </div>
              <button
                className="gen-btn"
                disabled={!selectedAccountId || !selectedDocType}
                onClick={handleOpenDocModal}
              >
                ⎙ {selectedAccountId ? 'Open generator' : 'Select an account first'}
              </button>
            </div>
          </div>

          {/* Account status breakdown */}
          <div className="panel">
            <div className="panel-head"><h3>Account Status</h3></div>
            <div className="activity">
              <div className="act">
                <div className="swatch" />
                <div className="body"><b>Total</b><small>{stats.total_accounts} accounts</small></div>
              </div>
              {sideRows.map(row => (
                <div key={row.label} className="act">
                  <div className="swatch" style={{ background: row.style.color || 'var(--ink-dim)' }} />
                  <div className="body">
                    <b style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <span
                        style={{
                          display:'inline-block', padding:'2px 8px', borderRadius:'999px',
                          fontSize:'10px', fontWeight:700, fontFamily:'var(--mono)',
                          textTransform:'uppercase', background: row.style.bg, color: row.style.color
                        }}
                      >{row.label}</span>
                    </b>
                    <small>{row.note} account{row.note !== 1 ? 's' : ''}</small>
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
      <GenerateDocModal
        accountId={selectedAccountId}
        accountName={selectedAccountName || 'Account'}
        hierarchy={selectedAccountHierarchy}
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
    </>
  );
}

export default AccountsPage;
