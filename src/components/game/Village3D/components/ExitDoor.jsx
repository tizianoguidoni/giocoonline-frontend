import React from 'react';
import { Html } from '@react-three/drei';

/**
 * Visual archway meshes of the exit door.
 * @returns {React.ReactElement} Arch geometric meshes.
 */
function ExitArchGeometry() {
  return (
    <>
      {/* Colonne arco */}
      <mesh castShadow position={[-1.6, 1.5, 0]}>
        <boxGeometry args={[0.5, 3, 0.5]} />
        <meshStandardMaterial color="#7a6f5f" roughness={0.95} />
      </mesh>
      <mesh castShadow position={[1.6, 1.5, 0]}>
        <boxGeometry args={[0.5, 3, 0.5]} />
        <meshStandardMaterial color="#7a6f5f" roughness={0.95} />
      </mesh>
      {/* Arco superiore */}
      <mesh castShadow position={[0, 3.1, 0]}>
        <boxGeometry args={[3.7, 0.5, 0.5]} />
        <meshStandardMaterial color="#5a5045" roughness={0.95} />
      </mesh>
      {/* Cartello */}
      <mesh castShadow position={[0, 3.5, 0.2]}>
        <boxGeometry args={[2.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#3a2515" />
      </mesh>
    </>
  );
}

/**
 * Portal circular area mesh on the floor.
 * @param {Object} props
 * @param {boolean} props.isNear - Is the player currently standing in the portal area.
 * @returns {React.ReactElement} Ring portal mesh.
 */
function ExitPortalPortal({ isNear }) {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.6, 24]} />
      <meshStandardMaterial
        color="#ffaa00"
        emissive="#ff8800"
        emissiveIntensity={isNear ? 1.2 : 0.4}
        transparent
        opacity={isNear ? 0.6 : 0.3}
      />
    </mesh>
  );
}

/**
 * ExitDoor component representing the exit archway and portal trigger.
 * @param {Object} props
 * @param {number[]} [props.position] - 3D coordinates.
 * @param {function(): void} [props.onExit] - Callback when player triggers exit.
 * @param {boolean} props.isNear - Is player near the portal.
 * @returns {React.ReactElement} Exit door group.
 */
export default function ExitDoor({ position = [0, 0, 32], onExit, isNear }) {
  return (
    <group position={position}>
      <ExitArchGeometry />

      <Html position={[0, 3.5, 0.3]} center distanceFactor={10}>
        <div
          style={{
            color: '#f0d090',
            fontFamily: 'Cinzel, Georgia, serif',
            fontSize: 18,
            textShadow: '0 0 4px #000',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ← Ritorno
        </div>
      </Html>

      <ExitPortalPortal isNear={isNear} />

      {isNear && (
        <Html position={[0, 1.5, 0.5]} center distanceFactor={8}>
          <button
            onClick={onExit}
            data-testid="village-exit-btn"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(180deg,#3a2515,#1a0d05)',
              color: '#ffd76a',
              border: '2px solid #c2933a',
              borderRadius: 6,
              fontFamily: 'Cinzel, Georgia, serif',
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(255,170,40,0.55)',
            }}
          >
            [E] Torna indietro
          </button>
        </Html>
      )}
    </group>
  );
}
