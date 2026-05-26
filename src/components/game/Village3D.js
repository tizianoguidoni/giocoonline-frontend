import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, PointerLockControls, Html, Stars } from '@react-three/drei';
import * as THREE from 'three';
import ShopPanel from './ShopPanel';

/* ══════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════ */
const VILLAGE_SIZE = 60;          // half-extent of ground
const MOVE_SPEED   = 5.5;
const PLAYER_HEIGHT = 1.7;
const INTERACT_DIST = 3.5;

const INTERACTABLES = [
  { id: 'gate', type: 'gate', name: '← Torna alla Casa', pos: [0, 0, 27], dist: 4.5 },
  { id: 'guard', type: 'npc', name: '🛡 Guardia', pos: [2.5, 0, 24], dist: 3.5 },
  { id: 'herb', type: 'shop_herb', name: '🌿 Erborista', pos: [0, 0, 6.5], dist: 3.5 },
  { id: 'smith', type: 'shop_smith', name: '🔨 Fabbro', pos: [5, 0, 4.5], dist: 3.5 },
  { id: 'merc', type: 'shop_merc', name: '📜 Mercante', pos: [-5, 0, 4.5], dist: 3.5 },
];

/* ══════════════════════════════════════════════
   COBBLESTONE GROUND — procedural instanced mesh
══════════════════════════════════════════════ */
function CobblestoneGround() {
  const meshRef = useRef();
  const count = 80 * 80;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const palette = [
      [0.38, 0.33, 0.28], [0.42, 0.37, 0.31],
      [0.35, 0.30, 0.25], [0.45, 0.40, 0.34],
    ];
    for (let i = 0; i < count; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      arr[i * 3]     = c[0] + (Math.random() - 0.5) * 0.04;
      arr[i * 3 + 1] = c[1] + (Math.random() - 0.5) * 0.04;
      arr[i * 3 + 2] = c[2] + (Math.random() - 0.5) * 0.04;
    }
    return arr;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    let i = 0;
    for (let x = -40; x < 40; x++) {
      for (let z = -40; z < 40; z++) {
        const px = x * 1.5 + Math.random() * 0.15;
        const pz = z * 1.5 + Math.random() * 0.15;
        const sy = 0.08 + Math.random() * 0.06;
        dummy.position.set(px, -sy / 2, pz);
        dummy.scale.set(1.35 + Math.random() * 0.2, sy, 1.35 + Math.random() * 0.2);
        dummy.rotation.y = Math.random() * 0.3;
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        i++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.geometry.setAttribute(
      'color', new THREE.InstancedBufferAttribute(colors, 3)
    );
  }, [dummy, colors]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors roughness={0.9} metalness={0} />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════
   FOUNTAIN — animated water particle system
══════════════════════════════════════════════ */
function Fountain({ position = [0, 0, 0] }) {
  const waterRef = useRef();
  const particlesRef = useRef();
  const particleCount = 120;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      velocities.push({
        x: Math.cos(angle) * speed * 0.15,
        y: 2.5 + Math.random() * 1.5,
        z: Math.sin(angle) * speed * 0.15,
        t: Math.random() * Math.PI * 2,
      });
    }
    return { positions, velocities };
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array;
    const t = clock.elapsedTime;
    for (let i = 0; i < particleCount; i++) {
      const v = velocities[i];
      const age = ((t * 0.6 + v.t) % 1.8);
      pos[i * 3]     = v.x * age * 6;
      pos[i * 3 + 1] = v.y * age - 4.9 * age * age;
      pos[i * 3 + 2] = v.z * age * 6;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;

    if (waterRef.current) {
      waterRef.current.material.opacity = 0.55 + Math.sin(t * 1.5) * 0.08;
    }
  });

  return (
    <group position={position}>
      {/* Base outer ring */}
      <mesh position={[0, 0.25, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[3.2, 3.5, 0.5, 32]} />
        <meshStandardMaterial color="#6b5c48" roughness={0.85} />
      </mesh>
      {/* Inner pool */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.2, 32]} />
        <meshStandardMaterial color="#334455" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Center pillar */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.35, 1.5, 12]} />
        <meshStandardMaterial color="#7a6a54" roughness={0.7} />
      </mesh>
      {/* Top basin */}
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.7, 0.3, 16]} />
        <meshStandardMaterial color="#8a7a60" roughness={0.6} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.7, 32]} />
        <meshStandardMaterial color="#3a6f9f" transparent opacity={0.6} roughness={0.1} metalness={0.4} />
      </mesh>
      {/* Water particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#aaddff" size={0.12} transparent opacity={0.85} sizeAttenuation />
      </points>
    </group>
  );
}

/* ══════════════════════════════════════════════
   TORCH — flickering light
══════════════════════════════════════════════ */
function Torch({ position }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.elapsedTime;
      lightRef.current.intensity = 3 + Math.sin(t * 9) * 0.6 + Math.sin(t * 17) * 0.3;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={lightRef} color="#ffaa44" intensity={3} distance={8} decay={2} castShadow />
    </group>
  );
}

