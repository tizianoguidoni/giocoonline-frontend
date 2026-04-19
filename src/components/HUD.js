import React, { useEffect, useRef } from 'react';

export function MiniMap({ game }) {
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

export function HUD({ state, zoneName, onOpenBank }) {
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
      <div data-testid="hud-stats" style={{ position: 'fixed', top: 16, left: 16, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', textShadow: '0 1px 2px #000', pointerEvents: 'none', zIndex: 50 }}>
        <div style={{ fontSize: 22, letterSpacing: 3, color: '#ffb060', textTransform: 'uppercase' }}>{zoneName}</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')} · Score {state.score}</div>
      </div>

      {/* Bottom-left: HP + Mana + money */}
      <div style={{ position: 'fixed', bottom: 20, left: 20, width: 340, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', pointerEvents: 'none', zIndex: 50 }}>
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
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, pointerEvents: 'none', zIndex: 50 }}>
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
      <div style={{ position: 'fixed', bottom: 20, right: 20, width: 260, color: '#f0d8a8', fontFamily: 'ui-monospace, monospace', textAlign: 'right', pointerEvents: 'none', zIndex: 50 }}>
        <div data-testid="weapon-name" style={{ fontSize: 18, color: '#ffc080' }}>{w.icon} {w.name}</div>
        <div data-testid="ammo" style={{ fontSize: 28, marginTop: 2 }}>
          {w.reloading ? 'R...' : (w.magazine === null || w.ammo === Infinity || w.magazine === Infinity ? '∞' : `${w.ammo} / ${w.reserve === Infinity ? '∞' : w.reserve}`)}
        </div>
        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 4 }}>1..5 armi · R ricarica · Z/X/C magia</div>
      </div>

      {/* Boss HP bar */}
      {state.bossVisible && (
        <div data-testid="boss-bar" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', width: 420, color: '#ffdddd', fontFamily: 'ui-monospace, monospace', textAlign: 'center', zIndex: 50 }}>
          <div style={{ fontSize: 16, color: '#ff4040', letterSpacing: 4, textShadow: '0 0 10px #ff0020' }}>◆ IL GUARDIANO ◆</div>
          <div style={{ marginTop: 6, height: 14, background: 'rgba(40,0,0,0.8)', border: '1px solid rgba(255,60,60,0.6)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${bossPct}%`, height: '100%', background: 'linear-gradient(90deg,#600008,#ff2040)', transition: 'width .2s' }} />
          </div>
        </div>
      )}
    </>
  );
}
