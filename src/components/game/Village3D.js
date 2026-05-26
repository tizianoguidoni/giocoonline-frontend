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
  { id: 'lectern', type: 'lectern', name: '📖 Nano-GPT Creator', pos: [0, 0, -2.5], dist: 3.5 }
];

// NPC gorgeous 2D portraits
const NPC_PORTRAITS = {
  '🛡 Guardia': 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=150&h=150&fit=crop',
  '🌿 Erborista': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  '🔨 Fabbro': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  '📜 Mercante': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop'
};

/* ══════════════════════════════════════════════
   COBBLESTONE GROUND
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
      <meshStandardMaterial roughness={0.95} />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════
   LIGHTING & DECORATIONS
   ══════════════════════════════════════════════ */
function Torch({ position }) {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.elapsedTime;
      lightRef.current.intensity = 3.0 + Math.sin(t * 8) * 0.4 + Math.sin(t * 13) * 0.2;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.4, 0.1]}>
        <boxGeometry args={[0.08, 0.8, 0.08]} />
        <meshStandardMaterial color="#2a1e12" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.8, 0.1]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ff7700" emissive="#ff4400" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={lightRef} color="#ffaa44" intensity={3} distance={8} decay={2} castShadow />
    </group>
  );
}

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

function Fountain({ position }) {
  const waterRef = useRef();
  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.rotation.z = clock.elapsedTime * 0.15;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <cylinderGeometry args={[2.5, 2.6, 0.4, 16]} />
        <meshStandardMaterial color="#554d45" roughness={0.8} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 1.2, 12]} />
        <meshStandardMaterial color="#4a423a" roughness={0.9} />
      </mesh>
      <mesh ref={waterRef} position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 32]} />
        <meshStandardMaterial color="#2a7eb0" emissive="#124a6f" emissiveIntensity={0.6} roughness={0.2} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

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
    </group>
  );
}

/* ══════════════════════════════════════════════
   PREMIUM DETAILED BUILDINGS (NON-UNIFORM)
   ══════════════════════════════════════════════ */

// 1. Blacksmith (Fabbro) House - Stone structure with animated smoke & anvil
function FabbroBuilding({ position }) {
  const smokeParticles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      speed: 0.8 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);
  
  const particleRefs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    particleRefs.current.forEach((ref, i) => {
      if (ref) {
        const p = smokeParticles[i];
        const y = ((t * p.speed + p.offset) % 3.0);
        ref.position.y = 3.6 + y;
        ref.position.x = -2.2 + Math.sin(t * 2 + i) * 0.15;
        ref.position.z = -1.2 + Math.cos(t * 2 + i) * 0.15;
        const scale = (1.0 - y / 3.0) * 0.15;
        ref.scale.set(scale, scale, scale);
      }
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 3.6, 5]} />
        <meshStandardMaterial color="#4a4d53" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[5.2, 1.8, 4]} />
        <meshStandardMaterial color="#6a3535" roughness={0.7} />
      </mesh>
      <mesh position={[-2.2, 3.2, -1.2]} castShadow>
        <boxGeometry args={[0.8, 2.0, 0.8]} />
        <meshStandardMaterial color="#3a3c40" roughness={0.9} />
      </mesh>
      {smokeParticles.map((p, i) => (
        <mesh key={p.id} ref={el => particleRefs.current[i] = el}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color="#777777" transparent opacity={0.5} flatShading />
        </mesh>
      ))}
      <group position={[1.8, 0, 3.2]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.4, 0.5, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.8} metalness={0.8} />
        </mesh>
      </group>
      <mesh position={[0, 1.1, 2.51]}>
        <planeGeometry args={[1.1, 2.2]} />
        <meshStandardMaterial color="#221105" roughness={0.9} />
      </mesh>
    </group>
  );
}

