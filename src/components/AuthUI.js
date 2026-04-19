import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export function AuthUI({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin ? { username, password } : { username, email, password };
    try {
      const response = await axios.post(`${API}${endpoint}`, payload);
      if (response.data.ok) {
        localStorage.setItem('ark-token', response.data.token);
        localStorage.setItem('lab3d-nick', response.data.username);
        onAuthSuccess(response.data);
      } else {
        setError(response.data.error || 'Errore durante l\'autenticazione');
      }
    } catch (err) {
      setError('Connessione al server fallita. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const themeColor = '#50c8e8'; // Ark Cyan

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      background: 'radial-gradient(circle at center, #1a2a35 0%, #050a0f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, fontFamily: 'sans-serif', color: themeColor, textTransform: 'uppercase'
    }}>
      {/* Background Decor */}
      <div style={{
        position: 'absolute', width: '100%', height: '100%', 
        backgroundImage: 'linear-gradient(rgba(80, 200, 232, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(80, 200, 232, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />

      <div style={{
        width: 450, padding: 40, background: 'rgba(5, 15, 20, 0.9)',
        border: `1px solid ${themeColor}66`, borderRadius: 2,
        boxShadow: `0 0 50px ${themeColor}22`, position: 'relative',
        backdropFilter: 'blur(10px)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: 32, letterSpacing: 8, margin: 0, color: '#fff', textShadow: `0 0 10px ${themeColor}` }}>
                {isLogin ? 'ACCESSO' : 'REGISTRAZIONE'}
            </h1>
            <div style={{ height: 2, width: 60, background: themeColor, margin: '15px auto' }} />
            <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>SOPRAVVISSUTO RILEVATO: INSERIRE CREDENZIALI</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, letterSpacing: 1 }}>NOME UTENTE</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${themeColor}33`,
                padding: '12px 15px', color: '#fff', outline: 'none', transition: '0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = themeColor}
              onBlur={(e) => e.target.style.borderColor = `${themeColor}33`}
            />
          </div>

          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, letterSpacing: 1 }}>EMAIL (OPZIONALE PER AMMINISTRATORI)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${themeColor}33`,
                  padding: '12px 15px', color: '#fff', outline: 'none', transition: '0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = themeColor}
                onBlur={(e) => e.target.style.borderColor = `${themeColor}33`}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, letterSpacing: 1 }}>PASSWORD DI SICUREZZA</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${themeColor}33`,
                padding: '12px 15px', color: '#fff', outline: 'none', transition: '0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = themeColor}
              onBlur={(e) => e.target.style.borderColor = `${themeColor}33`}
            />
          </div>

          {error && <div style={{ color: '#ff4b4b', fontSize: 11, textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: 10, background: themeColor, color: '#000', padding: '15px',
              border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: 4,
              transition: '0.3s', opacity: loading ? 0.5 : 1
            }}
            onMouseOver={(e) => e.target.style.boxShadow = `0 0 15px ${themeColor}`}
            onMouseOut={(e) => e.target.style.boxShadow = 'none'}
          >
            {loading ? 'ELABORAZIONE...' : (isLogin ? 'ACCEDI' : 'CREA ACCOUNT')}
          </button>
        </form>

        <div style={{ marginTop: 25, textAlign: 'center' }}>
          <span 
            style={{ fontSize: 11, cursor: 'pointer', opacity: 0.6, letterSpacing: 1 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'NON HAI UN ACCOUNT? REGISTRATI ORA' : 'HAI GIÀ UN ACCOUNT? ACCEDI'}
          </span>
        </div>

        {/* Corner Decals */}
        <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: `2px solid ${themeColor}`, borderLeft: `2px solid ${themeColor}` }} />
        <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: `2px solid ${themeColor}`, borderRight: `2px solid ${themeColor}` }} />
      </div>
    </div>
  );
}
