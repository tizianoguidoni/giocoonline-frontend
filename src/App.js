import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Game } from './game/Game';
import { InventoryUI } from './components/InventoryUI';
import { AuthUI } from './components/AuthUI';
import { assetManager } from './game/AssetManager';
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function MiniMap({ game }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const draw = () => {
      const c = ref.current;
      if (!c || !game) { raf = requestAnimationFrame(draw); return; }
      const ctx = c.getContext('2d');
      const d = game.getMinimapData();
      const W = c.width, H = c.height, cells = 15, cp = W / (cells * 2 + 1);
      ctx.fillStyle = 'rgba(5,5,8,0.88)'; ctx.fillRect(0, 0, W, H);
      for (let dy = -cells; dy <= cells; dy++) for (let dx = -cells; dx <= cells; dx++) {
        const gx = d.playerCellX + dx, gy = d.playerCellY + dy;
        if (gx < 0 || gy < 0 || gx >= d.grid[0].length || gy >= d.grid.length) continue;
        const v = d.grid[gy][gx], px = (cells + dx) * cp, py = (cells + dy) * cp;
        ctx.fillStyle = v === 1 ? '#2a2028' : v === 2 ? '#c0802a' : v === 3 ? '#c02040' : '#0c0a10';
        ctx.fillRect(px, py, cp, cp);
      }
      for (const r of d.rooms) {
        const gx = r.x - d.playerCellX + cells, gy = r.y - d.playerCellY + cells;
        ctx.fillStyle = r.type === 'boss' ? 'rgba(220,40,40,0.25)' : r.type === 'merchant' ? 'rgba(255,180,50,0.25)' : 'rgba(80,180,255,0.12)';
        ctx.fillRect(gx * cp, gy * cp, r.w * cp, r.h * cp);
      }
      const ex = d.exitCell.x - d.playerCellX + cells, ey = d.exitCell.y - d.playerCellY + cells;
      if (ex >= 0 && ey >= 0 && ex <= cells * 2 && ey <= cells * 2) {
        ctx.fillStyle = '#20ff80'; ctx.fillRect(ex * cp + 1, ey * cp + 1, cp - 2, cp - 2);
      }
      for (const e of d.enemies) {
        const gx = e.x - d.playerCellX + cells, gy = e.y - d.playerCellY + cells;
        if (gx < 0 || gy < 0 || gx > cells * 2 || gy > cells * 2) continue;
        ctx.fillStyle = e.boss ? '#ff4020' : '#ff6060';
        ctx.beginPath(); ctx.arc(gx * cp + cp / 2, gy * cp + cp / 2, e.boss ? cp * 0.6 : cp * 0.35, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save(); ctx.translate(cells * cp + cp / 2, cells * cp + cp / 2); ctx.rotate(-d.yaw);
      ctx.fillStyle = '#ffd060'; ctx.beginPath();
      ctx.moveTo(0, -cp * 0.6); ctx.lineTo(-cp * 0.4, cp * 0.45); ctx.lineTo(cp * 0.4, cp * 0.45); ctx.closePath(); ctx.fill();
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [game]);
  return <canvas ref={ref} width={220} height={220} data-testid="minimap"
    style={{ position: 'fixed', top: 20, right: 20, borderRadius: 8, border: '1px solid rgba(255,180,80,0.35)', boxShadow: '0 0 24px rgba(0,0,0,0.6), inset 0 0 10px rgba(0,0,0,0.8)' }} />;
}

function HUD({ state, zoneName, onOpenBank }) {
  if (!state) return null;
  const hpPct = (state.hp / state.maxHp) * 100;
  const manaPct = state.maxMana ? (state.mana / state.maxMana) * 100 : 0;
  const bossPct = state.bossMaxHp ? (state.bossHp / state.bossMaxHp) * 100 : 0;
  const mm = Math.floor(state.time / 60), ss = Math.floor(state.time % 60);
  const w = state.weapon;
  return (
    <>
      {/* Crosshair */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', width: 2, height: 14, background: 'rgba(255,220,180,0.8)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', width: 14, height: 2, background: 'rgba(255,220,180,0.8)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />

      {/* Top-left */}
      <div data-testid="hud-stats" style={{ position: 'fixed', top: 16, left: 16, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', textShadow: '0 1px 2px #000', pointerEvents: 'none' }}>
        <div style={{ fontSize: 22, letterSpacing: 3, color: '#ffb060', textTransform: 'uppercase' }}>{zoneName}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')} · Score {state.score}</div>
      </div>

      {/* Bottom-left: HP + Mana + money */}
      <div style={{ position: 'fixed', bottom: 20, left: 20, width: 340, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', pointerEvents: 'none' }}>
        <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>❤ HP{state.shieldActive ? ' 🛡' : ''}</span><span data-testid="hp-text">{state.hp}/{state.maxHp}</span>
        </div>
        <div style={{ height: 12, background: 'rgba(40,10,10,0.8)', border: '1px solid rgba(255,80,80,0.4)', borderRadius: 2, overflow: 'hidden' }}>
          <div data-testid="hp-bar" style={{ width: `${hpPct}%`, height: '100%', background: hpPct > 50 ? 'linear-gradient(90deg,#d02020,#ff4040)' : hpPct > 25 ? 'linear-gradient(90deg,#c06020,#ff8030)' : 'linear-gradient(90deg,#800010,#ff0020)', transition: 'width .2s' }} />
        </div>
        <div style={{ fontSize: 11, marginTop: 8, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#8aa0ff' }}>🔮 Mana</span><span data-testid="mana-text">{state.mana}/{state.maxMana}</span>
        </div>
        <div style={{ height: 8, background: 'rgba(10,15,40,0.8)', border: '1px solid rgba(100,140,255,0.4)', borderRadius: 2, overflow: 'hidden' }}>
          <div data-testid="mana-bar" style={{ width: `${manaPct}%`, height: '100%', background: 'linear-gradient(90deg,#3050c0,#60a0ff)', transition: 'width .2s' }} />
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 13 }}>
          <span data-testid="pocket-money" style={{ color: '#ffd060' }}>💰 {state.pocketMoney}€</span>
          <span data-testid="bank-money" style={{ color: '#60b0ff' }}>🏦 {state.bankMoney}€</span>
          <span data-testid="gems">💎 {state.gems}</span>
          <span data-testid="keys">🗝 {state.keys.length}</span>
        </div>
      </div>

      {/* Bottom-center: spell bar */}
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, pointerEvents: 'none' }}>
        {[
          { k: 'Z', icon: '🔥', name: 'Fireball', mana: 30, color: '#ff6020' },
          { k: 'X', icon: '❤', name: 'Cura', mana: 25, color: '#40ff80' },
          { k: 'C', icon: '🛡', name: 'Scudo', mana: 35, color: '#60a0ff' },
        ].map(s => {
          const canCast = state.mana >= s.mana;
          return (
            <div key={s.k} data-testid={`spell-${s.k}`} style={{
              width: 64, height: 64, background: 'rgba(15,10,20,0.85)',
              border: `2px solid ${canCast ? s.color : 'rgba(100,100,100,0.4)'}`,
              borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: canCast ? '#fff' : 'rgba(200,200,200,0.4)', fontFamily: 'ui-monospace, monospace',
              opacity: canCast ? 1 : 0.5,
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 10 }}>[{s.k}] {s.mana}🔮</div>
            </div>
          );
        })}
      </div>

      {/* Bottom-right: weapon */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, width: 260, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', textAlign: 'right', pointerEvents: 'none' }}>
        <div data-testid="weapon-name" style={{ fontSize: 18, color: '#ffc080' }}>{w.icon} {w.name}</div>
        <div data-testid="ammo" style={{ fontSize: 28, marginTop: 2 }}>
          {w.reloading ? 'R...' : (w.magazine === null || w.ammo === Infinity || w.magazine === Infinity ? '∞' : `${w.ammo} / ${w.reserve === Infinity ? '∞' : w.reserve}`)}
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>1..5 armi · R ricarica · Z/X/C magia</div>
      </div>

      {/* Boss HP bar */}
      {state.bossVisible && (
        <div data-testid="boss-bar" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', width: 420, color: '#ffdddd', fontFamily: 'ui-monospace, monospace', textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: '#ff4040', letterSpacing: 4, textShadow: '0 0 10px #ff0020' }}>◆ IL GUARDIANO ◆</div>
          <div style={{ marginTop: 6, height: 14, background: 'rgba(40,0,0,0.8)', border: '1px solid rgba(255,60,60,0.6)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${bossPct}%`, height: '100%', background: 'linear-gradient(90deg,#600008,#ff2040)', transition: 'width .2s' }} />
          </div>
        </div>
      )}
    </>
  );
}

function MerchantUI({ catalog, game, onClose, state }) {
  const buy = (id) => { const r = game.buyWeapon(id); if (!r.ok) alert(r.reason); };
  const buyAmmo = (id) => { const r = game.buyAmmo(id); if (!r.ok) alert(r.reason); };
  return (
    <div data-testid="merchant-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
      <div style={{ width: 640, maxWidth: '92%', background: 'linear-gradient(180deg,#1a0c08,#0c0604)', border: '1px solid rgba(255,180,80,0.4)', borderRadius: 10, padding: 28, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', boxShadow: '0 0 60px rgba(255,120,40,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <div style={{ fontSize: 26, color: '#ffa040', letterSpacing: 3 }}>◆ MERCANTE OSCURO ◆</div>
          <button data-testid="close-merchant" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,180,80,0.4)', color: '#f0d8a8', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>ESC</button>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>«Prezzi a metà. Ma accetto solo contanti in tasca, amico.»</div>
        <div style={{ fontSize: 13, marginBottom: 16, color: '#ffd060' }}>💰 In tasca: <b data-testid="merchant-pocket">{state?.pocketMoney || 0}€</b> (banca {state?.bankMoney || 0}€ — non spendibile qui)</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {catalog.map(w => {
            const owned = state?.ownedWeapons?.includes(w.id);
            return (
              <div key={w.id} data-testid={`weapon-${w.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'rgba(40,20,10,0.5)', border: '1px solid rgba(255,180,80,0.15)', borderRadius: 4 }}>
                <div>
                  <div style={{ fontSize: 16, color: '#ffc080' }}>{w.icon} {w.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{w.description}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>DMG {w.damage} · Cadenza {w.fireRate}/s · Caricatore {w.magazine}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140, alignItems: 'flex-end' }}>
                  {owned ? (
                    w.melee ? (
                      <div style={{ color: '#a0ffa0', fontSize: 12, padding: '8px 14px' }}>✓ Posseduta</div>
                    ) : (
                      <button data-testid={`ammo-${w.id}`} onClick={() => buyAmmo(w.id)} style={{ background: 'rgba(80,120,60,0.3)', color: '#d0f0a0', border: '1px solid rgba(150,220,100,0.4)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                        Munizioni (+{w.magazine * 2}) · {Math.max(10, Math.floor((w.price || 50) / 5))}€
                      </button>
                    )
                  ) : (
                    <button data-testid={`buy-${w.id}`} onClick={() => buy(w.id)} style={{ background: 'rgba(180,80,40,0.4)', color: '#ffd0a0', border: '1px solid rgba(255,180,80,0.5)', padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                      Compra · {w.price}€
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ scores }) {
  if (!scores || scores.length === 0) {
    return <div style={{ color: '#888', fontSize: 12, marginTop: 12 }}>Nessun punteggio ancora registrato.</div>;
  }
  return (
    <div data-testid="leaderboard" style={{ marginTop: 12, maxHeight: 180, overflowY: 'auto', fontSize: 12, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 60px 60px 40px', gap: 8, color: '#ffa040', paddingBottom: 6, borderBottom: '1px solid rgba(255,180,80,0.25)', marginBottom: 6 }}>
        <span>#</span><span>Giocatore</span><span style={{ textAlign: 'right' }}>Score</span><span style={{ textAlign: 'right' }}>Tempo</span><span style={{ textAlign: 'center' }}>Esito</span>
      </div>
      {scores.slice(0, 10).map((s, i) => (
        <div key={s.id || i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 60px 60px 40px', gap: 8, padding: '3px 0', opacity: 0.9 }}>
          <span style={{ color: i < 3 ? '#ffd060' : '#888' }}>{i + 1}</span>
          <span style={{ color: '#ffc080' }}>{s.nickname}</span>
          <span style={{ textAlign: 'right' }}>{s.score}</span>
          <span style={{ textAlign: 'right', color: '#888' }}>{Math.floor(s.time)}s</span>
          <span style={{ textAlign: 'center' }}>{s.won ? '👑' : '💀'}</span>
        </div>
      ))}
    </div>
  );
}

function StartOverlay({ onStart, scores, nickname, setNickname }) {
  return (
    <div data-testid="start-overlay" style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle, rgba(20,5,5,0.96), rgba(0,0,0,0.98))', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', maxWidth: 620, padding: 20 }}>
        <div style={{ fontSize: 56, letterSpacing: 12, color: '#ff4020', textShadow: '0 0 30px #ff0020' }}>LABIRINTO</div>
        <div style={{ fontSize: 22, letterSpacing: 8, color: '#ffa040', marginTop: -4 }}>3D · FANTASY · AZIONE</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 18, lineHeight: 1.7 }}>
          WASD muovere · SHIFT corsa · MOUSE mirare · CLICK attaccare<br/>
          1-5 armi · R ricarica · Z 🔥 · X ❤ · C 🛡 · E interagire · ESC menu<br/><br/>
          <span style={{ color: '#ffd060' }}>💰 Monete · 💎 Gemme · 🗝 Chiavi · 🔮 Pozioni mana</span><br/>
          <span style={{ color: '#60b0ff' }}>🏦 Cerchio blu = deposito (soldi protetti ma non spendibili dal mercante)</span><br/>
          <span style={{ color: '#80a0ff', opacity: 0.85 }}>◆ 4 zone: Dungeon · Giardino Perduto · Catacombe · Abisso Stellato (2 a cielo aperto)</span>
        </div>
        <div style={{ marginTop: 22 }}>
          <input
            data-testid="nickname-input"
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 20))}
            placeholder="Il tuo nome..."
            style={{
              background: 'rgba(0,0,0,0.6)', color: '#ffd0a0',
              border: '1px solid rgba(255,180,80,0.4)',
              padding: '10px 18px', fontSize: 14, textAlign: 'center',
              fontFamily: 'inherit', letterSpacing: 2, width: 240,
            }}
          />
        </div>
        <button onClick={onStart} data-testid="start-btn" style={{ marginTop: 20, background: 'transparent', color: '#ff6030', border: '2px solid #ff6030', padding: '14px 42px', fontSize: 18, letterSpacing: 6, cursor: 'pointer', fontFamily: 'inherit' }}>
          ENTRA NEL LABIRINTO
        </button>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 16, color: '#ffa040', letterSpacing: 4 }}>◆ CLASSIFICA ◆</div>
          <Leaderboard scores={scores} />
        </div>
      </div>
    </div>
  );
}

function EndOverlay({ type, state, nickname, onRestart, scores }) {
  return (
    <div data-testid={`end-${type}`} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, overflowY: 'auto' }}>
      <div style={{ textAlign: 'center', color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', maxWidth: 560, padding: 20 }}>
        <div style={{ fontSize: 48, letterSpacing: 10, color: type === 'win' ? '#20ff80' : '#ff2040' }}>
          {type === 'win' ? 'FUGA RIUSCITA' : 'SEI MORTO'}
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 16 }}>
          <b style={{ color: '#ffc080' }}>{nickname || 'Anonimo'}</b> · Score <b style={{ color: '#ffd060' }}>{state?.score || 0}</b> · Tempo <b>{Math.floor((state?.time || 0))}s</b>
        </div>
        <button onClick={onRestart} data-testid="restart-btn" style={{ marginTop: 24, background: 'transparent', color: '#ffa040', border: '2px solid #ffa040', padding: '12px 32px', fontSize: 16, letterSpacing: 4, cursor: 'pointer', fontFamily: 'inherit' }}>RIPROVA</button>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 14, color: '#ffa040', letterSpacing: 3 }}>◆ CLASSIFICA ◆</div>
          <Leaderboard scores={scores} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState(null);
  const [merchantCatalog, setMerchantCatalog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [end, setEnd] = useState(null);
  const [zoneName, setZoneName] = useState('Dungeon');
  const [nickname, setNickname] = useState(() => localStorage.getItem('lab3d-nick') || '');
  const [scores, setScores] = useState([]);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('ark-token'));
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const submittedRef = useRef(false);

  const fetchScores = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/scores?limit=20`);
      setScores(r.data || []);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const submitScore = useCallback(async (finalState, won) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      await axios.post(`${API}/scores`, {
        nickname: nickname || 'Anonimo',
        score: finalState?.score || 0,
        time: finalState?.time || 0,
        won,
        zone_reached: zoneName,
      });
      fetchScores();
    } catch (e) { /* silent */ }
  }, [nickname, zoneName, fetchScores]);

  const handleEvent = useCallback((ev) => {
    if (ev.type === 'state') setState(ev.state);
    else if (ev.type === 'toast') {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, text: ev.text }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
    } else if (ev.type === 'open-merchant') {
      setMerchantCatalog(ev.catalog);
      if (document.pointerLockElement) document.exitPointerLock();
    } else if (ev.type === 'zone') {
      setZoneName(ev.zone.name);
    } else if (ev.type === 'death') {
      setEnd('death');
    } else if (ev.type === 'win') {
      setEnd('win');
    }
  }, []);

  // Submit score when game ends
  useEffect(() => {
    if (end && state) {
      submitScore(state, end === 'win');
    }
  }, [end, state, submitScore]);

  const startGame = () => {
    if (nickname) localStorage.setItem('lab3d-nick', nickname);
    if (gameRef.current) { gameRef.current.stop(); gameRef.current = null; }
    setEnd(null); setState(null); setMerchantCatalog(null); setToasts([]);
    submittedRef.current = false;
    const g = new Game(canvasRef.current, handleEvent);
    gameRef.current = g;
    g.start();
    setStarted(true);
    setTimeout(() => g.requestPointerLock(), 100);
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'i' || e.key === 'I' || e.key === 'Tab') && started && !end && !merchantCatalog) {
        e.preventDefault();
        setInventoryOpen(prev => {
          const next = !prev;
          if (next && document.pointerLockElement) {
            document.exitPointerLock();
          } else if (!next && gameRef.current) {
            setTimeout(() => gameRef.current && gameRef.current.requestPointerLock(), 150);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, end, merchantCatalog]);

  useEffect(() => {
    if (isLoggedIn && !isAssetsLoaded) {
       assetManager.loadAll().then(() => setIsAssetsLoaded(true));
    }
  }, [isLoggedIn, isAssetsLoaded]);

  useEffect(() => {
    return () => { if (gameRef.current) gameRef.current.stop(); };
  }, []);

  useEffect(() => {
    if (!merchantCatalog && started && !end) {
      const t = setTimeout(() => gameRef.current && gameRef.current.requestPointerLock(), 150);
      return () => clearTimeout(t);
    }
  }, [merchantCatalog, started, end]);

  return (
    <div style={{ margin: 0, padding: 0, overflow: 'hidden', background: '#000', cursor: started && !merchantCatalog && !end ? 'none' : 'default' }}>
      <canvas ref={canvasRef} data-testid="game-canvas" style={{ display: 'block', width: '100vw', height: '100vh' }} />
      {started && !end && <HUD state={state} zoneName={zoneName} />}
      {started && !end && gameRef.current && <MiniMap game={gameRef.current} />}
      {merchantCatalog && !inventoryOpen && (
        <MerchantUI
          catalog={merchantCatalog}
          game={gameRef.current}
          state={state}
          onClose={() => setMerchantCatalog(null)}
        />
      )}
      {inventoryOpen && !end && (
        <InventoryUI 
          state={state} 
          game={gameRef.current} 
          onClose={() => {
            setInventoryOpen(false);
            setTimeout(() => gameRef.current && gameRef.current.requestPointerLock(), 150);
          }} 
        />
      )}
      {!isLoggedIn && <AuthUI onAuthSuccess={(nick) => { setNickname(nick); setIsLoggedIn(true); }} />}
      {isLoggedIn && !isAssetsLoaded && (
        <div style={{
          position: 'fixed', inset: 0, background: '#050a0f', zIndex: 2000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#50c8e8', fontFamily: 'sans-serif', letterSpacing: 4
        }}>
           <div style={{ fontSize: 24, marginBottom: 20 }}>INIZIALIZZAZIONE DATI ARK...</div>
           <div style={{ width: 300, height: 4, background: 'rgba(80, 200, 232, 0.2)', position: 'relative' }}>
             <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#50c8e8', width: '60%', transition: 'width 0.5s', boxShadow: '0 0 15px #50c8e8' }} />
           </div>
           <p style={{ fontSize: 10, marginTop: 15, opacity: 0.6 }}>CARICAMENTO MODELLI 3D E VARIANTI ELEMENTALI</p>
        </div>
      )}
      {isLoggedIn && isAssetsLoaded && !started && <StartOverlay onStart={startGame} scores={scores} nickname={nickname} setNickname={setNickname} />}
      {end && <EndOverlay type={end} state={state} nickname={nickname} onRestart={startGame} scores={scores} />}
      <div data-testid="toast-container" style={{ position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none', zIndex: 50 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: '8px 20px', background: 'rgba(20,10,5,0.85)', border: '1px solid rgba(255,180,80,0.4)', color: '#ffd0a0', fontFamily: 'ui-monospace, monospace', fontSize: 13, borderRadius: 3 }}>{t.text}</div>
        ))}
      </div>
    </div>
  );
}
