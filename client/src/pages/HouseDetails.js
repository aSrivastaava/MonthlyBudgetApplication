import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import axios from 'axios';

const ROLES = ['member', 'financier', 'rent payer', 'admin'];

function avatarClass(name) {
  if (!name) return 'av-a';
  return 'av-' + name[0].toLowerCase().replace(/[^a-z]/, 'a');
}
function initials(name) {
  if (!name) return '?';
  return name[0].toUpperCase();
}
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function relTime(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
const CAT_ICONS = { groceries: '🛒', wifi: '📶', gas: '⛽', electricity: '⚡', rent: '🏠', other: '📦', settlement: '✅' };

export default function HouseDetails() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => { fetchAll(); }, [houseId]);

  const fetchAll = async () => {
    setLoading(true);
    const [houseRes, balRes, actRes] = await Promise.all([
      houseService.getHouseDetails(houseId),
      axios.get(`/api/houses/${houseId}/balances`).catch(() => null),
      axios.get(`/api/houses/${houseId}/activity?limit=20`).catch(() => null)
    ]);
    if (houseRes.success) setHouse(houseRes.data.house);
    else setError(houseRes.error);
    if (balRes?.data) setBalances(balRes.data);
    if (actRes?.data) setActivity(actRes.data.activities || []);
    setLoading(false);
  };

  const toast = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(house.houseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await houseService.renameHouse(houseId, newName);
    if (result.success) { setHouse(h => ({ ...h, name: newName })); toast('House renamed!'); setShowRename(false); }
    else toast(result.error, true);
    setSaving(false);
  };

  const handleAssignRole = async (memberId, role) => {
    const result = await houseService.assignRole(houseId, memberId, role);
    if (result.success) { toast('Role updated!'); fetchAll(); }
    else toast(result.error, true);
  };

  const handleRemoveMember = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from the house?`)) return;
    const result = await houseService.removeMember(houseId, memberId);
    if (result.success) { toast('Member removed'); fetchAll(); }
    else toast(result.error, true);
  };

  const handleLeave = async () => {
    setSaving(true);
    const result = await houseService.leaveHouse(houseId);
    if (result.success) navigate('/dashboard');
    else { toast(result.error, true); setConfirmLeave(false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await houseService.deleteHouse(houseId);
    if (result.success) navigate('/dashboard');
    else { toast(result.error, true); setConfirmDelete(false); }
    setSaving(false);
  };

  if (loading) return (
    <AppLayout>
      <div className="page-inner">
        <div style={{ display: 'grid', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
      </div>
    </AppLayout>
  );

  if (!house) return (
    <AppLayout>
      <div className="page-inner">
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <h3>House not found</h3>
          <p>{error || 'This house does not exist or you are not a member.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    </AppLayout>
  );

  const isAdmin = ['owner', 'admin'].includes(house.userRole);
  const isOwner = house.userRole === 'owner';
  const myBalance = balances?.netBalance?.[user?.id] ?? null;

  return (
    <AppLayout>
      <div className="page-inner" style={{ animation: 'slideUp 0.3s ease' }}>
        <button className="page-back" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* House Header */}
        <div className="page-header">
          <div>
            <h1>{house.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span className="house-card-key">{house.houseKey}</span>
              <button className="btn btn-xs btn-secondary" onClick={copyKey}>
                {copied ? '✓ Copied' : '📋 Copy Key'}
              </button>
              <span className={`badge badge-${house.userRole.replace(' ', '_')}`}>{house.userRole}</span>
            </div>
          </div>
          <div className="page-header-actions">
            {isAdmin && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setNewName(house.name); setShowRename(true); }}>
                ✏️ Rename
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/house/${houseId}/budget`)}>
              📊 Budget
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/house/${houseId}/balances`)}>
              ⚖️ Balances
            </button>
          </div>
        </div>

        {/* My Balance Banner */}
        {myBalance !== null && (
          <div className={`card ${myBalance > 0 ? 'card-primary' : myBalance < 0 ? '' : ''}`} style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', border: myBalance > 0 ? '1px solid rgba(16,185,129,0.3)' : myBalance < 0 ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border)' }}>
            <div style={{ fontSize: 28 }}>{myBalance > 0 ? '💚' : myBalance < 0 ? '🔴' : '✅'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Balance</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: myBalance > 0 ? 'var(--primary)' : myBalance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {myBalance > 0 ? `+${fmt(myBalance)} you are owed` : myBalance < 0 ? `-${fmt(myBalance)} you owe` : 'All settled up ✓'}
              </div>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => navigate(`/house/${houseId}/balances`)}>
              {myBalance !== 0 ? 'Settle Up →' : 'View Balances →'}
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '📊', label: 'Budget', sub: 'Manage expenses', path: `/house/${houseId}/budget` },
            { icon: '⚖️', label: 'Balances', sub: 'Who owes whom', path: `/house/${houseId}/balances` },
            { icon: '📖', label: 'Expense Book', sub: 'Full history', path: `/house/${houseId}/book` },
          ].map(a => (
            <button
              key={a.label}
              className="card card-hover"
              onClick={() => navigate(a.path)}
              style={{ textAlign: 'left', cursor: 'pointer', border: 'none', background: 'var(--card)', padding: '16px 18px' }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{a.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            👥 Members ({house.members?.length || 0})
          </button>
          <button className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
            🕐 Activity
          </button>
          {isAdmin && (
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              ⚙️ Settings
            </button>
          )}
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {house.members?.map(member => {
              const memberBalance = balances?.netBalance?.[member.id];
              return (
                <div key={member.id} className="member-card">
                  <div className={`avatar avatar-md ${avatarClass(member.username)}`}>
                    {initials(member.username)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.username}
                      {member.id === user?.id && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</div>
                  </div>
                  {memberBalance !== undefined && (
                    <div style={{ textAlign: 'right' }}>
                      <div className={`member-balance-text ${memberBalance > 0 ? 'balance-positive' : memberBalance < 0 ? 'balance-negative' : 'balance-zero'}`}>
                        {memberBalance > 0 ? `+${fmt(memberBalance)}` : memberBalance < 0 ? `-${fmt(memberBalance)}` : '✓ Settled'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {memberBalance > 0 ? 'is owed' : memberBalance < 0 ? 'owes' : ''}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${member.role.replace(' ', '_')}`}>{member.role}</span>
                    {isAdmin && member.id !== user?.id && member.role !== 'owner' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <select
                          value={member.role}
                          onChange={e => handleAssignRole(member.id, e.target.value)}
                          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                        >
                          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button className="btn btn-xs btn-danger" onClick={() => handleRemoveMember(member.id, member.username)} title="Remove member">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="card" style={{ padding: '8px 24px' }}>
            {activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">📋</div>
                <h3>No activity yet</h3>
                <p>Start adding expenses to see activity here.</p>
              </div>
            ) : (
              activity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className={`activity-dot ${item.type}`} />
                  <div className={`avatar avatar-sm ${avatarClass(item.actor)}`} style={{ flexShrink: 0 }}>
                    {item.actor[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                      <strong>{item.actor}</strong>{' '}
                      {item.type === 'settlement' ? 'settled up with' : 'added'}{' '}
                      {item.type === 'settlement' ? <strong>{item.paidTo}</strong> : <span className={`cat-pill cat-${item.category}`}>{CAT_ICONS[item.category]} {item.description}</span>}
                    </div>
                    <div className="activity-meta">{relTime(item.date)}</div>
                  </div>
                  <div className="activity-amount" style={{ color: item.type === 'settlement' ? 'var(--info)' : 'var(--text)' }}>
                    {fmt(item.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Danger Zone</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!isOwner && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Leave House</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>You will lose access to all shared data.</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmLeave(true)}>Leave</button>
                  </div>
                )}
                {isOwner && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Delete House</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Permanently delete the house and all its data. This cannot be undone.</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {showRename && (
        <div className="modal-overlay" onClick={() => setShowRename(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename House</h2>
              <button className="modal-close" onClick={() => setShowRename(false)}>✕</button>
            </div>
            <form onSubmit={handleRename}>
              <div className="form-group">
                <label>New Name</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required autoFocus />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRename(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Rename'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Confirm */}
      {confirmLeave && (
        <div className="modal-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Leave House?</h2>
              <button className="modal-close" onClick={() => setConfirmLeave(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
              Are you sure you want to leave <strong style={{ color: 'var(--text)' }}>{house.name}</strong>? You'll lose access to all shared expenses.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmLeave(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLeave} disabled={saving}>{saving ? 'Leaving…' : 'Leave House'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete House?</h2>
              <button className="modal-close" onClick={() => setConfirmDelete(false)}>✕</button>
            </div>
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ⚠️ This will permanently delete <strong>{house.name}</strong> and all its expenses, budgets, and data.
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14 }}>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