/* ══════════════════════════════════════════════
   TREE
══════════════════════════════════════════════ */
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.5, 3, 8]} />
        <meshStandardMaterial color="#1a4a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <coneGeometry args={[1.1, 2.5, 8]} />
        <meshStandardMaterial color="#1f5a27" roughness={0.8} />
      </mesh>
      <mesh position={[0, 5.5, 0]} castShadow>
        <coneGeometry args={[0.7, 2, 8]} />
        <meshStandardMaterial color="#256630" roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════
   BUILDING — generic medieval structure
══════════════════════════════════════════════ */
function Building({ position, size = [6, 5, 5], color = '#7a6a54', roofColor = '#6b2020', label, onInteract, interactDist, playerPos }) {
  const [hovered, setHovered] = useState(false);
  const [w, h, d] = size;
  const nearEnough = playerPos
    ? Math.hypot(playerPos.x - position[0], playerPos.z - position[2]) < interactDist
    : false;

  return (
    <group position={position}>
      {/* Walls */}
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, h + 0.8, 0]}>
        <coneGeometry args={[Math.max(w, d) * 0.78, 2.5, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1.1, d / 2 + 0.01]}>
        <planeGeometry args={[1.1, 2.2]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Window */}
      <mesh position={[-1.5, h * 0.6, d / 2 + 0.01]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#4a7a9b" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.5, h * 0.6, d / 2 + 0.01]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="#4a7a9b" transparent opacity={0.6} side={THREE.DoubleSide} />
     /* ══════════════════════════════════════════════
   NPC — static premium ambient villager / shopkeeper
   ══════════════════════════════════════════════ */
function NPC({ startPos, color = '#e8c88a', name, playerPos }) {
  const groupRef = useRef();
  const posRef = useRef(new THREE.Vector3(startPos[0], 0, startPos[2]));

  const near = playerPos
    ? Math.hypot(playerPos.x - posRef.current.x, playerPos.z - posRef.current.z) < INTERACT_DIST
    : false;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    
    // Idle breathing bobbing animation
    groupRef.current.position.y = Math.sin(t * 2.0) * 0.02;

    // Face the approaching player or default to facing the center of the village
    if (playerPos && near) {
      const dx = playerPos.x - posRef.current.x;
      const dz = playerPos.z - posRef.current.z;
      const targetAngle = Math.atan2(dx, dz);
      const currentAngle = groupRef.current.rotation.y;
      let diff = targetAngle - currentAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      groupRef.current.rotation.y += diff * 0.1;
    } else {
      const dx = -posRef.current.x;
      const dz = -posRef.current.z;
      const defaultAngle = Math.atan2(dx, dz);
      const currentAngle = groupRef.current.rotation.y;
      let diff = defaultAngle - currentAngle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      groupRef.current.rotation.y += diff * 0.03;
    }
  });

  const getPrompt = () => {
    if (name.includes('Mercante')) return '[E] Negozio Generale';
    if (name.includes('Fabbro')) return '[E] Forgia & Armi';
    if (name.includes('Erborista')) return '[E] Acquista Pozioni';
    return '[E] Parla';
  };

  return (
    <group ref={groupRef} position={startPos}>
      {/* Body */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color="#f5d5a0" roughness={0.7} />
      </mesh>
      {/* Hat */}
      <mesh castShadow position={[0, 2.05, 0]}>
        <coneGeometry args={[0.22, 0.4, 8]} />
        <meshStandardMaterial color="#3a2810" roughness={0.9} />
      </mesh>
      {/* Arms */}
      <mesh position={[0.35, 1.1, 0]} rotation={[0, 0, -0.4]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[-0.35, 1.1, 0]} rotation={[0, 0, 0.4]} castShadow>
        <capsuleGeometry args={[0.07, 0.5, 6, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>

      {name && near && (
        <Html position={[0, 2.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10, 5, 20, 0.92)',
            border: '1.5px solid #2A9D8F',
            borderRadius: 10,
            padding: '6px 14px',
            color: '#2A9D8F',
            fontSize: 13,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 0 15px rgba(42, 157, 143, 0.45)',
          }}>
            {name}
          </div>
        </Html>
      )}
      {near && (
        <Html position={[0, 2.0, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8,
            padding: '5px 12px',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}>
            {getPrompt()}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ══════════════════════════════════════════════
   GATE / PORTAL — entrance arch to go back to house
══════════════════════════════════════════════ */
function GatePortal({ position, onEnter, playerPos, label = '← Torna alla Casa' }) {
  const glowRef = useRef();
  const near = playerPos
    ? Math.hypot(playerPos.x - position[0], playerPos.z - position[2]) < INTERACT_DIST + 1
    : false;

  useFrame(({ clock }) => {
    if (glowRef.current) {
      glowRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 3) * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Left pillar */}
      <mesh castShadow position={[-2, 3, 0]}>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#6b5c40" roughness={0.7} />
      </mesh>
      {/* Right pillar */}
      <mesh castShadow position={[2, 3, 0]}>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#6b5c40" roughness={0.7} />
      </mesh>
      {/* Arch top */}
      <mesh castShadow position={[0, 6.2, 0]}>
        <boxGeometry args={[4.8, 0.7, 0.8]} />
        <meshStandardMaterial color="#5a4c38" roughness={0.7} />
      </mesh>
      {/* Portal glow effect */}
      <mesh position={[0, 3, 0]}>
        <planeGeometry args={[3.2, 5.5]} />
        <meshStandardMaterial
          color="#4a90d9"
          emissive="#2255cc"
          emissiveIntensity={near ? 2.0 : 0.5}
          transparent
          opacity={near ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight ref={glowRef} color="#4488ff" intensity={1.5} distance={10} position={[0, 3, 0]} />
      {near && (
        <Html position={[0, 7.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,20,0.85)',
            border: '1px solid #4488ff',
            borderRadius: 8,
            padding: '6px 16px',
            color: '#88bbff',
            fontFamily: 'Inter, sans-serif',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {label}
          </div>
        </Html>
      )}
      {near && (
        <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 6,
            padding: '2px 10px',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
          }}>
            [E] Attraversa il portale
          </div>
        </Html>
      )}
    </group>
  );
}

/* ══════════════════════════════════════════════
   PERIMETER WALL
══════════════════════════════════════════════ */
function PerimeterWalls() {
  const wallColor = '#6b5c48';
  const h = 3;
  const s = 55;
  return (
    <group>
      {/* North */}
      <mesh position={[0, h / 2, -s / 2]} castShadow receiveShadow>
        <boxGeometry args={[s, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* South (with gap for gate) */}
      <mesh position={[-15, h / 2, s / 2]} castShadow receiveShadow>
        <boxGeometry args={[25, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[18, h / 2, s / 2]} castShadow receiveShadow>
        <boxGeometry args={[19, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* West */}
      <mesh position={[-s / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, h, s]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* East */}
      <mesh position={[s / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, h, s]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════
   BENCH
══════════════════════════════════════════════ */
function Bench({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[2.2, 0.1, 0.55]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.9, 0.25, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.55]} />
        <meshStandardMaterial color="#4a2e15" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.9, 0.25, 0]}>
        <boxGeometry args={[0.1, 0.45, 0.55]} />
        <meshStandardMaterial color="#4a2e15" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ══════════════════════════════════════════════
   MARKET STALL
══════════════════════════════════════════════ */
function MarketStall({ position, color = '#c87941', label }) {
  return (
    <group position={position}>
      {/* Table */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#8b6040" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[[-1, 0.25, -0.5], [1, 0.25, -0.5], [-1, 0.25, 0.5], [1, 0.25, 0.5]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
        </mesh>
      ))}
      {/* Canopy frame */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[2.8, 0.08, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Front drape */}
      <mesh position={[0, 1.45, 0.75]}>
        <planeGeometry args={[2.8, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Goods on table */}
      {[-0.8, 0, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.65, 0]} castShadow>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color={['#e63946', '#ffd700', '#2a9d8f'][i]} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ══════════════════════════════════════════════
   PLAYER CONTROLLER
══════════════════════════════════════════════ */
function Player({ controlsRef, dialogOpen, onNearGate, onInteractPress }) {
  const { camera } = useThree();
  const keys = useRef({});
  const posRef = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 10));

  useEffect(() => {
    camera.position.copy(posRef.current);
    const onKey = (e) => { keys.current[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [camera]);

  // Expose press E
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'KeyE') onInteractPress?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onInteractPress]);

  useFrame((_, delta) => {
    if (dialogOpen) return;
    const speed = MOVE_SPEED * delta;
    const dir = new THREE.Vector3();

    if (keys.current['KeyW'] || keys.current['ArrowUp'])    dir.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown'])  dir.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft'])  dir.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) dir.x += 1;

    if (dir.lengthSq() > 0) {
      dir.normalize().applyEuler(new THREE.Euler(0, camera.rotation.y, 0, 'YXZ'));
      const np = posRef.current.clone().addScaledVector(dir, speed);
      np.x = Math.max(-26, Math.min(26, np.x));
      np.z = Math.max(-26, Math.min(26, np.z));
      posRef.current.copy(np);
    }

    posRef.current.y = PLAYER_HEIGHT;
    camera.position.copy(posRef.current);

    // Signal gate proximity
    onNearGate?.(posRef.current);
  });

  return null;
}

/* ══════════════════════════════════════════════
   DAY-NIGHT CYCLE CONTROLLER
══════════════════════════════════════════════ */
function DayNight({ timeRef }) {
  const { scene } = useThree();
  const ambRef = useRef();
  const dirRef = useRef();

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * 0.03) % 1; // full day in ~33s for demo
    timeRef.current = t;
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const sunX = Math.cos(angle) * 100;
    const sunY = Math.sin(angle) * 80;

    if (dirRef.current) {
      dirRef.current.position.set(sunX, sunY, 50);
      const dayIntensity = Math.max(0, Math.sin(angle));
      dirRef.current.intensity = dayIntensity * 2.5;
    }
    if (ambRef.current) {
      const night = Math.max(0, -Math.sin(angle));
      ambRef.current.intensity = 0.4 + Math.max(0, Math.sin(angle)) * 1.0;
      ambRef.current.color.setHSL(0.1, 0.2, 0.3 + Math.max(0, Math.sin(angle)) * 0.4);
    }
    if (scene.fog) {
      const dayFog = Math.max(0, Math.sin(angle));
      scene.fog.far = 60 + dayFog * 40;
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.8} color="#ffe0aa" />
      <directionalLight
        ref={dirRef}
        intensity={2}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   FULL SCENE
══════════════════════════════════════════════ */
function VillageScene({ dialogOpen, onNearGate, onInteractPress }) {
  const timeRef = useRef(0);
  const controlsRef = useRef();
  const playerPosState = useRef(new THREE.Vector3(0, PLAYER_HEIGHT, 10));

  // Update player position ref for proximity checks
  const handleNearGate = useCallback((pos) => {
    playerPosState.current.copy(pos);
    onNearGate?.(pos);
  }, [onNearGate]);

  const pp = playerPosState.current;

  const npcList = useMemo(() => [
    { id: 1, pos: [2.5, 0, 24], color: '#c4955a', name: '🛡 Guardia' },
    { id: 2, pos: [0, 0, 6.5],  color: '#a0c4a0', name: '🌿 Erborista' },
    { id: 3, pos: [5, 0, 4.5],  color: '#c4a870', name: '🔨 Fabbro' },
    { id: 4, pos: [-5, 0, 4.5], color: '#c07a9a', name: '📜 Mercante' },
  ], []);

  return (
    <>
      <fog attach="fog" args={['#c8b8a2', 20, 90]} />
      <DayNight timeRef={timeRef} />

      {/* Sky */}
      <Sky sunPosition={[50, 20, 50]} turbidity={8} rayleigh={2} />
      <Stars radius={80} depth={50} count={1500} factor={3} saturation={0} fade />

      {/* Ground */}
      <CobblestoneGround />

      {/* Central fountain */}
      <Fountain position={[0, 0, 0]} />

      {/* Perimeter */}
      <PerimeterWalls />

      {/* Gate / Portal south */}
      <GatePortal
        position={[0, 0, 27]}
        playerPos={pp}
        onEnter={onInteractPress}
      />

      {/* Buildings */}
      <Building position={[-14, 0, -12]} size={[7, 5.5, 5]} color="#7a6a54" roofColor="#6b2020"
        label="⚒️ Fabbro" interactDist={5} playerPos={pp} />
      <Building position={[14, 0, -12]}  size={[7, 5.5, 5]} color="#6a7a54" roofColor="#204b20"
        label="🌿 Erboristeria" interactDist={5} playerPos={pp} />
      <Building position={[-14, 0, 0]}   size={[6, 6, 5]}   color="#6a5a7a" roofColor="#4b2070"
        label="🔮 Mago" interactDist={5} playerPos={pp} />
      <Building position={[14, 0, 6]}    size={[8, 5, 6]}   color="#7a6040" roofColor="#804020"
        label="🍺 Taverna" interactDist={5} playerPos={pp} />
      <Building position={[0, 0, -22]}   size={[10, 5, 5]}  color="#8a7460" roofColor="#702020"
        label="🏛️ Municipio" interactDist={6} playerPos={pp} />

      {/* Market stalls */}
      <MarketStall position={[-5, 0, 6]}  color="#c87941" label="Cibo" />
      <MarketStall position={[5, 0, 6]}   color="#4178c8" label="Armi" />
      <MarketStall position={[0, 0, 8]}   color="#41c878" label="Pozioni" />

      {/* Benches around fountain */}
      <Bench position={[-4, 0, 0]} rotation={Math.PI / 2} />
      <Bench position={[4, 0, 0]}  rotation={Math.PI / 2} />
      <Bench position={[0, 0, -4]} rotation={0} />
      <Bench position={[0, 0, 4]}  rotation={0} />

      {/* Trees corners */}
      <Tree position={[-22, 0, -22]} scale={1.0} />
      <Tree position={[22, 0, -22]}  scale={1.1} />
      <Tree position={[-22, 0, 22]}  scale={0.9} />
      <Tree position={[22, 0, 22]}   scale={1.2} />
      <Tree position={[-10, 0, -22]} scale={0.85} />
      <Tree position={[10, 0, -22]}  scale={0.9} />

      {/* Wall torches */}
      {[
        [-26, 2.5, -10], [-26, 2.5, 10],
        [26, 2.5, -10],  [26, 2.5, 10],
        [-10, 2.5, -26], [10, 2.5, -26],
      ].map((p, i) => <Torch key={i} position={p} />)}

      {/* NPCs */}
      {npcList.map(npc => (
        <NPC
          key={npc.id}
          startPos={npc.pos}
          color={npc.color}
          name={npc.name}
          playerPos={pp}
        />
      ))}

      {/* Player */}
      {!dialogOpen && <PointerLockControls ref={controlsRef} />}
      <Player
        controlsRef={controlsRef}
        dialogOpen={dialogOpen}
        onNearGate={handleNearGate}
        onInteractPress={onInteractPress}
      />
    </>
  );
}

/* ══════════════════════════════════════════════
   CROSSHAIR
══════════════════════════════════════════════ */
function Crosshair() {
  const s = { position: 'absolute', background: 'rgba(255,255,255,0.8)', borderRadius: 2 };
  return (
    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 90 }}>
      <div style={{ ...s, width: 18, height: 2,  top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div style={{ ...s, width: 2,  height: 18, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
    </div>
  );
}

/* ══════════════════════════════════════════════
   TIME DISPLAY HUD
══════════════════════════════════════════════ */
function TimeHUD({ time }) {
  const h = Math.floor(time * 24);
  const m = Math.floor((time * 24 * 60) % 60);
  const isDay = time > 0.25 && time < 0.75;
  return (
    <span style={{ color: isDay ? '#ffd700' : '#aaaaff' }}>
      {isDay ? '☀️' : '🌙'} {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}
    </span>
  );
}

/* ══════════════════════════════════════════════
   NPC DIALOG MODAL
══════════════════════════════════════════════ */
function NPCDialog({ npc, onClose }) {
  if (!npc) return null;
  const lines = {
    '🛡 Guardia': ['Fermati, viandante! Queste mura sono sicure.', 'Nessun mostro passa da qui... per ora.'],
    '🌿 Erborista': ['Ho erbe rare dal bosco di Nevaleth!', 'Una pozione di guarigione? Ho quello che cerchi.'],
    '🔨 Fabbro': ['Le mie lame sono le più affilate del regno!', 'Portami del minerale e ti forgio un\'armatura.'],
    '📜 Mercante': ['Ho merci da tutto il continente!', 'Vuoi comprare o vendere? Prezzi onesti, parola mia.'],
  };
  const texts = lines[npc.name] || ['...'];
  const randomText = texts[Math.floor(Math.random() * texts.length)];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 60px 0',
      zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0f05 0%, #2d1a0a 100%)',
        border: '2px solid #D4AF37',
        borderRadius: 16,
        padding: '24px 32px',
        maxWidth: 520,
        width: '90%',
        boxShadow: '0 0 40px rgba(212,175,55,0.3)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48,
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid #D4AF37',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {npc.name?.split(' ')[0]}
          </div>
          <div>
            <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 15, fontFamily: 'Inter, sans-serif' }}>
              {npc.name}
            </p>
            <p style={{ color: '#888', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>Abitante del Villaggio</p>
          </div>
        </div>
        <p style={{
          color: '#f0e8d8',
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          lineHeight: 1.65,
          borderLeft: '3px solid #D4AF37',
          paddingLeft: 14,
        }}>
          "{randomText}"
        </p>
        <button onClick={onClose} style={{
          marginTop: 20,
          background: 'rgba(212,175,55,0.2)',
          border: '1px solid #D4AF37',
          borderRadius: 8,
          color: '#D4AF37',
          padding: '7px 20px',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 13,
        }}>
          Chiudi [ESC]
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════ */
export default function Village3D({ onExit }) {
  const [dialog, setDialog] = useState(null);
  const [time, setTime] = useState(0.3);
  const timeRef = useRef(0.3);
  
  const [nearestInteractable, setNearestInteractable] = useState(null);
  const [shopConfig, setShopConfig] = useState({ open: false, category: 'all' });

  // Update displayed time every second
  useEffect(() => {
    const id = setInterval(() => setTime(timeRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  // ESC closes dialog, shop or exits
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (shopConfig.open) setShopConfig({ open: false, category: 'all' });
        else if (dialog) setDialog(null);
        else onExit?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, shopConfig.open, onExit]);

  const handleInteractPress = useCallback(() => {
    if (!nearestInteractable) return;
    
    if (nearestInteractable.type === 'gate') {
      onExit?.();
    } else if (nearestInteractable.type === 'npc') {
      setDialog(nearestInteractable);
    } else if (nearestInteractable.type === 'shop_merc') {
      setShopConfig({ open: true, category: 'all' });
    } else if (nearestInteractable.type === 'shop_smith') {
      setShopConfig({ open: true, category: 'equipment' });
    } else if (nearestInteractable.type === 'shop_herb') {
      setShopConfig({ open: true, category: 'consumable' });
    }
  }, [nearestInteractable, onExit]);

  const handlePlayerMove = useCallback((pos) => {
    let nearest = null;
    let minDist = Infinity;
    
    INTERACTABLES.forEach(ent => {
      const d = Math.hypot(pos.x - ent.pos[0], pos.z - ent.pos[2]);
      if (d < ent.dist && d < minDist) {
        minDist = d;
        nearest = ent;
      }
    });

    setNearestInteractable(prev => {
      if (prev?.id === nearest?.id) return prev;
      return nearest;
    });
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#0a0805', overflow: 'hidden' }}>
      {/* HUD */}
      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 100,
        color: '#D4AF37', fontFamily: 'Inter, sans-serif', fontSize: 12,
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.75)',
          borderRadius: 10,
          padding: '8px 16px',
          border: '1px solid #D4AF3744',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>🏘️ Villaggio Medievale</span>
          <span style={{ color: '#aaa', fontSize: 11 }}>WASD muovi · Mouse guarda · E interagisci · ESC esci</span>
          <TimeHUD time={time} />
        </div>
      </div>

      {/* Exit button */}
      <button onClick={onExit} style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        background: 'rgba(230,57,70,0.85)',
        border: 'none', borderRadius: 8,
        padding: '8px 18px', color: '#fff',
        fontWeight: 700, cursor: 'pointer', fontSize: 13,
        fontFamily: 'Inter, sans-serif',
      }}>
        ✕ Esci dal Villaggio
      </button>

      <Crosshair />
      <NPCDialog npc={dialog} onClose={() => setDialog(null)} />

      {/* Specialty Premium Shop Overlay */}
      {shopConfig.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 9, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 300
        }}>
          <div className="w-full max-w-5xl h-[85vh] animate-fade-in">
            <ShopPanel 
              initialCategory={shopConfig.category} 
              onClose={() => setShopConfig({ open: false, category: 'all' })} 
            />
          </div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 200, position: [0, PLAYER_HEIGHT, 10] }}
        style={{ width: '100%', height: '100%' }}
        onPointerDown={e => !dialog && !shopConfig.open && e.target.requestPointerLock?.()}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <VillageScene
          dialogOpen={!!dialog || shopConfig.open}
          onNearGate={handlePlayerMove}
          onInteractPress={handleInteractPress}
        />
      </Canvas>
    </div>
  );
}
