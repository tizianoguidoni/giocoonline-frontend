import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

/**
 * Renders the stone basin base structure of the fountain.
 * @param {Object} props
 * @param {THREE.Material} props.stoneMaterial - Paving light stone material.
 * @param {THREE.Material} props.darkStone - Secondary dark border material.
 * @returns {React.ReactElement}
 */
function FountainBasin({ stoneMaterial, darkStone }) {
  return (
    <>
      {/* Vasca ottagonale esterna */}
      <mesh material={stoneMaterial} castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 1, 8]} />
      </mesh>
      {/* Bordo */}
      <mesh material={darkStone} castShadow receiveShadow position={[0, 1, 0]}>
        <torusGeometry args={[3.0, 0.18, 12, 8]} />
      </mesh>
    </>
  );
}

/**
 * Renders the custom animated circular water surface mesh.
 * @param {Object} props
 * @param {React.RefObject<THREE.Mesh>} props.waterRef - Ref to the water surface mesh.
 * @param {Object} props.waterUniforms - Custom uniforms for the water shader.
 * @returns {React.ReactElement}
 */
function FountainWater({ waterRef, waterUniforms }) {
  return (
    <mesh
      ref={waterRef}
      position={[0, 1.02, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[2.95, 64]} />
      <shaderMaterial
        transparent
        uniforms={waterUniforms}
        vertexShader={`
          varying vec2 vUv;
          varying float vWave;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 p = position;
            float w = sin((p.x + uTime) * 4.0) * 0.03 + cos((p.y + uTime * 0.8) * 3.5) * 0.03;
            p.z += w;
            vWave = w;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          varying float vWave;
          uniform vec3 uColor;
          uniform float uTime;
          void main() {
            float d = distance(vUv, vec2(0.5)) * 2.0;
            float highlight = smoothstep(0.4, 0.8, 1.0 - d) * 0.5;
            vec3 base = mix(uColor * 0.6, uColor, 1.0 - d);
            base += vWave * 6.0;
            base += highlight * vec3(0.3, 0.5, 0.6);
            gl_FragColor = vec4(base, 0.88);
          }
        `}
      />
    </mesh>
  );
}

/**
 * Renders the central stone spout columns and sphere.
 * @param {Object} props
 * @param {THREE.Material} props.stoneMaterial - Primary material.
 * @param {THREE.Material} props.darkStone - Secondary material.
 * @returns {React.ReactElement}
 */
function FountainSpout({ stoneMaterial, darkStone }) {
  return (
    <>
      {/* Colonna centrale */}
      <mesh material={stoneMaterial} castShadow position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 1.2, 12]} />
      </mesh>
      <mesh material={darkStone} castShadow position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.9, 0.7, 0.2, 12]} />
      </mesh>
      <mesh material={stoneMaterial} castShadow position={[0, 2.6, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
      </mesh>
    </>
  );
}

/**
 * Renders the animated rising water droplets/particles.
 * @param {Object} props
 * @param {React.RefObject<THREE.Points>} props.dropletsRef - Ref to points.
 * @param {THREE.BufferGeometry} props.dropletGeo - Procedural coordinates buffer.
 * @returns {React.ReactElement}
 */
function WaterParticles({ dropletsRef, dropletGeo }) {
  return (
    <points ref={dropletsRef} geometry={dropletGeo}>
      <pointsMaterial
        color="#9ad8ee"
        size={0.08}
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Central stone fountain with highly responsive, animated water vertex shaders.
 * @param {Object} props
 * @param {number[]} [props.position] - 3D coordinates.
 * @returns {React.ReactElement}
 */
export default function Fountain({ position = [0, 0, 0] }) {
  const waterRef = useRef();
  const dropletsRef = useRef();

  const stoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9a9088',
        roughness: 0.88,
        metalness: 0.05,
      }),
    []
  );

  const darkStone = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6b665e',
        roughness: 0.9,
      }),
    []
  );

  // Acqua: shader semplice basato su seno per onde + colore blu traslucido
  const waterUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#3aa0c8') },
    }),
    []
  );

  useFrame((_state, dt) => {
    waterUniforms.uTime.value += dt;
    if (waterRef.current) {
      waterRef.current.material.uniforms.uTime.value = waterUniforms.uTime.value;
    }
    if (dropletsRef.current) {
      const positions = dropletsRef.current.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += dt * 1.4;
        if (y > 3.2) {
          y = 1.6;
          positions.setX(i, (Math.random() - 0.5) * 0.4);
          positions.setZ(i, (Math.random() - 0.5) * 0.4);
        }
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  const dropletGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 60;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 0.4;
      arr[i * 3 + 1] = 1.6 + Math.random() * 1.6;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geo;
  }, []);

  return (
    <group position={position}>
      <FountainBasin stoneMaterial={stoneMaterial} darkStone={darkStone} />

      <FountainWater waterRef={waterRef} waterUniforms={waterUniforms} />

      <FountainSpout stoneMaterial={stoneMaterial} darkStone={darkStone} />

      <WaterParticles dropletsRef={dropletsRef} dropletGeo={dropletGeo} />
    </group>
  );
}
