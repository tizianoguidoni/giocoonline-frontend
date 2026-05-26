import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/**
 * @typedef {Object} StallProps
 * @property {number[]} position - 3D position [x, y, z].
 * @property {number} [rotation] - Rotation around Y axis in radians.
 * @property {string} [color] - Hex color code for the wooden stall.
 * @property {React.ReactNode} [children] - Optional custom children representing items on the table.
 * @property {string} label - Shop name displayed on button.
 * @property {function(): void} onInteract - Callback when the interact button is clicked.
 */

/**
 * Generic wooden stall builder component.
 * @param {StallProps} props
 * @returns {React.ReactElement} Stall meshes.
 */
function Stall({ position, rotation = 0, color = '#7a4b2a', children, label, onInteract }) {
  const legs = [
    [-1.4, 0.45, -0.5],
    [1.4, 0.45, -0.5],
    [-1.4, 0.45, 0.5],
    [1.4, 0.45, 0.5],
  ];

  const posts = [
    [-1.5, 1.7, -0.4],
    [1.5, 1.7, -0.4],
  ];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tavolo bancarella */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[3, 0.15, 1.2]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Gambe */}
      {legs.map((p) => (
        <mesh key={`leg-${p[0]}-${p[2]}`} castShadow position={p}>
          <boxGeometry args={[0.15, 0.9, 0.15]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ))}
      {/* Tettoia */}
      <mesh castShadow position={[0, 2.3, -0.2]} rotation={[Math.PI / 8, 0, 0]}>
        <boxGeometry args={[3.2, 0.08, 1.5]} />
        <meshStandardMaterial color="#9b3a3a" roughness={0.85} />
      </mesh>
      {/* Pali tettoia */}
      {posts.map((p) => (
        <mesh key={`post-${p[0]}-${p[2]}`} castShadow position={p}>
          <boxGeometry args={[0.1, 1.6, 0.1]} />
          <meshStandardMaterial color="#3a2515" />
        </mesh>
      ))}
      {/* Oggetti sul banco */}
      {children}
      {/* Cartello cliccabile */}
      <group position={[0, 2.7, 0]}>
        <Html center distanceFactor={10} occlude>
          <button
            onClick={onInteract}
            data-testid={`shop-${label.toLowerCase().replace(/\s/g, '-')}-btn`}
            style={{
              padding: '6px 14px',
              background: 'rgba(20,15,10,0.85)',
              color: '#f7c873',
              border: '2px solid #c2933a',
              borderRadius: 4,
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {label}
          </button>
        </Html>
      </group>
    </group>
  );
}

/**
 * Blacksmith specific stall component.
 * @param {Object} props
 * @param {function(string): void} props.onOpenShop - Callback for opening a shop.
 * @returns {React.ReactElement} Blacksmith shop.
 */
function Blacksmith({ onOpenShop }) {
  const swords = [0.4, 0.8, 1.2];
  return (
    <Stall
      position={[-28, 0, 0]}
      rotation={Math.PI / 2}
      color="#5a3a20"
      label="Fabbro"
      onInteract={() => onOpenShop('fabbro')}
    >
      {/* Incudine */}
      <mesh position={[-0.8, 1.15, 0]} castShadow>
        <boxGeometry args={[0.5, 0.35, 0.3]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Spade esposte */}
      {swords.map((x) => (
        <group key={`sword-${x}`} position={[x, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow position={[0, 0.4, 0]}>
            <boxGeometry args={[0.7, 0.06, 0.02]} />
            <meshStandardMaterial color="#cccccc" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0, -0.05, 0]}>
            <boxGeometry args={[0.12, 0.2, 0.05]} />
            <meshStandardMaterial color="#3a2515" />
          </mesh>
        </group>
      ))}
    </Stall>
  );
}

/**
 * MagicShop specific stall component.
 * @param {Object} props
 * @param {function(string): void} props.onOpenShop - Callback for opening a shop.
 * @returns {React.ReactElement} Magic Shop.
 */
function MagicShop({ onOpenShop }) {
  const crystalRef = useRef();
  const scrolls = [-1, -0.5, 0.7, 1.1];

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = state.clock.elapsedTime * 0.8;
      crystalRef.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <Stall
      position={[28, 0, -12]}
      rotation={-Math.PI / 2}
      color="#2a1f4a"
      label="Mercante Magico"
      onInteract={() => onOpenShop('mago')}
    >
      <mesh ref={crystalRef} position={[0, 1.4, 0]} castShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#7a5cff"
          emissive="#5a3aff"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#9a7aff" intensity={0.8} distance={3} />
      {/* Pergamene */}
      {scrolls.map((x) => (
        <mesh key={`scroll-${x}`} position={[x, 1.05, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#e8d4a8" roughness={0.95} />
        </mesh>
      ))}
    </Stall>
  );
}

/**
 * FoodStall specific stall component.
 * @param {Object} props
 * @param {function(string): void} props.onOpenShop - Callback for opening a shop.
 * @returns {React.ReactElement} Food Stall.
 */
function FoodStall({ onOpenShop }) {
  const breads = [
    [-0.9, 1.05, 0],
    [-0.6, 1.05, 0.2],
    [-0.3, 1.05, 0]
  ];
  return (
    <Stall
      position={[-28, 0, -12]}
      rotation={Math.PI / 2}
      color="#6a3a20"
      label="Bancarella Cibo"
      onInteract={() => onOpenShop('cibo')}
    >
      {/* Pane */}
      {breads.map((p) => (
        <mesh key={`bread-${p[0]}-${p[2]}`} position={p} castShadow>
          <sphereGeometry args={[0.13, 8, 6]} />
          <meshStandardMaterial color="#d4a868" roughness={0.95} />
        </mesh>
      ))}
      {/* Carne / formaggio */}
      <mesh position={[0.3, 1.05, 0]} castShadow>
        <boxGeometry args={[0.3, 0.15, 0.25]} />
        <meshStandardMaterial color="#a83a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0.8, 1.05, 0]} castShadow>
        <coneGeometry args={[0.18, 0.25, 6]} />
        <meshStandardMaterial color="#f0c870" roughness={0.85} />
      </mesh>
    </Stall>
  );
}

/**
 * Alchemist specific stall component.
 * @param {Object} props
 * @param {function(string): void} props.onOpenShop - Callback for opening a shop.
 * @returns {React.ReactElement} Alchemist.
 */
function Alchemist({ onOpenShop }) {
  const potions = [-0.9, -0.5, -0.1, 0.3, 0.7, 1.1];
  return (
    <Stall
      position={[28, 0, 12]}
      rotation={-Math.PI / 2}
      color="#3a2a4a"
      label="Alchimista"
      onInteract={() => onOpenShop('mago')}
    >
      {/* Bottiglie/pozioni */}
      {potions.map((x, i) => (
        <group key={`potion-${x}`} position={[x, 1.05, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.25, 8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#3a7aff' : '#ff3a6a'}
              transparent
              opacity={0.75}
              emissive={i % 2 === 0 ? '#1a3a8a' : '#8a1a3a'}
              emissiveIntensity={0.3}
            />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.08, 6]} />
            <meshStandardMaterial color="#3a2515" />
          </mesh>
        </group>
      ))}
    </Stall>
  );
}

/**
 * Shops component managing all four market stalls in the village.
 * @param {Object} props
 * @param {function(string): void} props.onOpenShop - Callback.
 * @returns {React.ReactElement} Group of stalls.
 */
export default function Shops({ onOpenShop }) {
  return (
    <group>
      <Blacksmith onOpenShop={onOpenShop} />
      <MagicShop onOpenShop={onOpenShop} />
      <FoodStall onOpenShop={onOpenShop} />
      <Alchemist onOpenShop={onOpenShop} />
    </group>
  );
}
