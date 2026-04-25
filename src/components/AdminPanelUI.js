import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

export function AdminPanelUI({ role, game, onClose }) {
  const [tab, setTab] = useState(role === 'owner' ? 'cheats' : 'moderation');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minimapData, setMinimapData] = useState(null);

  useEffect(() => {
    if (game) {
      try {
        setMinimapData(game.getMinimapData());
      } catch (e) {
        console.error("Failed to get initial minimap data", e);
      }
    }
  }, [game]);

  useEffect(() => {
    if (tab === 'moderation') {
      fetchUsers();
    }
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const resp = await axios.get(`${API}/admin/users`);
      setUsers(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleBan = async (username) => {
    try {
      await axios.post(`${API}/admin/toggle-ban`, { username });
      fetchUsers();
    } catch (e) { alert('Errore ban'); }
  };

  const setRole = async (username, newRole) => {
    try {
      await axios.post(`${API}/admin/set-role`, { username, role: newRole });
      fetchUsers();
    } catch (e) { alert('Errore ruolo'); }
  };

  const themeColor = '#ff3c00'; // Admin Orange/Red

  const cheatBtnStyle = {
    background: 'rgba(255, 60, 0, 0.1)',
    border: '1px solid #ff3c00',
    color: '#ff3c00',
    padding: '15px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 10
  };

  const actionBtnStyle = {
    background: '#222',
    border: '1px solid #444',
    color: '#ccc',
    fontSize: 9,
    padding: '3px 8px',
    cursor: 'pointer'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 3000, fontFamily: 'monospace', backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        width: 800, height: 600, background: '#0a0a0f', border: `1px solid ${themeColor}`,
        boxShadow: `0 0 40px ${themeColor}33`, color: '#fff', padding: 30, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: themeColor, letterSpacing: 5 }}>ARK_ADMIN_CONSOLE v2.0</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${themeColor}`, color: themeColor, cursor: 'pointer', padding: '5px 15px' }}>ESC</button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid #333', paddingBottom: 10 }}>
          <button 
            onClick={() => setTab('game')} 
            style={{ background: 'none', border: 'none', color: tab === 'game' ? themeColor : '#666', cursor: 'pointer', fontWeight: 'bold' }}
          >
            [ GAME CONTROL ]
          </button>
          {role === 'owner' && (
            <button 
              onClick={() => setTab('cheats')} 
              style={{ background: 'none', border: 'none', color: tab === 'cheats' ? themeColor : '#666', cursor: 'pointer', fontWeight: 'bold' }}
            >
              [ RESOURCES ]
            </button>
          )}
          <button 
            onClick={() => setTab('moderation')} 
            style={{ background: 'none', border: 'none', color: tab === 'moderation' ? themeColor : '#666', cursor: 'pointer', fontWeight: 'bold' }}
          >
            [ MODERATION ]
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'game' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
              {/* Teleport Minimap */}
              <div style={{ background: '#000', border: '1px solid #444', padding: 10 }}>
                <div style={{ color: themeColor, fontSize: 10, marginBottom: 10, textAlign: 'center' }}>CLICCA PER TELETRASPORTO</div>
                {minimapData ? (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${minimapData.grid[0].length}, 1fr)`,
                    width: '100%',
                    aspectRatio: '1',
                    gap: 1
                  }}>
                    {minimapData.grid.map((row, y) => row.map((cell, x) => {
                      const isPlayer = minimapData.playerCellX === x && minimapData.playerCellY === y;
                      const isExit = minimapData.exitCell.x === x && minimapData.exitCell.y === y;
                      return (
                        <div 
                          key={`${x}-${y}`}
                          onClick={() => {
                            if (game) {
                              game.teleportToCell(x, y);
                              setMinimapData(game.getMinimapData());
                            }
                          }}
                          style={{
                            background: isPlayer ? '#00ff00' : isExit ? '#00ffff' : cell === 1 ? '#333' : '#111',
                            cursor: 'pointer'
                          }}
                        />
                      );
                    }))}
                  </div>
                ) : <div>Dati minimap non disponibili</div>}
              </div>

              {/* Game Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <button onClick={() => game?.cheatGodMode() && alert('GOD MODE ATTIVA')} style={cheatBtnStyle}>GOD MODE: ON/OFF</button>
                <button onClick={() => game?.cheatKillAll()} style={cheatBtnStyle}>KILL ALL ENEMIES</button>
                <button onClick={() => game?.cheatHeal()} style={cheatBtnStyle}>RESTORE HP/MANA</button>
                
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, marginBottom: 5 }}>PLAYER SPEED MULTIPLIER</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[1, 2, 3, 5].map(v => (
                      <button key={v} onClick={() => game?.cheatSetSpeed(v)} style={actionBtnStyle}>{v}x</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 20, borderTop: '1px solid #222', paddingTop: 10 }}>
                   <button 
                    onClick={async () => {
                      if(window.confirm("RESET STATS: Sei sicuro di voler riportare il personaggio al livello 1?")) {
                        try {
                          await axios.post(`${API}/admin/reset-character`, { email: 'admin@mythicarena.com' });
                          alert("Carattere resettato! Ricarica il gioco.");
                        } catch(e) { alert("Errore reset"); }
                      }
                    }} 
                    style={{ ...cheatBtnStyle, background: 'rgba(255,0,0,0.2)', borderColor: '#ff0000', color: '#ff0000' }}
                   >
                     RESET CHARACTER STATS (LVL 1)
                   </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'cheats' && role === 'owner' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <button onClick={() => game?.cheatGiveMoney(5000)} style={cheatBtnStyle}>AGGIUNGI 5000€</button>
              <button onClick={() => game?.cheatGiveMoney(50000)} style={cheatBtnStyle}>AGGIUNGI 50000€</button>
              <button onClick={() => game?.cheatUnlockAll?.()} style={cheatBtnStyle}>SBLOCCA TUTTE LE ARMI</button>
            </div>
          )}

          {tab === 'moderation' && (
            <div>
              {loading ? <div>CARICAMENTO DATABASE...</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: themeColor, textAlign: 'left' }}>
                      <th style={{ padding: 8 }}>UTENTE</th>
                      <th>RUOLO</th>
                      <th>STATO</th>
                      <th>AZIONI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.username} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: 8 }}>{u.username}</td>
                        <td>{u.role}</td>
                        <td style={{ color: u.is_banned ? '#ff3c00' : '#00ff00' }}>{u.is_banned ? 'BANNATO' : 'ATTIVO'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button onClick={() => toggleBan(u.username)} style={actionBtnStyle}>
                              {u.is_banned ? 'SBLOCCA' : 'BAN'}
                            </button>
                            {role === 'owner' && (
                              <button onClick={() => setRole(u.username, u.role === 'co_admin' ? 'player' : 'co_admin')} style={actionBtnStyle}>
                                {u.role === 'co_admin' ? 'DE-PROMUOVI' : 'PROMUOVI'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