// 2. Herbalist (Erboristeria) - Organic green house with foliage
function ErboristaBuilding({ position }) {
  const leaves = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      speed: 0.5 + Math.random() * 0.4,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);
  
  const leafRefs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    leafRefs.current.forEach((ref, i) => {
      if (ref) {
        const l = leaves[i];
        const y = ((t * l.speed + l.offset) % 4.0);
        ref.position.y = 4.0 - y;
        ref.position.x = 2.0 + Math.sin(t + i) * 0.4;
        ref.position.z = 2.0 + Math.cos(t + i) * 0.4;
        ref.rotation.y = t * 1.5 + i;
        ref.rotation.x = t * 0.8;
      }
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 3.6, 5]} />
        <meshStandardMaterial color="#425740" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[5.2, 1.8, 4]} />
        <meshStandardMaterial color="#7a6b4a" roughness={0.8} />
      </mesh>
      <mesh position={[1.8, 1.8, 2.52]} castShadow>
        <boxGeometry args={[1.2, 2.8, 0.08]} />
        <meshStandardMaterial color="#1a4d22" roughness={0.7} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={l.id} ref={el => leafRefs.current[i] = el} scale={[0.1, 0.02, 0.15]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#2d7a3a" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 2.51]}>
        <planeGeometry args={[1.1, 2.2]} />
        <meshStandardMaterial color="#1f2d12" roughness={0.9} />
      </mesh>
    </group>
  );
}

// 3. Wizard Tower (Mago) - Tall cylindrical stone structure with glowing spinning bands
function MagoTower({ position }) {
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef1.current) {
      ringRef1.current.rotation.y = t * 0.8;
      ringRef1.current.position.y = 5.0 + Math.sin(t * 1.5) * 0.3;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = -t * 1.2;
      ringRef2.current.position.y = 5.0 - Math.sin(t * 1.5) * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.0, 2.3, 6.4, 16]} />
        <meshStandardMaterial color="#3b3345" roughness={0.85} />
      </mesh>
      <mesh position={[0, 7.4, 0]} castShadow>
        <coneGeometry args={[2.5, 2.4, 12]} />
        <meshStandardMaterial color="#4c2275" roughness={0.65} metalness={0.2} />
      </mesh>
      <mesh ref={ringRef1} position={[0, 5.0, 0]}>
        <torusGeometry args={[2.6, 0.1, 8, 32]} />
        <meshStandardMaterial color="#9933ff" emissive="#cc66ff" emissiveIntensity={2.5} />
      </mesh>
      <mesh ref={ringRef2} position={[0, 5.0, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.8, 0.08, 8, 32]} />
        <meshStandardMaterial color="#33ccff" emissive="#66ffff" emissiveIntensity={2.0} />
      </mesh>
      <mesh position={[0, 1.1, 2.05]}>
        <planeGeometry args={[1.1, 2.2]} />
        <meshStandardMaterial color="#0c021f" roughness={0.9} emissive="#4c2275" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// 4. Tavern (Taverna) - Timber structure with wooden columns and deck porch
function TavernaHouse({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 3.6, 6]} />
        <meshStandardMaterial color="#7a5538" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.3, 0]} castShadow>
        <coneGeometry args={[5.8, 1.8, 4]} />
        <meshStandardMaterial color="#572212" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 3.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 1.5]} />
        <meshStandardMaterial color="#4a301c" roughness={0.9} />
      </mesh>
      {[-3.6, 0, 3.6].map((x, i) => (
        <mesh key={i} position={[x, 1.2, 4.1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.4, 6]} />
          <meshStandardMaterial color="#4a301c" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 3.01]}>
        <planeGeometry args={[1.2, 2.2]} />
        <meshStandardMaterial color="#301602" roughness={0.9} />
      </mesh>
    </group>
  );
}

