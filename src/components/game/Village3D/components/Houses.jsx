import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Renders the structural walls, beams, windows, and interactive doors of the house.
 * @param {Object} props
 * @param {THREE.Material} props.wallMat - Wall plaster material.
 * @param {THREE.Material} props.beamMat - Dark timber wood material.
 * @param {THREE.Material} props.windowMat - Emissive window material.
 * @param {boolean} props.accessible - Is house enterable.
 * @param {function(): void} [props.onEnter] - Interactive click callback.
 * @returns {React.ReactElement}
 */
function HouseWalls({ wallMat, beamMat, windowMat, accessible, onEnter }) {
  return (
    <>
      {/* Corpo principale */}
      <mesh material={wallMat} castShadow receiveShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[4, 2.8, 4]} />
      </mesh>

      {/* Travi a vista (orizzontali/verticali) */}
      <mesh material={beamMat} castShadow position={[0, 0.4, 2.01]}>
        <boxGeometry args={[4.05, 0.2, 0.08]} />
      </mesh>
      <mesh material={beamMat} castShadow position={[0, 2.4, 2.01]}>
        <boxGeometry args={[4.05, 0.2, 0.08]} />
      </mesh>
      <mesh material={beamMat} castShadow position={[0, 1.4, 2.01]}>
        <boxGeometry args={[0.2, 2, 0.08]} />
      </mesh>
      <mesh
        material={beamMat}
        castShadow
        position={[1.5, 1.4, 2.01]}
        rotation={[0, 0, Math.PI / 6]}
      >
        <boxGeometry args={[0.18, 2.4, 0.08]} />
      </mesh>

      {/* Finestre */}
      <mesh material={windowMat} position={[-1.2, 1.6, 2.04]}>
        <boxGeometry args={[0.9, 0.9, 0.08]} />
      </mesh>
      <mesh material={windowMat} position={[1.2, 1.6, 2.04]}>
        <boxGeometry args={[0.9, 0.9, 0.08]} />
      </mesh>
      <mesh material={windowMat} position={[2.04, 1.6, 0]}>
        <boxGeometry args={[0.08, 0.9, 0.9]} />
      </mesh>

      {/* Porta */}
      <mesh material={beamMat} castShadow position={[0, 0.9, 2.05]}>
        <boxGeometry args={[1, 1.8, 0.1]} />
      </mesh>
      {accessible && (
        <mesh position={[0, 0.9, 2.11]} onClick={onEnter}>
          <boxGeometry args={[1, 1.8, 0.01]} />
          <meshStandardMaterial color="#ffaa00" transparent opacity={0.15} emissive="#ffaa00" emissiveIntensity={0.6} />
        </mesh>
      )}
    </>
  );
}

/**
 * Renders the straw pyramid roof mesh.
 * @param {Object} props
 * @param {THREE.Material} props.roofMat - Roof thatch material.
 * @returns {React.ReactElement}
 */
function HouseRoof({ roofMat }) {
  return (
    <mesh material={roofMat} castShadow position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[3.4, 1.8, 4]} />
    </mesh>
  );
}

/**
 * Renders the chimney stack and animated cloud particles rising from it.
 * @param {Object} props
 * @param {React.RefObject<THREE.Group>} props.smokeRef - Ref to the particle group.
 * @param {THREE.Material} props.beamMat - Chimney brick/wood material.
 * @returns {React.ReactElement}
 */
