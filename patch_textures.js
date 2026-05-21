const fs = require('fs');
const filepath = 'src/game/textures.js';
let code = fs.readFileSync(filepath, 'utf8');

const replacement = `// --- Wall textures per zone ---

export function dungeonWallTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#2c2522'; ctx.fillRect(0, 0, 256, 256);
  // stone blocks
  for (let r = 0; r < 8; r++) {
    for (let co = 0; co < 8; co++) {
      const v = 30 + Math.random() * 20;
      ctx.fillStyle = \`rgb(\${v + 10 | 0},\${v | 0},\${v - 5 | 0})\`;
      const offset = (r % 2 === 0) ? 0 : 16;
      ctx.fillRect(co * 32 - offset + 1, r * 32 + 1, 30, 30);
    }
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = \`rgba(10, 20, 10, \${Math.random() * 0.5})\`;
    ctx.beginPath();
    ctx.arc(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalize(c, { repeat: 2 });
}

export function gardenWallTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#1e2b18'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1000; i++) {
    const gr = 40 + Math.random() * 60;
    ctx.fillStyle = \`rgba(\${gr * 0.4 | 0}, \${gr | 0}, \${gr * 0.3 | 0}, 0.8)\`;
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 2 + Math.random() * 4, 4 + Math.random() * 8, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finalize(c, { repeat: 2 });
}

export function catacombsWallTexture() {
  const { c, ctx } = makeCanvas(256);
  ctx.fillStyle = '#2a2420'; ctx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 10; r++) {
    for (let co = 0; co < 10; co++) {
      const v = 40 + Math.random() * 15;
      ctx.fillStyle = \`rgb(\${v | 0},\${v - 5 | 0},\${v - 10 | 0})\`;
      const offset = (r % 2 === 0) ? 0 : 12;
      ctx.fillRect(co * 25 - offset + 1, r * 25 + 1, 23, 23);
    }
  }
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = \`rgba(200, 190, 170, 0.7)\`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 1 + Math.random() * 2);
  }
  return finalize(c, { repeat: 2 });
}

export function genericCeilingTexture() {`;

code = code.replace(/\/\/ --- Wall textures per zone ---[\s\S]*?export function genericCeilingTexture\(\) \{/, replacement);

fs.writeFileSync(filepath, code);
console.log('Patched textures.js');
