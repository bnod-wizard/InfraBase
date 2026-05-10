import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import accountApi from '../services/accountApi';

function Sidebar({ onOpenAreaCalc }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen,      setMenuOpen]      = useState(false); // user dropdown
  const [mobileOpen,    setMobileOpen]    = useState(false); // mobile drawer
  const [activeCount,   setActiveCount]   = useState(null);
  const wrapRef = useRef(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Fetch active account count once on mount
  useEffect(() => {
    accountApi.getAccountStats()
      .then(res => {
        if (res.data?.success) {
          const sc = res.data.data?.status_counts || {};
          setActiveCount(sc.active ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = path => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/home/';
    return location.pathname.startsWith(path);
  };

  const go = path => { navigate(path); setMobileOpen(false); };

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
    <>
      {/* ── Hamburger button — mobile only ── */}
      <button
        className="sb-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <span /><span /><span />
      </button>

      {/* ── Backdrop — mobile only ── */}
      {mobileOpen && (
        <div className="sb-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar drawer ── */}
      <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
        {/* Close button — mobile only */}
        <button
          className="sb-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          ✕
        </button>

        <div className="brand">
          <div className="mark">I</div>
          <div><b>InfraBase</b></div>
        </div>

        <div className="group">
          <span className="group-label">Workspace</span>
          <div className={`item ${isActive('/home') && !isActive('/home/accounts') && !isActive('/home/templates') ? 'active' : ''}`} onClick={() => go('/home')}>
            <span className="ico">▦</span> Dashboard
          </div>
          <div className={`item ${isActive('/home/accounts') ? 'active' : ''}`} onClick={() => go('/home/accounts')}>
            <span className="ico">◉</span> Accounts
            {activeCount !== null && <span className="badge">{activeCount}</span>}
          </div>
          <div className="item" onClick={onOpenAreaCalc}>
            <span className="ico">⬡</span> Area Calculator
          </div>
        </div>

        <div className="group">
          <span className="group-label">Documents</span>
          <div className={`item ${isActive('/home/templates') ? 'active' : ''}`} onClick={() => go('/home/templates')}>
            <span className="ico">▣</span> Templates
          </div>
          <div className="item"><span className="ico">⎙</span> Generated</div>
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
    </>
  );
}

export default Sidebar;
