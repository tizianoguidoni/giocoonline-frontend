import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Generates a procedural cobblestone texture using HTML Canvas.
 * @returns {THREE.CanvasTexture} Procedural cobblestone canvas texture.
 */
function makeCobbleTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  // Base scura tra le pietre
  ctx.fillStyle = '#2a2620';
  ctx.fillRect(0, 0, size, size);

  // Pietre singole
  const stones = 90;
  for (let i = 0; i < stones; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 18 + Math.random() * 18;
    const g = 110 + Math.floor(Math.random() * 50);
    const tint = `rgb(${g}, ${g - 10}, ${g - 25})`;
    ctx.beginPath();
    ctx.fillStyle = tint;
    ctx.ellipse(x, y, r, r * (0.7 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();

    // ombra
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // riflesso
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.ellipse(x - r * 0.3, y - r * 0.4, r * 0.45, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // rumore sottile
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.anisotropy = 8;
  return tex;
}

/**
 * Generates a procedural grass texture using HTML Canvas.
 * @returns {THREE.CanvasTexture} Procedural grass canvas texture.
 */
function makeGrassTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(c);

  ctx.fillStyle = '#3d5a2a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const g = 60 + Math.floor(Math.random() * 80);
    ctx.fillStyle = `rgb(${g - 20}, ${g + 20}, ${g - 30})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(30, 30);
  return tex;
}

/**
 * Ground component rendering the square cobblestone paving and border grass.
 * @returns {React.ReactElement} Ground meshes.
 */
export default function Ground() {
  const cobble = useMemo(() => makeCobbleTexture(), []);
  const grass = useMemo(() => makeGrassTexture(), []);

  // Removed redundant useFrame callback entirely for optimization and lower complexity.

  return (
    <group>
      {/* Erba esterna (perimetro) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>

      {/* Piazza in sampietrini */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial map={cobble} roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  );
}
