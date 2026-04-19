// Fantasy weapons catalog. Mix of melee (sword/axe) and ranged (bow/staff).
// Unified system: all use raycast for damage (melee = short range cone, ranged = precise).

import * as THREE from 'three';
import { assetManager } from './AssetManager';

export const WEAPONS = {
  shortsword: {
    id: 'shortsword',
    name: 'Spada Corta',
    description: 'Arma base del viandante. Veloce, ma debole.',
    damage: 32,
    fireRate: 2.4,
    magazine: Infinity, // melee = illimitato
    reloadTime: 0,
    range: 2.2,
    spread: 0.5,      // large arc for melee
    pellets: 3,       // hits up to 3 enemies in arc
    price: 0,
    icon: '🗡',
    color: 0xd0e0ff,
    melee: true,
  },
  warhammer: {
    id: 'warhammer',
    name: 'Martello da Guerra',
    description: 'Colpo devastante. Rallenta nel fendente.',
    damage: 95,
    fireRate: 1.1,
    magazine: Infinity,
    reloadTime: 0,
    range: 2.6,
    spread: 0.8,
    pellets: 4,
    price: 180,
    icon: '🔨',
    color: 0xc88850,
    melee: true,
  },
  runebow: {
    id: 'runebow',
    name: 'Arco Runico',
    description: 'Frecce incantate a lunga gittata. Ricarica.',
    damage: 70,
    fireRate: 1.6,
    magazine: 8,
    reloadTime: 1.8,
    range: 60,
    spread: 0.002,
    pellets: 1,
    price: 240,
    icon: '🏹',
    color: 0x80ffb0,
    melee: false,
  },
  magestaff: {
    id: 'magestaff',
    name: 'Bastone del Mago',
    description: 'Scaglia dardi arcani. Mira automatica imprecisa.',
    damage: 38,
    fireRate: 4.0,
    magazine: 20,
    reloadTime: 2.0,
    range: 45,
    spread: 0.015,
    pellets: 1,
    price: 360,
    icon: '🔮',
    color: 0xc040ff,
    melee: false,
  },
  soulblade: {
    id: 'soulblade',
    name: 'Lama dell\'Anima',
    description: 'Leggendaria. Taglio che risucchia le anime.',
    damage: 180,
    fireRate: 1.4,
    magazine: Infinity,
    reloadTime: 0,
    range: 3.0,
    spread: 0.9,
    pellets: 5,
    price: 600,
    icon: '⚔',
    color: 0xff4060,
    melee: true,
  },
};

function buildSwordViewmodel(color = 0xd0e0ff) {
  const group = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({
    color, roughness: 0.2, metalness: 0.85,
    emissive: color, emissiveIntensity: 0.25,
  });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x2a1610, roughness: 0.8 });
  const guardMat = new THREE.MeshStandardMaterial({ color: 0x8a6020, roughness: 0.4, metalness: 0.7 });

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.02), bladeMat);
  blade.position.set(0, 0.3, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), bladeMat);
  tip.position.set(0, 0.62, 0);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), guardMat);
  guard.position.set(0, 0.05, 0);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.18, 8), gripMat);
  grip.position.set(0, -0.06, 0);
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), guardMat);
  pommel.position.set(0, -0.17, 0);

  group.add(blade, tip, guard, grip, pommel);
  group.rotation.z = 0.4;
  return group;
}

function buildHammerViewmodel() {
  const group = new THREE.Group();
  const headMat = new THREE.MeshStandardMaterial({ color: 0x707070, roughness: 0.4, metalness: 0.9, emissive: 0x201008, emissiveIntensity: 0.15 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a2a15, roughness: 0.9 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), headMat);
  head.position.set(0, 0.42, 0);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 8), handleMat);
  handle.position.set(0, 0.1, 0);
  group.add(head, handle);
  group.rotation.z = 0.35;
  return group;
}

