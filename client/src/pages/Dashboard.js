import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';
import AppLayout from '../components/AppLayout';

function avatarClass(name) {
  if (!name) return 'av-a';
  return 'av-' + name[0].toLowerCase().replace(/[^a-z]/, 'a');
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [houseName, setHouseName] = useState('');
  const [houseKey, setHouseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchHouses(); }, []);

  const fetchHouses = async () => {
    setLoading(true);
    const result = await houseService.getMyHouses();
    if (result.success) setHouses(result.data.houses);
    setLoading(false);
  };

  const toast = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await houseService.createHouse(houseName);
    if (result.success) {
      toast(`House created! Share key: ${result.data.house.houseKey}`);
      setHouseName(''); setShowCreate(false); fetchHouses();
    } else toast(result.error, true);
    setSaving(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await houseService.joinHouse(houseKey);
    if (result.success) {
      toast('Joined house successfully!');
      setHouseKey(''); setShowJoin(false); fetchHouses();
    } else toast(result.error, true);
    setSaving(false);
  };

  const copyKey = (e, key) => {
    e.stopPropagation();
    navigator.clipboard.writeText(key);
    toast('House key copied!');
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout>
      <div className="page-inner" style={{ animation: 'slideUp 0.3s ease' }}>
        {/* Header */}
        <div className="page-header">
          <div>
            <h1>{greeting()}, {user?.username} 👋</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {houses.length === 0 ? 'Create or join a house to get started' : `You're in ${houses.length} house${houses.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => { setShowJoin(true); setError(''); }}>
              🔑 Join House
            </button>
            <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError(''); }}>
              + Create House
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Houses */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 18 }} />
            ))}
          </div>
        ) : houses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏡</div>
            <h3>No houses yet</h3>
            <p>Create a shared house or join one using a 6-character house key from a housemate.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create House</button>
              <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>🔑 Join with Key</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {houses.map(house => (
              <div
                key={house.id}
                className="house-card"
                onClick={() => navigate(`/house/${house.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="house-card-icon">🏠</div>
                  <span className={`badge badge-${house.role.replace(' ', '_')}`}>{house.role}</span>
                </div>

                <div className="house-card-name">{house.name}</div>

                <div style={{ marginTop: 6, marginBottom: 16 }}>
                  <span className="house-card-key">{house.houseKey}</span>
                </div>

                <div className="house-card-footer">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={e => { e.stopPropagation(); navigate(`/house/${house.id}/budget`); }}
                    >
                      📊 Budget
                    </button>
                    <button
                      className="btn btn-xs btn-secondary"
                      onClick={e => { e.stopPropagation(); navigate(`/house/${house.id}/balances`); }}
                    >
                      ⚖️ Balances
                    </button>
                  </div>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={e => copyKey(e, house.houseKey)}
                    title="Copy house key"
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New House</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              A unique 6-character key will be generated for your housemates to join.
            </p>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>House Name</label>
                <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} required placeholder="e.g. Greenview Apartment" autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : '+ Create House'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Join a House</h2>
              <button className="modal-close" onClick={() => setShowJoin(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Ask your housemate for the 6-character house key.
            </p>
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>House Key</label>
                <input
                  type="text"
                  value={houseKey}
                  onChange={e => setHouseKey(e.target.value.toUpperCase())}
                  required placeholder="AB12C3"
                  maxLength={6} autoFocus
                  style={{ fontFamily: 'Courier New, monospace', fontSize: 22, letterSpacing: '0.2em', textAlign: 'center', padding: 16 }}
                />
                <span className="form-hint">{houseKey.length}/6 characters</span>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || houseKey.length !== 6}>
                  {saving ? 'Joining…' : '🔑 Join House'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
