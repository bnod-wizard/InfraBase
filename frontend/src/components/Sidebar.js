import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';

/**
 * Sidebar Component - Main navigation for the application
 */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home' || location.pathname === '/home/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">L</div>
        <div><b>InfraBase</b></div>
      </div>

      <div className="group">
        <span className="group-label">Workspace</span>
        <div className={`item ${isActive('/home') ? 'active' : ''}`} onClick={() => navigate('/home')}>
          <span className="ico">▦</span> Dashboard <span className="badge">3</span>
        </div>

        <div className={`item open ${isActive('/home/accounts') ? 'active' : ''}`}>
          <span className="ico">◉</span> Accounts
          <span className="chev">▸</span>
        </div>
        <div className="submenu">
          <div className={`sub ${isActive('/home/accounts') ? 'active' : ''}`} onClick={() => navigate('/home/accounts')}>
            <span className="dot"></span> All Customers <span className="count">248</span>
          </div>
          <div className="sub"><span className="dot"></span> Active Loans <span className="count">186</span></div>
          <div className="sub"><span className="dot"></span> Pending Approval <span className="count">12</span></div>
          <div className="sub"><span className="dot"></span> Overdue <span className="count">7</span></div>
          <div className="sub"><span className="dot"></span> Closed <span className="count">43</span></div>
          <div className="sub"><span className="dot"></span> Co-signers</div>
        </div>

        <div className="item"><span className="ico">▤</span> Applications <span className="badge">12</span></div>
        <div className="item"><span className="ico">$</span> Disbursements</div>
        <div className="item"><span className="ico">⟲</span> Repayments</div>
        <div className="item"><span className="ico">⊟</span> Collateral</div>
      </div>

      <div className="group">
        <span className="group-label">Documents</span>
        <div className="item"><span className="ico">▣</span> Templates</div>
        <div className="item"><span className="ico">⎙</span> Generated <span className="badge">94</span></div>
        <div className="item"><span className="ico">✎</span> E-Signatures</div>
        <div className="item"><span className="ico">⛶</span> KYC Vault</div>
      </div>

      <div className="group">
        <span className="group-label">Insights</span>
        <div className="item"><span className="ico">◢</span> Reports</div>
        <div className="item"><span className="ico">◌</span> Risk &amp; Audit</div>
        <div className="item"><span className="ico">⚙</span> Settings</div>
      </div>

      <div className="user">
        <div className="av">AM</div>
        <div className="meta">Aarav Mehta<small>Loan Officer · Branch 04</small></div>
      </div>
    </aside>
  );
}

export default Sidebar;
