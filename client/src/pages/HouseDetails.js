import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import { useAuth } from '../context/AuthContext';
import AppLayout, { avColor, avInit, fmtINR } from '../components/AppLayout';
import axios from 'axios';
import { Users, BarChart3, Scale, BookOpen, Copy, Pencil, ChevronLeft, Trash2, LogOut as Leave, Activity, Settings } from 'lucide-react';

const ROLES = ['member','financier','rent payer','admin'];
const CAT_IC = { groceries:'🛒', wifi:'📶', gas:'⛽', electricity:'⚡', rent:'🏠', other:'📦', settlement:'✅' };
const BADGE = { owner:'badge-owner', admin:'badge-admin', financier:'badge-financier', member:'badge-member', 'rent payer':'badge-rent_payer' };

function relTime(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return <div className="toast-stack"><div className={`toast toast-${type}`}>{type === 'ok' ? '✓' : '✕'} {msg}</div></div>;
}

const X = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function HouseDetails() {
  const { houseId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [bals, setBals] = useState(null);
  const [acts, setActs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('members');
  const [modal, setModal] = useState(null);
  const [newName, setNewName] = useState('');
  const [busy, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  useEffect(() => { load(); }, [houseId]);

  const load = async () => {
    setLoading(true);
    const [hr, br, ar] = await Promise.all([
      houseService.getHouseDetails(houseId),
      axios.get(`/api/houses/${houseId}/balances`).catch(() => null),
      axios.get(`/api/houses/${houseId}/activity?limit=25`).catch(() => null),
    ]);
    if (hr.success) setHouse(hr.data.house); 
    if (br?.data) setBals(br.data);
    if (ar?.data) setActs(ar.data.activities || []);
    setLoading(false);
  };

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '' }), 3000); };

  const copyKey = () => { navigator.clipboard.writeText(house.houseKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const rename = async e => {
    e.preventDefault(); setSaving(true);
    const r = await houseService.renameHouse(houseId, newName);
    if (r.success) { setHouse(h => ({ ...h, name: newName })); showToast('House renamed'); setModal(null); }
    else showToast(r.error, 'err');
    setSaving(false);
  };

  const changeRole = async (mId, role) => {
    const r = await houseService.assignRole(houseId, mId, role);
    if (r.success) { showToast('Role updated'); load(); } else showToast(r.error, 'err');
  };

  const removeMember = async (mId, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    const r = await houseService.removeMember(houseId, mId);
    if (r.success) { showToast('Member removed'); load(); } else showToast(r.error, 'err');
  };

  const leave = async () => {
    setSaving(true);
    const r = await houseService.leaveHouse(houseId);
    if (r.success) nav('/dashboard'); else { showToast(r.error, 'err'); setModal(null); }
    setSaving(false);
  };

  const del = async () => {
    setSaving(true);
    const r = await houseService.deleteHouse(houseId);
    if (r.success) nav('/dashboard'); else { showToast(r.error, 'err'); setModal(null); }
    setSaving(false);
  };

  if (loading) return (
    <AppLayout>
      <div className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 66, borderRadius: 10 }} />)}
        </div>
      </div>
    </AppLayout>
  );

  if (!house) return (
    <AppLayout>
      <div className="page">
        <div className="empty">
          <div className="empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <h3>House not found</h3>
          <p>This house does not exist or you are not a member.</p>
          <button className="btn btn-primary" onClick={() => nav('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </AppLayout>
  );

  const isAdmin = ['owner','admin'].includes(house.userRole);
  const isOwner = house.userRole === 'owner';
  const myId = user?.id?.toString();
  const myBal = bals?.netBalance?.[myId] ?? null;

  return (
    <AppLayout>
      <div className="page enter">
        <button className="back-btn" onClick={() => nav('/dashboard')}>
          <ChevronLeft size={14} /> Dashboard
        </button>

        {/* Header */}
        <div className="page-hd">
          <div className="page-hd-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ margin: 0 }}>{house.name}</h1>
              <span className={`badge ${BADGE[house.userRole] || 'badge-member'}`}>{house.userRole}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="hc-key">{house.houseKey}</span>
              <button className="btn btn-xs btn-ghost" onClick={copyKey}>
                <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="page-hd-right">
            {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => { setNewName(house.name); setModal('rename'); }}><Pencil size={14} /> Rename</button>}
            <button className="btn btn-ghost btn-sm" onClick={() => nav(`/house/${houseId}/budget`)}><BarChart3 size={14} /> Budget</button>
            <button className="btn btn-primary btn-sm" onClick={() => nav(`/house/${houseId}/balances`)}><Scale size={14} /> Balances</button>
          </div>
        </div>

        {/* Balance banner */}
        {myBal !== null && (
          <div className="card" style={{
            marginBottom: 20, padding: '16px 22px',
            display: 'flex', alignItems: 'center', gap: 16,
            background: myBal > 0.005 ? 'rgba(34,197,94,.06)' : myBal < -0.005 ? 'rgba(239,68,68,.06)' : 'var(--glass)',
            borderColor: myBal > 0.005 ? 'rgba(34,197,94,.25)' : myBal < -0.005 ? 'rgba(239,68,68,.22)' : 'var(--stroke)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              background: myBal > 0.005 ? 'var(--green-d)' : myBal < -0.005 ? 'var(--red-d)' : 'var(--glass)',
            }}>
              {myBal > 0.005 ? '💚' : myBal < -0.005 ? '🔴' : '✅'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Your Balance</div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', color: myBal > 0.005 ? 'var(--green)' : myBal < -0.005 ? 'var(--red)' : 'var(--t3)' }}>
                {myBal > 0.005 ? `+${fmtINR(myBal)} owed to you` : myBal < -0.005 ? `-${fmtINR(myBal)} you owe` : 'All settled up'}
              </div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => nav(`/house/${houseId}/balances`)}>
              {Math.abs(myBal) > 0.005 ? 'Settle Up' : 'View Balances'} <Scale size={13} />
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { ic: <BarChart3 size={20} />, label: 'Budget', sub: 'Monthly expenses', path: `/house/${houseId}/budget`, clr: '#818cf8' },
            { ic: <Scale size={20} />, label: 'Balances', sub: 'Who owes whom', path: `/house/${houseId}/balances`, clr: '#4ade80' },
            { ic: <BookOpen size={20} />, label: 'Expense Book', sub: 'Full history', path: `/house/${houseId}/book`, clr: '#67e8f9' },
          ].map(a => (
            <button key={a.label} onClick={() => nav(a.path)} style={{
              background: 'var(--glass-2)', border: '1px solid var(--stroke-2)',
              borderRadius: 12, padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
              transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 8,
            }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--glass-3)'; e.currentTarget.style.borderColor='var(--stroke-3)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--glass-2)'; e.currentTarget.style.borderColor='var(--stroke-2)'; e.currentTarget.style.transform='translateY(0)'; }}
            >
              <div style={{ color: a.clr }}>{a.ic}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#eef2ff', marginBottom: 3 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: '#7e8cb0' }}>{a.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'members' ? 'on' : ''}`} onClick={() => setTab('members')}>
            <Users size={14} /> Members ({house.members?.length || 0})
          </button>
          <button className={`tab ${tab === 'activity' ? 'on' : ''}`} onClick={() => setTab('activity')}>
            <Activity size={14} /> Activity
          </button>
          {isAdmin && <button className={`tab ${tab === 'settings' ? 'on' : ''}`} onClick={() => setTab('settings')}>
            <Settings size={14} /> Settings
          </button>}
        </div>

        {/* Members */}
        {tab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {house.members?.map(m => {
              const bal = bals?.netBalance?.[m.id?.toString()];
              const isMe = m.id?.toString() === myId;
              return (
                <div key={m.id} className="row-item">
                  <div className={`av av-md ${avColor(m.username)}`}>{avInit(m.username)}</div>
                  <div className="row-meta">
                    <div className="row-name">{m.username}{isMe && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 7, fontWeight: 400 }}>you</span>}</div>
                    <div style={{ fontSize: 11.5, color: "var(--t2)", marginTop: 1 }}>{m.email}</div>
                  </div>
                  {bal !== undefined && (
                    <div className="text-right" style={{ marginRight: 10 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: bal > 0.005 ? 'var(--green)' : bal < -0.005 ? 'var(--red)' : 'var(--t4)' }}>
                        {bal > 0.005 ? `+${fmtINR(bal)}` : bal < -0.005 ? `-${fmtINR(bal)}` : '—'}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--t4)' }}>
                        {bal > 0.005 ? 'owed' : bal < -0.005 ? 'owes' : 'settled'}
                      </div>
                    </div>
                  )}
                  <span className={`badge ${BADGE[m.role] || 'badge-member'}`}>{m.role}</span>
                  {isAdmin && !isMe && m.role !== 'owner' && (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <select value={m.role} onChange={e => changeRole(m.id, e.target.value)}
                        className="input input-select" style={{ padding: '4px 28px 4px 8px', fontSize: 12, width: 'auto', borderRadius: 6 }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button className="btn btn-xs btn-danger btn-icon" onClick={() => removeMember(m.id, m.username)} title="Remove"><X /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Activity */}
        {tab === 'activity' && (
          <div className="card" style={{ padding: '4px 22px' }}>
            {acts.length === 0 ? (
              <div className="empty" style={{ padding: '40px 0' }}>
                <div className="empty-icon"><Activity size={22} /></div>
                <h3>No activity yet</h3>
                <p>Add expenses to see activity here.</p>
              </div>
            ) : (
              <div className="activity-list">
                {acts.map(item => (
                  <div key={item.id} className="activity-item">
                    <div className={`activity-dot ${item.type === 'payment' ? 'pay' : item.type === 'rent' ? 'rent' : 'settle'}`} />
                    <div className={`av av-sm ${avColor(item.actor)}`}>{avInit(item.actor)}</div>
                    <div className="activity-body">
                      <div className="activity-txt">
                        <strong style={{ color: 'var(--t1)' }}>{item.actor}</strong>
                        {item.type === 'settlement' ? <> settled with <strong style={{ color: 'var(--t1)' }}>{item.paidTo}</strong></> : <> added <span className={`cat cat-${item.category}`}>{CAT_IC[item.category]} {item.description}</span></>}
                      </div>
                      <div className="activity-meta">{relTime(item.date)}</div>
                    </div>
                    <div className="activity-amt" style={{ color: item.type === 'settlement' ? 'var(--cyan)' : 'var(--t1)' }}>
                      {fmtINR(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === 'settings' && isAdmin && (
          <div className="card card-danger">
            <h3 style={{ fontSize: 15, marginBottom: 16, color: 'var(--t1)' }}>Danger Zone</h3>
            {!isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(239,68,68,.12)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Leave House</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>You will lose access to all shared data.</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setModal('leave')}><Leave size={13} /> Leave</button>
              </div>
            )}
            {isOwner && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Delete House</div>
                  <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>Permanently delete all data. Cannot be undone.</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setModal('delete')}><Trash2 size={13} /> Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast {...toast} />

      {modal === 'rename' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>Rename House</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <form onSubmit={rename}>
              <div className="field"><label>New Name</label><input className="input" type="text" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus /></div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Rename'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'leave' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>Leave House?</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <p style={{ fontSize: 13.5, color: 'var(--t2)', marginBottom: 8 }}>You will lose access to <strong style={{ color: 'var(--t1)' }}>{house.name}</strong> and all its shared data.</p>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={leave} disabled={busy}>{busy ? 'Leaving…' : 'Leave House'}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>Delete House?</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <div className="alert alert-error">Permanently deletes <strong>{house.name}</strong>, all expenses, budgets, and member data. This cannot be undone.</div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={del} disabled={busy}>{busy ? 'Deleting…' : 'Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
