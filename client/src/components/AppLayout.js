import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';
import {
  LayoutDashboard, Users, BarChart3, Scale, BookOpen,
  LogOut, Home
} from 'lucide-react';

export function avColor(name) {
  if (!name) return 'avc-0';
  const n = name.charCodeAt(0) % 10;
  return `avc-${n}`;
}
export function avInit(name) { return name ? name[0].toUpperCase() : '?'; }
export function fmtINR(n) {
  return '₹' + Math.abs(Number(n)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const houseMatch = location.pathname.match(/\/house\/([a-f0-9]{24})/i);
  const houseId = houseMatch ? houseMatch[1] : null;
  const [houseName, setHouseName] = useState('');

  useEffect(() => {
    if (!houseId) { setHouseName(''); return; }
    houseService.getHouseDetails(houseId).then(r => {
      if (r.success) setHouseName(r.data.house.name);
    });
  }, [houseId]);

  const at = path => location.pathname === path;

  const NavBtn = ({ icon, label, path, exact = true }) => {
    const active = exact ? at(path) : location.pathname.startsWith(path);
    return (
      <button className={`nav-btn ${active ? 'active' : ''}`} onClick={() => navigate(path)}>
        <span className="nav-ic">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-stripe" />

        {/* Centered brand */}
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <img
            src="/logo192.png"
            alt="SplitNest"
            style={{ width:80, height:80, objectFit:'contain', display:'block', margin:'0 auto' }}
          />
          <div style={{ marginTop: 2 }}>
            <div className="brand-name">SplitNest</div>
            <div className="brand-tagline">Split bills. Not friendships.</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-group-label">Menu</span>
            <NavBtn icon={<LayoutDashboard size={15} />} label="Dashboard" path="/dashboard" />
          </div>

          {houseId && (
            <div className="nav-group">
              {houseName && (
                <div className="house-chip">
                  <div className="house-chip-name">
                    <Home size={11} /> {houseName}
                  </div>
                  <div className="house-chip-sub">Current house</div>
                </div>
              )}
              <span className="nav-group-label">House</span>
              <NavBtn icon={<Users size={15} />} label="Members" path={`/house/${houseId}`} />
              <NavBtn icon={<BarChart3 size={15} />} label="Budget" path={`/house/${houseId}/budget`} />
              <NavBtn icon={<Scale size={15} />} label="Balances" path={`/house/${houseId}/balances`} />
              <NavBtn icon={<BookOpen size={15} />} label="Expense Book" path={`/house/${houseId}/book`} />
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="sidebar-ft">
          <div className="user-row">
            <div className={`av av-sm ${avColor(user?.username)}`}>{avInit(user?.username)}</div>
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="nav-btn" onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--t4)' }}>
            <span className="nav-ic"><LogOut size={14} /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
