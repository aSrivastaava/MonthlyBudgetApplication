import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { houseService } from '../services/houseService';
import AppLayout, { avColor, avInit } from '../components/AppLayout';
import { Plus, Key, BarChart3, Scale, Copy, Home } from 'lucide-react';

const BADGE = { owner:'badge-owner', admin:'badge-admin', financier:'badge-financier', member:'badge-member', 'rent payer':'badge-rent_payer' };
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

function Toast({ msg, type = 'ok' }) {
  if (!msg) return null;
  return (
    <div className="toast-stack">
      <div className={`toast toast-${type}`}>
        {type === 'ok' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
        {msg}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [houseName, setHouseName] = useState('');
  const [houseKey, setHouseKey] = useState('');
  const [err, setErr] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'ok' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const r = await houseService.getMyHouses();
    if (r.success) setHouses(r.data.houses);
    setLoading(false);
  };

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '' }), 3000); };

  const create = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await houseService.createHouse(houseName);
    if (r.success) { showToast(`House created — key: ${r.data.house.houseKey}`); setHouseName(''); setModal(null); load(); }
    else setErr(r.error);
    setBusy(false);
  };

  const join = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await houseService.joinHouse(houseKey);
    if (r.success) { showToast('Joined house!'); setHouseKey(''); setModal(null); load(); }
    else setErr(r.error);
    setBusy(false);
  };

  const copy = (e, key) => { e.stopPropagation(); navigator.clipboard.writeText(key); showToast('Key copied!'); };

  return (
    <AppLayout>
      <div className="page enter">
        {/* Header */}
        <div className="page-hd">
          <div className="page-hd-left">
            <h1>{greet()}, {user?.username}</h1>
            <p>{houses.length === 0 ? 'Create or join a house to get started' : `Managing ${houses.length} house${houses.length !== 1 ? 's' : ''}`}</p>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-ghost" onClick={() => { setModal('join'); setErr(''); }}>
              <Key size={15} /> Join House
            </button>
            <button className="btn btn-primary" onClick={() => { setModal('create'); setErr(''); }}>
              <Plus size={15} /> New House
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 188, borderRadius: 18 }} />)}
          </div>
        ) : houses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Home size={24} /></div>
            <h3>No houses yet</h3>
            <p>Create a shared house or join one using a 6-character key from a housemate.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setModal('create')}><Plus size={14} /> Create House</button>
              <button className="btn btn-ghost" onClick={() => setModal('join')}><Key size={14} /> Join House</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 12 }}>
            {houses.map(h => (
              <div key={h.id} className="house-card" onClick={() => nav(`/house/${h.id}`)}>
                <div className="hc-glow" />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div className="hc-icon"><Home size={20} /></div>
                  <span className={`badge ${BADGE[h.role] || 'badge-member'}`}>{h.role}</span>
                </div>
                <div className="hc-name">{h.name}</div>
                <div style={{ marginTop: 6 }}>
                  <span className="hc-key">{h.houseKey}</span>
                </div>
                <div className="hc-footer">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-xs btn-ghost" onClick={e => { e.stopPropagation(); nav(`/house/${h.id}/budget`); }}>
                      <BarChart3 size={12} /> Budget
                    </button>
                    <button className="btn btn-xs btn-ghost" onClick={e => { e.stopPropagation(); nav(`/house/${h.id}/balances`); }}>
                      <Scale size={12} /> Balances
                    </button>
                  </div>
                  <button className="btn btn-xs btn-ghost btn-icon-sm" onClick={e => copy(e, h.houseKey)} title="Copy key">
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast {...toast} />

      {/* Create modal */}
      {modal === 'create' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <h2>Create New House</h2>
              <button className="close-btn" onClick={() => setModal(null)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 18 }}>A unique 6-character key will be generated automatically for housemates to join.</p>
            <form onSubmit={create}>
              <div className="field">
                <label>House Name</label>
                <input className="input" type="text" placeholder="e.g. Greenview Apartment" required autoFocus value={houseName} onChange={e => setHouseName(e.target.value)} />
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create House'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join modal */}
      {modal === 'join' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd">
              <h2>Join a House</h2>
              <button className="close-btn" onClick={() => setModal(null)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            {err && <div className="alert alert-error">{err}</div>}
            <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 18 }}>Ask your housemate for the 6-character house key.</p>
            <form onSubmit={join}>
              <div className="field">
                <label>House Key</label>
                <input className="input mono" type="text" placeholder="AB12C3" required maxLength={6} autoFocus
                  style={{ fontSize: 24, letterSpacing: '0.25em', textAlign: 'center', padding: '14px 16px' }}
                  value={houseKey} onChange={e => setHouseKey(e.target.value.toUpperCase())} />
                <span className="hint" style={{ textAlign: 'center' }}>{houseKey.length}/6 characters</span>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy || houseKey.length !== 6}>{busy ? 'Joining…' : 'Join House'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
