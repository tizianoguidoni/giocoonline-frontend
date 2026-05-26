import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Tree component rendering trunk and polygonal foliage.
 * @param {Object} props
 * @param {number[]} props.position - 3D position [x, y, z].
 * @param {number} [props.scale] - Local scale.
 * @returns {React.ReactElement}
 */
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Tronco */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 3, 8]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.95} />
      </mesh>
      {/* Chioma (3 sfere irregolari) */}
      <mesh castShadow position={[0, 3.4, 0]}>
        <sphereGeometry args={[1.4, 12, 10]} />
        <meshStandardMaterial color="#3a6a2a" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.6, 3.7, 0.4]}>
        <sphereGeometry args={[0.9, 10, 8]} />
        <meshStandardMaterial color="#4a7a35" roughness={1} />
      </mesh>
      <mesh castShadow position={[-0.5, 3.5, -0.3]}>
        <sphereGeometry args={[0.8, 10, 8]} />
        <meshStandardMaterial color="#2f5a22" roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * Bush component rendering low-poly vegetation layers.
 * @param {Object} props
 * @param {number[]} props.position - 3D position [x, y, z].
 * @param {number} [props.scale] - Local scale.
 * @returns {React.ReactElement}
 */
function Bush({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.7, 10, 8]} />
        <meshStandardMaterial color="#3a6a2a" roughness={1} />
      </mesh>
      <mesh castShadow position={[0.4, 0.1, 0.2]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#4a7a35" roughness={1} />
      </mesh>
      <mesh castShadow position={[-0.3, 0.05, 0.3]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshStandardMaterial color="#2f5a22" roughness={1} />
      </mesh>
    </group>
  );
}

/**
 * FlowerBed component rendering circular soil basin and individual flowers.
 * @param {Object} props
 * @param {number[]} props.position - 3D coordinates.
 * @returns {React.ReactElement}
 */
function FlowerBed({ position }) {
  const colors = ['#e74c3c', '#f1c40f', '#9b59b6', '#ecf0f1'];
  const flowerIndices = Array.from({ length: 8 });

  return (
    <group position={position}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 12]} />
        <meshStandardMaterial color="#5a3a25" roughness={1} />
      </mesh>
      {flowerIndices.map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.7;
        const flowerX = Math.cos(a) * r;
        const flowerZ = Math.sin(a) * r;
        return (
          <group key={`flower-${flowerX.toFixed(2)}-${flowerZ.toFixed(2)}`} position={[flowerX, 0.25, flowerZ]}>
            <mesh>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
              <meshStandardMaterial color="#2a6a2a" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color={colors[i % colors.length]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Trees component rendering the full collection of environmental vegetation.
 * @returns {React.ReactElement} Main vegetation group.
 */
export default function Trees() {
  const positions = useMemo(() => {
    const tree = [
      [-18, 0, -8], [18, 0, -8], [-18, 0, 8], [18, 0, 8],
      [-8, 0, -18], [8, 0, -18], [-8, 0, 18], [8, 0, 18],
      [-25, 0, 0], [25, 0, 0], [0, 0, -32], [0, 0, 32],
    ];
    return tree;
  }, []);

  const bushes = useMemo(() => {
    return [
      [-6, 0, 0], [6, 0, 0], [0, 0, -6], [0, 0, 6],
      [-14, 0, -3], [14, 0, 3], [-3, 0, -14], [3, 0, 14],
    ];
  }, []);

  const flowerBeds = useMemo(() => {
    return [
      [-6, 0, -6], [6, 0, -6], [-6, 0, 6], [6, 0, 6],
    ];
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <Tree key={`tree-${p[0]}-${p[2]}`} position={p} scale={0.9 + (i % 3) * 0.15} />
      ))}
      {bushes.map((p, i) => (
        <Bush key={`bush-${p[0]}-${p[2]}`} position={p} scale={0.9 + (i % 2) * 0.2} />
      ))}
      {flowerBeds.map((p) => (
        <FlowerBed key={`flowerbed-${p[0]}-${p[2]}`} position={p} />
      ))}
    </group>
  );
}
