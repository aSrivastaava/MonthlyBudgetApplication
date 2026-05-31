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
import AppLayout, { avColor, avInit, fmtINR } from '../components/AppLayout';
import {
  ChevronLeft, ChevronLeft as PrevM, ChevronRight as NextM,
  Plus, Trash2, Receipt, BarChart3, Home, TrendingUp, Wallet
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CATS = ['groceries','wifi','gas','electricity','other'];
const CAT_IC = { groceries:'🛒', wifi:'📶', gas:'⛽', electricity:'⚡', other:'📦', rent:'🏠' };
const CAT_CLR = { groceries:'#4ade80', wifi:'#a5b4fc', gas:'#fcd34d', electricity:'#fdba74', other:'#94a3b8', rent:'#fca5a5' };
const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const X = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const CHART_OPTS = {
  plugins: { legend: { labels: { color: '#9ba3c4', font: { size: 11 }, padding: 16 } } },
  scales: {
    x: { ticks: { color: '#5a6384', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.04)' } },
    y: { ticks: { color: '#5a6384', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.04)' } }
  }
};
const PIE_OPTS = { plugins: { legend: { labels: { color: '#9ba3c4', font: { size: 11 }, padding: 14 } } } };

export default function BudgetManagement() {
  const { houseId } = useParams();
  const nav = useNavigate();
  const [house, setHouse] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [budget, setBudget] = useState(null);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [rent, setRent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('budget');
  const [toast, setToast] = useState({ msg: '', type: 'ok' });

  const [modal, setModal] = useState(null); // 'budget'|'payment'|'rent'
  const [busy, setBusy] = useState(false);

  const [budgetCats, setBudgetCats] = useState(CATS.map(n => ({ name: n, amount: 0 })));
  const [payForm, setPayForm] = useState({ category: '', amount: '', description: '', receipt: null });
  const [payContribs, setPayContribs] = useState([]);
  const [rentForm, setRentForm] = useState({ totalAmount: '', receipt: null });
  const [rentContribs, setRentContribs] = useState([]);

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '' }), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [hr, br, rr] = await Promise.all([
      houseService.getHouseDetails(houseId),
      budgetService.getBudget(houseId, year, month),
      rentService.getRentPayment(houseId, year, month),
    ]);
    if (hr.success) {
      setHouse(hr.data.house);
      const mems = hr.data.house.members.map(m => ({ userId: m.id, username: m.username, amount: 0 }));
      setPayContribs(mems); setRentContribs(mems);
    }
    if (br.success) {
      setBudget(br.data.budget);
      const ex = br.data.budget.categories;
      setBudgetCats(CATS.map(n => ({ name: n, amount: ex.find(c => c.name === n)?.amount || 0 })));
      const [pr, sr] = await Promise.all([
        paymentService.getPaymentsByBudget(houseId, br.data.budget._id),
        statisticsService.getStatistics(houseId, year, month),
      ]);
      if (pr.success) setPayments(pr.data.payments);
      if (sr.success) setStats(sr.data.statistics);
    } else {
      setBudget(null); setPayments([]); setStats(null);
      setBudgetCats(CATS.map(n => ({ name: n, amount: 0 })));
    }
    setRent(rr.success ? rr.data.rentPayment : null);
    setLoading(false);
  }, [houseId, year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const saveBudget = async e => {
    e.preventDefault(); setBusy(true);
    const cats = budgetCats.filter(c => c.amount > 0);
    const r = await budgetService.createOrUpdateBudget(houseId, { month, year, categories: cats });
    if (r.success) { showToast('Budget saved!'); setModal(null); load(); }
    else showToast(r.error, 'err');
    setBusy(false);
  };

  const savePayment = async e => {
    e.preventDefault(); setBusy(true);
    const contrib = payContribs.filter(c => c.amount > 0);
    const r = await paymentService.createPayment(houseId, {
      budgetId: budget._id,
      category: payForm.category,
      amount: parseFloat(payForm.amount),
      description: payForm.description,
      receipt: payForm.receipt,
      contributions: contrib.map(c => ({ userId: c.userId, amount: parseFloat(c.amount) })),
    });
    if (r.success) {
      showToast('Payment added!'); setModal(null);
      setPayForm({ category: budget.categories[0]?.name || '', amount: '', description: '', receipt: null });
      setPayContribs(pc => pc.map(c => ({ ...c, amount: 0 })));
      load();
    } else showToast(r.error, 'err');
    setBusy(false);
  };

  const deletePayment = async id => {
    if (!window.confirm('Delete this payment?')) return;
    const r = await bookService.deletePayment(houseId, id);
    if (r.success) { showToast('Payment deleted'); load(); }
    else showToast(r.error, 'err');
  };

  const saveRent = async e => {
    e.preventDefault(); setBusy(true);
    const contrib = rentContribs.filter(c => c.amount > 0);
    const r = await rentService.createRentPayment(houseId, {
      month, year,
      totalAmount: parseFloat(rentForm.totalAmount),
      receipt: rentForm.receipt,
      contributions: contrib.map(c => ({ userId: c.userId, amount: parseFloat(c.amount) })),
    });
    if (r.success) { showToast('Rent saved!'); setModal(null); setRentForm({ totalAmount: '', receipt: null }); setRentContribs(rc => rc.map(c => ({ ...c, amount: 0 }))); load(); }
    else showToast(r.error, 'err');
    setBusy(false);
  };

  const spendingByCategory = stats?.categoryBreakdown?.length > 0 ? {
    labels: stats.categoryBreakdown.map(c => c.category),
    datasets: [{ data: stats.categoryBreakdown.map(c => c.totalSpent), backgroundColor: CHART_COLORS, borderWidth: 0 }]
  } : null;

  const budgetVsSpent = budget?.categories?.length > 0 ? {
    labels: budget.categories.map(c => c.name),
    datasets: [
      { label: 'Budget', data: budget.categories.map(c => c.amount), backgroundColor: 'rgba(99,102,241,.5)', borderRadius: 4 },
      { label: 'Spent', data: budget.categories.map(c => stats?.categoryBreakdown?.find(x => x.category === c.name)?.totalSpent || 0), backgroundColor: 'rgba(239,68,68,.6)', borderRadius: 4 }
    ]
  } : null;

  if (loading) return (
    <AppLayout>
      <div className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </div>
    </AppLayout>
  );

  const totalBudget = budget?.categories?.reduce((s, c) => s + c.amount, 0) || 0;
  const totalSpent = stats?.totalSpent || 0;
  const pct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <AppLayout>
      <div className="page enter">
        <button className="back-btn" onClick={() => nav(`/house/${houseId}`)}><ChevronLeft size={14} /> House</button>

        {/* Header with month nav */}
        <div className="page-hd">
          <div className="page-hd-left">
            <h1>Budget</h1>
            <p>{house?.name}</p>
          </div>
          <div className="page-hd-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--glass)', border: '1px solid var(--stroke)', borderRadius: 10, padding: '4px 6px' }}>
              <button className="btn btn-xs btn-ghost btn-icon" onClick={prevMonth}><PrevM size={14} /></button>
              <span style={{ fontSize: 13.5, fontWeight: 700, minWidth: 130, textAlign: 'center', color: 'var(--t1)' }}>{MONTHS[month - 1]} {year}</span>
              <button className="btn btn-xs btn-ghost btn-icon" onClick={nextMonth}><NextM size={14} /></button>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal('budget')}><BarChart3 size={14} /> {budget ? 'Edit Budget' : 'Set Budget'}</button>
            {budget && <button className="btn btn-primary btn-sm" onClick={() => { setPayForm(f => ({ ...f, category: budget.categories[0]?.name || '' })); setModal('payment'); }}><Plus size={14} /> Add Payment</button>}
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon-box"><Wallet size={16} /></div>
            <div>
              <div className="stat-lbl">Total Budget</div>
              <div className="stat-val" style={{ color: 'var(--p-1)' }}>{fmtINR(totalBudget)}</div>
            </div>
          </div>
          <div className={`stat-card ${totalSpent > totalBudget ? 'red' : ''}`}>
            <div className="stat-icon-box" style={totalSpent > totalBudget ? { background: 'var(--red-d)', color: 'var(--red)' } : {}}><TrendingUp size={16} /></div>
            <div>
              <div className="stat-lbl">Spent</div>
              <div className="stat-val" style={{ color: totalSpent > totalBudget ? 'var(--red)' : 'var(--t1)' }}>{fmtINR(totalSpent)}</div>
            </div>
          </div>
          <div className={`stat-card ${totalBudget - totalSpent < 0 ? 'red' : 'green'}`}>
            <div className="stat-icon-box" style={{ background: totalBudget - totalSpent >= 0 ? 'var(--green-d)' : 'var(--red-d)', color: totalBudget - totalSpent >= 0 ? 'var(--green)' : 'var(--red)' }}><Wallet size={16} /></div>
            <div>
              <div className="stat-lbl">Remaining</div>
              <div className="stat-val" style={{ color: totalBudget - totalSpent >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtINR(Math.abs(totalBudget - totalSpent))}</div>
              <div className="stat-sub">{totalBudget - totalSpent >= 0 ? 'available' : 'over budget'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box"><Receipt size={16} /></div>
            <div>
              <div className="stat-lbl">Payments</div>
              <div className="stat-val">{payments.length}</div>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        {totalBudget > 0 && (
          <div className="card card-sm" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>Overall spending</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)' }}>{pct.toFixed(0)}%</span>
            </div>
            <div className="prog prog-lg">
              <div className="prog-fill" style={{ width: `${pct}%`, background: pct > 100 ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--p-grad)' }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'budget' ? 'on' : ''}`} onClick={() => setTab('budget')}><BarChart3 size={14} /> Budget</button>
          <button className={`tab ${tab === 'payments' ? 'on' : ''}`} onClick={() => setTab('payments')}><Receipt size={14} /> Payments ({payments.length})</button>
          <button className={`tab ${tab === 'rent' ? 'on' : ''}`} onClick={() => setTab('rent')}><Home size={14} /> Rent</button>
          <button className={`tab ${tab === 'stats' ? 'on' : ''}`} onClick={() => setTab('stats')}><TrendingUp size={14} /> Stats</button>
        </div>

        {/* BUDGET TAB */}
        {tab === 'budget' && (
          !budget ? (
            <div className="empty">
              <div className="empty-icon"><Wallet size={22} /></div>
              <h3>No budget for {MO[month-1]} {year}</h3>
              <p>Set a monthly budget to start tracking expenses by category.</p>
              <button className="btn btn-primary" onClick={() => setModal('budget')}><Plus size={14} /> Set Budget</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {budget.categories.map(cat => {
                const spent = stats?.categoryBreakdown?.find(c => c.category === cat.name)?.totalSpent || 0;
                const p = (spent / cat.amount) * 100;
                return (
                  <div key={cat.name} className="card card-sm">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: `${CAT_CLR[cat.name]}18`, flexShrink: 0 }}>
                        {CAT_IC[cat.name]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', textTransform: 'capitalize' }}>{cat.name}</span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: p > 100 ? 'var(--red)' : 'var(--t1)' }}>{fmtINR(spent)}</span>
                            <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 4 }}>/ {fmtINR(cat.amount)}</span>
                          </div>
                        </div>
                        <div className="prog">
                          <div className="prog-fill" style={{ width: `${Math.min(p, 100)}%`, background: p > 100 ? 'var(--red)' : p > 80 ? 'var(--amber)' : CAT_CLR[cat.name] }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* PAYMENTS TAB */}
        {tab === 'payments' && (
          payments.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><Receipt size={22} /></div>
              <h3>No payments yet</h3>
              <p>{budget ? 'Add your first payment to start tracking expenses.' : 'Set a budget first, then add payments.'}</p>
              {budget && <button className="btn btn-primary" onClick={() => { setPayForm(f => ({ ...f, category: budget.categories[0]?.name || '' })); setModal('payment'); }}><Plus size={14} /> Add Payment</button>}
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Contributions</th><th></th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td><span className={`cat cat-${p.category}`}>{CAT_IC[p.category]} {p.category}</span></td>
                      <td className="fw">{p.description || <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                      <td className="num">{fmtINR(p.amount)}</td>
                      <td>
                        {p.contributions?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.contributions.map((c, i) => (
                              <span key={i} style={{ fontSize: 10.5, background: 'var(--p-dim)', color: 'var(--p-1)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(99,102,241,.2)' }}>
                                {c.userId?.username || '?'}: {fmtINR(c.amount)}
                              </span>
                            ))}
                          </div>
                        ) : <span className="muted" style={{ fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-ghost btn-icon" title="Receipt"><Receipt size={12} /></a>}
                          <button className="btn btn-xs btn-danger btn-icon" onClick={() => deletePayment(p._id)} title="Delete"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* RENT TAB */}
        {tab === 'rent' && (
          <div>
            {!rent ? (
              <div className="empty">
                <div className="empty-icon"><Home size={22} /></div>
                <h3>No rent for {MO[month-1]} {year}</h3>
                <p>Record the rent payment for this month.</p>
                <button className="btn btn-primary" onClick={() => setModal('rent')}><Plus size={14} /> Record Rent</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Total Rent</div>
                      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.03em', color: 'var(--red)' }}>{fmtINR(rent.totalAmount)}</div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t3)' }}>
                      {MO[rent.month - 1]} {rent.year}
                    </div>
                  </div>
                  {rent.receiptUrl && <a href={rent.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Receipt size={13} /> View Receipt</a>}
                </div>
                {rent.contributions?.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="card">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>Contributions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rent.contributions.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'var(--base-2)', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className={`av av-sm ${avColor(c.userId?.username)}`}>{avInit(c.userId?.username)}</div>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)' }}>{c.userId?.username || '?'}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--red)' }}>{fmtINR(c.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '100%', maxWidth: 200 }}>
                        <Pie data={{
                          labels: rent.contributions.map(c => c.userId?.username || '?'),
                          datasets: [{ data: rent.contributions.map(c => c.amount), backgroundColor: CHART_COLORS, borderWidth: 0 }]
                        }} options={PIE_OPTS} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          !stats ? (
            <div className="empty">
              <div className="empty-icon"><TrendingUp size={22} /></div>
              <h3>No statistics yet</h3>
              <p>Create a budget and add payments to see analytics.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {spendingByCategory && (
                  <div className="card"><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>Spending by Category</div><div style={{ maxWidth: 220, margin: '0 auto' }}><Pie data={spendingByCategory} options={PIE_OPTS} /></div></div>
                )}
                {budgetVsSpent && (
                  <div className="card"><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 16 }}>Budget vs Spent</div><Bar data={budgetVsSpent} options={CHART_OPTS} /></div>
                )}
              </div>
              <div className="card">
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 14 }}>Member Contributions</div>
                <div className="tbl-wrap" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>Member</th><th>Contributed</th><th>Fair Share</th><th>Balance</th></tr></thead>
                    <tbody>
                      {stats.memberContributions.map(m => (
                        <tr key={m.userId}>
                          <td className="fw">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className={`av av-sm ${avColor(m.username)}`}>{avInit(m.username)}</div>
                              {m.username}
                            </div>
                          </td>
                          <td className="num">{fmtINR(m.totalContributed)}</td>
                          <td className="muted">{fmtINR(m.totalSpent)}</td>
                          <td className="fw" style={{ color: m.balance >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                            {m.balance >= 0 ? '+' : ''}{fmtINR(m.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {toast.msg && <div className="toast-stack"><div className={`toast toast-${toast.type}`}>{toast.type === 'ok' ? '✓' : '✕'} {toast.msg}</div></div>}

      {/* BUDGET MODAL */}
      {modal === 'budget' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>{budget ? 'Edit Budget' : 'Set Budget'} — {MO[month-1]} {year}</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <form onSubmit={saveBudget}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
                {budgetCats.map((cat, i) => (
                  <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--base-2)', borderRadius: 8, border: '1px solid var(--stroke)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `${CAT_CLR[cat.name]}18`, flexShrink: 0 }}>{CAT_IC[cat.name]}</div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t1)', flex: 1, textTransform: 'capitalize' }}>{cat.name}</span>
                    <input className="input" type="number" min="0" step="0.01" placeholder="0"
                      value={cat.amount || ''}
                      onChange={e => setBudgetCats(bc => bc.map((c, j) => j === i ? { ...c, amount: parseFloat(e.target.value) || 0 } : c))}
                      style={{ width: 110, textAlign: 'right' }} />
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 0 4px', fontSize: 13, color: 'var(--t3)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total budget</span>
                <strong style={{ color: 'var(--t1)' }}>{fmtINR(budgetCats.reduce((s, c) => s + (c.amount || 0), 0))}</strong>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {modal === 'payment' && budget && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>Add Payment</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <form onSubmit={savePayment}>
              <div className="form-row">
                <div className="field">
                  <label>Category</label>
                  <select className="input input-select" value={payForm.category} onChange={e => setPayForm(f => ({ ...f, category: e.target.value }))} required>
                    {budget.categories.map(c => <option key={c.name} value={c.name}>{CAT_IC[c.name]} {c.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Amount (₹)</label>
                  <input className="input" type="number" min=".01" step=".01" placeholder="0.00" required value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Description <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--t4)' }}>(optional)</span></label>
                <input className="input" type="text" placeholder="What was this for?" value={payForm.description} onChange={e => setPayForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="field">
                <label>Receipt <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--t4)' }}>(optional)</span></label>
                <input className="input" type="file" accept="image/*,.pdf" onChange={e => setPayForm(f => ({ ...f, receipt: e.target.files[0] }))} />
              </div>
              {payContribs.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Member Contributions (optional)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {payContribs.map((m, i) => (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`av av-sm ${avColor(m.username)}`}>{avInit(m.username)}</div>
                        <span style={{ fontSize: 13, flex: 1, color: 'var(--t2)' }}>{m.username}</span>
                        <input className="input" type="number" min="0" step=".01" placeholder="0.00"
                          value={m.amount || ''} style={{ width: 100 }}
                          onChange={e => setPayContribs(pc => pc.map((c, j) => j === i ? { ...c, amount: e.target.value } : c))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENT MODAL */}
      {modal === 'rent' && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hd"><h2>Record Rent — {MO[month-1]} {year}</h2><button className="close-btn" onClick={() => setModal(null)}><X /></button></div>
            <form onSubmit={saveRent}>
              <div className="field">
                <label>Total Rent (₹)</label>
                <input className="input" type="number" min=".01" step=".01" placeholder="0.00" required value={rentForm.totalAmount} onChange={e => setRentForm(f => ({ ...f, totalAmount: e.target.value }))} />
              </div>
              <div className="field">
                <label>Receipt <span style={{ textTransform: 'none', fontWeight: 400, letterSpacing: 0, color: 'var(--t4)' }}>(optional)</span></label>
                <input className="input" type="file" accept="image/*,.pdf" onChange={e => setRentForm(f => ({ ...f, receipt: e.target.files[0] }))} />
              </div>
              {rentContribs.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Member Contributions (optional)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {rentContribs.map((m, i) => (
                      <div key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`av av-sm ${avColor(m.username)}`}>{avInit(m.username)}</div>
                        <span style={{ fontSize: 13, flex: 1, color: 'var(--t2)' }}>{m.username}</span>
                        <input className="input" type="number" min="0" step=".01" placeholder="0.00"
                          value={m.amount || ''} style={{ width: 100 }}
                          onChange={e => setRentContribs(rc => rc.map((c, j) => j === i ? { ...c, amount: e.target.value } : c))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Rent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
