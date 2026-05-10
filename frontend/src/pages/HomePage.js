import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccountsPage from './AccountsPage';
import AccountDetailPage from './AccountDetailPage';
import AccountModal from '../components/AccountModal';
import TemplatesPage from './TemplatesPage';
import TemplateBuilder from '../components/TemplateBuilder';
import accountApi from '../services/accountApi';

const HomePage = () => {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/:templateId" element={<TemplateBuilder />} />
        </Routes>
      </main>
    </div>
  );
};

/* ── status → swatch color ─────────────────────────────────── */
const SWATCH = {
  active:             'var(--ok)',
  paid:               'var(--ok)',
  'bank verified':    '#00897b',
  'bank verification':'var(--info)',
  prospect:           'var(--info)',
  'payment pending':  'var(--warn)',
  pending:            'var(--warn)',
  lost:               'var(--danger)',
  overdue:            'var(--danger)',
  deleted:            'var(--ink-dim)',
  archived:           'var(--ink-dim)',
  inactive:           'var(--ink-dim)',
};

const swatchColor = status => SWATCH[(status || '').toLowerCase()] || 'var(--ink-dim)';

/* ── time formatter ────────────────────────────────────────── */
const parseUtc = iso => {
  if (!iso) return null;
  const s = /[Zz]|[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  return new Date(s);
};

const fmtTime = iso => {
  const d = parseUtc(iso);
  if (!d) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const fmtFull = iso => {
  const d = parseUtc(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

/* ── message builder (mirrors AccountDetail logic) ─────────── */
const buildMessage = log => {
  const actor    = log.changed_by_name || log.changed_by || 'System';
  const acctName = log.account_name    || 'an account';
  const isCreate = !log.old_status;

  return isCreate
    ? { title: <>An account for <b>{acctName}</b> has been added by {actor}</>,
        sub:   `Status of the account is ${log.new_status}` }
    : { title: <><b>{actor}</b> changed status to {log.new_status}</>,
        sub:   `${acctName} · was ${log.old_status}` };
};

/* ── Pipeline stage definitions ────────────────────────────── */
const PIPELINE_STAGES = [
  { label: 'Active',            key: 'Active',            color: '#2e8b57', bg: '#e6f3ec' },
  { label: 'Prospect',          key: 'Prospect',          color: '#3b6fb6', bg: '#e7f3ff' },
  { label: 'Bank Verification', key: 'Bank Verification', color: '#3b6fb6', bg: '#e7f3ff' },
  { label: 'Bank Verified',     key: 'Bank Verified',     color: '#00695c', bg: '#e0f2f1' },
  { label: 'Payment Pending',   key: 'Payment Pending',   color: '#e8743b', bg: '#fff0ed' },
  { label: 'Paid',              key: 'Paid',              color: '#2e8b57', bg: '#e6f3ec' },
];

/* ── DashboardContent ──────────────────────────────────────── */
const DashboardContent = () => {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [activity,     setActivity]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [statusCounts, setStatusCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    accountApi.getRecentChangelogs(20)
      .then(res => {
        if (res.data?.success) setActivity(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    accountApi.getAccountStats()
      .then(res => {
        if (res.data?.success) setStatusCounts(res.data.data?.status_counts || {});
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="crumbs"><b>Dashboard</b></div>
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search by name, account #, PAN, phone…" />
          <span style={{fontFamily:'var(--mono)',fontSize:'11px',color:'var(--ink-mute)'}}>⌘K</span>
        </div>
        <button className="icon-btn" title="Filter">⚲</button>
        <button className="icon-btn" title="Notifications"><span className="pin"></span>◔</button>
        <button className="new-btn" onClick={() => setModalOpen(true)}>＋ New Account</button>
      </div>

      <section className="layout" style={{marginTop:'28px'}}>
        <div className="panel">
          <div className="panel-head">
            <h3>Recent Activity</h3>
            <div className="more">
              <span className="chip" style={{cursor:'pointer'}} onClick={() => navigate('/home/accounts')}>
                View all
              </span>
            </div>
          </div>

          <div className="activity">
            {loading && (
              <div style={{padding:'24px',color:'var(--ink-mute)',fontSize:'13px'}}>Loading…</div>
            )}

            {!loading && activity.length === 0 && (
              <div style={{padding:'24px',color:'var(--ink-mute)',fontSize:'13px'}}>
                No activity yet. Create an account to get started.
              </div>
            )}

            {!loading && activity.map((log, idx) => {
              const msg = buildMessage(log);
              return (
                <div
                  key={log._id || idx}
                  className="act"
                  style={{cursor: log.account_id ? 'pointer' : 'default'}}
                  onClick={() => log.account_id && navigate(`/home/accounts/${log.account_id}`)}
                >
                  <div className="swatch" style={{background: swatchColor(log.new_status)}} />
                  <div className="time">{fmtTime(log.changed_at)}</div>
                  <div className="body">
                    {msg.title}
                    <small style={{display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap'}}>
                      <span style={{
                        display:'inline-block', padding:'1px 7px', borderRadius:'999px',
                        fontSize:'10px', fontWeight:700, fontFamily:'var(--mono)',
                        textTransform:'uppercase',
                        background: swatchColor(log.new_status) + '22',
                        color: swatchColor(log.new_status),
                        border: `1px solid ${swatchColor(log.new_status)}44`,
                      }}>{log.new_status}</span>
                      {msg.sub}
                      <span style={{marginLeft:'auto', color:'var(--ink-mute)', fontSize:'11px'}}>
                        {fmtFull(log.changed_at)}
                      </span>
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="stack">
          <div className="panel pipeline" style={{padding:'18px'}}>
            {(() => {
              const counts = PIPELINE_STAGES.map(s => statusCounts[s.key] || 0);
              const inFlow = counts.reduce((a, b) => a + b, 0);
              const total  = Math.max(inFlow, 1);
              return (
                <>
                  <div style={{display:'flex',alignItems:'center',marginBottom:'14px'}}>
                    <h3 style={{margin:'0',fontSize:'14px',fontWeight:'600'}}>Application Pipeline</h3>
                    <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:'11px',color:'var(--ink-mute)'}}>{inFlow} in flow</span>
                  </div>
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div key={stage.key} className="stage">
                      <span className="lab">{stage.label}</span>
                      <div className="bar" style={{background: stage.bg}}>
                        <i style={{width: `${(counts[i] / total) * 100}%`, background: stage.color}}></i>
                      </div>
                      <span className="num" style={{color: stage.color}}>{counts[i]}</span>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </aside>
      </section>

      <section className="bottom" style={{gridTemplateColumns:'1fr'}}>
        <div className="panel chart-wrap">
          <div style={{display:'flex',alignItems:'center',marginBottom:'12px'}}>
            <h3 style={{margin:'0',fontSize:'14px',fontWeight:'600'}}>Disbursements vs Repayments</h3>
            <div className="more" style={{marginLeft:'auto'}}><span className="chip">Last 6 months</span></div>
          </div>
          <svg className="chart" viewBox="0 0 600 220" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1f3a2e" stopOpacity=".25"/>
                <stop offset="100%" stopColor="#1f3a2e" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <g stroke="#efede6" strokeWidth="1">
              <line x1="0" y1="44" x2="600" y2="44"/>
              <line x1="0" y1="88" x2="600" y2="88"/>
              <line x1="0" y1="132" x2="600" y2="132"/>
              <line x1="0" y1="176" x2="600" y2="176"/>
            </g>
            <g fill="#c8f25c">
              <rect x="40" y="120" width="22" height="80" rx="3"/>
              <rect x="140" y="100" width="22" height="100" rx="3"/>
              <rect x="240" y="115" width="22" height="85" rx="3"/>
              <rect x="340" y="85" width="22" height="115" rx="3"/>
              <rect x="440" y="95" width="22" height="105" rx="3"/>
              <rect x="540" y="70" width="22" height="130" rx="3"/>
            </g>
            <path d="M51,90 L151,70 L251,95 L351,55 L451,65 L551,40 L551,200 L51,200 Z" fill="url(#lg1)"/>
            <path d="M51,90 L151,70 L251,95 L351,55 L451,65 L551,40" fill="none" stroke="#1f3a2e" strokeWidth="2.5"/>
            <g fill="#1f3a2e"><circle cx="51" cy="90" r="4"/><circle cx="151" cy="70" r="4"/><circle cx="251" cy="95" r="4"/><circle cx="351" cy="55" r="4"/><circle cx="451" cy="65" r="4"/><circle cx="551" cy="40" r="4"/></g>
            <g fill="#a8a8b2" fontFamily="JetBrains Mono" fontSize="10">
              <text x="40" y="215">Nov</text><text x="140" y="215">Dec</text><text x="240" y="215">Jan</text><text x="340" y="215">Feb</text><text x="440" y="215">Mar</text><text x="540" y="215">Apr</text>
            </g>
          </svg>
          <div className="chart-legend">
            <span><i style={{background:'#1f3a2e'}}></i>Disbursed (₹ Cr)</span>
            <span><i style={{background:'#c8f25c'}}></i>Repaid (₹ Cr)</span>
            <span style={{marginLeft:'auto',color:'var(--ink-mute)'}}>Apr peak — ₹ 1.84 Cr disbursed</span>
          </div>
        </div>
      </section>

      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => setModalOpen(false)}
      />
    </>
  );
};

export default HomePage;
