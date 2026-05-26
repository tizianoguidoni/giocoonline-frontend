// Procedural textures via Canvas. No external assets — perfect for a dark fantasy aesthetic.
// Each zone gets its own wall/floor pattern.
// Wall textures are now FULLY PROCEDURAL to avoid white walls when PNG files fail to load.

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

// --- Wall textures per zone (100% procedural — no external files needed) ---

export function dungeonWallTexture() {
  // Stone blocks with cracks and grime — dark dungeon look
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1a1210'; ctx.fillRect(0, 0, 256, 256);
  // Stone block grid
  const bw = 64, bh = 48;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      const offset = (row % 2) * 32;
      const v = 28 + Math.random() * 18;
      const r = v + 4, g = v - 2, b = v - 4;
      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
      ctx.fillRect(col * bw + offset, row * bh + 2, bw - 3, bh - 3);
      // Inner shadow
      ctx.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.3})`;
      ctx.fillRect(col * bw + offset + 1, row * bh + 3, bw - 5, 4);
    }
  }
  // Crack lines
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    let x = Math.random() * 256, y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) { x += (Math.random()-0.5)*20; y += Math.random()*12; ctx.lineTo(x,y); }
    ctx.stroke();
  }
  // Moss/grime spots
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = `rgba(${20+Math.random()*15|0},${35+Math.random()*20|0},${15+Math.random()*10|0},${0.3+Math.random()*0.4})`;
    ctx.beginPath(); ctx.arc(Math.random()*256, Math.random()*256, 3+Math.random()*8, 0, Math.PI*2); ctx.fill();
  }
  return finalize(c, { repeat: 1 });
}

export function gardenWallTexture() {
  // Hedge / overgrown stone wall
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1a2010'; ctx.fillRect(0, 0, 256, 256);
  // Base stone
  for (let i = 0; i < 120; i++) {
    const v = 22 + Math.random() * 18;
    ctx.fillStyle = `rgba(${v*0.7|0},${v*0.9|0},${v*0.5|0},${0.6+Math.random()*0.3})`;
    ctx.fillRect(Math.random()*256, Math.random()*256, 4+Math.random()*10, 4+Math.random()*8);
  }
  // Green ivy patches
  for (let i = 0; i < 200; i++) {
    const gr = 50 + Math.random() * 60;
    ctx.fillStyle = `rgba(${gr*0.3|0},${gr|0},${gr*0.25|0},${0.5+Math.random()*0.5})`;
    ctx.fillRect(Math.random()*256, Math.random()*256, 2, 3+Math.random()*6);
  }
  // Flowers
  for (let i = 0; i < 15; i++) {
    ctx.fillStyle = `rgba(${200+Math.random()*55|0},${100+Math.random()*80|0},${50+Math.random()*50|0},0.8)`;
    ctx.beginPath(); ctx.arc(Math.random()*256, Math.random()*256, 2+Math.random()*3, 0, Math.PI*2); ctx.fill();
  }
  return finalize(c, { repeat: 1 });
}

export function catacombsWallTexture() {
  // Aged brick — dark red/brown
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#0e0a08'; ctx.fillRect(0, 0, 256, 256);
  // Brick rows
  const bw = 52, bh = 28;
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 6; col++) {
      const offset = (row % 2) * 26;
      const v = 55 + Math.random() * 30;
      ctx.fillStyle = `rgb(${v|0},${v*0.38|0},${v*0.22|0})`;
      ctx.fillRect(col * bw + offset, row * bh + 2, bw - 4, bh - 4);
      // Mortar shadow
      ctx.fillStyle = `rgba(0,0,0,${0.25+Math.random()*0.2})`;
      ctx.fillRect(col * bw + offset, row * bh + bh - 5, bw - 4, 4);
    }
  }
  // Dark stains
  for (let i = 0; i < 20; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.3+Math.random()*0.4})`;
    ctx.beginPath(); ctx.arc(Math.random()*256, Math.random()*256, 5+Math.random()*15, 0, Math.PI*2); ctx.fill();
  }
  // Bone dust / pale speckles
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(180,160,130,${Math.random()*0.3})`;
    ctx.fillRect(Math.random()*256, Math.random()*256, 1, 1);
  }
  return finalize(c, { repeat: 1 });
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
