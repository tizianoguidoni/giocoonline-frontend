// Magic spells + potion system.
// - Z: Fireball (mana-based), launches projectile that explodes on hit
// - X: Cura (mana-based), heals HP
// - C: Scudo (mana-based), reduces incoming damage
// Mana regenerates over time. Potions found as pickups instantly restore mana.

import * as THREE from 'three';

export const SPELLS = {
  fireball: {
    id: 'fireball', name: 'Palla di Fuoco', key: 'Z', mana: 30,
    damage: 85, radius: 3.0, speed: 18, color: 0xff6020, icon: '🔥',
    desc: 'Esplode all\'impatto: danno ad area.',
  },
  heal: {
    id: 'heal', name: 'Rigenera', key: 'X', mana: 25,
    heal: 55, color: 0x40ff80, icon: '❤',
    desc: 'Ripristina HP istantaneamente.',
  },
  shield: {
    id: 'shield', name: 'Scudo Arcano', key: 'C', mana: 35,
    duration: 6, reduction: 0.65, color: 0x60a0ff, icon: '🛡',
    desc: 'Riduce il danno del 65% per 6s.',
  },
};

export class SpellSystem {
  constructor(scene, camera, game) {
    this.scene = scene;
    this.camera = camera;
    this.game = game;
    this.maxMana = 100;
    this.mana = 100;
    this.manaRegen = 5; // per second
    this.projectiles = [];
    this.shieldTimer = 0;
    this.shieldOrb = null;
    this.cooldown = 0;
  }

  get shieldActive() { return this.shieldTimer > 0; }
  getShieldReduction() { return this.shieldActive ? SPELLS.shield.reduction : 0; }

  cast(id, enemies, onHit, onHeal, audio) {
    if (this.cooldown > 0) return { ok: false, reason: 'Attendi un istante' };
    const spell = SPELLS[id];
    if (!spell) return { ok: false };
    if (this.mana < spell.mana) return { ok: false, reason: 'Mana insufficiente' };
    this.mana -= spell.mana;
    this.cooldown = 0.35;
    audio && audio.sfxSpell();

    if (id === 'fireball') {
      this._launchFireball(enemies, onHit);
    } else if (id === 'heal') {
      onHeal && onHeal(spell.heal);
      this._spawnHealEffect();
    } else if (id === 'shield') {
      this.shieldTimer = spell.duration;
      this._spawnShieldOrb();
    }
    return { ok: true };
  }