function buildBowViewmodel() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3a2015, roughness: 0.8, emissive: 0x201008, emissiveIntensity: 0.1 });
  const stringMat = new THREE.MeshBasicMaterial({ color: 0xc0d0e0 });
  // Arc (torus segment)
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.015, 8, 20, Math.PI), woodMat);
  arc.rotation.z = Math.PI / 2;
  arc.position.set(0, 0.2, 0);
  // String
  const stringGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.05, 0), new THREE.Vector3(0, 0.45, 0)]);
  const string = new THREE.Line(stringGeo, stringMat);
  group.add(arc, string);
  return group;
}

function buildStaffViewmodel() {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x2a1510, roughness: 0.9 });
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0xa040ff, roughness: 0.1, metalness: 0.3,
    emissive: 0xa040ff, emissiveIntensity: 1.2, transparent: true, opacity: 0.85,
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.8, 8), woodMat);
  shaft.position.set(0, 0.2, 0);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), orbMat);
  orb.position.set(0, 0.65, 0);
  group.add(shaft, orb);
  group.userData.orb = orb;
  return group;
}

export function buildViewmodelFor(weaponId) {
  switch (weaponId) {
    case 'warhammer': return buildHammerViewmodel();
    case 'runebow': return buildBowViewmodel();
    case 'magestaff': return buildStaffViewmodel();
    case 'soulblade': {
      const model = assetManager.getSwordModel() || buildSwordViewmodel(0xff4060);
      model.rotation.set(0, -Math.PI/2, 0.45);
      model.scale.setScalar(0.012);
      return model;
    }
    default: {
      const model = assetManager.getSwordModel() || buildSwordViewmodel(0xd0e0ff);
      model.rotation.set(0, -Math.PI/2, 0.45);
      model.scale.setScalar(0.012);
      return model;
    }

  }
}

