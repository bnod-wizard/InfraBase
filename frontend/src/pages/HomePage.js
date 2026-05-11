import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccountsPage from './AccountsPage';
import AccountDetailPage from './AccountDetailPage';
import AccountModal from '../components/AccountModal';
import TemplatesPage from './TemplatesPage';
import TemplateBuilder from '../components/TemplateBuilder';
import AreaCalculatorModal from '../components/AreaCalculatorModal';
import SettingsPage from './SettingsPage';
import accountApi from '../services/accountApi';

const HomePage = () => {
  const [areaCalcOpen, setAreaCalcOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar onOpenAreaCalc={() => setAreaCalcOpen(true)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="templates" element={<TemplatesPage />} />
          <Route path="templates/:templateId" element={<TemplateBuilder />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <AreaCalculatorModal
        isOpen={areaCalcOpen}
        onClose={() => setAreaCalcOpen(false)}
      />
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
  const [monthlyData,  setMonthlyData]  = useState([]);
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

    accountApi.getMonthlyStats()
      .then(res => {
        if (res.data?.success) setMonthlyData(res.data.data || []);
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
        <div className="panel" style={{padding:'18px 20px'}}>
          {(() => {
            const src    = monthlyData.length > 0 ? monthlyData
                         : Array.from({length:6},(_,i)=>({label:['Jan','Feb','Mar','Apr','May','Jun'][i],count:0}));
            const counts = src.map(m => m.count || 0);
            const total  = counts.reduce((a,b) => a+b, 0);
            const cur    = counts[counts.length-1] || 0;
            const prev   = counts[counts.length-2] || 0;
            const growth = prev > 0 ? Math.round((cur-prev)/prev*100) : null;

            /* geometry — mirrors the HTML template (viewBox 800×340) */
            const VW=800, VH=340, PL=60, PR=20, PT=20, PB=60;
            const plotH = VH-PT-PB;   // 260
            const yBot  = VH-PB;      // 280
            const slotW = (VW-PL-PR)/src.length;
            const barW  = Math.min(slotW*0.42, 52);
            const cxArr = src.map((_,i) => PL + slotW*i + slotW/2);

            const rawMax = Math.max(...counts, 1);
            const maxVal = rawMax<=5?5 : rawMax<=10?10 : rawMax<=20?20
                         : rawMax<=50?Math.ceil(rawMax/10)*10 : Math.ceil(rawMax/25)*25;
            const toY   = v => yBot - (v/maxVal)*plotH;
            const bTops = counts.map(c => toY(c));
            const bHs   = counts.map(c => yBot - toY(c));
            const pts   = cxArr.map((x,i) => `${x},${bTops[i]}`);
            const lPath = `M${pts.join(' L')}`;
            const aPath = `${lPath} L${cxArr[cxArr.length-1]},${yBot} L${cxArr[0]},${yBot} Z`;
            const gridVs= [0,.25,.5,.75,1].map(f=>({y:toY(f*maxVal), lbl:Math.round(f*maxVal)}));
            const peakI = counts.indexOf(Math.max(...counts));

            return (
              <>
                {/* ── Header ── */}
                <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14}}>
                  <div>
                    <h3 style={{fontSize:14,fontWeight:600,letterSpacing:'-.01em',margin:0}}>Account Growth</h3>
                    <div style={{color:'var(--ink-mute)',fontSize:12,marginTop:2}}>Last 6 months · Accounts added</div>
                  </div>
                  <div style={{display:'flex',gap:20}}>
                    <div>
                      <div style={{color:'var(--ink-mute)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em'}}>Period Total</div>
                      <div style={{fontSize:15,fontWeight:650,marginTop:1}}>{total}</div>
                    </div>
                    <div>
                      <div style={{color:'var(--ink-mute)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em'}}>This Month</div>
                      <div style={{fontSize:15,fontWeight:650,marginTop:1}}>{cur}</div>
                      {growth !== null && (
                        <div style={{fontSize:11,fontWeight:600,color:growth>=0?'var(--ok)':'var(--danger)'}}>
                          {growth>=0?'▲':'▼'} {Math.abs(growth)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Legend ── */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',gap:14,alignItems:'center',fontSize:11,color:'var(--ink-mute)'}}>
                    <span>
                      <i style={{display:'inline-block',width:10,height:10,borderRadius:3,marginRight:6,background:'#dfeede',border:'1px solid #b8d4c4',verticalAlign:-1}}></i>
                      Accounts Added
                    </span>
                    <span>
                      <i style={{display:'inline-block',width:10,height:10,borderRadius:3,marginRight:6,background:'#c8f25c',border:'1px solid #a9d63a',verticalAlign:-1}}></i>
                      Trend
                    </span>
                  </div>
                  {peakI >= 0 && counts[peakI] > 0 && (
                    <span style={{fontSize:12,color:'var(--ink-mute)'}}>
                      Peak · <b style={{color:'var(--ink)'}}>{counts[peakI]}</b> accounts in {src[peakI]?.label}
                    </span>
                  )}
                </div>

                {/* ── SVG chart ── */}
                <div style={{position:'relative',height:180,marginTop:4}}>
                  <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none"
                    style={{width:'100%',height:'100%',display:'block',overflow:'visible'}}>
                    <defs>
                      <linearGradient id="chartLg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%"   stopColor="#c8f25c" stopOpacity=".18"/>
                        <stop offset="100%" stopColor="#c8f25c" stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* grid */}
                    <g stroke="#eef0ec" strokeWidth="1">
                      {gridVs.map((g,i) => <line key={i} x1={PL} x2={VW-PR} y1={g.y} y2={g.y}/>)}
                    </g>

                    {/* Y labels */}
                    <g fill="#a8a8b2" fontSize="11" fontFamily="inherit">
                      {gridVs.map((g,i) => (
                        <text key={i} x={PL-8} y={g.y+4} textAnchor="end">{g.lbl}</text>
                      ))}
                    </g>

                    {/* bars */}
                    {cxArr.map((x,i) => bHs[i] > 0 && (
                      <rect key={i}
                        x={x-barW/2} y={bTops[i]} width={barW} height={bHs[i]} rx="6"
                        fill="#dfeede"
                        onMouseEnter={e => e.currentTarget.setAttribute('fill','#1f3a2e')}
                        onMouseLeave={e => e.currentTarget.setAttribute('fill','#dfeede')}
                        style={{cursor:'default'}}
                      />
                    ))}

                    {/* area + line */}
                    <path d={aPath} fill="url(#chartLg)"/>
                    <path d={lPath} fill="none" stroke="#c8f25c" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{filter:'drop-shadow(0 2px 4px rgba(168,210,60,.35))'}}/>

                    {/* points */}
                    {cxArr.map((x,i) => (
                      <g key={i}>
                        <circle cx={x} cy={bTops[i]} r="4.5" fill="#fff" stroke="#1f3a2e" strokeWidth="2"/>
                        {i===src.length-1 && <circle cx={x} cy={bTops[i]} r="3" fill="#c8f25c"/>}
                      </g>
                    ))}

                    {/* X labels */}
                    <g fill="#a8a8b2" fontSize="11" fontFamily="inherit">
                      {cxArr.map((x,i) => (
                        <text key={i} x={x} y={yBot+22} textAnchor="middle">{src[i].label}</text>
                      ))}
                    </g>
                  </svg>
                </div>

                {/* ── Footer ── */}
                <div style={{display:'flex',justifyContent:'space-between',color:'var(--ink-mute)',fontSize:11,marginTop:8}}>
                  <span>Source · Account ledger</span>
                  <span>Live data</span>
                </div>
              </>
            );
          })()}
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
