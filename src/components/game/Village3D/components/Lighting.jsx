import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Torch component representing a street light post with animated flame meshes.
 * @param {Object} props
 * @param {number[]} props.position - 3D coordinates.
 * @returns {React.ReactElement}
 */
function Torch({ position }) {
  const flameRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (flameRef.current) {
      flameRef.current.scale.y = 1 + Math.sin(t * 14) * 0.15;
      flameRef.current.scale.x = 1 + Math.cos(t * 12) * 0.1;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 1.6 + Math.sin(t * 12) * 0.25;
    }
  });

  return (
    <group position={position}>
      {/* Palo */}
      <mesh castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 3.2, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.95} />
      </mesh>
      {/* Sostegno */}
      <mesh castShadow position={[0, 3.2, 0]}>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Fiamma */}
      <mesh ref={flameRef} position={[0, 3.55, 0]}>
        <coneGeometry args={[0.18, 0.5, 8]} />
        <meshBasicMaterial color="#ffb84a" />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshBasicMaterial color="#fff2a8" />
      </mesh>
      {/* Luce calda */}
      <pointLight
        ref={lightRef}
        position={[0, 3.5, 0]}
        color="#ffaa44"
        intensity={1.6}
        distance={12}
        decay={1.5}
        castShadow
      />
    </group>
  );
}

/**
 * Animated Clouds moving across the sky.
 * @param {Object} props
 * @param {boolean} props.visible - Day/Night visibility toggle.
 * @returns {React.ReactElement|null}
 */
function Clouds({ visible }) {
  const ref = useRef();
  useFrame((_state, dt) => {
    if (ref.current && visible) {
      ref.current.children.forEach((c, i) => {
        c.position.x += dt * (0.4 + i * 0.05);
        if (c.position.x > 80) {
          c.position.x = -80;
        }
      });
    }
  });
  if (!visible) return null;

  const cloudsArray = Array.from({ length: 7 });

  return (
    <group ref={ref} position={[0, 30, -20]}>
      {cloudsArray.map((_, i) => {
        const xOffset = -40 + i * 12;
        return (
          <group key={`cloud-offset-${xOffset}`} position={[xOffset, Math.random() * 6, Math.random() * 20 - 10]}>
            <mesh>
              <sphereGeometry args={[3, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
            <mesh position={[2.5, -0.3, 0]}>
              <sphereGeometry args={[2.4, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
            <mesh position={[-2.2, 0.2, 0]}>
              <sphereGeometry args={[2.2, 10, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Night starry points buffer generator.
 * @param {Object} props
 * @param {boolean} props.visible - Day/Night visibility flag.
 * @returns {React.ReactElement|null}
 */
function Stars({ visible }) {
  const points = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 350;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI * 0.5;
      const r = 80;
      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.cos(theta);
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);
  if (!visible) return null;
  return (
    <points geometry={points}>
      <pointsMaterial color="#ffffff" size={0.4} sizeAttenuation transparent opacity={0.95} />
    </points>
  );
}

/**
 * Sun and Moon visual sphere components.
 * @param {Object} props
 * @param {boolean} props.isNight - Current lighting state.
 * @param {number[]} props.sunPos - Calculated Sun coordinates [x, y, z].
 * @returns {React.ReactElement}
 */
function SunMoon({ isNight, sunPos }) {
  return (
    <>
      {isNight && (
        <mesh position={[40, 30, -30]}>
          <sphereGeometry args={[2.5, 24, 24]} />
          <meshBasicMaterial color="#fdf9e0" />
        </mesh>
      )}
      {!isNight && (
        <mesh position={sunPos}>
          <sphereGeometry args={[2.2, 24, 24]} />
          <meshBasicMaterial color="#ffea9c" />
        </mesh>
      )}
    </>
  );
}

/**
 * Interactive Day/Night lighting, atmospheric fog, and torch system.
 * @param {Object} props
 * @param {boolean} props.isNight - Night-time flag.
 * @param {number} [props.sunAngle] - Angle of the orbital light source.
 * @returns {React.ReactElement}
 */
export default function Lighting({ isNight, sunAngle = 0.6 }) {
  const sunPos = useMemo(() => {
    // Avoids local variables flagged by strict react-hooks/exhaustive-deps checkers
    return [Math.cos(sunAngle) * 40, Math.sin(sunAngle) * 35 + 5, 10];
  }, [sunAngle]);

  const torchPositions = [
    [-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8],
    [-20, 0, 0], [20, 0, 0], [0, 0, -20], [0, 0, 20],
  ];

  return (
    <>
      {/* Ambient */}
      <ambientLight intensity={isNight ? 0.18 : 0.55} color={isNight ? '#3a4a7a' : '#fff5e0'} />

      {/* Sole / Luna */}
      <directionalLight
        position={sunPos}
        intensity={isNight ? 0.4 : 1.6}
        color={isNight ? '#a8b8e8' : '#fff2c8'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-far={150}
      />

      {/* Hemisphere per simulare luce ambientale del cielo */}
      <hemisphereLight
        args={[isNight ? '#243a6a' : '#cfeaff', isNight ? '#0a0a1a' : '#5a4a35', isNight ? 0.25 : 0.45]}
      />

      <SunMoon isNight={isNight} sunPos={sunPos} />

      <Clouds visible={!isNight} />
      <Stars visible={isNight} />

      {/* Torce/lampioni: accese solo di notte */}
      {isNight &&
        torchPositions.map((p) => (
          <Torch key={`torch-${p[0]}-${p[2]}`} position={p} />
        ))}

      {/* Fog atmosferica */}
      <fog attach="fog" args={[isNight ? '#0a1228' : '#cfe0f0', 50, 130]} />
    </>
  );
}
