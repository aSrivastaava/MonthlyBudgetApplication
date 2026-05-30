import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';

function avatarClass(name) {
  if (!name) return 'av-a';
  return 'av-' + name[0].toLowerCase().replace(/[^a-z]/, 'a');
}
function initials(name) { return name ? name[0].toUpperCase() : '?'; }
function fmt(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BalancePage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettle, setShowSettle] = useState(false);
  const [settleForm, setSettleForm] = useState({ paidTo: '', amount: '', note: '' });
  const [settling, setSettling] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => { fetchBalances(); }, [houseId]);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/houses/${houseId}/balances`);
      setBalances(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load balances');
    }
    setLoading(false);
  };

  const toast = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setSettling(true);
    try {
      await axios.post(`/api/houses/${houseId}/settle`, {
        paidTo: settleForm.paidTo,
        amount: parseFloat(settleForm.amount),
        note: settleForm.note
      });
      toast('Settlement recorded!');
      setShowSettle(false);
      setSettleForm({ paidTo: '', amount: '', note: '' });
      fetchBalances();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to record settlement', true);
    }
    setSettling(false);
  };

  const openSettleWith = (toUserId, amount) => {
    setSettleForm({ paidTo: toUserId, amount: amount > 0 ? amount.toFixed(2) : '', note: '' });
    setShowSettle(true);
  };

  if (loading) return (
    <AppLayout>
      <div className="page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />)}
        </div>
      </div>
    </AppLayout>
  );

  const myId = user?.id;
  const myBalance = balances?.netBalance?.[myId] ?? 0;
  const others = balances?.members?.filter(m => m.id !== myId) || [];
  const myDebts = balances?.debts?.filter(d => d.from.id === myId) || [];
  const owedToMe = balances?.debts?.filter(d => d.to.id === myId) || [];

  return (
    <AppLayout>
      <div className="page-inner" style={{ animation: 'slideUp 0.3s ease' }}>
        <button className="page-back" onClick={() => navigate(`/house/${houseId}`)}>
          ← Back to House
        </button>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="page-header">
          <div>
            <h1>⚖️ Balances</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Track who owes whom and settle up easily
            </p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setShowSettle(true)}>
              ✅ Record Settlement
            </button>
          </div>
        </div>

        {/* My Balance Hero */}
        <div style={{
          background: myBalance > 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))' :
                      myBalance < 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))' :
                      'var(--card)',
          border: myBalance > 0 ? '1px solid rgba(16,185,129,0.25)' : myBalance < 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '28px 32px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 24
        }}>
          <div style={{ fontSize: 48 }}>
            {myBalance > 0 ? '💚' : myBalance < 0 ? '🔴' : '🎉'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
              Your Overall Balance
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', color: myBalance > 0 ? 'var(--primary)' : myBalance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {myBalance > 0 ? `+${fmt(myBalance)}` : myBalance < 0 ? `-${fmt(myBalance)}` : 'All settled up!'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              {myBalance > 0 ? `${owedToMe.length} person${owedToMe.length !== 1 ? 's' : ''} owe${owedToMe.length === 1 ? 's' : ''} you money` :
               myBalance < 0 ? `You owe money to ${myDebts.length} person${myDebts.length !== 1 ? 's' : ''}` :
               'No outstanding balances — you\'re all good!'}
            </div>
          </div>
          {myBalance !== 0 && (
            <button className="btn btn-primary btn-lg" onClick={() => setShowSettle(true)}>
              Settle Up →
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Members</div>
            <div className="stat-value">{balances?.members?.length || 0}</div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-icon">💸</div>
            <div className="stat-label">You Owe</div>
            <div className="stat-value negative">{myBalance < 0 ? fmt(myBalance) : '₹0'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Owed to You</div>
            <div className="stat-value positive">{myBalance > 0 ? fmt(myBalance) : '₹0'}</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">🤝</div>
            <div className="stat-label">Settlements</div>
            <div className="stat-value">{balances?.settlements?.length || 0}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
            Summary
          </button>
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All Balances
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            Settlement History
          </button>
        </div>

        {/* Summary tab — show who owes whom (simplified) */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(balances?.debts?.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <h3>Everyone is settled up!</h3>
                <p>No outstanding balances in this house.</p>
              </div>
            ) : balances?.debts?.map((debt, i) => {
              const isMe = debt.from.id === myId || debt.to.id === myId;
              return (
                <div key={i} className="debt-card" style={{ border: isMe ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--border)' }}>
                  {/* From */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={`avatar ${avatarClass(debt.from.username)}`}>
                      {initials(debt.from.username)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {debt.from.id === myId ? 'You' : debt.from.username}
                      </div>
                      {isMe && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>owes</div>}
                    </div>
                  </div>

                  {/* Arrow + Amount */}
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: 20, color: 'var(--text-muted)' }}>→</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: debt.from.id === myId ? 'var(--danger)' : 'var(--primary)' }}>
                      {fmt(debt.amount)}
                    </div>
                  </div>

                  {/* To */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse', textAlign: 'right' }}>
                    <div className={`avatar ${avatarClass(debt.to.username)}`}>
                      {initials(debt.to.username)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {debt.to.id === myId ? 'You' : debt.to.username}
                      </div>
                      {isMe && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>receives</div>}
                    </div>
                  </div>

                  {/* Settle button (only for debtor) */}
                  {debt.from.id === myId && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openSettleWith(debt.to.id, debt.amount)}
                    >
                      Pay {fmt(debt.amount)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* All Balances tab */}
        {activeTab === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {balances?.members?.map(member => {
              const bal = balances.netBalance[member.id] ?? 0;
              return (
                <div key={member.id} className="member-card">
                  <div className={`avatar avatar-md ${avatarClass(member.username)}`}>
                    {initials(member.username)}
                  </div>
                  <div className="member-info">
                    <div className="member-name">
                      {member.username}
                      {member.id === myId && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`member-balance-text ${bal > 0 ? 'balance-positive' : bal < 0 ? 'balance-negative' : 'balance-zero'}`} style={{ fontSize: 16 }}>
                      {bal > 0 ? `+${fmt(bal)}` : bal < 0 ? `-${fmt(bal)}` : 'Settled'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {bal > 0 ? 'is owed' : bal < 0 ? 'owes' : ''}
                    </div>
                  </div>
                  {bal < 0 && member.id === myId && (
                    <button className="btn btn-sm btn-primary" onClick={() => setShowSettle(true)}>
                      Settle Up
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Settlement History */}
        {activeTab === 'history' && (
          <div>
            {(balances?.settlements?.length === 0) ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No settlements yet</h3>
                <p>When someone settles a debt, it will appear here.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Amount</th>
                      <th>Note</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.settlements.map(s => (
                      <tr key={s.id}>
                        <td className="td-primary">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`avatar avatar-sm ${avatarClass(s.paidBy.username)}`}>{initials(s.paidBy.username)}</div>
                            {s.paidBy.id === myId ? <strong>You</strong> : s.paidBy.username}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`avatar avatar-sm ${avatarClass(s.paidTo.username)}`}>{initials(s.paidTo.username)}</div>
                            {s.paidTo.id === myId ? <strong>You</strong> : s.paidTo.username}
                          </div>
                        </td>
                        <td className="amount" style={{ color: 'var(--info)' }}>{fmt(s.amount)}</td>
                        <td>{s.note || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{new Date(s.settledAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settle Up Modal */}
      {showSettle && (
        <div className="modal-overlay" onClick={() => setShowSettle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Record Settlement</h2>
              <button className="modal-close" onClick={() => setShowSettle(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Record a payment you made to settle a debt with a housemate.
            </p>
            <form onSubmit={handleSettle}>
              <div className="form-group">
                <label>Paid To</label>
                <select
                  value={settleForm.paidTo}
                  onChange={e => setSettleForm(f => ({ ...f, paidTo: e.target.value }))}
                  required
                >
                  <option value="">Select member…</option>
                  {balances?.members?.filter(m => m.id !== myId).map(m => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={settleForm.amount}
                  onChange={e => setSettleForm(f => ({ ...f, amount: e.target.value }))}
                  required placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Note <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="text"
                  value={settleForm.note}
                  onChange={e => setSettleForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Paid via UPI"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSettle(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={settling}>
                  {settling ? 'Recording…' : '✅ Record Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
