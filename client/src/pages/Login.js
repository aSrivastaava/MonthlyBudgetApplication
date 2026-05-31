import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [v, setV] = useState({ id: '', pw: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await login(v.id, v.pw);
    if (r.success) nav('/dashboard'); else setErr(r.error);
    setBusy(false);
  };

  return (
    <div className="auth-shell">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/logo192.png" alt="SplitNest" /></div>
          <h1 className="auth-h1">SplitNest</h1>
          <p className="auth-sub">The modern way to manage shared household finances. Track expenses, split bills, settle debts.</p>
        </div>
        <div className="auth-feats">
          {['Real-time balance tracking across all members','Splitwise-style debt simplification algorithm','Monthly budgets with spending charts & CSV export','Full expense ledger with filters and search','Settle debts with one click — stay balanced'].map(f => (
            <div className="auth-feat" key={f}>
              <div className="auth-feat-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="auth-right">
        <div className="auth-box">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-desc">Sign in to continue managing your house finances</p>

          {err && (
            <div className="alert alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email or Username</label>
              <input className="input" type="text" placeholder="you@email.com" autoFocus required
                value={v.id} onChange={e => setV(p => ({ ...p, id: e.target.value }))} />
            </div>
            <div className="field" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show ? 'text' : 'password'} placeholder="••••••••" required
                  style={{ paddingRight: 42 }}
                  value={v.pw} onChange={e => setV(p => ({ ...p, pw: e.target.value }))} />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t3)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <><span className="spinner spinner-sm" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--t3)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--p-1)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
