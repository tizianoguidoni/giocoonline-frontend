// World builder: turns the maze grid into Three.js meshes.
// Also builds floor, ceiling, doors and zone-specific visuals.

import * as THREE from 'three';
import { CELL, CELL_SIZE, cellToWorld } from './maze';
import { ZONES, zoneForCell } from './zones';
import { buildZoneTextures } from './textures';
import { spawnTorch, spawnDeadTree, spawnGrassTuft, spawnSkullPile, spawnCrystal, spawnPillar, resetTorchLightBudget } from './props';

export class World {
  constructor(scene, mazeData) {
    this.scene = scene;
    this.maze = mazeData;
    this.textures = buildZoneTextures();

    this.wallMeshes = [];   // for collisions & raycast
    this.doorMeshes = [];   // { mesh, cellX, cellY, keyId, opened, type }
    this.keyPickups = [];
    this.gemPickups = [];
    this.moneyPickups = [];
    this.props = [];

    this._build();
  }

  _wallMaterialForZone(zone) {
    const tex = this.textures[zone.id]?.wall;
    return new THREE.MeshStandardMaterial({
      color: zone.wallColor,
      map: tex,
      roughness: 0.92,
      metalness: 0.08,
      emissive: zone.wallColor,
      emissiveIntensity: 0.05,
    });
  }

