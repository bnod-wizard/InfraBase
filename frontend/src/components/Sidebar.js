import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import '../styles/Sidebar.css';

/**
 * Sidebar Component - Main navigation for the application
 */
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/home',
      icon: '📊',
    },
    {
      label: 'Accounts',
      path: '/home/accounts',
      icon: '🏢',
    },
  ];

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
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="brand-markers">
            <span className="brand-dot brand-dot-1" />
            <span className="brand-dot brand-dot-2" />
            <span className="brand-dot brand-dot-3" />
          </div>
          <h2>InfraBase</h2>
        </div>

        <button className="sidebar-collapse" onClick={() => navigate('/home')}>
          ←
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-item-left">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </span>
            <span className="nav-arrow">›</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-card assistant-card">
        <div className="assistant-card-header">
          <div>
            <h3>AI Assistant</h3>
          </div>
          <button className="assistant-close" type="button">
            ×
          </button>
        </div>
        <p className="assistant-copy">
          Technology that helps people complete tasks faster and more efficiently.
        </p>
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
