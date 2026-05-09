/**
 * HomePage - Main page after login
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AccountsPage from './AccountsPage';
import AccountDetailPage from './AccountDetailPage';

const HomePage = () => {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<DashboardContent />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPage />} />
        </Routes>
      </main>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <>
      <div className="topbar">
        <div className="crumbs">Workspace / <b>Accounts</b> / All Customers</div>
        <div className="search">
          <span>⌕</span>
          <input placeholder="Search by name, account #, PAN, phone…" />
          <span style={{fontFamily:'var(--mono)',fontSize:'11px',color:'var(--ink-mute)'}}>⌘K</span>
        </div>
        <button className="icon-btn" title="Filter">⚲</button>
        <button className="icon-btn" title="Notifications"><span className="pin"></span>◔</button>
        <button className="new-btn">＋ New Customer</button>
      </div>

      <div className="page-head">
        <div>
          <h1>Customer Accounts</h1>
          <div className="sub">248 customers · 186 active loans · ₹ 14.82 Cr outstanding</div>
        </div>
        <div className="right">
          <button className="chip active">All</button>
          <button className="chip">Active</button>
          <button className="chip">Pending</button>
          <button className="chip">Overdue</button>
          <button className="chip">Closed</button>
        </div>
      </div>

      <section className="kpis">
        <div className="kpi feature">
          <div className="icon-tl">$</div>
          <div className="lab">Outstanding Principal</div>
          <div className="val">₹ 14.82 Cr</div>
          <div className="delta">▲ 6.2% vs last month</div>
        </div>
        <div className="kpi">
          <div className="icon-tl">▤</div>
          <div className="lab">Active Loans</div>
          <div className="val">186</div>
          <div className="delta">▲ 14 new this month</div>
        </div>
        <div className="kpi">
          <div className="icon-tl">⟲</div>
          <div className="lab">Repayments (MTD)</div>
          <div className="val">₹ 92.4 L</div>
          <div className="delta dim">— on schedule</div>
        </div>
        <div className="kpi">
          <div className="icon-tl">!</div>
          <div className="lab">Overdue Accounts</div>
          <div className="val">7</div>
          <div className="delta warn">▲ 2 since last week</div>
        </div>
      </section>

      <section className="layout">
        <div className="panel accounts-card">
          <div className="table-card-header">
            <div className="table-search">
              <span>⌕</span>
              <input placeholder="Search accounts (name, email, tax ID)..." />
            </div>
          </div>

          <table className="accounts">
            <thead>
              <tr>
                <th>ACCOUNT NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr className="status-ok">
                <td><div className="cust"><div className="av" style={{background:'#1f3a2e'}}>RS</div><div><b>Rohan Sharma</b><small>qobypyvi@mailinator.com</small></div></div></td>
                <td className="acct-email">qobypyvi@mailinator.com</td>
                <td className="acct-phone">+91 98212 04411</td>
                <td><span className="pill ok">ACTIVE</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-review">
                <td><div className="cust"><div className="av" style={{background:'#3b6fb6'}}>PV</div><div><b>Priya Verma</b><small>pv_admin@mail.com</small></div></div></td>
                <td className="acct-email">pv_admin@mail.com</td>
                <td className="acct-phone">+91 98712 50098</td>
                <td><span className="pill review">IN REVIEW</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-ok">
                <td><div className="cust"><div className="av" style={{background:'#e8743b'}}>AK</div><div><b>Ananya Kapoor</b><small>ananya.kapoor@mail.com</small></div></div></td>
                <td className="acct-email">ananya.kapoor@mail.com</td>
                <td className="acct-phone">+91 99102 71140</td>
                <td><span className="pill ok">ACTIVE</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-due">
                <td><div className="cust"><div className="av" style={{background:'#c0392b'}}>VS</div><div><b>Vikram Singh</b><small>vikram.singh@mail.com</small></div></div></td>
                <td className="acct-email">vikram.singh@mail.com</td>
                <td className="acct-phone">+91 96541 33820</td>
                <td><span className="pill due">PAYMENT DUE</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-ok">
                <td><div className="cust"><div className="av" style={{background:'#2e8b57'}}>MN</div><div><b>Meera Nair</b><small>meera.nair@mail.com</small></div></div></td>
                <td className="acct-email">meera.nair@mail.com</td>
                <td className="acct-phone">+91 90034 89221</td>
                <td><span className="pill ok">ACTIVE</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-draft">
                <td><div className="cust"><div className="av" style={{background:'#7a7a86'}}>DC</div><div><b>Devansh Chauhan</b><small>devansh.chauhan@mail.com</small></div></div></td>
                <td className="acct-email">devansh.chauhan@mail.com</td>
                <td className="acct-phone">+91 98998 12233</td>
                <td><span className="pill draft">DRAFT</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
              <tr className="status-warn">
                <td><div className="cust"><div className="av" style={{background:'#1f3a2e'}}>SI</div><div><b>Sana Iqbal</b><small>sana.iqbal@mail.com</small></div></div></td>
                <td className="acct-email">sana.iqbal@mail.com</td>
                <td className="acct-phone">+91 99887 65440</td>
                <td><span className="pill warn">PAYMENT DUE</span></td>
                <td className="table-actions"><button className="icon-btn small">👁</button><button className="icon-btn small">🗑</button></td>
              </tr>
            </tbody>
          </table>

          <div className="panel-foot">
            Showing 1–7 of 248 customers
            <div className="pager">
              <button>‹</button><button className="on">1</button><button>2</button><button>3</button><button>…</button><button>36</button><button>›</button>
            </div>
          </div>
        </div>

        <aside className="stack">
          <div className="panel doc-gen">
            <h3>Generate Document</h3>
            <p className="hint">Pick a customer and a template — fields will auto-fill from their account.</p>

            <div className="field">
              <label>Customer</label>
              <select>
                <option>Rohan Sharma — LL-00248</option>
                <option>Priya Verma — LL-00247</option>
                <option>Ananya Kapoor — LL-00246</option>
              </select>
            </div>

            <div className="field">
              <label>Template</label>
              <div className="templates">
                <div className="tpl selected"><span className="tag">Legal</span><b>Loan Agreement</b><span className="pages">8 pages · v3.2</span></div>
                <div className="tpl"><span className="tag">Approval</span><b>Sanction Letter</b><span className="pages">2 pages · v1.4</span></div>
                <div className="tpl"><span className="tag">Schedule</span><b>EMI Schedule</b><span className="pages">3 pages</span></div>
                <div className="tpl"><span className="tag">Closure</span><b>NOC Letter</b><span className="pages">1 page</span></div>
              </div>
            </div>

            <div className="field">
              <label>Format</label>
              <select><option>PDF (signed)</option><option>DOCX (editable)</option><option>Both</option></select>
            </div>

            <button className="gen-btn">⎙ Generate &amp; Send for E-Sign</button>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Recent Activity</h3>
              <div className="more"><span className="chip">View all</span></div>
            </div>
            <div className="activity">
              <div className="act ok"><div className="swatch"></div><div className="time">14:22</div><div className="body"><b>Sanction Letter</b> generated for Rohan Sharma<small>LL-00248 · sent for e-signature</small></div></div>
              <div className="act warn"><div className="swatch"></div><div className="time">12:08</div><div className="body">Repayment <b>missed</b> by Vikram Singh<small>LL-00245 · ₹ 12,400 · 14 days overdue</small></div></div>
              <div className="act info"><div className="swatch"></div><div className="time">10:51</div><div className="body"><b>KYC verified</b> for Priya Verma<small>PAN, Aadhaar, Bank statement</small></div></div>
              <div className="act"><div className="swatch"></div><div className="time">09:34</div><div className="body">New application from <b>Devansh Chauhan</b><small>Personal loan · ₹ 4,40,000 requested</small></div></div>
              <div className="act ok"><div className="swatch"></div><div className="time">08:12</div><div className="body"><b>EMI received</b> from Ananya Kapoor<small>LL-00246 · ₹ 28,750 auto-debit</small></div></div>
            </div>
          </div>
        </aside>
      </section>

      <section className="bottom">
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

        <div className="panel pipeline">
          <div style={{display:'flex',alignItems:'center',marginBottom:'4px'}}>
            <h3 style={{margin:'0',fontSize:'14px',fontWeight:'600'}}>Application Pipeline</h3>
            <span style={{marginLeft:'auto',fontFamily:'var(--mono)',fontSize:'11px',color:'var(--ink-mute)'}}>36 in flow</span>
          </div>
          <div className="stage"><span className="lab">New leads</span><div className="bar"><i style={{width:'90%',background:'#dcdcd2'}}></i></div><span className="num">14</span></div>
          <div className="stage"><span className="lab">KYC pending</span><div className="bar"><i style={{width:'62%',background:'#3b6fb6'}}></i></div><span className="num">9</span></div>
          <div className="stage"><span className="lab">Underwriting</span><div className="bar"><i style={{width:'48%',background:'#e8743b'}}></i></div><span className="num">7</span></div>
          <div className="stage"><span className="lab">Sanctioned</span><div className="bar"><i style={{width:'30%',background:'#1f3a2e'}}></i></div><span className="num">4</span></div>
          <div className="stage"><span className="lab">Disbursed</span><div className="bar"><i style={{width:'14%',background:'#2e8b57'}}></i></div><span className="num">2</span></div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
