import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode]         = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, register }     = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
        toast.success('Logged in successfully');
      } else {
        await register(username, email, password);
        toast.success('Account created');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f172a',
    }}>
      <div style={{ width: '100%', maxWidth: 400, padding: 16 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 14,
            background: '#1e40af', marginBottom: 16,
          }}>
            <Zap size={28} color="#fff" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>AI Timetable Agent</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>
            Intelligent academic scheduling
          </p>
        </div>

        <div className="card">
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14, textTransform: 'capitalize',
                color: mode === m ? 'var(--color-primary)' : 'var(--color-muted)',
                borderBottom: mode === m ? '2px solid var(--color-primary)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--color-muted)' }}>
              Default: <strong>admin</strong> / <strong>admin123</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
