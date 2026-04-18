// Enemies + Boss: stylized low-poly humanoids.
// Simple AI: idle -> patrol -> chase -> attack -> dead.

import * as THREE from 'three';
import { CELL_SIZE } from './maze';

const STATE = { IDLE: 'idle', PATROL: 'patrol', CHASE: 'chase', ATTACK: 'attack', DEAD: 'dead' };

function buildEnemyMesh({ color = 0x8a1020, scale = 1, eyeColor = 0xff3030, isBoss = false }) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.15,
    emissive: color,
    emissiveIntensity: 0.12,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0a0608,
    roughness: 0.9,
    metalness: 0.1,
  });

  if (isBoss) {
    // ---- Nanon Banana Boss Design ----
    const bananaMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, roughness: 0.5, metalness: 0.1, emissive: 0x403000, emissiveIntensity: 0.2
    });
    const brownMat = new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.9 });
    
    // Corpo a banana gigante (tronco)
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5 * scale, 1.2 * scale, 8, 12), bananaMat);
    torso.position.y = 1.3 * scale;
    // Piegatura simulata (tilt)
    torso.rotation.z = -0.15;
    group.add(torso);

    // Gambo sù
    const stemTop = new THREE.Mesh(new THREE.ConeGeometry(0.15 * scale, 0.4 * scale, 6), brownMat);
    stemTop.position.set(0.18 * scale, 2.3 * scale, 0);
    stemTop.rotation.z = -0.4;
    group.add(stemTop);

    // Occhi
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06 * scale, 6, 6), eyeMat);
    const eyeR = eyeL.clone();
    eyeL.position.set(-0.15 * scale, 1.8 * scale, 0.45 * scale);
    eyeR.position.set(0.25 * scale, 1.8 * scale, 0.48 * scale);
    group.add(eyeL, eyeR);

    // Braccia muscolose
    const armGeo = new THREE.CapsuleGeometry(0.15 * scale, 0.8 * scale, 6, 8);
    const armL = new THREE.Mesh(armGeo, bananaMat);
    const armR = armL.clone();
    armL.position.set(-0.6 * scale, 1.3 * scale, 0);
    armR.position.set(0.6 * scale, 1.3 * scale, 0);
    group.add(armL, armR);

    // Gambe
    const legGeo = new THREE.CapsuleGeometry(0.18 * scale, 0.8 * scale, 6, 8);
    const legL = new THREE.Mesh(legGeo, brownMat);
    const legR = legL.clone();
    legL.position.set(-0.25 * scale, 0.4 * scale, 0);
    legR.position.set(0.25 * scale, 0.4 * scale, 0);
    group.add(legL, legR);

    return { group, eyeL, eyeR, armL, armR, legL, legR };
  }

  // ---- Design standard (Grunt) ----
  // torso (tall elongated)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32 * scale, 0.9 * scale, 4, 8), bodyMat);
  torso.position.y = 1.0 * scale;
  group.add(torso);

  // head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 10, 8), darkMat);
  head.position.y = 1.75 * scale;
  group.add(head);

  // eyes (emissive)
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.045 * scale, 6, 6), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.08 * scale, 1.78 * scale, 0.18 * scale);
  eyeR.position.set(0.08 * scale, 1.78 * scale, 0.18 * scale);
  group.add(eyeL, eyeR);

  // arms (thin)
  const armGeo = new THREE.CapsuleGeometry(0.1 * scale, 0.8 * scale, 4, 6);
  const armL = new THREE.Mesh(armGeo, bodyMat);
  const armR = armL.clone();
  armL.position.set(-0.42 * scale, 1.05 * scale, 0);
  armR.position.set(0.42 * scale, 1.05 * scale, 0);
  group.add(armL, armR);

  // legs
  const legGeo = new THREE.CapsuleGeometry(0.13 * scale, 0.7 * scale, 4, 6);
  const legL = new THREE.Mesh(legGeo, darkMat);
  const legR = legL.clone();
  legL.position.set(-0.16 * scale, 0.38 * scale, 0);
  legR.position.set(0.16 * scale, 0.38 * scale, 0);
  group.add(legL, legR);

  // point light "aura" (very subtle, only on bosses)
  return { group, eyeL, eyeR, armL, armR, legL, legR };
}

export class Enemy {
  constructor({ scene, spawnPos, type = 'grunt', skin = null }) {
    this.scene = scene;
    this.type = type;
    this.isBoss = type === 'boss';
    const scale = this.isBoss ? 1.9 : 1.0;

    const color = this.isBoss ? 0xffd700 : (skin ? skin.color : (type === 'stalker' ? 0x6a2a7a : 0x8a1020));
    const eyeColor = this.isBoss ? 0xff0000 : (skin ? skin.eye : 0xff3030);
    this.displayName = this.isBoss ? 'Nanon Banana' : (skin ? skin.name : 'Nemico');
    const { group, eyeL, eyeR, armL, armR, legL, legR } = buildEnemyMesh({ color, scale, eyeColor, isBoss: this.isBoss });
    this.mesh = group;
    this.eyeL = eyeL; this.eyeR = eyeR;
    this.armL = armL; this.armR = armR;
    this.legL = legL; this.legR = legR;
    this.mesh.position.copy(spawnPos);
    scene.add(this.mesh);

    // Stats
    if (this.isBoss) {
      this.maxHp = 480; this.hp = 480;
      this.speed = 2.6;
      this.damage = 28;
      this.attackRange = 1.8;
      this.sightRange = 22;
      this.attackCooldown = 0;
      this.attackInterval = 1.2;
      this.scoreReward = 500;
      this.moneyReward = 300;

      // boss aura
      this.aura = new THREE.PointLight(0xff4020, 1.6, 5);
      this.aura.position.y = 1.5;
      this.mesh.add(this.aura);
    } else {
      this.maxHp = 60; this.hp = 60;
      this.speed = 2.1;
      this.damage = 10;
      this.attackRange = 1.4;
      this.sightRange = 12;
      this.attackCooldown = 0;
      this.attackInterval = 1.0;
      this.scoreReward = 60;
      this.moneyReward = 15 + Math.floor(Math.random() * 20);
    }

    this.hitboxes = [group]; // for raycast
    this.state = STATE.PATROL;
    this.dead = false;
    this.patrolTarget = null;
    this.walkTime = Math.random() * 10;
    this.homePos = spawnPos.clone();
    this.flashTime = 0;
  }

