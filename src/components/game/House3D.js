import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, PointerLockControls, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ───────────────── constants ───────────────── */
const ROOM = { w: 10, h: 4, d: 8 };
const MOVE_SPEED = 3.5;
const MOUSE_SENS = 0.002;

/* ───────────────── wood material helper ───────────────── */
function WoodMat({ color = '#5a3a1a', roughness = 0.85 }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />;
}

/* ───────────────── Room shell ───────────────── */
function Room() {
  const wallColor = '#4a3520';
  const floorColor = '#3d2b1a';
  const ceilColor = '#5a4030';

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.h, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.d]} />
        <meshStandardMaterial color={ceilColor} roughness={0.8} />
      </mesh>

      {/* Ceiling beams */}
      {[-2, 0, 2].map((z, i) => (
        <mesh key={`beam-${i}`} position={[0, ROOM.h - 0.15, z]} castShadow>
          <boxGeometry args={[ROOM.w, 0.2, 0.25]} />
          <WoodMat color="#3d2510" />
        </mesh>
      ))}

      {/* Back wall */}
      <mesh position={[0, ROOM.h / 2, -ROOM.d / 2]} receiveShadow>
        <planeGeometry args={[ROOM.w, ROOM.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Front wall (with window hole - two panels) */}
      <mesh position={[-3.5, ROOM.h / 2, ROOM.d / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[3, ROOM.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[3.5, ROOM.h / 2, ROOM.d / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[3, ROOM.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Top strip above window */}
      <mesh position={[0, ROOM.h - 0.4, ROOM.d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 0.8]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* Bottom strip below window */}
      <mesh position={[0, 0.4, ROOM.d / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4, 0.8]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Right wall */}
      <mesh position={[ROOM.w / 2, ROOM.h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[ROOM.d, ROOM.h]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Window arch frame */}
      <mesh position={[0, 2, ROOM.d / 2 + 0.01]} rotation={[0, Math.PI, 0]}>
        <ringGeometry args={[1.8, 2.1, 32, 1, 0, Math.PI]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ───────────────── Torch ───────────────── */
function Torch({ position }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.elapsedTime;
      lightRef.current.intensity = 2.5 + Math.sin(t * 8) * 0.4 + Math.sin(t * 13) * 0.2;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 8]} />
        <WoodMat color="#2a1505" />
      </mesh>
      <pointLight ref={lightRef} position={[0, 0.4, 0]} color="#ff9933"
        intensity={2.5} distance={8} decay={2} castShadow shadow-mapSize={512} />
      {/* Flame glow sphere */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffaa33" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/* ───────────────── Medieval Bed ───────────────── */
function Bed() {
  return (
    <group position={[-3.5, 0, -2.5]}>
      {/* Frame */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.15, 2.2]} />
        <WoodMat color="#3d2510" />
      </mesh>
      {/* Legs */}
      {[[-0.8, 0, -1], [0.8, 0, -1], [-0.8, 0, 1], [0.8, 0, 1]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, 0.15, z]} castShadow>
          <boxGeometry args={[0.12, 0.3, 0.12]} />
          <WoodMat color="#2a1505" />
        </mesh>
      ))}
      {/* Mattress */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.6, 0.15, 2]} />
        <meshStandardMaterial color="#8B4513" roughness={0.95} />
      </mesh>
      {/* Pillow */}
      <mesh position={[0, 0.55, -0.7]}>
        <boxGeometry args={[1, 0.12, 0.5]} />
        <meshStandardMaterial color="#c9b896" roughness={0.9} />
      </mesh>
      {/* Blanket */}
      <mesh position={[0, 0.55, 0.3]}>
        <boxGeometry args={[1.5, 0.08, 1.2]} />
        <meshStandardMaterial color="#8B0000" roughness={0.9} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, 0.8, -1.05]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.1]} />
        <WoodMat color="#2a1505" />
      </mesh>
    </group>
  );
}

