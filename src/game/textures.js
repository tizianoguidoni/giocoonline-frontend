// Procedural textures via Canvas. No external assets — perfect for a dark fantasy aesthetic.
// Each zone gets its own wall/floor pattern.

import * as THREE from 'three';

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
  const { c, ctx } = makeCanvas(256);
  // base mortar
  ctx.fillStyle = '#2a1d1a'; ctx.fillRect(0, 0, 256, 256);
  // bricks
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const off = row % 2 === 0 ? 0 : 16;
      const x = col * 32 - off;
      const y = row * 32;
      const b = 30 + Math.random() * 25;
      ctx.fillStyle = `rgb(${60 + b | 0},${38 + b / 2 | 0},${34 + b / 3 | 0})`;
      ctx.fillRect(x + 1, y + 1, 30, 30);
      // weathering
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
      ctx.fillRect(x + Math.random() * 20, y + Math.random() * 20, Math.random() * 10, Math.random() * 6);
    }
  }
  // rune scratches
  ctx.strokeStyle = 'rgba(255,100,30,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 256, Math.random() * 256);
    ctx.lineTo(Math.random() * 256, Math.random() * 256);
    ctx.stroke();
  }
  return finalize(c, { repeat: 1 });
}

export function gardenWallTexture() {
  const { c, ctx } = makeCanvas(256);
  // stone
  ctx.fillStyle = '#3a4a2a'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    const r = 50 + Math.random() * 40;
    const g = 70 + Math.random() * 40;
    const b = 40 + Math.random() * 30;
    ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${0.3 + Math.random() * 0.5})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 6, 2 + Math.random() * 6);
  }
  // moss/ivy
  ctx.fillStyle = 'rgba(30,80,40,0.6)';
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  // cracks
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    let x = Math.random() * 256, y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return finalize(c, { repeat: 1 });
}

export function catacombsWallTexture() {
  const { c, ctx } = makeCanvas(256);
  // sand-stone
  ctx.fillStyle = '#4a3828'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 800; i++) {
    const v = 80 + Math.random() * 60;
    ctx.fillStyle = `rgba(${v | 0},${(v - 20) | 0},${(v - 40) | 0},${Math.random() * 0.6})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  // bone etchings
  ctx.strokeStyle = 'rgba(220,200,170,0.35)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    const cx = Math.random() * 256, cy = Math.random() * 256;
    ctx.beginPath();
    ctx.arc(cx, cy, 8 + Math.random() * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 18);
    ctx.stroke();
  }
  return finalize(c, { repeat: 1 });
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
    dungeon:   { wall: dungeonWallTexture(),   floor: dungeonFloorTexture() },
    garden:    { wall: gardenWallTexture(),    floor: gardenFloorTexture() },
    catacombs: { wall: catacombsWallTexture(), floor: catacombsFloorTexture() },
    abyss:     { wall: abyssWallTexture(),     floor: abyssFloorTexture() },
  };
}
