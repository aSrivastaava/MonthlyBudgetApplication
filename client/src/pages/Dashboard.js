import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';
import AppLayout from '../components/AppLayout';

const ROLE_COLORS = { owner: '#fbbf24', admin: '#818cf8', financier: '#34d399', 'rent payer': '#c084fc', member: '#64748b' };

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
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const result = await houseService.createHouse(houseName);
    if (result.success) {
      toast(`House created! Key: ${result.data.house.houseKey}`);
      setHouseName(''); setShowCreate(false); fetchHouses();
    } else toast(result.error, true);
    setSaving(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const result = await houseService.joinHouse(houseKey);
    if (result.success) {
      toast('Joined house!');
      setHouseKey(''); setShowJoin(false); fetchHouses();
    } else toast(result.error, true);
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="page-inner">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 4 }}>My Houses</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Welcome back, {user?.username} 👋</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => { setShowJoin(true); setError(''); }}>🔑 Join House</button>
            <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError(''); }}>＋ Create House</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : houses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏡</div>
            <h3>No houses yet</h3>
            <p>Create a shared house or join one with a house key.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create House</button>
              <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>Join with Key</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {houses.map(house => (
              <div key={house.id} className="card card-hover" style={{ cursor: 'pointer', padding: 24 }} onClick={() => navigate(`/house/${house.id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--primary-dim)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏠</div>
                  <span className={`badge badge-${house.role.replace(' ', '_')}`}>{house.role}</span>
                </div>
                <h3 style={{ fontSize: 17, marginBottom: 8 }}>{house.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Key:</span>
                  <code style={{ fontSize: 13, background: 'var(--surface)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace', letterSpacing: '0.1em', color: 'var(--primary-light)' }}>{house.houseKey}</code>
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
            <h2>Create New House</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>House Name</label>
                <input type="text" value={houseName} onChange={e => setHouseName(e.target.value)} required placeholder="e.g. Apartment 4B" autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create House'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Join a House</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label>House Key</label>
                <input type="text" value={houseKey} onChange={e => setHouseKey(e.target.value.toUpperCase())} required placeholder="6-digit key (e.g. AB12C3)" maxLength={6} autoFocus style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.15em', textAlign: 'center' }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Joining…' : 'Join House'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