/* ───────────────── Chest (Interactive) ───────────────── */
function Chest({ onOpen, isOpen }) {
  const lidRef = useRef();
  const [hovered, setHovered] = useState(false);
  const targetAngle = isOpen ? -Math.PI / 2.2 : 0;

  useFrame(() => {
    if (lidRef.current) {
      lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, targetAngle, 0.08);
    }
  });

  return (
    <group position={[3.5, 0, -2.5]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onOpen}>
      {/* Base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshStandardMaterial color={hovered ? '#6a4a2a' : '#4a3218'} roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Metal bands */}
      {[-0.25, 0, 0.25].map((z, i) => (
        <mesh key={i} position={[0, 0.3, z]}>
          <boxGeometry args={[1.22, 0.62, 0.04]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Lid pivot */}
      <group position={[0, 0.6, -0.4]} ref={lidRef}>
        <mesh position={[0, 0.05, 0.4]} castShadow>
          <boxGeometry args={[1.2, 0.1, 0.8]} />
          <meshStandardMaterial color={hovered ? '#6a4a2a' : '#4a3218'} roughness={0.7} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.12, 0.4]}>
          <boxGeometry args={[1.22, 0.04, 0.82]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
      {/* Lock */}
      <mesh position={[0, 0.45, 0.41]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Glow hint when hovered */}
      {hovered && (
        <pointLight position={[0, 0.8, 0]} color="#D4AF37" intensity={1} distance={3} />
      )}
    </group>
  );
}

/* ───────────────── Landscape outside the window ───────────────── */
function Landscape() {
  return (
    <group position={[0, 0, ROOM.d / 2 + 30]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3a6b35" roughness={1} />
      </mesh>

      {/* Mountains */}
      {[[-20, 8, 40], [15, 12, 50], [-10, 10, 55], [25, 7, 35], [0, 15, 60]].map(([x, h, z], i) => (
        <mesh key={`mt-${i}`} position={[x, h / 2 - 2, z]}>
          <coneGeometry args={[h * 1.2, h, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#667788' : '#778899'} roughness={0.9} />
        </mesh>
      ))}
      {/* Snow caps */}
      {[[-20, 8, 40], [15, 12, 50], [0, 15, 60]].map(([x, h, z], i) => (
        <mesh key={`snow-${i}`} position={[x, h - 2, z]}>
          <coneGeometry args={[h * 0.5, h * 0.3, 6]} />
          <meshStandardMaterial color="#e8e8f0" roughness={0.6} />
        </mesh>
      ))}

      {/* River */}
      <mesh rotation={[-Math.PI / 2, 0, 0.3]} position={[5, -1.8, 15]}>
        <planeGeometry args={[3, 80]} />
        <meshStandardMaterial color="#2a5a8a" roughness={0.2} metalness={0.4} transparent opacity={0.85} />
      </mesh>

      {/* Forest (simple trees) */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = (Math.random() - 0.5) * 60;
        const z = 5 + Math.random() * 40;
        const h = 2 + Math.random() * 3;
        return (
          <group key={`tree-${i}`} position={[x, -2, z]}>
            <mesh position={[0, h / 2, 0]}>
              <cylinderGeometry args={[0.15, 0.2, h, 6]} />
              <meshStandardMaterial color="#4a3520" roughness={0.9} />
            </mesh>
            <mesh position={[0, h, 0]}>
              <coneGeometry args={[1.2, 2.5, 6]} />
              <meshStandardMaterial color="#1a4a1a" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Fog planes */}
      {[10, 25, 45].map((z, i) => (
        <mesh key={`fog-${i}`} position={[0, 2, z]} rotation={[0, 0, 0]}>
          <planeGeometry args={[120, 12]} />
          <meshBasicMaterial color="#c8c0b0" transparent opacity={0.08 + i * 0.04} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────────────── Table ───────────────── */
function Table() {
  return (
    <group position={[0, 0, -3]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.8]} />
        <WoodMat color="#5a3a1a" />
      </mesh>
      {[[-0.65, 0, -0.3], [0.65, 0, -0.3], [-0.65, 0, 0.3], [0.65, 0, 0.3]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, 0.32, z]} castShadow>
          <boxGeometry args={[0.08, 0.65, 0.08]} />
          <WoodMat color="#3d2510" />
        </mesh>
      ))}
      {/* Candle on table */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#ddd5c0" />
      </mesh>
      <pointLight position={[0, 1, 0]} color="#ff9933" intensity={0.8} distance={4} decay={2} />
    </group>
  );
}

/* ───────────────── Player controller with WASD + collisions ───────────────── */
function Player({ controlsRef }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const keys = useRef({});

  useEffect(() => {
    camera.position.set(0, 1.6, 0);
    const onDown = (e) => { keys.current[e.code] = true; };
    const onUp = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return;
    const k = keys.current;
    const dir = new THREE.Vector3();
    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    front.y = 0; front.normalize();
    const right = new THREE.Vector3().crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

    if (k['KeyW'] || k['ArrowUp']) dir.add(front);
    if (k['KeyS'] || k['ArrowDown']) dir.sub(front);
    if (k['KeyA'] || k['ArrowLeft']) dir.sub(right);
    if (k['KeyD'] || k['ArrowRight']) dir.add(right);
    if (dir.length() > 0) dir.normalize();

    const newPos = camera.position.clone().add(dir.multiplyScalar(MOVE_SPEED * delta));
    // Collisions (keep inside room with margin)
    const mx = ROOM.w / 2 - 0.4;
    const mz = ROOM.d / 2 - 0.4;
    newPos.x = Math.max(-mx, Math.min(mx, newPos.x));
    newPos.z = Math.max(-mz, Math.min(mz, newPos.z));
    newPos.y = 1.6;
    camera.position.copy(newPos);
  });
  return null;
}

/* ───────────────── Crosshair overlay ───────────────── */
function Crosshair() {
  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 100 }}>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(212,175,55,0.6)', borderRadius: '50%' }}>
        <div style={{ width: 4, height: 4, background: '#D4AF37', borderRadius: '50%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      </div>
    </div>
  );
}

/* ───────────────── Inventory UI (chest panel) ───────────────── */
function ChestInventory({ isOpen, onClose }) {
  const [stored, setStored] = useState(() => {
    try { return JSON.parse(localStorage.getItem('house_chest') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');

  const save = (items) => { setStored(items); localStorage.setItem('house_chest', JSON.stringify(items)); };
  const deposit = () => { if (!input.trim()) return; save([...stored, { name: input.trim(), id: Date.now() }]); setInput(''); };
  const withdraw = (id) => save(stored.filter(i => i.id !== id));

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      width: 420, background: 'linear-gradient(135deg, #1a1208 0%, #2a1a0a 100%)',
      border: '2px solid #D4AF37', borderRadius: 16, padding: 24, zIndex: 200,
      boxShadow: '0 0 60px rgba(212,175,55,0.3)', fontFamily: 'Inter, sans-serif', color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#D4AF37', letterSpacing: 3, textTransform: 'uppercase' }}>⚜ Forziere ⚜</h3>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #666', color: '#999', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
          ESC
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && deposit()}
          placeholder="Nome oggetto..."
          style={{ flex: 1, background: '#111', border: '1px solid #444', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }} />
        <button onClick={deposit} style={{ background: 'linear-gradient(135deg, #D4AF37, #B58E29)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
          Deposita
        </button>
      </div>

      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {stored.length === 0 && <p style={{ gridColumn: 'span 4', textAlign: 'center', color: '#666', fontSize: 13, padding: 20 }}>Il forziere è vuoto</p>}
        {stored.map(item => (
          <div key={item.id} onClick={() => withdraw(item.id)}
            style={{ background: '#1a1208', border: '1px solid #333', borderRadius: 8, padding: 10, textAlign: 'center', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 10px rgba(212,175,55,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>📦</div>
            <div style={{ color: '#ccc', lineHeight: 1.2 }}>{item.name}</div>
            <div style={{ color: '#666', fontSize: 9, marginTop: 4 }}>click = preleva</div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: '#555', fontSize: 10, marginTop: 12 }}>{stored.length} / 20 oggetti</p>
    </div>
  );
}

/* ───────────────── Scene ───────────────── */
function Scene({ onChestOpen, chestOpen }) {
  const controlsRef = useRef();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} color="#ffcc88" />
      <directionalLight position={[10, 15, 10]} intensity={0.3} color="#ffeedd" castShadow shadow-mapSize={1024} />

      {/* Sky */}
      <Sky sunPosition={[50, 5, 50]} turbidity={8} rayleigh={2} mieCoefficient={0.005}
        mieDirectionalG={0.8} inclination={0.48} azimuth={0.25} />

      {/* Room */}
      <Room />
      <Torch position={[-4.8, 2.5, -3]} />
      <Torch position={[4.8, 2.5, -3]} />
      <Torch position={[-4.8, 2.5, 2]} />
      <Torch position={[4.8, 2.5, 2]} />
      <Bed />
      <Table />
      <Chest onOpen={onChestOpen} isOpen={chestOpen} />
      <Landscape />

      {/* Controls */}
      <PointerLockControls ref={controlsRef} />
      <Player controlsRef={controlsRef} />
    </>
  );
}

/* ───────────────── Main export ───────────────── */
export default function House3D({ onExit }) {
  const [chestOpen, setChestOpen] = useState(false);
  const [showChestUI, setShowChestUI] = useState(false);
  const [locked, setLocked] = useState(false);

  const handleChestOpen = useCallback(() => {
    setChestOpen(o => !o);
    setShowChestUI(o => !o);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showChestUI) { setShowChestUI(false); setChestOpen(false); }
        else if (onExit) onExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showChestUI, onExit]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#000' }}>
      {/* HUD */}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 100, color: '#D4AF37', fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '8px 14px', border: '1px solid #D4AF3744' }}>
          🏠 <b>La tua Casa</b> — WASD per muoverti · Click sul forziere · ESC per uscire
        </div>
      </div>

      {/* Exit button */}
      <button onClick={onExit} style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        background: 'rgba(230,57,70,0.8)', border: 'none', borderRadius: 8,
        padding: '8px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13
      }}>
        ✕ Esci dalla Casa
      </button>

      <Crosshair />
      <ChestInventory isOpen={showChestUI} onClose={() => { setShowChestUI(false); setChestOpen(false); }} />

      <Canvas shadows camera={{ fov: 60, near: 0.1, far: 500 }} style={{ width: '100%', height: '100%' }}
        onPointerDown={e => e.target.requestPointerLock?.()}>
        <Scene onChestOpen={handleChestOpen} chestOpen={chestOpen} />
      </Canvas>
    </div>
  );
}