  _launchFireball(enemies, onHit) {
    const origin = new THREE.Vector3(); this.camera.getWorldPosition(origin);
    const dir = new THREE.Vector3(); this.camera.getWorldDirection(dir);
    const projGroup = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe080 })
    );
    const outer = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xff4020, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })
    );
    const light = new THREE.PointLight(0xff6020, 2.5, 8);
    projGroup.add(core, outer, light);
    projGroup.position.copy(origin).add(dir.clone().multiplyScalar(0.8));
    this.scene.add(projGroup);

    this.projectiles.push({
      mesh: projGroup, dir: dir.normalize(), life: 2.5,
      onHit, enemies,
    });
  }

  _spawnHealEffect() {
    // particle burst around the camera
    const geo = new THREE.BufferGeometry();
    const count = 40;
    const positions = new Float32Array(count * 3);
    const vel = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      vel.push({
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 2 + 0.5,
        z: (Math.random() - 0.5) * 2,
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x40ff80, size: 0.15, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particles = new THREE.Points(geo, mat);
    particles.position.copy(this.camera.position);
    particles.userData.vel = vel;
    particles.userData.life = 1;
    this.scene.add(particles);
    this._healFx = particles;
  }

  _spawnShieldOrb() {
    if (this.shieldOrb) { this.camera.remove(this.shieldOrb); this.shieldOrb = null; }
    const mat = new THREE.MeshBasicMaterial({
      color: 0x60a0ff, transparent: true, opacity: 0.22, side: THREE.BackSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.1, 18, 14), mat);
    sphere.position.set(0, 0, 0);
    this.camera.add(sphere);
    this.shieldOrb = sphere;
  }

  restoreMana(amount) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  update(dt, walls, enemies) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * dt);
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldOrb) {
        this.shieldOrb.material.opacity = 0.15 + Math.sin(performance.now() * 0.01) * 0.05;
        this.shieldOrb.rotation.y += dt * 0.8;
        if (this.shieldTimer <= 0) {
          this.camera.remove(this.shieldOrb);
          this.shieldOrb.geometry.dispose(); this.shieldOrb.material.dispose();
          this.shieldOrb = null;
        }
      }
    }

    // Fireballs
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const step = p.dir.clone().multiplyScalar(SPELLS.fireball.speed * dt);
      p.mesh.position.add(step);
      p.life -= dt;
      p.mesh.rotation.x += dt * 6;
      p.mesh.rotation.y += dt * 6;

      // wall collision
      let hitWall = false;
      for (const w of walls) {
        const wp = w.position;
        const halfX = w.userData.halfX || 1.5;
        const halfZ = w.userData.halfZ || 1.5;
        if (Math.abs(p.mesh.position.x - wp.x) < halfX + 0.3 &&
            Math.abs(p.mesh.position.z - wp.z) < halfZ + 0.3 &&
            p.mesh.position.y < 3 && p.mesh.position.y > 0) {
          hitWall = true;
          break;
        }
      }

      // enemy collision
      let hitEnemy = null;
      for (const e of enemies) {
        if (e.dead) continue;
        if (p.mesh.position.distanceTo(e.mesh.position.clone().add(new THREE.Vector3(0, 1, 0))) < 0.8) {
          hitEnemy = e; break;
        }
      }

      if (hitWall || hitEnemy || p.life <= 0) {
        this._explode(p.mesh.position.clone(), enemies, p.onHit);
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Heal particles
    if (this._healFx) {
      const pos = this._healFx.geometry.attributes.position;
      const vel = this._healFx.userData.vel;
      for (let i = 0; i < vel.length; i++) {
        pos.array[i * 3 + 0] += vel[i].x * dt;
        pos.array[i * 3 + 1] += vel[i].y * dt;
        pos.array[i * 3 + 2] += vel[i].z * dt;
        vel[i].y -= dt * 2.5;
      }
      pos.needsUpdate = true;
      this._healFx.userData.life -= dt;
      this._healFx.material.opacity = Math.max(0, this._healFx.userData.life);
      if (this._healFx.userData.life <= 0) {
        this.scene.remove(this._healFx);
        this._healFx.geometry.dispose();
        this._healFx.material.dispose();
        this._healFx = null;
      }
    }
  }

  _explode(pos, enemies, onHit) {
    const spell = SPELLS.fireball;
    // area damage
    for (const e of enemies) {
      if (e.dead) continue;
      const d = e.mesh.position.distanceTo(pos);
      if (d < spell.radius) {
        const dmg = Math.floor(spell.damage * (1 - d / spell.radius));
        onHit && onHit(e, dmg, pos);
      }
    }
    // Visual burst
    const geo = new THREE.SphereGeometry(0.3, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffa040, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const burst = new THREE.Mesh(geo, mat);
    burst.position.copy(pos);
    this.scene.add(burst);
    const light = new THREE.PointLight(0xff6020, 4, 8);
    light.position.copy(pos);
    this.scene.add(light);
    let t = 0;
    const anim = () => {
      t += 0.05;
      burst.scale.setScalar(1 + t * 6);
      mat.opacity = Math.max(0, 0.9 - t * 2);
      light.intensity = Math.max(0, 4 - t * 8);
      if (t < 0.5) requestAnimationFrame(anim);
      else {
        this.scene.remove(burst); this.scene.remove(light);
        burst.geometry.dispose(); burst.material.dispose();
      }
    };
    anim();
  }
}

// Mana potion pickup
export function spawnPotion(scene, pos, amount = 40) {
  const group = new THREE.Group();
  const bottleMat = new THREE.MeshStandardMaterial({
    color: 0x2040ff, roughness: 0.1, metalness: 0.1,
    emissive: 0x2040ff, emissiveIntensity: 0.7,
    transparent: true, opacity: 0.8,
  });
  const corkMat = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.8 });
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.28, 10), bottleMat);
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 8), corkMat);
  cork.position.y = 0.18;
  const glow = new THREE.PointLight(0x4060ff, 0.7, 2.5);
  group.add(bottle, cork, glow);
  group.position.copy(pos); group.position.y = 1;
  group.userData.isPotion = true;
  group.userData.amount = amount;
  scene.add(group);
  return group;
}
