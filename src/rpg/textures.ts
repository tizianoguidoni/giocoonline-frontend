import * as THREE from "three";

/**
 * RPG Texture Generator
 * Generates procedural textures via Canvas API with noise and flat-shading optimizations.
 */

function makeCanvas(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function addNoise(ctx: CanvasRenderingContext2D, size: number, amount: number = 20) {
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * amount;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);
}

function finalize(canvas: HTMLCanvasElement, repeat: number = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

export function stoneBrickTexture(repeat = 1): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#4a4540"; // Base mortar
  ctx.fillRect(0, 0, 256, 256);

  const bh = 32, bw = 64;
  for (let y = 0; y < 256; y += bh) {
    const offset = (y / bh % 2) * (bw / 2);
    for (let x = -bw; x < 256; x += bw) {
      const rx = x + offset;
      const shade = 60 + Math.random() * 40;
      ctx.fillStyle = `rgb(${shade},${shade - 5},${shade - 10})`;
      ctx.fillRect(rx + 2, y + 2, bw - 4, bh - 4);
      
      // Highlights & Shadows
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(rx + 2, y + 2, bw - 4, 4);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(rx + 2, y + bh - 6, bw - 4, 4);
    }
  }
  addNoise(ctx, 256);
  return finalize(canvas, repeat);
}

export function cobbleTexture(repeat = 1): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 10 + Math.random() * 20;
    const v = 50 + Math.random() * 50;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  addNoise(ctx, 256);
  return finalize(canvas, repeat);
}

export function woodPlankTexture(repeat = 1, dark = false): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  const ph = 42;
  ctx.fillStyle = "#1a0f0a";
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += ph) {
    const v = dark ? (20 + Math.random() * 20) : (60 + Math.random() * 40);
    ctx.fillStyle = `rgb(${v},${v * 0.7 | 0},${v * 0.4 | 0})`;
    ctx.fillRect(0, y + 1, 256, ph - 2);

    // Bezier veins
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * ph);
      ctx.bezierCurveTo(85, y + Math.random() * ph, 170, y + Math.random() * ph, 256, y + Math.random() * ph);
      ctx.stroke();
    }
  }
  addNoise(ctx, 256);
  return finalize(canvas, repeat);
}

export function darkWoodTexture(repeat = 1): THREE.CanvasTexture {
  return woodPlankTexture(repeat, true);
}

export function plasterTexture(repeat = 1): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#d2c5b0");
  grad.addColorStop(1, "#bba58d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Cracks
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let x = Math.random() * 256, y = Math.random() * 256;
    ctx.moveTo(x, y);
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  addNoise(ctx, 256, 15);
  return finalize(canvas, repeat);
}

export function dirtTexture(repeat = 1): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256);
  ctx.fillStyle = "#1a2610"; // Dark green/dirt
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const v = 30 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v * 0.8 | 0},${v | 0},${v * 0.5 | 0}, 0.6)`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  addNoise(ctx, 256, 30);
  return finalize(canvas, repeat);
}
