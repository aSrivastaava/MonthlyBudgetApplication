import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💰</div>
          <span className="sidebar-logo-text">BudgetHome</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Navigation</span>
          {navLinks.map(link => (
            <button
              key={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div style={{ padding: '12px 12px 8px', color: 'var(--text-secondary)', fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button className="sidebar-link btn-ghost" onClick={handleLogout} style={{ width: '100%' }}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