// 5. Town Hall (Municipio) - Marble building with front columns
function MunicipioHouse({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 4.4, 6]} />
        <meshStandardMaterial color="#dfdbd5" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0, 5.0, 0]} castShadow>
        <coneGeometry args={[7.2, 1.8, 4]} />
        <meshStandardMaterial color="#c8a86a" roughness={0.6} />
      </mesh>
      {[-4.2, -2.1, 2.1, 4.2].map((x, i) => (
        <mesh key={i} position={[x, 2.0, 3.2]} castShadow>
          <cylinderGeometry args={[0.2, 0.25, 4.0, 12]} />
          <meshStandardMaterial color="#f0ede9" roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.4, 3.01]}>
        <planeGeometry args={[2.0, 2.8]} />
        <meshStandardMaterial color="#c8a86a" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

// 6. Magic Lectern (Town Center) - Holds the floating Magic Book for Nano-GPT Text-to-Store
function MagicLectern({ position, near }) {
  const bookRef = useRef();
  
  useFrame(({ clock }) => {
    if (bookRef.current) {
      const t = clock.elapsedTime;
      bookRef.current.position.y = 1.35 + Math.sin(t * 2.0) * 0.08;
      bookRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.45, 0.8, 8]} />
        <meshStandardMaterial color="#2d2a33" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.7, 0.15, 0.6]} />
        <meshStandardMaterial color="#c8a86a" roughness={0.4} metalness={0.7} />
      </mesh>
      <group ref={bookRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.08, 0.45, 0.35]} />
          <meshStandardMaterial color="#551a1a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.18, 0.02, 0]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.3, 0.04, 0.32]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.9} />
        </mesh>
        <mesh position={[0.18, 0.02, 0]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.3, 0.04, 0.32]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.9} />
        </mesh>
      </group>
      <pointLight color="#ffbb44" intensity={1.8} distance={5} position={[0, 1.5, 0]} />
      {near && (
        <Html position={[0, 2.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10, 0, 25, 0.95)',
            border: '2.0px solid #D4AF37',
            borderRadius: 12,
            padding: '10px 22px',
            color: '#D4AF37',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(212,175,55,0.7)',
            whiteSpace: 'nowrap',
          }}>
            📖 Nano-GPT Lore & Shop Creator<br />
            <span style={{ fontSize: 11, color: '#ffea9f99', fontWeight: 500 }}>[E] Apri Console AI</span>
          </div>
        </Html>
      )}
    </group>
  );
}

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
    
    groupRef.current.position.y = Math.sin(t * 2.0) * 0.02;

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

      {/* FLOATING 2D AVATAR ABOVE HEAD */}
      {near && NPC_PORTRAITS[name] && (
        <Html position={[0, 2.9, 0]} center style={{ pointerEvents: 'none' }}>
          <img 
            src={NPC_PORTRAITS[name]} 
            alt={name}
            style={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: '2px solid #2A9D8F',
              boxShadow: '0 0 10px rgba(42, 157, 143, 0.6)',
              objectFit: 'cover'
            }}
          />
        </Html>
      )}

      {name && near && (
        <Html position={[0, 2.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10, 5, 20, 0.92)',
            border: '1.5px solid #2A9D8F',
            borderRadius: 10,
            padding: '6px 14px',
            color: '#2A9D8F',
            fontSize: 13,
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            boxShadow: '0 0 15px rgba(42, 157, 143, 0.45)',
          }}>
            {name}
          </div>
        </Html>
      )}
      {near && (
        <Html position={[0, 1.9, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 8,
            padding: '5px 12px',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Outfit, sans-serif',
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
   GATE / PORTAL
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
      <mesh castShadow position={[-2, 3, 0]}>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#6b5c40" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[2, 3, 0]}>
        <boxGeometry args={[0.8, 6, 0.8]} />
        <meshStandardMaterial color="#6b5c40" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 6.2, 0]}>
        <boxGeometry args={[4.8, 0.7, 0.8]} />
        <meshStandardMaterial color="#5a4c38" roughness={0.7} />
      </mesh>
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
            fontFamily: 'Outfit, sans-serif',
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
            fontFamily: 'Outfit, sans-serif',
          }}>
            [E] Attraversa il portale
          </div>
        </Html>
      )}
    </group>
  );
}

/* ══════════════════════════════════════════════
   PERIMETER WALL & DECORATIONS
   ══════════════════════════════════════════════ */
