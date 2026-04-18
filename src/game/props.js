// Decorative ambient props scattered in each zone. Also zone-specific enemy skins.

import * as THREE from 'three';

// --- Torches on dungeon walls ---
// PERF: only the first few torches get a point light; rest are emissive-only.
let _torchLightBudget = 6;
export function resetTorchLightBudget(n = 6) { _torchLightBudget = n; }

export function spawnTorch(scene, pos, rot = 0) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a1a10, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), woodMat);
  base.position.y = 0.2;
  const holder = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 10, Math.PI), new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.4, metalness: 0.8 }));
  holder.position.y = 0.42; holder.rotation.x = Math.PI / 2;

  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xff9040, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 6), flameMat);
  flame.position.y = 0.58;
  group.add(base, holder, flame);

  // Only budget-limited torches get a dynamic light
  if (_torchLightBudget > 0) {
    const light = new THREE.PointLight(0xff9040, 1.8, 5);
    light.position.y = 0.6;
    group.add(light);
    group.userData.light = light;
    _torchLightBudget--;
  }

  group.position.copy(pos);
  group.rotation.y = rot;
  group.userData.flame = flame;
  group.userData.flickerTime = Math.random() * 10;
  scene.add(group);
  return group;
}

// --- Tree (dead gnarled tree for garden) ---
export function spawnDeadTree(scene, pos) {
  const group = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x2a1610, roughness: 0.95 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.5, 6), barkMat);
  trunk.position.y = 1.25;
  group.add(trunk);

  for (let i = 0; i < 5; i++) {
    const len = 0.6 + Math.random() * 0.8;
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, len, 5), barkMat);
    const a = Math.random() * Math.PI * 2;
    branch.position.set(Math.cos(a) * 0.15, 1.8 + Math.random() * 0.6, Math.sin(a) * 0.15);
    branch.rotation.z = (Math.random() - 0.5) * 1.4;
    branch.rotation.x = (Math.random() - 0.5) * 1.2;
    group.add(branch);
  }

  group.position.copy(pos);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
  return group;
}

// --- Grass tuft (small decorative) ---
export function spawnGrassTuft(scene, pos) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4a7030, roughness: 0.9, side: THREE.DoubleSide,
    emissive: 0x102010, emissiveIntensity: 0.2,
  });
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.25), mat);
    blade.position.y = 0.12;
    blade.rotation.y = i * (Math.PI / 3);
    group.add(blade);
  }
  group.position.copy(pos);
  scene.add(group);
  return group;
}

// --- Skull pile for catacombs ---
export function spawnSkullPile(scene, pos) {
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xc4b090, roughness: 0.7 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.9 });
  const group = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), boneMat);
    skull.position.set((Math.random() - 0.5) * 0.3, 0.12 + i * 0.08, (Math.random() - 0.5) * 0.3);
    // eye sockets (black dots)
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 4, 4), darkMat);
    const eyeR = eyeL.clone();
    eyeL.position.set(-0.04, 0.02, 0.1); eyeR.position.set(0.04, 0.02, 0.1);
    skull.add(eyeL, eyeR);
    group.add(skull);
  }
  group.position.copy(pos);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
  return group;
}

// --- Floating crystal for abyss (NO point light — emissive only for perf) ---
export function spawnCrystal(scene, pos) {
  const color = [0x8040ff, 0xff4080, 0x40c0ff][Math.floor(Math.random() * 3)];
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.1, metalness: 0.1,
    emissive: color, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.85,
  });
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
  crystal.position.copy(pos);
  crystal.position.y += 0.3 + Math.random() * 0.6;
  crystal.userData.floatTime = Math.random() * 10;
  crystal.userData.baseY = crystal.position.y;
  scene.add(crystal);
  return crystal;
}

// --- Column/pillar for dungeon boss room ---
export function spawnPillar(scene, pos) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x201814, roughness: 0.9 });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 3.0, 8), mat);
  col.position.copy(pos); col.position.y = 1.5;
  scene.add(col);
  return col;
}

// --- Animate ambient props each frame ---
export function updateProps(props, dt, time) {
  for (const p of props) {
    if (p.userData.flame) {
      p.userData.flickerTime += dt * 25;
      const f = 1 + Math.sin(p.userData.flickerTime) * 0.15 + Math.random() * 0.1;
      p.userData.flame.scale.y = f;
      if (p.userData.light) {
        p.userData.light.intensity = 1.5 + Math.sin(p.userData.flickerTime * 0.7) * 0.5;
      }
    }
    if (p.userData.baseY !== undefined) {
      p.userData.floatTime += dt;
      p.position.y = p.userData.baseY + Math.sin(p.userData.floatTime * 1.5) * 0.25;
      p.rotation.y += dt * 0.6;
      p.rotation.x += dt * 0.3;
    }
  }
}

// ---- Enemy skins per zone ----
// Returns color+eye config for an enemy spawned in a given zone.
export function enemySkinForZone(zoneId) {
  switch (zoneId) {
    case 'dungeon':   return { name: 'Orco',      color: 0x5a3020, eye: 0xff4020 };
    case 'garden':    return { name: 'Goblin',    color: 0x305a28, eye: 0xfff020 };
    case 'catacombs': return { name: 'Scheletro', color: 0xa08870, eye: 0x40ffff };
    case 'abyss':     return { name: 'Demone',    color: 0x4a1030, eye: 0xc040ff };
    default:          return { name: 'Nemico',    color: 0x8a1020, eye: 0xff3030 };
  }
}
