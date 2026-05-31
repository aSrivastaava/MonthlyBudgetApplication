import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const pwStrength = p => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};
const SC = ['','#ef4444','#f59e0b','#6366f1','#22c55e'];
const SL = ['','Weak','Fair','Good','Strong'];

export default function Register() {
  const [v, setV] = useState({ username: '', email: '', pw: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const set = k => e => setV(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setErr('');
    if (v.pw !== v.confirm) return setErr('Passwords do not match');
    if (v.pw.length < 6) return setErr('Password must be at least 6 characters');
    setBusy(true);
    const r = await register(v.username, v.email, v.pw);
    if (r.success) nav('/dashboard'); else setErr(r.error);
    setBusy(false);
  };

  const str = pwStrength(v.pw);

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/logo192.png" alt="SplitNest" /></div>
          <h1 className="auth-h1">Join SplitNest</h1>
          <p className="auth-sub">Create your account in seconds and start splitting expenses fairly with your housemates.</p>
        </div>
        <div className="auth-feats">
          {['Free to use — no hidden costs','Create or join a house in seconds','Automatic fair-share calculation','Role-based permissions for your house','Receipt uploads & expense history'].map(f => (
            <div className="auth-feat" key={f}>
              <div className="auth-feat-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-desc">Start managing shared expenses with your housemates</p>

          {err && (
            <div className="alert alert-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-row">
              <div className="field">
                <label>Username</label>
                <input className="input" type="text" placeholder="johndoe" required minLength={3} autoFocus value={v.username} onChange={set('username')} />
              </div>
              <div className="field">
                <label>Email</label>
                <input className="input" type="email" placeholder="you@email.com" required value={v.email} onChange={set('email')} />
              </div>
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input" type={show ? 'text' : 'password'} placeholder="Min 6 characters" required minLength={6} style={{ paddingRight: 42 }} value={v.pw} onChange={set('pw')} />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--t3)', display: 'flex', cursor: 'pointer' }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {v.pw && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= str ? SC[str] : 'var(--stroke)', transition: 'background .25s' }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: SC[str] }}>{SL[str]}</span>
                </div>
              )}
            </div>
            <div className="field" style={{ marginBottom: 24 }}>
              <label>Confirm Password</label>
              <input className="input" type="password" placeholder="••••••••" required value={v.confirm} onChange={set('confirm')} />
              {v.confirm && v.pw !== v.confirm && <span className="hint hint-danger">Passwords do not match</span>}
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? <><span className="spinner spinner-sm" /> Creating…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--t3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--p-1)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