function PerimeterWalls() {
  const wallColor = '#6b5c48';
  const h = 3;
  const s = 55;
  return (
    <group>
      <mesh position={[0, h / 2, -s / 2]} castShadow receiveShadow>
        <boxGeometry args={[s, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[-15, h / 2, s / 2]} castShadow receiveShadow>
        <boxGeometry args={[25, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[18, h / 2, s / 2]} castShadow receiveShadow>
        <boxGeometry args={[19, h, 1.2]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[-s / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, h, s]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      <mesh position={[s / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, h, s]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
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
    const t = (clock.elapsedTime * 0.03) % 1;
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

  const nearLectern = Math.hypot(pp.x - 0, pp.z - (-2.5)) < INTERACT_DIST;

  return (
    <>
      <fog attach="fog" args={['#c8b8a2', 20, 90]} />
      <DayNight timeRef={timeRef} />

      <Sky sunPosition={[50, 20, 50]} turbidity={8} rayleigh={2} />
      <Stars radius={80} depth={50} count={1500} factor={3} saturation={0} fade />

      <CobblestoneGround />
      <Fountain position={[0, 0, 0]} />
      <PerimeterWalls />

      <GatePortal
        position={[0, 0, 27]}
        playerPos={pp}
        onEnter={onInteractPress}
      />

      {/* UNIQUE DETAILED PREMIUM HOUSES */}
      <FabbroBuilding position={[-14, 0, -12]} />
      <ErboristaBuilding position={[14, 0, -12]} />
      <MagoTower position={[-14, 0, 0]} />
      <TavernaHouse position={[14, 0, 6]} />
      <MunicipioHouse position={[0, 0, -22]} />

      {/* Magic Lectern for Nano-GPT Lore Creator */}
      <MagicLectern position={[0, 0, -2.5]} near={nearLectern} />

      <MarketStall position={[-5, 0, 6]}  color="#c87941" />
      <MarketStall position={[5, 0, 6]}   color="#4178c8" />
      <MarketStall position={[0, 0, 8]}   color="#41c878" />

      <Bench position={[-4, 0, 0]} rotation={Math.PI / 2} />
      <Bench position={[4, 0, 0]}  rotation={Math.PI / 2} />
      <Bench position={[0, 0, -4]} rotation={0} />
      <Bench position={[0, 0, 4]}  rotation={0} />

      <Tree position={[-22, 0, -22]} scale={1.0} />
      <Tree position={[22, 0, -22]}  scale={1.1} />
      <Tree position={[-22, 0, 22]}  scale={0.9} />
      <Tree position={[22, 0, 22]}   scale={1.2} />
      <Tree position={[-10, 0, -22]} scale={0.85} />
      <Tree position={[10, 0, -22]}  scale={0.9} />

      {[
        [-26, 2.5, -10], [-26, 2.5, 10],
        [26, 2.5, -10],  [26, 2.5, 10],
        [-10, 2.5, -26], [10, 2.5, -26],
      ].map((p, i) => <Torch key={i} position={p} />)}

      {npcList.map(npc => (
        <NPC
          key={npc.id}
          startPos={npc.pos}
          color={npc.color}
          name={npc.name}
          playerPos={pp}
        />
      ))}

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
   NPC DIALOG MODAL WITH PORTRAIT
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
  const portrait = NPC_PORTRAITS[npc.name] || '';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 0 60px 0',
      zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #120e24 0%, #1f1a3a 100%)',
        border: '2px solid #D4AF37',
        borderRadius: 24,
        padding: '32px',
        maxWidth: 580,
        width: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(212,175,55,0.25)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          {portrait && (
            <img 
              src={portrait} 
              alt={npc.name} 
              style={{
                width: 72, height: 72,
                borderRadius: '50%',
                border: '2px solid #D4AF37',
                objectFit: 'cover',
                boxShadow: '0 0 15px rgba(212,175,55,0.4)'
              }}
            />
          )}
          <div>
            <p style={{ color: '#D4AF37', fontWeight: 800, fontSize: 18, fontFamily: 'Outfit, sans-serif' }}>
              {npc.name}
            </p>
            <p style={{ color: '#A19BAD', fontSize: 12, fontFamily: 'Outfit, sans-serif' }}>Abitante del Villaggio</p>
          </div>
        </div>
        <p style={{
          color: '#f0e8d8',
          fontFamily: 'Outfit, sans-serif',
          fontSize: 16,
          lineHeight: 1.65,
          borderLeft: '4.0px solid #D4AF37',
          paddingLeft: 16,
          marginBottom: 24,
          fontStyle: 'italic'
        }}>
          "{randomText}"
        </p>
        <button onClick={onClose} style={{
          background: 'linear-gradient(135deg, #D4AF37, #B58E29)',
          border: 'none',
          borderRadius: 12,
          color: '#000',
          padding: '10px 24px',
          cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
          transition: 'all 0.2s'
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
  const [shopConfig, setShopConfig] = useState({ open: false, category: 'all', customItems: null });
  
  // Nano-GPT Lore Book States
  const [showLecternUI, setShowLecternUI] = useState(false);
  const [gptPrompt, setGptPrompt] = useState('');
  const [gptLoading, setGptLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState('');
  const [generatedShopkeeper, setGeneratedShopkeeper] = useState(null);

  // Update displayed time every second
  useEffect(() => {
    const id = setInterval(() => setTime(timeRef.current), 1000);
    return () => clearInterval(id);
  }, []);

  // ESC closes modals or exits
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showLecternUI) setShowLecternUI(false);
        else if (shopConfig.open) setShopConfig({ open: false, category: 'all', customItems: null });
        else if (dialog) setDialog(null);
        else onExit?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, shopConfig.open, showLecternUI, onExit]);

  const handleInteractPress = useCallback(() => {
    if (!nearestInteractable) return;
    
    if (nearestInteractable.type === 'gate') {
      onExit?.();
    } else if (nearestInteractable.type === 'npc') {
      setDialog(nearestInteractable);
    } else if (nearestInteractable.type === 'shop_merc') {
      setShopConfig({ open: true, category: 'all', customItems: null });
    } else if (nearestInteractable.type === 'shop_smith') {
      setShopConfig({ open: true, category: 'equipment', customItems: null });
    } else if (nearestInteractable.type === 'shop_herb') {
      setShopConfig({ open: true, category: 'consumable', customItems: null });
    } else if (nearestInteractable.type === 'lectern') {
      setShowLecternUI(true);
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

  // NANO-GPT Text-to-Store & Lore Engine
  const handleGenerateStoryAndShop = async () => {
    if (!gptPrompt.trim()) return;
    setGptLoading(true);
    setGeneratedStory('');
    setGeneratedShopkeeper(null);

    // Simulate Nano-GPT processing states (loading/typing states)
    await new Promise(r => setTimeout(r, 2200));

    const lowercasePrompt = gptPrompt.toLowerCase();
    
    // Choose theme based on prompt keywords
    let theme = {
      name: 'Mago Alchimista Oscuro',
      portrait: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop',
      story: 'Dalle profondità delle lande di Nevaleth, ho estratto minerali oscuri pregni di magia demoniaca. Forgio lame che gridano vendetta.',
      items: [
        { id: 'dragon_slayer', name: 'Lama Demoniaca del Sangue', type: 'weapon', slot: 'sword', rarity: 'legendary', stats: { strength: 30, damage: 65, dark_damage: 15 }, price: 950 },
        { id: 'shadow_dagger', name: 'Artiglio del Vuoto Oscuro', type: 'weapon', slot: 'secondary', rarity: 'epic', stats: { agility: 20, damage: 40, crit_chance: 20 }, price: 850 },
        { id: 'dragon_shield', name: 'Scudo Infernale d\'Acciaio', type: 'armor', slot: 'shield', rarity: 'epic', stats: { defense: 45, block: 50, fire_resist: 30 }, price: 900 },
        { id: 'large_health_potion', name: 'Elisir del Patto di Sangue', type: 'consumable', rarity: 'rare', stats: { heal: 180 }, price: 90 }
      ]
    };

    if (lowercasePrompt.includes('fuoco') || lowercasePrompt.includes('fiamm') || lowercasePrompt.includes('vulcan')) {
      theme = {
        name: 'Guardiano del Vulcano',
        portrait: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
        story: 'Il fuoco scorre nelle mie vene e la lava è il mio martello. Ho temprato queste armi direttamente nel cuore del vulcano attivo.',
        items: [
          { id: 'flame_sword', name: 'Spada del Drago Vulcano', type: 'weapon', slot: 'sword', rarity: 'legendary', stats: { strength: 28, damage: 58, fire_damage: 22 }, price: 1100 },
          { id: 'dragon_helmet', name: 'Cresta di Lava Fusa', type: 'armor', slot: 'helmet', rarity: 'epic', stats: { defense: 30, hp_bonus: 120, fire_resist: 40 }, price: 1000 },
          { id: 'dragon_shield', name: 'Egida della Fenice di Fuoco', type: 'armor', slot: 'shield', rarity: 'epic', stats: { defense: 40, block: 50, reflect: 15 }, price: 1050 },
          { id: 'medium_health_potion', name: 'Pozione Sangue di Drago', type: 'consumable', rarity: 'uncommon', stats: { heal: 95 }, price: 45 }
        ]
      };
    } else if (lowercasePrompt.includes('ghiaccio') || lowercasePrompt.includes('gelo') || lowercasePrompt.includes('nord')) {
      theme = {
        name: 'Fabbro dei Ghiacci Antichi',
        portrait: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop',
        story: 'Nei picchi del nord, dove il tempo si congela, incido rune di puro ghiaccio eterno sulle lame degli avventurieri.',
        items: [
          { id: 'frost_brand', name: 'Lama del Gelo Polare', type: 'weapon', slot: 'sword', rarity: 'legendary', stats: { strength: 26, damage: 52, ice_damage: 25 }, price: 1150 },
          { id: 'steel_shield', name: 'Baluardo della Tempesta Bianca', type: 'armor', slot: 'shield', rarity: 'rare', stats: { defense: 25, block: 30, ice_resist: 25 }, price: 650 },
          { id: 'large_mana_potion', name: 'Nettare Polare di Mana', type: 'consumable', rarity: 'rare', stats: { mana: 120 }, price: 85 }
        ]
      };
    } else if (lowercasePrompt.includes('luce') || lowercasePrompt.includes('santo') || lowercasePrompt.includes('angel')) {
      theme = {
        name: 'Chierico della Luce Eterna',
        portrait: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
        story: 'La luce divina benedice la mia forgia. Queste sacre reliquie respingeranno l\'oscurità del dungeon e cureranno le tue piaghe.',
        items: [
          { id: 'silver_blade', name: 'Sterminatrice dell\'Eresia', type: 'weapon', slot: 'sword', rarity: 'legendary', stats: { strength: 32, damage: 60, holy_damage: 25 }, price: 1200 },
          { id: 'knight_helmet', name: 'Corona della Fede Infrangibile', type: 'armor', slot: 'helmet', rarity: 'rare', stats: { defense: 22, hp_bonus: 80, mana_bonus: 40 }, price: 700 },
          { id: 'large_health_potion', name: 'Elisir degli Arcangeli', type: 'consumable', rarity: 'rare', stats: { heal: 200 }, price: 110 }
        ]
      };
    }

    setGeneratedStory(theme.story);
    setGeneratedShopkeeper(theme);
    setGptLoading(false);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: '#0a0805', overflow: 'hidden' }}>
      {/* HUD */}
      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 100,
        color: '#D4AF37', fontFamily: 'Outfit, sans-serif', fontSize: 12,
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

      <button onClick={onExit} style={{
        position: 'fixed', top: 16, right: 16, zIndex: 100,
        background: 'rgba(230,57,70,0.85)',
        border: 'none', borderRadius: 8,
        padding: '8px 18px', color: '#fff',
        fontWeight: 700, cursor: 'pointer', fontSize: 13,
        fontFamily: 'Outfit, sans-serif',
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
              onClose={() => setShopConfig({ open: false, category: 'all', customItems: null })} 
              customItems={shopConfig.customItems}
            />
          </div>
        </div>
      )}

      {/* NANO-GPT LECTERN LORE CONSOLE */}
      {showLecternUI && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 2, 12, 0.9)',
          backdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 250
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #161224 0%, #0b0914 100%)',
            border: '2px solid #D4AF37',
            borderRadius: 24,
            padding: '32px',
            maxWidth: 640,
            width: '95%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.3)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#D4AF37', fontWeight: 900, fontSize: 24, fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              📖 Nano-GPT Prompt Engine
            </h3>
            <p style={{ color: '#A19BAD', fontSize: 13, fontFamily: 'Outfit, sans-serif', marginBottom: 24 }}>
              Scrivi una descrizione per generare istantaneamente una bottega personalizzata ed una storia di conoscenza per l'NPC.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <input 
                type="text"
                value={gptPrompt}
                onChange={e => setGptPrompt(e.target.value)}
                placeholder="Es. Un mago alchimista del fuoco del vulcano profondo..."
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'Outfit, sans-serif',
                  outline: 'none',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
                }}
              />
              <button 
                onClick={handleGenerateStoryAndShop}
                disabled={gptLoading || !gptPrompt.trim()}
                style={{
                  background: 'linear-gradient(135deg, #D4AF37, #B58E29)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#000',
                  padding: '14px',
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 800,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
                  opacity: gptPrompt.trim() ? 1 : 0.6
                }}
              >
                {gptLoading ? 'Generazione Nano-GPT in corso...' : 'Genera Storia e Bottega'}
              </button>
            </div>

            {/* Generated results */}
            {generatedShopkeeper && (
              <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img 
                    src={generatedShopkeeper.portrait} 
                    alt={generatedShopkeeper.name}
                    style={{
                      width: 60, height: 60,
                      borderRadius: '50%',
                      border: '2.5px solid #2A9D8F',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <h4 style={{ color: '#2A9D8F', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit, sans-serif' }}>
                      {generatedShopkeeper.name}
                    </h4>
                    <p style={{ color: '#A19BAD', fontSize: 11, fontFamily: 'Outfit, sans-serif' }}>Creato da Nano-GPT</p>
                  </div>
                </div>
                
                <p style={{ color: '#f0e8d8', fontSize: 14, fontFamily: 'Outfit, sans-serif', fontStyle: 'italic', borderLeft: '3px solid #2A9D8F', paddingLeft: 12, margin: 0 }}>
                  "{generatedStory}"
                </p>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', margin: 0 }}>Oggetti Unici Creati:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {generatedShopkeeper.items.map((it, idx) => (
                      <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                        ⚔️ {it.name} (Lv.{Object.values(it.stats)[0]})
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowLecternUI(false);
                    setShopConfig({ open: true, category: 'all', customItems: generatedShopkeeper.items });
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #2A9D8F, #38c9b9)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#000',
                    padding: '12px',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: 800,
                    fontSize: 13,
                    textTransform: 'uppercase',
                    marginTop: 12
                  }}
                >
                  🛒 Apri Emporio Generato
                </button>
              </div>
            )}

            <button 
              onClick={() => setShowLecternUI(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                color: '#A19BAD',
                padding: '10px',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: 13,
                width: '100%',
                marginTop: 16
              }}
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <Canvas
        shadows
        camera={{ fov: 70, near: 0.1, far: 200, position: [0, PLAYER_HEIGHT, 10] }}
        style={{ width: '100%', height: '100%' }}
        onPointerDown={e => !dialog && !shopConfig.open && !showLecternUI && e.target.requestPointerLock?.()}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <VillageScene
          dialogOpen={!!dialog || shopConfig.open || showLecternUI}
          onNearGate={handlePlayerMove}
          onInteractPress={handleInteractPress}
        />
      </Canvas>
    </div>
  );
}