function ChimneySmoke({ smokeRef, beamMat }) {
  const particles = Array.from({ length: 5 });
  return (
    <>
      {/* Camino */}
      <mesh material={beamMat} castShadow position={[1.2, 3.8, -0.6]}>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
      </mesh>

      {/* Fumo dal camino */}
      <group ref={smokeRef} position={[1.2, 4.4, -0.6]}>
        {particles.map((_, i) => (
          <mesh key={`smoke-puff-${i}`} position={[0, i * 0.3, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshBasicMaterial color="#cccccc" transparent opacity={0.5 - i * 0.08} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/**
 * Single modular Medieval House component.
 * @param {Object} props
 * @param {number[]} props.position - 3D position [x, y, z].
 * @param {number} [props.rotation] - Y rotation.
 * @param {number} [props.scale] - Local scale.
 * @param {number} [props.variant] - Visual color variation.
 * @param {boolean} [props.isNight] - Is night cycle.
 * @param {boolean} [props.accessible] - Can the player click on this door.
 * @param {function(): void} [props.onEnter] - Interactive entry callback.
 * @returns {React.ReactElement}
 */
function House({
  position,
  rotation = 0,
  scale = 1,
  variant = 0,
  isNight = false,
  accessible = false,
  onEnter,
}) {
  const palette = [
    { wall: '#e9d5b2', beam: '#3b2818', roof: '#6e4a2a' },
    { wall: '#d8c19a', beam: '#2e1d12', roof: '#5a3a22' },
    { wall: '#c7ad84', beam: '#3a2616', roof: '#7a5230' },
    { wall: '#efe0c2', beam: '#241510', roof: '#8a5e36' },
  ];
  const c = palette[variant % palette.length];

  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: c.wall, roughness: 0.95 }),
    [c.wall]
  );
  const beamMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: c.beam, roughness: 0.9 }),
    [c.beam]
  );
  const roofMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: c.roof, roughness: 1 }),
    [c.roof]
  );
  const windowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isNight ? '#ffd07a' : '#3a4a55',
        emissive: isNight ? '#ffb547' : '#000000',
        emissiveIntensity: isNight ? 1.4 : 0,
        roughness: 0.4,
      }),
    [isNight]
  );

  const smokeRef = useRef();

  useFrame((state, dt) => {
    if (smokeRef.current) {
      smokeRef.current.children.forEach((p, i) => {
        p.position.y += dt * (0.3 + i * 0.04);
        p.position.x += Math.sin(state.clock.elapsedTime + i) * dt * 0.1;
        const s = p.scale.x + dt * 0.1;
        p.scale.set(s, s, s);
        if (p.material) {
          p.material.opacity -= dt * 0.18;
          if (p.material.opacity <= 0) {
            p.position.set(0, 0, 0);
            p.scale.set(0.3, 0.3, 0.3);
            p.material.opacity = 0.55;
          }
        }
      });
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <HouseWalls
        wallMat={wallMat}
        beamMat={beamMat}
        windowMat={windowMat}
        accessible={accessible}
        onEnter={onEnter}
      />
      <HouseRoof roofMat={roofMat} />
      <ChimneySmoke smokeRef={smokeRef} beamMat={beamMat} />
    </group>
  );
}

/**
 * Renders all medieval residential houses surrounding the village square.
 * @param {Object} props
 * @param {boolean} props.isNight - Night atmosphere state flag.
 * @param {function(number): void} [props.onEnterHouse] - Callback when an enterable door is clicked.
 * @returns {React.ReactElement}
 */
export default function Houses({ isNight, onEnterHouse }) {
  // Layout simmetrico ai bordi della piazza, lasciando spazio centrale per fontana
  const positions = [
    // Lato Mercato (alto)
    { p: [-22, 0, -22], r: Math.PI / 4, v: 0, acc: false },
    { p: [-12, 0, -26], r: Math.PI / 8, v: 1, acc: false },
    { p: [0, 0, -28], r: 0, v: 2, acc: false },
    { p: [12, 0, -26], r: -Math.PI / 8, v: 3, acc: false },
    { p: [22, 0, -22], r: -Math.PI / 4, v: 0, acc: false },

    // Lato Porta (basso)
    { p: [-22, 0, 22], r: (3 * Math.PI) / 4, v: 1, acc: false },
    { p: [-12, 0, 26], r: (7 * Math.PI) / 8, v: 2, acc: true }, // casa abitabile C
    { p: [12, 0, 26], r: -(7 * Math.PI) / 8, v: 3, acc: false },
    { p: [22, 0, 22], r: -(3 * Math.PI) / 4, v: 0, acc: false },

    // Laterali
    { p: [-28, 0, 0], r: Math.PI / 2, v: 2, acc: false },
    { p: [-28, 0, -12], r: Math.PI / 2, v: 3, acc: false },
    { p: [-28, 0, 12], r: Math.PI / 2, v: 1, acc: false },
    { p: [28, 0, -12], r: -Math.PI / 2, v: 0, acc: false },
    { p: [28, 0, 12], r: -Math.PI / 2, v: 2, acc: false },
  ];

  return (
    <group>
      {positions.map((h, i) => (
        <House
          key={`house-${h.p[0]}-${h.p[2]}`}
          position={h.p}
          rotation={h.r}
          variant={h.v}
          accessible={h.acc}
          isNight={isNight}
          scale={0.9 + (i % 3) * 0.08}
          onEnter={() => h.acc && onEnterHouse && onEnterHouse(i)}
        />
      ))}
    </group>
  );
}