  takeDamage(dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    this.flashTime = 0.12;
    if (this.hp <= 0) {
      this.die();
    } else {
      this.state = STATE.CHASE;
    }
  }

  die() {
    this.dead = true;
    this.state = STATE.DEAD;
    // fall animation handled in update
    this.deathTime = 0;
  }

  _canSee(playerPos, walls) {
    const from = this.mesh.position.clone(); from.y = 1.5;
    const to = playerPos.clone(); to.y = 1.5;
    const dist = from.distanceTo(to);
    if (dist > this.sightRange) return false;
    const dir = to.clone().sub(from).normalize();
    const ray = new THREE.Raycaster(from, dir, 0.1, dist - 0.2);
    const hits = ray.intersectObjects(walls, false);
    return hits.length === 0;
  }

  _tryMoveTo(target, dt, walls, allEnemies) {
    const pos = this.mesh.position;
    const dir = new THREE.Vector3(target.x - pos.x, 0, target.z - pos.z);
    const dist = dir.length();
    if (dist < 0.05) return false;
    dir.normalize();

    // Face direction
    const targetAngle = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y += (targetAngle - this.mesh.rotation.y) * Math.min(1, dt * 6);

    const step = Math.min(this.speed * dt, dist);
    const next = pos.clone().addScaledVector(dir, step);

    // Wall collision check (approx: sphere around next)
    const radius = this.isBoss ? 0.8 : 0.45;
    for (const w of walls) {
      const wp = w.position;
      const halfX = w.userData.halfX || CELL_SIZE / 2;
      const halfZ = w.userData.halfZ || CELL_SIZE / 2;
      const closestX = Math.max(wp.x - halfX, Math.min(next.x, wp.x + halfX));
      const closestZ = Math.max(wp.z - halfZ, Math.min(next.z, wp.z + halfZ));
      const dx = next.x - closestX;
      const dz = next.z - closestZ;
      if (dx * dx + dz * dz < radius * radius) return false;
    }
    // Enemy-enemy separation
    for (const other of allEnemies) {
      if (other === this || other.dead) continue;
      const dx = next.x - other.mesh.position.x;
      const dz = next.z - other.mesh.position.z;
      if (dx * dx + dz * dz < (radius + 0.4) * (radius + 0.4)) return false;
    }
    pos.x = next.x;
    pos.z = next.z;
    return true;
  }

  update(dt, { playerPos, walls, allEnemies, onPlayerHit }) {
    if (this.dead) {
      this.deathTime += dt;
      // sink + fade
      this.mesh.rotation.x = Math.min(Math.PI / 2, this.deathTime * 2.5);
      this.mesh.position.y = Math.max(-0.4, this.mesh.position.y - dt * 0.25);
      return;
    }

    this.walkTime += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.flashTime = Math.max(0, this.flashTime - dt);

    // flash eyes when hit
    const flashK = this.flashTime > 0 ? 1 + this.flashTime * 8 : 1;
    this.eyeL.material.color.setRGB(1 * flashK, 0.2, 0.2);
    this.eyeR.material.color.setRGB(1 * flashK, 0.2, 0.2);

    const dist = this.mesh.position.distanceTo(playerPos);
    const sees = this._canSee(playerPos, walls);

    if (sees && dist < this.sightRange) {
      this.state = STATE.CHASE;
    } else if (this.state === STATE.CHASE && dist > this.sightRange * 1.5) {
      this.state = STATE.PATROL;
      this.patrolTarget = null;
    }

    if (this.state === STATE.CHASE) {
      if (dist > this.attackRange) {
        this._tryMoveTo(playerPos, dt, walls, allEnemies);
      } else {
        // attack
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackInterval;
          // animation: arm swing
          this.armL.rotation.x = -1.2; this.armR.rotation.x = -1.2;
          if (onPlayerHit) onPlayerHit(this.damage, this);
        }
      }
    } else if (this.state === STATE.PATROL) {
      if (!this.patrolTarget || this.mesh.position.distanceTo(this.patrolTarget) < 0.5) {
        const r = 4 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        this.patrolTarget = this.homePos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const moved = this._tryMoveTo(this.patrolTarget, dt, walls, allEnemies);
      if (!moved) this.patrolTarget = null;
    }

    // Walk leg animation
    const walking = this.state === STATE.CHASE || this.state === STATE.PATROL;
    if (walking) {
      const t = this.walkTime * 6;
      this.legL.rotation.x = Math.sin(t) * 0.6;
      this.legR.rotation.x = -Math.sin(t) * 0.6;
      if (!(this.state === STATE.CHASE && dist <= this.attackRange)) {
        this.armL.rotation.x = -Math.sin(t) * 0.5;
        this.armR.rotation.x = Math.sin(t) * 0.5;
      }
    }

    // boss aura pulse
    if (this.aura) {
      this.aura.intensity = 1.2 + Math.sin(this.walkTime * 3) * 0.6;
    }
  }

  cleanup() {
    this.scene.remove(this.mesh);
    this.mesh.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
  }
}
