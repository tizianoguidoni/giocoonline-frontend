import React from 'react';

/**
 * Single Bench component.
 * @param {Object} props
 * @param {number[]} props.position - 3D position [x, y, z] of the bench.
 * @param {number} [props.rotation] - Rotation around Y axis in radians.
 * @returns {React.ReactElement} Bench mesh structure.
 */
function Bench({ position, rotation = 0 }) {
  const legsOffset = [-0.8, 0.8];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seduta */}
      <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[1.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#6a4525" roughness={0.95} />
      </mesh>
      {/* Schienale */}
      <mesh castShadow position={[0, 0.85, -0.2]}>
        <boxGeometry args={[1.8, 0.6, 0.06]} />
        <meshStandardMaterial color="#6a4525" roughness={0.95} />
      </mesh>
      {/* Gambe */}
      {legsOffset.map((x) => (
        <mesh key={`bench-leg-${x}`} castShadow position={[x, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.45, 0.45]} />
          <meshStandardMaterial color="#3a2515" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Group of wooden benches placed around the fountain.
 * @returns {React.ReactElement} Combined benches meshes.
 */
export default function Benches() {
  /**
   * @typedef {Object} BenchData
   * @property {number[]} p - Position.
   * @property {number} r - Rotation.
   */
  /** @type {BenchData[]} */
  const benches = [
    { p: [-5, 0, 0], r: Math.PI / 2 },
    { p: [5, 0, 0], r: -Math.PI / 2 },
    { p: [0, 0, -5], r: 0 },
    { p: [0, 0, 5], r: Math.PI },
    { p: [-5, 0, -5], r: Math.PI / 4 },
    { p: [5, 0, 5], r: -(3 * Math.PI) / 4 },
  ];
  return (
    <group>
      {benches.map((b) => (
        <Bench key={`bench-${b.p[0]}-${b.p[2]}`} position={b.p} rotation={b.r} />
      ))}
    </group>
  );
}