  _build() {
    const { grid, width, height } = this.maze;
    const CEILING_H = 3.0;

    // merge walls per zone for perf
    const zoneBuckets = {};
    for (const z of Object.values(ZONES)) {
      zoneBuckets[z.id] = { positions: [], zone: z };
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === CELL.WALL) {
          const wp = cellToWorld(x, y, grid);
          const zone = zoneForCell(x, y, width, height);
          // outdoor zones = shorter walls (like hedge-maze ruins)
          const wallY = zone.outdoor ? (CEILING_H * 0.85) : CEILING_H;
          zoneBuckets[zone.id].positions.push({ x: wp.x, y: wallY / 2, z: wp.z, h: wallY });
        }
      }
    }

    // Shared invisible material for collision meshes (perf optimization)
    const invisibleMat = new THREE.MeshBasicMaterial({ visible: false });

    for (const bucketId in zoneBuckets) {
      const { positions, zone } = zoneBuckets[bucketId];
      if (positions.length === 0) continue;

      const wallH = zone.outdoor ? CEILING_H * 0.85 : CEILING_H;
      const geo = new THREE.BoxGeometry(CELL_SIZE, wallH, CELL_SIZE);
      const mat = this._wallMaterialForZone(zone);
      const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Collision meshes (invisible) — full height, shared material
      const colGeo = new THREE.BoxGeometry(CELL_SIZE, CEILING_H, CELL_SIZE);
      for (const p of positions) {
        const colMesh = new THREE.Mesh(colGeo, invisibleMat);
        colMesh.position.set(p.x, CEILING_H / 2, p.z);
        colMesh.userData.halfX = CELL_SIZE / 2;
        colMesh.userData.halfZ = CELL_SIZE / 2;
        colMesh.userData.isWall = true;
        this.scene.add(colMesh);
        this.wallMeshes.push(colMesh);
      }
    }

    // Floor - one big plane per zone quadrant
    const halfW = (width * CELL_SIZE) / 2;
    const halfH = (height * CELL_SIZE) / 2;

    for (const z of Object.values(ZONES)) {
      const tex = this.textures[z.id]?.floor;
      const mat = new THREE.MeshStandardMaterial({
        color: z.floorColor,
        map: tex,
        roughness: 0.95,
        metalness: 0.05,
      });
      if (tex) { tex.repeat.set(10, 10); }
      const w = halfW; const h = halfH;
      let cx = 0, cz = 0;
      if (z.id === 'dungeon')   { cx = -w / 2; cz = -h / 2; }
      if (z.id === 'garden')    { cx =  w / 2; cz = -h / 2; }
      if (z.id === 'catacombs') { cx = -w / 2; cz =  h / 2; }
      if (z.id === 'abyss')     { cx =  w / 2; cz =  h / 2; }
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(cx, 0, cz);
      floor.receiveShadow = true;
      this.scene.add(floor);
    }

    // Ceiling: one quadrant per zone (skip outdoor zones)
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x050305, roughness: 1 });
    for (const z of Object.values(ZONES)) {
      if (z.outdoor) continue;
      const w = halfW; const h = halfH;
      let cx = 0, cz = 0;
      if (z.id === 'dungeon')   { cx = -w / 2; cz = -h / 2; }
      if (z.id === 'catacombs') { cx = -w / 2; cz =  h / 2; }
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(w, h), ceilMat);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(cx, CEILING_H, cz);
      this.scene.add(ceil);
    }

    // Sky dome
    const skyGeo = new THREE.SphereGeometry(140, 18, 14);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x050014, side: THREE.BackSide, fog: false,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    // Stars (reduced: 300)
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1) * 0.5;
      const r = 120 + Math.random() * 10;
      sp[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      sp[i * 3 + 1] = r * Math.cos(phi);
      sp[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.55, sizeAttenuation: true, fog: false,
      transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    // Moon (no glow light — moonlight directional is enough)
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0e8ff, fog: false });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), moonMat);
    moon.position.set(60, 80, -40);
    this.scene.add(moon);

    // Directional moonlight
    const moonlight = new THREE.DirectionalLight(0xa0c0ff, 0.35);
    moonlight.position.set(40, 50, -30);
    this.scene.add(moonlight);

    // Doors: meshes that replace wall cells marked DOOR / BOSS_DOOR
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (grid[y][x] === CELL.DOOR || grid[y][x] === CELL.BOSS_DOOR) {
          const wp = cellToWorld(x, y, grid);
          const isBoss = grid[y][x] === CELL.BOSS_DOOR;

          const mat = new THREE.MeshStandardMaterial({
            color: isBoss ? 0x3a0a14 : 0x6a3a18,
            roughness: 0.6,
            metalness: 0.3,
            emissive: isBoss ? 0xff2040 : 0xff8020,
            emissiveIntensity: isBoss ? 0.6 : 0.3,
          });
          const door = new THREE.Mesh(
            new THREE.BoxGeometry(CELL_SIZE * 0.95, CEILING_H * 0.95, CELL_SIZE * 0.3),
            mat
          );
          door.position.set(wp.x, CEILING_H / 2, wp.z);
          door.userData.halfX = CELL_SIZE / 2;
          door.userData.halfZ = CELL_SIZE / 2;
          door.userData.isDoor = true;
          door.userData.isBossDoor = isBoss;
          door.userData.cellX = x;
          door.userData.cellY = y;
          door.userData.opened = false;
          door.userData.keyId = isBoss ? 'boss_key' : `key_${x}_${y}`;
          this.scene.add(door);

          this.doorMeshes.push(door);
          // doors also act as walls until opened
          this.wallMeshes.push(door);
        }
      }
    }

    // Build spatial hash: map cellKey "x_z" -> array of wallMeshes for fast collision
    this._wallHash = new Map();
    for (const wm of this.wallMeshes) {
      const cx = Math.round(wm.position.x / CELL_SIZE);
      const cz = Math.round(wm.position.z / CELL_SIZE);
      const key = `${cx}_${cz}`;
      if (!this._wallHash.has(key)) this._wallHash.set(key, []);
      this._wallHash.get(key).push(wm);
    }

    // --- Decorative props scattered in floor cells, zone-specific ---
    // Only the first 6 torches get a dynamic light (perf budget)
    resetTorchLightBudget(6);
    const propSpawnCount = { dungeon: 10, garden: 16, catacombs: 12, abyss: 14 };
    const spawned = { dungeon: 0, garden: 0, catacombs: 0, abyss: 0 };
    let tries = 0;
    while (tries < 600 && (spawned.dungeon < propSpawnCount.dungeon || spawned.garden < propSpawnCount.garden || spawned.catacombs < propSpawnCount.catacombs || spawned.abyss < propSpawnCount.abyss)) {
      tries++;
      const cx = 1 + Math.floor(Math.random() * (width - 2));
      const cy = 1 + Math.floor(Math.random() * (height - 2));
      if (grid[cy][cx] !== CELL.FLOOR) continue;
      const zone = zoneForCell(cx, cy, width, height);
      if (spawned[zone.id] >= propSpawnCount[zone.id]) continue;
      if (Math.abs(cx - 1) + Math.abs(cy - 1) < 2) continue;
      const wp = cellToWorld(cx, cy, grid);
      const jitterX = (Math.random() - 0.5) * 1.2;
      const jitterZ = (Math.random() - 0.5) * 1.2;
      const pos = new THREE.Vector3(wp.x + jitterX, 0, wp.z + jitterZ);
      let prop = null;
      if (zone.id === 'dungeon') {
        if (Math.random() < 0.6) prop = spawnTorch(this.scene, new THREE.Vector3(pos.x, 1.2, pos.z));
        else prop = spawnPillar(this.scene, pos);
      } else if (zone.id === 'garden') {
        if (Math.random() < 0.35) prop = spawnDeadTree(this.scene, pos);
        else prop = spawnGrassTuft(this.scene, pos);
      } else if (zone.id === 'catacombs') {
        if (Math.random() < 0.7) prop = spawnSkullPile(this.scene, pos);
        else prop = spawnTorch(this.scene, new THREE.Vector3(pos.x, 1.2, pos.z));
      } else if (zone.id === 'abyss') {
        prop = spawnCrystal(this.scene, pos);
      }
      if (prop) {
        this.props.push(prop);
        spawned[zone.id]++;
      }
    }
  }

  // Return only the wall meshes in a 3x3 cell area around world (x,z) — fast collision.
  getNearbyWalls(x, z) {
    if (!this._wallHash) return this.wallMeshes;
    const cx = Math.round(x / CELL_SIZE);
    const cz = Math.round(z / CELL_SIZE);
    const out = [];
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${cx + dx}_${cz + dz}`;
        const list = this._wallHash.get(key);
        if (list) out.push(...list);
      }
    }
    return out;
  }

  // Attempt to open a door the player is facing
  tryOpenDoor(playerPos, playerInventory) {
    for (const d of this.doorMeshes) {
      if (d.userData.opened) continue;
      const dx = d.position.x - playerPos.x;
      const dz = d.position.z - playerPos.z;
      if (dx * dx + dz * dz < 6.25) {
        const keyId = d.userData.keyId;
        if (playerInventory.has(keyId)) {
          d.userData.opened = true;
          // animate up
          d.userData.openAnim = 0;
          // remove from wallMeshes
          const idx = this.wallMeshes.indexOf(d);
          if (idx >= 0) this.wallMeshes.splice(idx, 1);
          return { ok: true, keyUsed: keyId, bossDoor: d.userData.isBossDoor };
        } else {
          return { ok: false, missingKey: keyId, bossDoor: d.userData.isBossDoor };
        }
      }
    }
    return null;
  }

  setTheme(themeName) {
    let wallTex, floorTex, wallColor, floorColor;
    switch (themeName) {
      case 'natura':
        wallTex = this.textures.garden.wall;
        floorTex = this.textures.garden.floor;
        wallColor = 0x2a4d1a; floorColor = 0x1a3d0a;
        break;
      case 'mattoni':
        wallTex = this.textures.catacombs.wall;
        floorTex = this.textures.catacombs.floor;
        wallColor = 0x8b4513; floorColor = 0x4a2a15;
        break;
      default: // pietra (dungeon)
        wallTex = this.textures.dungeon.wall;
        floorTex = this.textures.dungeon.floor;
        wallColor = 0x606060; floorColor = 0x303030;
    }

    this.scene.traverse(obj => {
      if (obj.isInstancedMesh || obj.isMesh) {
        if (obj.userData.isWall && obj.material) {
          obj.material.map = wallTex;
          obj.material.color.setHex(wallColor);
          obj.material.needsUpdate = true;
        }
        if (obj.geometry.type === 'PlaneGeometry' && obj.material && !obj.userData.isDoor) {
          obj.material.map = floorTex;
          obj.material.color.setHex(floorColor);
          obj.material.needsUpdate = true;
        }
      }
    });
  }

  // Update animations (doors opening)
  update(dt) {
    for (const d of this.doorMeshes) {
      if (d.userData.opened && d.userData.openAnim < 1) {
        d.userData.openAnim = Math.min(1, d.userData.openAnim + dt * 1.5);
        d.position.y = 1.5 + d.userData.openAnim * 3.2;
        if (d.userData.openAnim >= 1) d.visible = false;
      }
    }
  }
}

// ---------- Pickups (keys, gems, money) ----------

export function spawnKey(scene, pos, keyId, color = 0xffc440) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.3, metalness: 0.85,
    emissive: color, emissiveIntensity: 1.2,
  });
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 6, 12), mat);
  head.rotation.x = Math.PI / 2;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 6), mat);
  shaft.position.y = -0.18;
  group.add(head, shaft);
  // no point light — emissive only (perf)
  group.position.copy(pos); group.position.y = 1;
  group.userData.isKey = true;
  group.userData.keyId = keyId;
  group.userData.color = color;
  scene.add(group);
  return group;
}

export function spawnGem(scene, pos) {
  const color = [0x40ffa0, 0x40c0ff, 0xff4080, 0xffd040][Math.floor(Math.random() * 4)];
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.1, metalness: 0.2,
    emissive: color, emissiveIntensity: 1.5,
    transparent: true, opacity: 0.9,
  });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
  gem.position.copy(pos); gem.position.y = 1;
  gem.userData.isGem = true;
  gem.userData.value = 1;
  // no point light (perf)
  scene.add(gem);
  return gem;
}

export function spawnMoney(scene, pos, amount = 10) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd860, roughness: 0.2, metalness: 0.9,
    emissive: 0xffae10, emissiveIntensity: 0.9,
  });
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 14), mat);
    c.position.y = 0.1 + i * 0.04;
    group.add(c);
  }
  group.position.copy(pos); group.position.y = 0.9;
  group.userData.isMoney = true;
  group.userData.amount = amount;
  scene.add(group);
  return group;
}

// Ambient particle field
export function buildParticles(scene, color = 0x886644, count = 260) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 3 + 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities.push({
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.05,
      vz: (Math.random() - 0.5) * 0.15,
    });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color, size: 0.07, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.velocities = velocities;
  scene.add(points);
  return points;
}

export function updateParticles(points, dt, playerPos) {
  const pos = points.geometry.attributes.position;
  const v = points.userData.velocities;
  for (let i = 0; i < v.length; i++) {
    pos.array[i * 3 + 0] += v[i].vx * dt;
    pos.array[i * 3 + 1] += v[i].vy * dt;
    pos.array[i * 3 + 2] += v[i].vz * dt;
    // wrap around player
    const dx = pos.array[i * 3 + 0] - playerPos.x;
    const dz = pos.array[i * 3 + 2] - playerPos.z;
    if (Math.abs(dx) > 40) pos.array[i * 3 + 0] = playerPos.x + (Math.random() - 0.5) * 40;
    if (Math.abs(dz) > 40) pos.array[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * 40;
    if (pos.array[i * 3 + 1] < 0.1) pos.array[i * 3 + 1] = 3;
    if (pos.array[i * 3 + 1] > 3.2) pos.array[i * 3 + 1] = 0.2;
  }
  pos.needsUpdate = true;
}
