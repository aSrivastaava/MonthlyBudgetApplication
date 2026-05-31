import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { houseService } from '../services/houseService';
import AppLayout, { fmtINR } from '../components/AppLayout';
import { ChevronLeft, Download, Search, BookOpen } from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ALL_CATS = ['groceries','wifi','gas','electricity','other','rent'];
const CAT_IC = { groceries:'🛒', wifi:'📶', gas:'⛽', electricity:'⚡', other:'📦', rent:'🏠' };
const CAT_CLR = { groceries:'#4ade80', wifi:'#a5b4fc', gas:'#fcd34d', electricity:'#fdba74', rent:'#fca5a5', other:'#6b7280' };

export default function BookPage() {
  const { houseId } = useParams();
  const nav = useNavigate();
  const [house, setHouse] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const load = useCallback(async () => {
    setLoading(true);
    const [hr, br] = await Promise.all([houseService.getHouseDetails(houseId), bookService.getBook(houseId)]);
    if (hr.success) setHouse(hr.data.house);
    if (br.success) setData(br.data); else setErr(br.error || 'Failed to load');
    setLoading(false);
  }, [houseId]);

  useEffect(() => { load(); }, [load]);

  const years = data ? [...new Set(data.entries.map(e => e.year))].sort((a,b) => b-a) : [];

  const filtered = (data?.entries || []).filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (filterYear !== 'all' && e.year !== parseInt(filterYear)) return false;
    if (filterMonth !== 'all' && e.month !== parseInt(filterMonth)) return false;
    if (search) { const q = search.toLowerCase(); if (!e.description?.toLowerCase().includes(q) && !e.category.includes(q) && !e.createdBy?.username?.toLowerCase().includes(q)) return false; }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc')  return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const grouped = {};
  filtered.forEach(e => {
    const key = `${MONTHS[e.month - 1]} ${e.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  const exportCSV = () => {
    const rows = [['Date','Type','Category','Description','Amount','By'], ...filtered.map(e => [
      new Date(e.date).toLocaleDateString(), e.type, e.category, e.description || '', e.amount.toFixed(2), e.createdBy?.username || ''
    ])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `splitnest-book-${house?.name || houseId}.csv`;
    a.click();
  };

  if (loading) return <AppLayout><div className="page"><div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 10 }} />)}</div></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page enter">
        <button className="back-btn" onClick={() => nav(`/house/${houseId}`)}><ChevronLeft size={14} /> House</button>

        <div className="page-hd">
          <div className="page-hd-left">
            <h1>Expense Book</h1>
            <p>Complete financial ledger — {house?.name}</p>
          </div>
          <div className="page-hd-right">
            <button className="btn btn-ghost btn-sm" onClick={exportCSV}><Download size={14} /> Export CSV</button>
          </div>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        {/* Stats — totals row */}
        {data && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div className="stat-card red">
              <div className="stat-icon-box" style={{ background:'var(--red-d)', color:'var(--red)' }}><BookOpen size={16} /></div>
              <div>
                <div className="stat-lbl">Total Expenses</div>
                <div className="stat-val" style={{ color:'var(--red)' }}>{fmtINR(data.totalExpenses)}</div>
                <div className="stat-sub">{data.entries.length} transaction{data.entries.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-box"><BookOpen size={16} /></div>
              <div>
                <div className="stat-lbl">Total Budgeted</div>
                <div className="stat-val" style={{ color:'var(--p-1)' }}>{fmtINR(data.totalBudgeted)}</div>
                <div className="stat-sub">{data.budgets?.length || 0} month{data.budgets?.length !== 1 ? 's' : ''} tracked</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats — per-category row */}
        {data && Object.entries(data.categoryTotals || {}).filter(([,v]) => v > 0).length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:16 }}>
            {Object.entries(data.categoryTotals).filter(([,v]) => v > 0).sort(([,a],[,b]) => b-a).map(([cat, amt]) => (
              <div key={cat} style={{
                background:'var(--glass)', border:'1px solid var(--stroke)',
                borderRadius:10, padding:'12px 14px',
                borderTop:`2px solid ${CAT_CLR[cat]}`,
              }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{CAT_IC[cat]}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4 }}>{cat}</div>
                <div style={{ fontSize:17, fontWeight:800, color:CAT_CLR[cat], letterSpacing:'-.02em' }}>{fmtINR(amt)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {data && Object.keys(data.categoryTotals || {}).length > 0 && (
          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>Spending by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(data.categoryTotals).filter(([,v]) => v > 0).sort(([,a],[,b]) => b-a).map(([cat, amt]) => {
                const pct = (amt / data.totalExpenses) * 100;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                      <span style={{ color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 15 }}>{CAT_IC[cat]}</span> {cat}</span>
                      <span style={{ color: 'var(--t3)', fontSize: 12 }}>{fmtINR(amt)} <span style={{ color: 'var(--t4)' }}>({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="prog">
                      <div className="prog-fill" style={{ width: `${pct}%`, background: CAT_CLR[cat] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-row">
          <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input className="input" type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8 }} />
          </div>
          <select className="input input-select" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 'auto', padding: '8px 28px 8px 10px' }}>
            <option value="all">All Categories</option>
            {ALL_CATS.map(c => <option key={c} value={c}>{CAT_IC[c]} {c}</option>)}
          </select>
          <select className="input input-select" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: 'auto', padding: '8px 28px 8px 10px' }}>
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input input-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ width: 'auto', padding: '8px 28px 8px 10px' }}>
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input input-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', padding: '8px 28px 8px 10px' }}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'var(--glass)', border: '1px solid var(--stroke)', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            <span style={{ color: 'var(--t3)' }}>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 700, color: 'var(--red)' }}>{fmtINR(filteredTotal)}</span>
          </div>
        )}

        {/* Entries */}
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><BookOpen size={22} /></div>
            <h3>No transactions</h3>
            <p>{data?.entries.length === 0 ? 'Add budget payments or rent to build your expense book.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(grouped).map(([month, entries]) => (
              <div key={month}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{month}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>{fmtINR(entries.reduce((s,e) => s+e.amount, 0))}</span>
                </div>
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th><th>Category</th><th>Description</th>
                        <th>Amount</th><th>Paid By</th><th>Contributions</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(e => (
                        <tr key={e._id}>
                          <td className="muted" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                          <td><span className={`cat cat-${e.category}`}>{CAT_IC[e.category]} {e.category}</span></td>
                          <td className="fw" style={{ maxWidth: 200 }}>{e.description || <span style={{ color: 'var(--t4)' }}>—</span>}</td>
                          <td className="num">{fmtINR(e.amount)}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{e.createdBy?.username || '—'}</td>
                          <td>
                            {e.contributions?.length > 0 ? (
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {e.contributions.map((c, i) => (
                                  <span key={i} style={{ fontSize: 10.5, background: 'var(--p-dim)', color: 'var(--p-1)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(99,102,241,.2)' }}>
                                    {c.userId?.username || '?'}: {fmtINR(c.amount)}
                                  </span>
                                ))}
                              </div>
                            ) : <span style={{ color: 'var(--t4)', fontSize: 12 }}>—</span>}
                          </td>
                          <td>
                            {e.receiptUrl && <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-xs btn-ghost btn-icon" title="Receipt">📎</a>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
