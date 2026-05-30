import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

const ROLES = ['member', 'financier', 'rent payer', 'admin'];
const ROLE_ICONS = { owner: '👑', admin: '🛡️', financier: '💳', 'rent payer': '🏠', member: '👤' };

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

  useEffect(() => { fetchHouse(); }, [houseId]);

  const fetchHouse = async () => {
    setLoading(true);
    const result = await houseService.getHouseDetails(houseId);
    if (result.success) setHouse(result.data.house);
    else setError(result.error);
    setLoading(false);
  };

  const toast = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
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
    if (result.success) {
      setHouse(h => ({ ...h, name: newName }));
      toast('House renamed!');
      setShowRename(false);
    } else toast(result.error, true);
    setSaving(false);
  };

  const handleAssignRole = async (memberId, role) => {
    const result = await houseService.assignRole(houseId, memberId, role);
    if (result.success) { toast('Role updated!'); fetchHouse(); }
    else toast(result.error, true);
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the house?')) return;
    const result = await houseService.removeMember(houseId, memberId);
    if (result.success) { toast('Member removed'); fetchHouse(); }
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

  if (loading) return <AppLayout><div className="loading-screen"><div className="spinner" /></div></AppLayout>;
  if (!house) return <AppLayout><div style={{ padding: 40, textAlign: 'center' }}><p>{error || 'House not found'}</p><button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button></div></AppLayout>;

  const isAdmin = ['owner', 'admin'].includes(house.userRole);
  const isOwner = house.userRole === 'owner';

  return (
    <AppLayout>
      <div className="page-inner">
        {/* Back */}
        <button className="page-back" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* House header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 6 }}>{house.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge badge-${house.userRole.replace(' ', '_')}`}>{ROLE_ICONS[house.userRole]} {house.userRole}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Owner: {house.owner.username}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => { setNewName(house.name); setShowRename(true); }}>✏️ Rename</button>}
            {!isOwner && <button className="btn btn-danger btn-sm" onClick={() => setConfirmLeave(true)}>Leave House</button>}
            {isOwner && <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>🗑️ Delete House</button>}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <ActionCard icon="📊" title="Budget & Payments" sub="Manage monthly budgets" onClick={() => navigate(`/house/${houseId}/budget`)} />
          <ActionCard icon="📖" title="Expense Book" sub="Full financial ledger" onClick={() => navigate(`/house/${houseId}/book`)} />
          <ActionCard icon="🔑" title={house.houseKey} sub={copied ? '✓ Copied!' : 'Click to copy key'} onClick={copyKey} accent={copied} />
        </div>

        {/* Members */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18 }}>Members <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>({house.members.length})</span></h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {house.members.map(member => {
              const isSelf = member.userId._id === user?._id || member.userId._id === user?.id;
              return (
                <div key={member.userId._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface)', borderRadius: 10, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: 'var(--primary-light)' }}>
                      {member.userId.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{member.userId.username} {isSelf && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(you)</span>}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.userId.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isAdmin && member.role !== 'owner' ? (
                      <select value={member.role} onChange={e => handleAssignRole(member.userId._id, e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className={`badge badge-${member.role.replace(' ', '_')}`}>{ROLE_ICONS[member.role]} {member.role}</span>
                    )}
                    {isAdmin && !isSelf && member.role !== 'owner' && (
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleRemoveMember(member.userId._id)} title="Remove member">✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      {showRename && (
        <div className="modal-overlay" onClick={() => setShowRename(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Rename House</h2>
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

      {/* Confirm Leave */}
      {confirmLeave && (
        <div className="modal-overlay" onClick={() => setConfirmLeave(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Leave "{house.name}"?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>You'll lose access to all house data. You can rejoin with the house key.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmLeave(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLeave} disabled={saving}>{saving ? 'Leaving…' : 'Leave House'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Delete "{house.name}"?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>This is permanent. All budgets, payments, and rent records will be lost.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : '🗑️ Delete Permanently'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ActionCard({ icon, title, sub, onClick, accent }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--card)', border: `1px solid ${accent ? 'var(--success)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '20px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%', fontFamily: 'inherit' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = accent ? 'var(--success)' : 'var(--border)'}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
    </button>
  );
}
