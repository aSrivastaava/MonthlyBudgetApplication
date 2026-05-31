import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AppLayout, { avColor, avInit, fmtINR } from '../components/AppLayout';
import { ChevronLeft, Scale, Users, CheckCircle, Clock, Plus } from 'lucide-react';

const X = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function BalancePage() {
  const { houseId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('debts');
  const [toast, setToast] = useState({ msg: '', type: 'ok' });
  const [showSettle, setShowSettle] = useState(false);
  const [form, setForm] = useState({ paidTo: '', amount: '', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { load(); }, [houseId]);

  const load = async () => {
    setLoading(true);
    try { const r = await axios.get(`/api/houses/${houseId}/balances`); setData(r.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '' }), 3000); };

  const settle = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await axios.post(`/api/houses/${houseId}/settle`, { paidTo: form.paidTo, amount: parseFloat(form.amount), note: form.note });
      showToast('Settlement recorded!');
      setShowSettle(false); setForm({ paidTo: '', amount: '', note: '' }); load();
    } catch (e) { showToast(e.response?.data?.message || 'Failed', 'err'); }
    setBusy(false);
  };

  const openFor = (toId, amount) => { setForm({ paidTo: toId, amount: amount > 0 ? amount.toFixed(2) : '', note: '' }); setShowSettle(true); };

  if (loading) return <AppLayout><div className="page">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 10, marginBottom: 10 }} />)}</div></AppLayout>;

  const myId = user?.id?.toString();
  const myBal = data?.netBalance?.[myId] ?? 0;
  const myDebts = data?.debts?.filter(d => d.from.id === myId) || [];
  const owedToMe = data?.debts?.filter(d => d.to.id === myId) || [];

  return (
    <AppLayout>
      <div className="page enter">
        <button className="back-btn" onClick={() => nav(`/house/${houseId}`)}><ChevronLeft size={14} /> House</button>

        <div className="page-hd">
          <div className="page-hd-left">
            <h1>Balances</h1>
            <p>Track shared expenses and settle debts</p>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-primary" onClick={() => setShowSettle(true)}><Plus size={14} /> Record Settlement</button>
          </div>
        </div>

        {/* Hero balance card */}
        <div style={{
          borderRadius: 18, padding: '24px 28px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20,
          background: myBal > 0.005 ? 'rgba(34,197,94,.07)' : myBal < -0.005 ? 'rgba(239,68,68,.07)' : 'var(--glass)',
          border: `1px solid ${myBal > 0.005 ? 'rgba(34,197,94,.25)' : myBal < -0.005 ? 'rgba(239,68,68,.22)' : 'var(--stroke)'}`,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            background: myBal > 0.005 ? 'var(--green-d)' : myBal < -0.005 ? 'var(--red-d)' : 'var(--glass)' }}>
            {myBal > 0.005 ? '💚' : myBal < -0.005 ? '🔴' : '🎉'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>Your Net Balance</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.03em', color: myBal > 0.005 ? 'var(--green)' : myBal < -0.005 ? 'var(--red)' : 'var(--t3)' }}>
              {myBal > 0.005 ? `+${fmtINR(myBal)}` : myBal < -0.005 ? `-${fmtINR(myBal)}` : 'All settled'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginTop: 4 }}>
              {myBal > 0.005 ? `${owedToMe.length} person${owedToMe.length !== 1 ? 's' : ''} owe${owedToMe.length === 1 ? 's' : ''} you` :
               myBal < -0.005 ? `You owe ${myDebts.length} person${myDebts.length !== 1 ? 's' : ''}` : 'No outstanding balances'}
            </div>
          </div>
          {Math.abs(myBal) > 0.005 && (
            <button className="btn btn-primary btn-lg" onClick={() => setShowSettle(true)}>
              <Scale size={15} /> Settle Up
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon-box"><Users size={16} /></div>
            <div><div className="stat-lbl">Members</div><div className="stat-val">{data?.members?.length || 0}</div></div>
          </div>
          <div className="stat-card red">
            <div className="stat-icon-box"><Scale size={16} /></div>
            <div><div className="stat-lbl">You Owe</div><div className="stat-val">{myBal < -0.005 ? fmtINR(myBal) : '₹0'}</div></div>
          </div>
          <div className="stat-card green">
            <div className="stat-icon-box"><CheckCircle size={16} /></div>
            <div><div className="stat-lbl">Owed to You</div><div className="stat-val">{myBal > 0.005 ? fmtINR(myBal) : '₹0'}</div></div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-icon-box"><Clock size={16} /></div>
            <div><div className="stat-lbl">Settlements</div><div className="stat-val">{data?.settlements?.length || 0}</div></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'debts' ? 'on' : ''}`} onClick={() => setTab('debts')}>Simplified Debts ({data?.debts?.length || 0})</button>
          <button className={`tab ${tab === 'all' ? 'on' : ''}`} onClick={() => setTab('all')}>All Balances</button>
          <button className={`tab ${tab === 'history' ? 'on' : ''}`} onClick={() => setTab('history')}>History ({data?.settlements?.length || 0})</button>
        </div>

        {tab === 'debts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!data?.debts?.length ? (
              <div className="empty">
                <div className="empty-icon" style={{ background: 'var(--green-d)', borderColor: 'rgba(34,197,94,.2)', color: 'var(--green)' }}><CheckCircle size={24} /></div>
                <h3>Everyone is settled up!</h3><p>No outstanding debts in this house.</p>
              </div>
            ) : data.debts.map((d, i) => {
              const isMine = d.from.id === myId;
              return (
                <div key={i} className="row-item" style={{ borderColor: isMine ? 'rgba(239,68,68,.25)' : d.to.id === myId ? 'rgba(34,197,94,.25)' : 'var(--stroke)' }}>
                  <div className={`av ${avColor(d.from.username)}`}>{avInit(d.from.username)}</div>
                  <div className="row-meta">
                    <div className="row-name">{d.from.id === myId ? 'You' : d.from.username}</div>
                    <div className="row-sub">owes</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 2 }}>→</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: isMine ? 'var(--red)' : 'var(--green)' }}>{fmtINR(d.amount)}</div>
                  </div>
                  <div className="row-meta" style={{ textAlign: 'right' }}>
                    <div className="row-name">{d.to.id === myId ? 'You' : d.to.username}</div>
                    <div className="row-sub">receives</div>
                  </div>
                  <div className={`av ${avColor(d.to.username)}`}>{avInit(d.to.username)}</div>
                  {isMine && <button className="btn btn-sm btn-primary" onClick={() => openFor(d.to.id, d.amount)}>Pay {fmtINR(d.amount)}</button>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'all' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data?.members?.map(m => {
              const bal = data.netBalance[m.id] ?? 0;
              return (
                <div key={m.id} className="row-item">
                  <div className={`av av-md ${avColor(m.username)}`}>{avInit(m.username)}</div>
                  <div className="row-meta">
                    <div className="row-name">{m.username}{m.id === myId && <span style={{ fontSize: 11, color: 'var(--t4)', marginLeft: 7 }}>you</span>}</div>
                    <div className="row-sub">{m.role}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: 14, fontWeight: 800, color: bal > 0.005 ? 'var(--green)' : bal < -0.005 ? 'var(--red)' : 'var(--t4)' }}>
                      {bal > 0.005 ? `+${fmtINR(bal)}` : bal < -0.005 ? `-${fmtINR(bal)}` : '—'}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--t4)' }}>{bal > 0.005 ? 'owed' : bal < -0.005 ? 'owes' : 'settled'}</div>
                  </div>
                  {bal < -0.005 && m.id === myId && <button className="btn btn-sm btn-primary" onClick={() => setShowSettle(true)}><Scale size={13} /> Settle</button>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'history' && (
          !data?.settlements?.length ? (
            <div className="empty">
              <div className="empty-icon"><Clock size={22} /></div>
              <h3>No settlements yet</h3><p>Settled debts will appear here.</p>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Paid By</th><th>Paid To</th><th>Amount</th><th>Note</th><th>Date</th></tr></thead>
                <tbody>
                  {data.settlements.map(s => (
                    <tr key={s.id}>
                      <td className="fw"><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div className={`av av-sm ${avColor(s.paidBy.username)}`}>{avInit(s.paidBy.username)}</div>{s.paidBy.id === myId ? <strong>You</strong> : s.paidBy.username}</div></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><div className={`av av-sm ${avColor(s.paidTo.username)}`}>{avInit(s.paidTo.username)}</div>{s.paidTo.id === myId ? <strong>You</strong> : s.paidTo.username}</div></td>
                      <td className="num" style={{ color: 'var(--cyan)' }}>{fmtINR(s.amount)}</td>
                      <td className="muted">{s.note || '—'}</td>
                      <td className="muted">{new Date(s.settledAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {toast.msg && <div className="toast-stack"><div className={`toast toast-${toast.type}`}>{toast.type === 'ok' ? '✓' : '✕'} {toast.msg}</div></div>}

      {showSettle && (
        <div className="overlay" onClick={() => setShowSettle(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2><Scale size={17} style={{ marginRight: 6, verticalAlign: 'middle' }} />Record Settlement</h2><button className="close-btn" onClick={() => setShowSettle(false)}><X /></button></div>
            <p style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 18 }}>Record a payment you made to a housemate to settle a debt.</p>
            <form onSubmit={settle}>
              <div className="field">
                <label>Paid To</label>
                <select className="input input-select" value={form.paidTo} onChange={e => setForm(f => ({ ...f, paidTo: e.target.value }))} required>
                  <option value="">Select member…</option>
                  {data?.members?.filter(m => m.id !== myId).map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Amount (₹)</label>
                <input className="input" type="number" min=".01" step=".01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Note <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--t4)' }}>(optional)</span></label>
                <input className="input" type="text" placeholder="e.g. Paid via UPI" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setShowSettle(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Recording…' : 'Record Settlement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
