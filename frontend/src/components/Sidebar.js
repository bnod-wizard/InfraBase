import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';

function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef   = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = path => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/home/';
    return location.pathname.startsWith(path);
  };

  const getInitials = name => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'User';
  const email       = user?.email || '';
  const initials    = getInitials(displayName);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">I</div>
        <div><b>InfraBase</b></div>
      </div>

      <div className="group">
        <span className="group-label">Workspace</span>
        <div className={`item ${isActive('/home') && !isActive('/home/accounts') ? 'active' : ''}`} onClick={() => navigate('/home')}>
          <span className="ico">▦</span> Dashboard <span className="badge">3</span>
        </div>
        <div className={`item ${isActive('/home/accounts') ? 'active' : ''}`} onClick={() => navigate('/home/accounts')}>
          <span className="ico">◉</span> Accounts <span className="badge">12</span>
        </div>
      </div>

      <div className="group">
        <span className="group-label">Documents</span>
        <div className={`item ${isActive('/home/templates') ? 'active' : ''}`} onClick={() => navigate('/home/templates')}><span className="ico">▣</span> Templates</div>
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

      {/* ── User section with dropdown ── */}
      <div className="sb-user-wrap" ref={wrapRef}>
        {menuOpen && (
          <div className="sb-dropdown">
            <div className="sb-dropdown-head">
              <div className="av sb-dropdown-av">{initials}</div>
              <div>
                <strong>{displayName}</strong>
                <span>{email}</span>
              </div>
            </div>
            <div className="sb-dropdown-divider" />
            <button className="sb-dropdown-item sb-dropdown-danger" onClick={handleLogout}>
              <span>⎋</span> Sign out
            </button>
          </div>
        )}
        <div className="user" style={{cursor:'pointer'}} onClick={() => setMenuOpen(o => !o)}>
          <div className="av">{initials}</div>
          <div className="meta">
            {displayName}
            <small>{email}</small>
          </div>
          <span className="sb-chev">{menuOpen ? '▲' : '▼'}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
