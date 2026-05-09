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

        <div className={`item ${isActive('/home/accounts') ? 'active' : ''}`} onClick={() => navigate('/home/accounts')}>
          <span className="ico">◉</span> Accounts <span className="badge">12</span>
        </div>
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
