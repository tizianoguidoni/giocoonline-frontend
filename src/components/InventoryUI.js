import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WEAPONS, buildViewmodelFor } from '../game/weapons';

function CharacterPreview({ currentWeaponId }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;
    
    const w = currentRef.clientWidth;
    const h = currentRef.clientHeight;
    const scene = new THREE.Scene();
    
    // Ark style background color
    scene.background = new THREE.Color(0x0f1c24);
    
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    currentRef.appendChild(renderer.domElement);
    
    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xb0e0ff, 1.2);
    dirLight.position.set(5, 5, 2);
    scene.add(dirLight);

    // Character Group
    const charGroup = new THREE.Group();
    scene.add(charGroup);

    // Basic human-like character
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x5a554a, roughness: 0.9 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3d3830, roughness: 0.9 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), clothesMat);
    torso.position.y = 1.05;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
    head.position.y = 1.6;
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    legL.position.set(-0.14, 0.4, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), pantsMat);
    legR.position.set(0.14, 0.4, 0);
    
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.65, 0.15), skinMat);
    armL.position.set(-0.35, 1.05, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.65, 0.15), skinMat);
    // Right arm posed holding weapon
    armR.position.set(0.45, 1.05, 0.2);
    armR.rotation.x = -Math.PI / 2.5;

    charGroup.add(torso, head, legL, legR, armL, armR);

    // Add weapon
    if (currentWeaponId) {
      const weaponModel = buildViewmodelFor(currentWeaponId);
      weaponModel.position.set(0.45, 1.05 - 0.25, 0.5);
      weaponModel.rotation.set(0, Math.PI, 0);
      charGroup.add(weaponModel);
    }
    
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
      camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (currentRef) currentRef.removeChild(renderer.domElement);
      renderer.dispose();
      scene.clear();
    };
  }, [currentWeaponId]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}

export function InventoryUI({ state, onClose, game }) {
  if (!state) return null;

  // Derive inventory contents from state
  // In state we only have strings and numbers, we should map them back to icons
  const items = [];
  
  if (state.ownedWeapons) {
    state.ownedWeapons.forEach(wId => {
      const def = WEAPONS[wId];
      if (def) {
         items.push({ id: wId, name: def.name, icon: def.icon, qty: wId === state.weapon?.id ? "Equipaggiato" : 1 });
      }
    });
  }
  
  if (state.gems > 0) items.push({ id: 'gem', name: 'Gemma', icon: '💎', qty: state.gems });
  if (state.keys && state.keys.length > 0) items.push({ id: 'key', name: 'Chiave', icon: '🗝', qty: state.keys.length });

  // Grid padding
  while(items.length < 24) items.push(null);

  const themeColor = '#50c8e8'; // Ark cyan

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 15, 20, 0.85)', backdropFilter: 'blur(4px)', zIndex: 120, display: 'flex', color: themeColor, fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
      
      {/* Top Header */}
      <div style={{ position: 'absolute', top: 30, right: 40, cursor: 'pointer', fontSize: 24, fontWeight: 'bold' }} onClick={onClose}>
        X
      </div>

      <div style={{ display: 'flex', width: '100%', padding: '40px 60px', gap: 40, height: '100%', boxSizing: 'border-box' }}>
        
        {/* LEFT PANEL: INVENTORY (Matrix) */}
        <div style={{ flex: 1, border: `1px solid rgba(80, 200, 232, 0.4)`, background: 'rgba(5, 20, 30, 0.6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', fontSize: 28, borderBottom: `1px solid rgba(80, 200, 232, 0.3)`, letterSpacing: 2, background: 'rgba(80, 200, 232, 0.1)' }}>
            INVENTARIO
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, overflowY: 'auto' }}>
            {items.map((it, i) => (
              <div key={i} style={{ 
                aspectRatio: '1', border: `1px solid rgba(80, 200, 232, ${it ? 0.6 : 0.15})`, 
                background: it ? 'rgba(30, 60, 80, 0.5)' : 'rgba(10, 20, 30, 0.4)', 
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: it ? 'pointer' : 'default', transition: '0.2s',
                boxShadow: it && it.qty === "Equipaggiato" ? '0 0 12px rgba(80, 200, 232, 0.6) inset' : 'none'
              }}
              onClick={() => {
                if (it && it.id in WEAPONS && game) {
                  // Make the player select this weapon
                  game.weapons.switchWeapon(it.id);
                }
              }}
              >
                {it && (
                  <>
                    <div style={{ fontSize: 32 }}>{it.icon}</div>
                    <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 10, fontWeight: 'bold', color: '#fff' }}>{it.qty === "Equipaggiato" ? "EQ" : `x${it.qty}`}</div>
                    <div style={{ position: 'absolute', top: 4, left: 4, fontSize: 8, opacity: 0.7 }}>{it.name.substring(0, 10)}</div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: '10px 20px', marginTop: 'auto', borderTop: `1px solid rgba(80, 200, 232, 0.3)`, fontSize: 14 }}>
            DENARO IN PETTO: <span style={{ color: '#fff' }}>{state.pocketMoney} €</span>
          </div>
        </div>

        {/* MIDDLE PANEL: STATS */}
        <div style={{ flex: 1, border: `1px solid rgba(80, 200, 232, 0.4)`, background: 'rgba(5, 20, 30, 0.6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', fontSize: 28, borderBottom: `1px solid rgba(80, 200, 232, 0.3)`, letterSpacing: 2, background: 'rgba(80, 200, 232, 0.1)' }}>
            STATISTICHE
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'SALUTE', val: Math.round((state.hp / state.maxHp) * 100) + '%', num: `${Math.round(state.hp)} / ${state.maxHp}` },
              { label: 'MANA', val: state.maxMana ? Math.round((state.mana / state.maxMana) * 100) + '%' : '0%', num: `${Math.round(state.mana)} / ${state.maxMana}` },
              { label: 'VELOCITÀ', val: '100%', num: '1.0' },
              { label: 'DANNO CORPO A CORPO', val: state.weapon ? state.weapon.damage : '0', num: '' },
              { label: 'RESISTENZA AGGRESSIVA', val: state.shieldActive ? '100%' : '0%', num: state.shieldActive ? 'ATTIVO' : 'DISATTIVO' },
              { label: 'CAPACITÀ POLMONARE', val: '100%', num: 'inf' },
              { label: 'ARCO MAGICO', val: '100%', num: 'BASE' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>+ {s.label}</span>
                  <span style={{ color: '#fff' }}>{s.num}</span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(80, 200, 232, 0.5)' }}>
                   <div style={{ height: '100%', width: s.val, background: 'rgba(80, 200, 232, 0.8)' }} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ padding: '20px', marginTop: 'auto' }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>PUNTEGGIO GENERALE</div>
            <div style={{ fontSize: 32, color: '#fff' }}>{state.score}</div>
          </div>
        </div>

        {/* RIGHT PANEL: CHARACTER PREVIEW */}
        <div style={{ flex: 1, border: `1px solid rgba(80, 200, 232, 0.4)`, background: 'rgba(5, 20, 30, 0.6)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ padding: '16px 20px', fontSize: 28, borderBottom: `1px solid rgba(80, 200, 232, 0.3)`, letterSpacing: 2, background: 'rgba(80, 200, 232, 0.1)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
            SOPRAVVISSUTO
          </div>
          
          {/* Default to shortsword if null, or grab from state */}
          <CharacterPreview currentWeaponId={state.weapon?.id} />

          <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', fontSize: 18, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            NOME: {state.nickname || 'GIOCATORE'}
          </div>
        </div>

      </div>
    </div>
  );
}