export class WeaponSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.owned = new Set(['shortsword']);
    this.ammo = { shortsword: Infinity };
    this.reserve = { shortsword: Infinity };
    this.current = 'shortsword';
    this.cooldown = 0;
    this.reloadTimer = 0;
    this.tracers = [];
    this.swingT = 0;

    this.viewmodelHolder = new THREE.Group();
    this.viewmodelHolder.position.set(0.32, -0.3, -0.5);
    this.viewmodelHolder.rotation.y = -0.25;
    this.camera.add(this.viewmodelHolder);
    this._rebuildViewmodel();
  }

  _rebuildViewmodel() {
    while (this.viewmodelHolder.children.length) {
      const c = this.viewmodelHolder.children[0];
      this.viewmodelHolder.remove(c);
    }
    this.viewmodel = buildViewmodelFor(this.current);
    this.viewmodel.scale.setScalar(0.5);
    this.viewmodelHolder.add(this.viewmodel);
  }

  ownWeapon(id) {
    if (this.owned.has(id)) return false;
    this.owned.add(id);
    const def = WEAPONS[id];
    this.ammo[id] = def.magazine;
    this.reserve[id] = def.melee ? Infinity : def.magazine * 3;
    return true;
  }

  switchWeapon(id) {
    if (!this.owned.has(id)) return false;
    this.current = id;
    this.reloadTimer = 0;
    this._rebuildViewmodel();
    return true;
  }

  nextWeapon() {
    const list = Object.keys(WEAPONS).filter(k => this.owned.has(k));
    const idx = list.indexOf(this.current);
    this.switchWeapon(list[(idx + 1) % list.length]);
  }

  getCurrent() { return WEAPONS[this.current]; }

  fire(enemies, onHit) {
    if (this.reloadTimer > 0) return { fired: false };
    const w = this.getCurrent();
    if (this.cooldown > 0) return { fired: false };
    if (!w.melee && this.ammo[this.current] <= 0) {
      this.tryReload();
      return { fired: false };
    }
    if (!w.melee) this.ammo[this.current] -= 1;
    this.cooldown = 1 / w.fireRate;
    this.swingT = 1;

    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const baseDir = new THREE.Vector3();
    this.camera.getWorldDirection(baseDir);

    const hitEnemies = new Set();
    for (let p = 0; p < w.pellets; p++) {
      const dir = baseDir.clone();
      dir.x += (Math.random() - 0.5) * w.spread * 2;
      dir.y += (Math.random() - 0.5) * w.spread * 2;
      dir.z += (Math.random() - 0.5) * w.spread * 2;
      dir.normalize();

      const ray = new THREE.Raycaster(origin, dir, 0.1, w.range);
      let closestEnemy = null; let closestDist = Infinity;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (hitEnemies.has(enemy)) continue;
        const hits = ray.intersectObject(enemy.mesh, true);
        if (hits.length > 0 && hits[0].distance < closestDist) {
          closestDist = hits[0].distance;
          closestEnemy = { enemy, hit: hits[0] };
        }
      }
      let wallDist = w.range;
      if (this._wallMeshes) {
        const wh = ray.intersectObjects(this._wallMeshes, false);
        if (wh.length > 0) wallDist = wh[0].distance;
      }
      if (closestEnemy && closestDist < wallDist) {
        hitEnemies.add(closestEnemy.enemy);
        onHit && onHit(closestEnemy.enemy, w.damage, closestEnemy.hit.point);
        if (!w.melee) this._spawnTracer(origin, closestEnemy.hit.point, w.color);
      } else if (!w.melee) {
        const end = origin.clone().add(dir.multiplyScalar(Math.min(wallDist, w.range)));
        this._spawnTracer(origin, end, w.color);
      }
    }
    return { fired: true, hits: Array.from(hitEnemies) };
  }

  setWallMeshes(meshes) { this._wallMeshes = meshes; }

  _spawnTracer(from, to, color) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geo, mat);
    line.userData.life = 0.18;
    this.scene.add(line);
    this.tracers.push(line);
  }

  tryReload() {
    if (this.reloadTimer > 0) return false;
    const w = this.getCurrent();
    if (w.melee) return false;
    const id = this.current;
    if (this.ammo[id] === w.magazine) return false;
    if ((this.reserve[id] || 0) <= 0) return false;
    this.reloadTimer = w.reloadTime;
    return true;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        const w = this.getCurrent();
        const id = this.current;
        const need = w.magazine - this.ammo[id];
        const take = Math.min(need, this.reserve[id] || 0);
        this.ammo[id] += take;
        if (this.reserve[id] !== Infinity) this.reserve[id] = Math.max(0, this.reserve[id] - take);
        this.reloadTimer = 0;
      }
    }

    // Swing anim
    if (this.swingT > 0) {
      this.swingT = Math.max(0, this.swingT - dt * 7);
      const s = this.swingT;
      this.viewmodelHolder.rotation.x = -s * 1.2;
      this.viewmodelHolder.rotation.z = s * 0.9;
      this.viewmodelHolder.position.z = -0.5 + s * 0.15;
    } else {
      this.viewmodelHolder.rotation.x += (0 - this.viewmodelHolder.rotation.x) * Math.min(1, dt * 8);
      this.viewmodelHolder.rotation.z += (0 - this.viewmodelHolder.rotation.z) * Math.min(1, dt * 8);
      this.viewmodelHolder.position.z += (-0.5 - this.viewmodelHolder.position.z) * Math.min(1, dt * 8);
    }

    // Staff orb pulse (emissive intensity only — no dynamic light)
    if (this.viewmodel && this.viewmodel.userData.orb) {
      const t = performance.now() * 0.003;
      this.viewmodel.userData.orb.material.emissiveIntensity = 1.5 + Math.sin(t) * 0.6;
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.userData.life -= dt;
      t.material.opacity = Math.max(0, t.userData.life * 5);
      if (t.userData.life <= 0) {
        this.scene.remove(t);
        t.geometry.dispose(); t.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}
