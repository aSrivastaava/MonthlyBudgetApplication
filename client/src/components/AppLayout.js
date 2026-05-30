import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';

function avatarClass(name) {
  if (!name) return 'av-a';
  return 'av-' + name[0].toLowerCase().replace(/[^a-z]/, 'a');
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract houseId from URL
  const houseMatch = location.pathname.match(/\/house\/([a-f0-9]{24})/i);
  const houseId = houseMatch ? houseMatch[1] : null;

  const [houseName, setHouseName] = useState('');

  useEffect(() => {
    if (houseId) {
      houseService.getHouseDetails(houseId).then(r => {
        if (r.success) setHouseName(r.data.house.name);
      });
    } else {
      setHouseName('');
    }
  }, [houseId]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = user?.username ? user.username[0].toUpperCase() : '?';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div className="sidebar-brand-icon">
            <img src="/logo192.png" alt="SplitNest" />
          </div>
          <div>
            <div className="sidebar-brand-text">SplitNest</div>
            <div className="sidebar-brand-sub">Split bills. Not friendships.</div>
          </div>
        </div>

        <div className="sidebar-scroll">
          {/* Main navigation */}
          <div className="sidebar-section">
            <span className="sidebar-section-label">Navigation</span>
            <button
              className={`sidebar-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <span className="sidebar-link-icon">🏠</span>
              Dashboard
            </button>
          </div>

          {/* House-specific nav */}
          {houseId && (
            <div className="sidebar-section">
              {houseName && (
                <div className="sidebar-house-pill">
                  <div className="sidebar-house-pill-name">🏡 {houseName}</div>
                  <div className="sidebar-house-pill-sub">Current house</div>
                </div>
              )}
              <span className="sidebar-section-label">House</span>
              <button
                className={`sidebar-link ${location.pathname === `/house/${houseId}` ? 'active' : ''}`}
                onClick={() => navigate(`/house/${houseId}`)}
              >
                <span className="sidebar-link-icon">👥</span>
                Members
              </button>
              <button
                className={`sidebar-link ${location.pathname === `/house/${houseId}/budget` ? 'active' : ''}`}
                onClick={() => navigate(`/house/${houseId}/budget`)}
              >
                <span className="sidebar-link-icon">📊</span>
                Budget
              </button>
              <button
                className={`sidebar-link ${location.pathname === `/house/${houseId}/balances` ? 'active' : ''}`}
                onClick={() => navigate(`/house/${houseId}/balances`)}
              >
                <span className="sidebar-link-icon">⚖️</span>
                Balances
              </button>
              <button
                className={`sidebar-link ${location.pathname === `/house/${houseId}/book` ? 'active' : ''}`}
                onClick={() => navigate(`/house/${houseId}/book`)}
              >
                <span className="sidebar-link-icon">📖</span>
                Expense Book
              </button>
            </div>
          )}
        </div>

        {/* User + logout */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className={`avatar avatar-sm ${avatarClass(user?.username)}`}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name truncate">{user?.username}</div>
              <div className="sidebar-user-email truncate">{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-link btn-ghost" onClick={handleLogout} style={{ width: '100%', color: 'var(--text-muted)' }}>
            <span className="sidebar-link-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
