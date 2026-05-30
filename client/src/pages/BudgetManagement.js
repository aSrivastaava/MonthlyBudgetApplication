import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { budgetService } from '../services/budgetService';
import { paymentService } from '../services/paymentService';
import { rentService } from '../services/rentService';
import { statisticsService } from '../services/statisticsService';
import { houseService } from '../services/houseService';
import { bookService } from '../services/bookService';
import AppLayout from '../components/AppLayout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATEGORIES = ['groceries','wifi','gas','electricity','other'];
const CAT_ICONS = { groceries:'🛒', wifi:'📶', gas:'⛽', electricity:'⚡', other:'📦', rent:'🏠' };
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];

export default function BudgetManagement() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('budget');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Budget form
  const [budgetCats, setBudgetCats] = useState(CATEGORIES.map(n => ({ name: n, amount: 0 })));

  // Payment form
  const [payForm, setPayForm] = useState({ category: 'groceries', amount: '', description: '', receipt: null });
  const [payContribs, setPayContribs] = useState([]);

  // Rent form
  const [rentForm, setRentForm] = useState({ totalAmount: '', receipt: null });
  const [rentContribs, setRentContribs] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [houseRes, budgetRes, rentRes] = await Promise.all([
      houseService.getHouseDetails(houseId),
      budgetService.getBudget(houseId, year, month),
      rentService.getRentPayment(houseId, year, month),
    ]);
    if (houseRes.success) {
      setHouse(houseRes.data.house);
      // Initialize member contributions
      const members = houseRes.data.house.members.map(m => ({ userId: m.userId._id, username: m.userId.username, amount: 0 }));
      setPayContribs(members);
      setRentContribs(members);
    }
    if (budgetRes.success) {
      setBudget(budgetRes.data.budget);
      // Pre-fill budget form
      const existing = budgetRes.data.budget.categories;
      setBudgetCats(CATEGORIES.map(n => ({ name: n, amount: existing.find(c => c.name === n)?.amount || 0 })));
      // Fetch payments & stats
      const [payRes, statsRes] = await Promise.all([
        paymentService.getPaymentsByBudget(houseId, budgetRes.data.budget._id),
        statisticsService.getStatistics(houseId, year, month),
      ]);
      if (payRes.success) setPayments(payRes.data.payments);
      if (statsRes.success) setStats(statsRes.data.statistics);
    } else {
      setBudget(null); setPayments([]); setStats(null);
      setBudgetCats(CATEGORIES.map(n => ({ name: n, amount: 0 })));
    }
    if (rentRes.success) setRent(rentRes.data.rentPayment);
    else setRent(null);
    setLoading(false);
  }, [houseId, year, month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toast = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const canManageBudget = house && ['owner','admin','financier'].includes(house.userRole);
  const canManageRent = house && ['owner','admin','rent payer'].includes(house.userRole);

  const handleSaveBudget = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const result = await budgetService.createOrUpdateBudget(houseId, { month, year, categories: budgetCats.filter(c => c.amount > 0) });
    if (result.success) { toast('Budget saved!'); setShowBudgetModal(false); fetchAll(); }
    else toast(result.error, true);
    setSaving(false);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const contribs = payContribs.filter(c => c.amount > 0).map(c => ({ userId: c.userId, amount: c.amount }));
    const result = await paymentService.createPayment(houseId, { ...payForm, budgetId: budget._id, contributions: contribs });
    if (result.success) {
      toast('Payment added!');
      setShowPaymentModal(false);
      setPayForm({ category: 'groceries', amount: '', description: '', receipt: null });
      setPayContribs(prev => prev.map(c => ({ ...c, amount: 0 })));
      fetchAll();
    } else toast(result.error, true);
    setSaving(false);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment?')) return;
    const result = await bookService.deletePayment(houseId, paymentId);
    if (result.success) { toast('Payment deleted'); fetchAll(); }
    else toast(result.error, true);
  };

  const handleSaveRent = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const contribs = rentContribs.filter(c => c.amount > 0).map(c => ({ userId: c.userId, amount: c.amount }));
    const result = await rentService.createOrUpdateRent(houseId, { month, year, ...rentForm, contributions: contribs });
    if (result.success) { toast('Rent recorded!'); setShowRentModal(false); setRentForm({ totalAmount: '', receipt: null }); fetchAll(); }
    else toast(result.error, true);
    setSaving(false);
  };

  // Chart data
  const spendingByCategory = stats ? {
    labels: Object.keys(stats.categoryStats).map(c => `${CAT_ICONS[c]} ${c}`),
    datasets: [{ data: Object.values(stats.categoryStats).map(d => d.spent), backgroundColor: COLORS, borderWidth: 0 }]
  } : null;

  const budgetVsSpent = budget ? {
    labels: budget.categories.map(c => c.name),
    datasets: [
      { label: 'Budgeted', data: budget.categories.map(c => c.amount), backgroundColor: 'rgba(99,102,241,0.6)' },
      { label: 'Spent', data: budget.categories.map(c => stats?.categoryStats[c.name]?.spent || 0), backgroundColor: 'rgba(16,185,129,0.6)' },
    ]
  } : null;

  if (loading) return <AppLayout><div className="loading-screen"><div className="spinner" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-inner">
        <button className="page-back" onClick={() => navigate(`/house/${houseId}`)}>← Back to {house?.name}</button>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24 }}>Budget Management</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={prevMonth}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 16, minWidth: 130, textAlign: 'center' }}>{MONTHS[month-1]} {year}</span>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={nextMonth}>›</button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Stats row */}
        {stats && (
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard label="Budgeted" value={`$${stats.totalBudgeted}`} color="var(--primary)" />
            <StatCard label="Spent" value={`$${stats.totalSpent.toFixed(2)}`} color="var(--danger)" />
            <StatCard label="Remaining" value={`$${stats.totalRemaining.toFixed(2)}`} color={stats.totalRemaining >= 0 ? 'var(--success)' : 'var(--danger)'} />
            {rent && <StatCard label="Rent" value={`$${rent.totalAmount}`} color="var(--warning)" />}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--surface)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
          {['budget', 'rent', 'statistics'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? '#fff' : 'var(--text-muted)' }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Budget Tab ── */}
        {activeTab === 'budget' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!budget ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <h3 style={{ marginBottom: 8 }}>No budget for {MONTHS[month-1]} {year}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>Set a budget to start tracking expenses</p>
                {canManageBudget && <button className="btn btn-primary" onClick={() => setShowBudgetModal(true)}>Create Budget</button>}
              </div>
            ) : (
              <>
                {/* Budget categories */}
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18 }}>Budget Categories</h2>
                    {canManageBudget && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowBudgetModal(true)}>Edit Budget</button>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowPaymentModal(true)}>+ Add Payment</button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {budget.categories.map(cat => {
                      const spent = stats?.categoryStats[cat.name]?.spent || 0;
                      const pct = Math.min((spent / cat.amount) * 100, 100);
                      const over = spent > cat.amount;
                      return (
                        <div key={cat.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{CAT_ICONS[cat.name]} {cat.name}</span>
                            <span style={{ fontSize: 13, color: over ? 'var(--danger)' : 'var(--text-secondary)' }}>
                              ${spent.toFixed(2)} <span style={{ color: 'var(--text-muted)' }}>/ ${cat.amount}</span>
                            </span>
                          </div>
                          <div className="progress">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: over ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--primary)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payments list */}
                <div className="card">
                  <h2 style={{ fontSize: 18, marginBottom: 20 }}>Payments <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>({payments.length})</span></h2>
                  {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>No payments recorded yet.</div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>By</th><th></th></tr></thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p._id}>
                              <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td><span className={`cat-pill cat-${p.category}`}>{CAT_ICONS[p.category]} {p.category}</span></td>
                              <td>{p.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text)' }}>${p.amount.toFixed(2)}</td>
                              <td style={{ fontSize: 12 }}>{p.createdBy?.username}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm btn-icon" title="View receipt">📎</a>}
                                  {canManageBudget && <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeletePayment(p._id)} title="Delete">✕</button>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Rent Tab ── */}
        {activeTab === 'rent' && (
          <div>
            {!rent ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🏠</div>
                <h3 style={{ marginBottom: 8 }}>No rent recorded for {MONTHS[month-1]} {year}</h3>
                {canManageRent && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowRentModal(true)}>Record Rent Payment</button>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 18 }}>Rent Payment</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Recorded by {rent.createdBy?.username} · {new Date(rent.paymentDate).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>${rent.totalAmount}</div>
                      {canManageRent && <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowRentModal(true)}>Update</button>}
                    </div>
                  </div>
                  {rent.receiptUrl && <a href={rent.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">📎 View Receipt</a>}
                </div>

                {rent.contributions.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="card">
                      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Contribution Breakdown</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {rent.contributions.map((c, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface)', borderRadius: 8 }}>
                            <span style={{ fontSize: 14 }}>{c.userId.username}</span>
                            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>${c.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', maxWidth: 200 }}>
                        <Pie data={{
                          labels: rent.contributions.map(c => c.userId.username),
                          datasets: [{ data: rent.contributions.map(c => c.amount), backgroundColor: COLORS, borderWidth: 0 }]
                        }} options={{ plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Statistics Tab ── */}
        {activeTab === 'statistics' && (
          <div>
            {!stats ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
                <h3>No statistics yet</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Create a budget and add payments to see analytics</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {spendingByCategory && (
                    <div className="card">
                      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Spending by Category</h3>
                      <div style={{ maxWidth: 220, margin: '0 auto' }}>
                        <Pie data={spendingByCategory} options={{ plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
                      </div>
                    </div>
                  )}
                  {budgetVsSpent && (
                    <div className="card">
                      <h3 style={{ fontSize: 16, marginBottom: 16 }}>Budget vs Spent</h3>
                      <Bar data={budgetVsSpent} options={{
                        responsive: true,
                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                        scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
                      }} />
                    </div>
                  )}
                </div>

                {/* Member contributions */}
                <div className="card">
                  <h3 style={{ fontSize: 16, marginBottom: 16 }}>Member Contributions</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Member</th><th>Contributed</th><th>Fair Share</th><th>Balance</th></tr></thead>
                      <tbody>
                        {stats.memberContributions.map(m => (
                          <tr key={m.userId}>
                            <td style={{ fontWeight: 600 }}>{m.username}</td>
                            <td>${m.totalContributed.toFixed(2)}</td>
                            <td>${m.totalSpent.toFixed(2)}</td>
                            <td style={{ fontWeight: 700, color: m.balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                              {m.balance >= 0 ? '+' : ''}${m.balance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="modal-overlay" onClick={() => setShowBudgetModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{budget ? 'Update' : 'Create'} Budget — {MONTHS[month-1]} {year}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveBudget}>
              {budgetCats.map((cat, i) => (
                <div className="form-group" key={cat.name}>
                  <label>{CAT_ICONS[cat.name]} {cat.name}</label>
                  <input type="number" value={cat.amount} min="0" step="0.01" placeholder="0.00"
                    onChange={e => setBudgetCats(prev => prev.map((c, j) => j === i ? { ...c, amount: parseFloat(e.target.value) || 0 } : c))} />
                </div>
              ))}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>Add Payment</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddPayment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Category</label>
                  <select value={payForm.category} onChange={e => setPayForm(f => ({ ...f, category: e.target.value }))}>
                    {budget.categories.map(c => <option key={c.name} value={c.name}>{CAT_ICONS[c.name]} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Amount ($)</label>
                  <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required min="0" step="0.01" placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input type="text" value={payForm.description} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Weekly groceries from Walmart" />
              </div>
              <div className="form-group">
                <label>Receipt (optional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setPayForm(f => ({ ...f, receipt: e.target.files[0] }))} />
              </div>

              {/* Member contributions */}
              {payContribs.length > 0 && (
                <div style={{ margin: '8px 0 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Member Contributions (optional)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {payContribs.map((c, i) => (
                      <div key={c.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', flexShrink: 0 }}>{c.username[0].toUpperCase()}</div>
                        <span style={{ fontSize: 13, flex: 1 }}>{c.username}</span>
                        <input type="number" value={c.amount || ''} onChange={e => setPayContribs(prev => prev.map((m, j) => j === i ? { ...m, amount: parseFloat(e.target.value) || 0 } : m))} min="0" step="0.01" placeholder="0.00" style={{ width: 100, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rent Modal */}
      {showRentModal && (
        <div className="modal-overlay" onClick={() => setShowRentModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <h2>{rent ? 'Update' : 'Record'} Rent — {MONTHS[month-1]} {year}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSaveRent}>
              <div className="form-group">
                <label>Total Rent Amount ($)</label>
                <input type="number" value={rentForm.totalAmount} onChange={e => setRentForm(f => ({ ...f, totalAmount: e.target.value }))} required min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Receipt (optional)</label>
                <input type="file" accept="image/*,application/pdf" onChange={e => setRentForm(f => ({ ...f, receipt: e.target.files[0] }))} />
              </div>

              {rentContribs.length > 0 && (
                <div style={{ margin: '8px 0 16px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Member Contributions (optional)</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rentContribs.map((c, i) => (
                      <div key={c.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--warning-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>{c.username[0].toUpperCase()}</div>
                        <span style={{ fontSize: 13, flex: 1 }}>{c.username}</span>
                        <input type="number" value={c.amount || ''} onChange={e => setRentContribs(prev => prev.map((m, j) => j === i ? { ...m, amount: parseFloat(e.target.value) || 0 } : m))} min="0" step="0.01" placeholder="0.00" style={{ width: 100, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Rent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}
