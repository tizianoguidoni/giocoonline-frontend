// Procedural textures via Canvas. No external assets — perfect for a dark fantasy aesthetic.
// Each zone gets its own wall/floor pattern.

import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function makeCanvas(size = 256) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  return { c, ctx: c.getContext('2d') };
}

function finalize(c, opts = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(opts.repeat || 1, opts.repeat || 1);
  tex.anisotropy = 4;
  return tex;
}

// --- Wall textures per zone ---

export function dungeonWallTexture() {
  // Use the real rock texture generated
  const tex = loader.load('/textures/maze/rock_wall.png');
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function gardenWallTexture() {
  const tex = loader.load('/textures/maze/hedge_wall.png');
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function catacombsWallTexture() {
  const tex = loader.load('/textures/maze/brick_wall.png');
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function genericCeilingTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#0a080a'; ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#1a181a';
  for (let i = 0; i < 1000; i++) {
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2);
  }
  return finalize(c, { repeat: 2 });
}

export function abyssWallTexture() {
  const { c, ctx } = makeCanvas(256);
  // void with glow veins
  ctx.fillStyle = '#0a0520'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 300; i++) {
    const alpha = Math.random() * 0.5;
    ctx.fillStyle = `rgba(80,40,180,${alpha})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  // glowing runes
  ctx.strokeStyle = 'rgba(180,100,255,0.55)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const cx = Math.random() * 256, cy = Math.random() * 256;
    ctx.beginPath();
    for (let j = 0; j < 6; j++) {
      const a = (j / 6) * Math.PI * 2;
      const r = 6 + Math.random() * 5;
      const xx = cx + Math.cos(a) * r, yy = cy + Math.sin(a) * r;
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.closePath();
    ctx.stroke();
  }
  return finalize(c, { repeat: 1 });
}

// --- Floor textures per zone ---

export function dungeonFloorTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1a120e'; ctx.fillRect(0, 0, 256, 256);
  // stone tiles
  for (let r = 0; r < 4; r++) {
    for (let co = 0; co < 4; co++) {
      const v = 25 + Math.random() * 20;
      ctx.fillStyle = `rgb(${v + 5 | 0},${v - 4 | 0},${v - 6 | 0})`;
      ctx.fillRect(co * 64 + 2, r * 64 + 2, 60, 60);
    }
  }
  // grime
  for (let i = 0; i < 50; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalize(c, { repeat: 1 });
}

export function gardenFloorTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1a2614'; ctx.fillRect(0, 0, 256, 256);
  // grass patches
  for (let i = 0; i < 500; i++) {
    const gr = 60 + Math.random() * 50;
    ctx.fillStyle = `rgba(${gr * 0.5 | 0},${gr | 0},${gr * 0.4 | 0},${Math.random() * 0.8})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 2 + Math.random() * 4);
  }
  // stone path fragments
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(100,90,80,${0.4 + Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalize(c, { repeat: 1 });
}

export function catacombsFloorTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1c1814'; ctx.fillRect(0, 0, 256, 256);
  // stone + bone fragments
  for (let i = 0; i < 200; i++) {
    const v = 30 + Math.random() * 25;
    ctx.fillStyle = `rgba(${v | 0},${v - 5 | 0},${v - 10 | 0},${0.8})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 4, 3 + Math.random() * 4);
  }
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(200,180,150,${0.3 + Math.random() * 0.3})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 6 + Math.random() * 8);
  }
  return finalize(c, { repeat: 1 });
}

export function abyssFloorTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#050220'; ctx.fillRect(0, 0, 256, 256);
  // star dust
  for (let i = 0; i < 150; i++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 100 | 0},${80 + Math.random() * 80 | 0},255,${Math.random() * 0.7})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }
  // crystal veins
  ctx.strokeStyle = 'rgba(150,80,255,0.3)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    let x = Math.random() * 256, y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return finalize(c, { repeat: 1 });
}

// Compile all textures on demand (once per game)
export function buildZoneTextures() {
  return {
    dungeon:   { wall: dungeonWallTexture(),   floor: dungeonFloorTexture(),   ceil: genericCeilingTexture() },
    garden:    { wall: gardenWallTexture(),    floor: gardenFloorTexture(),    ceil: genericCeilingTexture() },
    catacombs: { wall: catacombsWallTexture(), floor: catacombsFloorTexture(), ceil: genericCeilingTexture() },
    abyss:     { wall: abyssWallTexture(),     floor: abyssFloorTexture(),     ceil: genericCeilingTexture() },
  };
}
