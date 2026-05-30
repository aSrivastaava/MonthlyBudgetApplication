import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { houseService } from '../services/houseService';
import AppLayout from '../components/AppLayout';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CAT_ICONS = { groceries:'🛒', wifi:'📶', gas:'⛽', electricity:'⚡', other:'📦', rent:'🏠' };
const ALL_CATS = ['groceries','wifi','gas','electricity','other','rent'];

function fmt(n) { return `$${Number(n).toFixed(2)}`; }

export default function BookPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterCat, setFilterCat] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [houseRes, bookRes] = await Promise.all([
      houseService.getHouseDetails(houseId),
      bookService.getBook(houseId),
    ]);
    if (houseRes.success) setHouse(houseRes.data.house);
    if (bookRes.success) setData(bookRes.data);
    else setError(bookRes.error);
    setLoading(false);
  }, [houseId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = [
      ['Date','Type','Category','Description','Amount','Member'],
      ...filtered.map(e => [
        new Date(e.date).toLocaleDateString(),
        e.type,
        e.category,
        e.description || '',
        e.amount.toFixed(2),
        e.createdBy?.username || '',
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `budget-book-${house?.name || houseId}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Available years from entries
  const years = data ? [...new Set(data.entries.map(e => e.year))].sort((a,b) => b-a) : [];

  // Filtering + sorting
  const filtered = (data?.entries || []).filter(e => {
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (filterYear !== 'all' && e.year !== parseInt(filterYear)) return false;
    if (filterMonth !== 'all' && e.month !== parseInt(filterMonth)) return false;
    if (search && !e.description?.toLowerCase().includes(search.toLowerCase()) && !e.category.toLowerCase().includes(search.toLowerCase()) && !e.createdBy?.username?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  // Group entries by month
  const grouped = {};
  filtered.forEach(e => {
    const key = `${MONTHS[e.month - 1]} ${e.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  if (loading) return <AppLayout><div className="loading-screen"><div className="spinner" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="page-inner">
        <button className="page-back" onClick={() => navigate(`/house/${houseId}`)}>← Back to {house?.name}</button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 4 }}>📖 Expense Book</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Complete financial ledger for {house?.name}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Summary stats */}
        {data && (
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: 'var(--danger)', fontSize: 22 }}>{fmt(data.totalExpenses)}</div>
              <div className="stat-sub">{data.entries.length} transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Budgeted</div>
              <div className="stat-value" style={{ color: 'var(--primary)', fontSize: 22 }}>{fmt(data.totalBudgeted)}</div>
              <div className="stat-sub">across {data.budgets?.length || 0} months</div>
            </div>
            {Object.entries(data.categoryTotals || {}).filter(([,v]) => v > 0).slice(0, 2).map(([cat, amt]) => (
              <div className="stat-card" key={cat}>
                <div className="stat-label">{CAT_ICONS[cat]} {cat}</div>
                <div className="stat-value" style={{ fontSize: 22 }}>{fmt(amt)}</div>
                <div className="stat-sub">total</div>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown bar */}
        {data && Object.keys(data.categoryTotals || {}).length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>Spending by Category</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(data.categoryTotals).filter(([,v]) => v > 0).sort(([,a],[,b]) => b-a).map(([cat, amt]) => {
                const pct = (amt / data.totalExpenses) * 100;
                const colors = { groceries: '#10b981', wifi: '#6366f1', gas: '#f59e0b', electricity: '#f97316', rent: '#ef4444', other: '#94a3b8' };
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span>{CAT_ICONS[cat]} {cat}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{fmt(amt)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: colors[cat] || '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search..." style={{ flex: '1 1 180px', minWidth: 150, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="all">All Categories</option>
            {ALL_CATS.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="all">All Months</option>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        {/* Filtered total */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--surface)', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>{filtered.length} transactions shown</span>
            <span style={{ fontWeight: 700, color: 'var(--danger)' }}>Total: {fmt(filteredTotal)}</span>
          </div>
        )}

        {/* Entries grouped by month */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <h3>No transactions found</h3>
            <p>{data?.entries.length === 0 ? 'Add budget payments or rent to build your expense book.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(grouped).map(([monthLabel, entries]) => (
              <div key={monthLabel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{monthLabel}</h3>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmt(entries.reduce((s, e) => s + e.amount, 0))}</span>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Contributions</th>
                          <th>By</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(entry => (
                          <tr key={entry._id}>
                            <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(entry.date).toLocaleDateString()}</td>
                            <td><span className={`cat-pill cat-${entry.category}`}>{CAT_ICONS[entry.category]} {entry.category}</span></td>
                            <td style={{ maxWidth: 200 }}>{entry.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(entry.amount)}</td>
                            <td>
                              {entry.contributions?.length > 0 ? (
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {entry.contributions.map((c, i) => (
                                    <span key={i} title={c.userId?.username} style={{ fontSize: 11, background: 'var(--primary-dim)', color: 'var(--primary-light)', padding: '2px 8px', borderRadius: 99 }}>
                                      {c.userId?.username || '?'}: {fmt(c.amount)}
                                    </span>
                                  ))}
                                </div>
                              ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.createdBy?.username}</td>
                            <td>
                              {entry.receiptUrl && (
                                <a href={entry.receiptUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm btn-icon" title="View receipt">📎</a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
