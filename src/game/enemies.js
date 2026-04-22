// Enemies + Boss: stylized low-poly humanoids.
// Simple AI: idle -> patrol -> chase -> attack -> dead.

import * as THREE from 'three';
import { CELL_SIZE } from './maze';
import { assetManager } from './AssetManager';

const STATE = { IDLE: 'idle', PATROL: 'patrol', CHASE: 'chase', ATTACK: 'attack', DEAD: 'dead' };

function buildEnemyMesh({ type = 'grunt', scale = 1, isBoss = false }) {
  const group = new THREE.Group();

  if (isBoss) {
    // ---- Arena Boss Layout (Crystal Construct) ----
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00d0ff, roughness: 0.1, metalness: 0.9, emissive: 0x0080ff, emissiveIntensity: 0.5
    });
    const darkCrystalMat = new THREE.MeshStandardMaterial({ 
      color: 0x050a10, roughness: 0.2, metalness: 0.8, emissive: 0x003366, emissiveIntensity: 0.2
    });
    
    const torso = new THREE.Mesh(new THREE.OctahedronGeometry(0.8 * scale, 0), darkCrystalMat);
    torso.scale.set(1, 2.2, 1);
    torso.position.y = 1.3 * scale;
    group.add(torso);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 * scale, 0), crystalMat);
    core.position.y = 1.3 * scale;
    group.add(core);
    group.userData.core = core;

    return { group };
  }

  // ---- Standard Enemy Variants ----
  if (type === 'spider') {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    
    // Thorax
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.3 * scale, 8, 8), bodyMat);
    thorax.position.y = 0.2 * scale;
    thorax.scale.set(1, 0.8, 1.2);
    group.add(thorax);

    // Abdomen
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.45 * scale, 8, 8), bodyMat);
    abdomen.position.set(0, 0.35 * scale, -0.6 * scale);
    group.add(abdomen);

    // Eyes
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 4, 4), eyeMat);
    const e2 = e1.clone();
    e1.position.set(0.12 * scale, 0.35 * scale, 0.25 * scale);
    e2.position.set(-0.12 * scale, 0.35 * scale, 0.25 * scale);
    group.add(e1, e2);

    // Legs
    const legs = new THREE.Group();
    const legGeo = new THREE.CapsuleGeometry(0.03 * scale, 0.7 * scale, 4, 4);
    for (let i = 0; i < 8; i++) {
        const leg = new THREE.Mesh(legGeo, bodyMat);
        const angle = (i < 4 ? i : i + 1) * (Math.PI / 6) - (Math.PI / 2);
        const side = i < 4 ? 1 : -1;
        leg.position.set(0.3 * side * scale, 0.2 * scale, (i % 4) * 0.2 * scale - 0.3 * scale);
        leg.rotation.z = Math.PI / 3 * side;
        legs.add(leg);
    }
    group.add(legs);
    group.userData.legs = legs;
    return { group };
  }

  if (type === 'orc') {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.8 }); // Dark Green
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.3 });
    
    // Bulky Torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.45 * scale, 0.8 * scale, 4, 6), skinMat);
    torso.position.y = 1.0 * scale;
    group.add(torso);

    // Shoulder pads
    const padGeo = new THREE.SphereGeometry(0.25 * scale, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const lPad = new THREE.Mesh(padGeo, armorMat);
    const rPad = lPad.clone();
    lPad.position.set(-0.5 * scale, 1.4 * scale, 0);
    rPad.position.set(0.5 * scale, 1.4 * scale, 0);
    group.add(lPad, rPad);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 8, 8), skinMat);
    head.position.y = 1.7 * scale;
    group.add(head);

    return { group };
  }

  if (type === 'goblin') {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x56a32d, roughness: 0.6 }); // Bright Green
    
    // Skinny Torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22 * scale, 0.6 * scale, 4, 6), skinMat);
    torso.position.y = 0.6 * scale;
    group.add(torso);

    // Large Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 8, 8), skinMat);
    head.position.y = 1.1 * scale;
    group.add(head);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.08 * scale, 0.25 * scale, 4);
    const lEar = new THREE.Mesh(earGeo, skinMat);
    const rEar = lEar.clone();
    lEar.position.set(-0.25 * scale, 1.15 * scale, 0);
    lEar.rotation.z = Math.PI / 2.5;
    rEar.position.set(0.25 * scale, 1.15 * scale, 0);
    rEar.rotation.z = -Math.PI / 2.5;
    group.add(lEar, rEar);

    return { group };
  }

  // Fallback (Grunt)
  const fallbackMat = new THREE.MeshStandardMaterial({ color: 0x8a1020 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.3 * scale, 0.8 * scale), fallbackMat);
  torso.position.y = 0.8 * scale;
  group.add(torso);
  return { group };
}

export class Enemy {
  constructor({ scene, spawnPos, type = 'grunt', skin = null }) {
    this.scene = scene;
    this.type = type;
    this.isBoss = type === 'boss';
    const scale = this.isBoss ? 2.2 : 1.0;

    let group, eyeL, eyeR, armL, armR, legL, legR;
    
    if (this.isBoss && assetManager.isLoaded && assetManager.models.boss) {
      // Pick a random element (0: Fire, 1: Ice, 2: Earth)
      this.bossType = Math.floor(Math.random() * 3);
      group = assetManager.getBossVariant(this.bossType);
      
      // If we have an FBX model, setup animations
      if (group && group.animations && group.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(group);
        this.clips = {};
        group.animations.forEach(clip => {
            const name = clip.name.toLowerCase();
            if (name.includes('idle')) this.clips.idle = this.mixer.clipAction(clip);
            if (name.includes('run') || name.includes('walk')) this.clips.run = this.mixer.clipAction(clip);
            if (name.includes('attack')) this.clips.attack = this.mixer.clipAction(clip);
        });
        // Default to idle
        if (this.clips.idle) this.clips.idle.play();
      }

      const names = ['Ignis', 'Glacies', 'Terra'];
      this.displayName = `Elementale del ${names[this.bossType]}`;
      
      // Placeholders for legacy code
      eyeL = { material: { color: { setRGB: () => {} } } };
      eyeR = { material: { color: { setRGB: () => {} } } };
      armL = new THREE.Group(); armR = new THREE.Group();
      legL = new THREE.Group(); legR = new THREE.Group();
    } else {
      const types = ['orc', 'goblin', 'spider'];
      const chosenType = skin ? skin.type : types[Math.floor(Math.random() * 3)];
      
      if (assetManager.isLoaded) {
        if (chosenType === 'goblin' && assetManager.models.goblin) {
          group = assetManager.getGoblinModel();
        } else if (chosenType === 'orc' && assetManager.models.character) {
          group = assetManager.getCharacterModel();
        }
      }

      if (!group) {
        const meshData = buildEnemyMesh({ type: chosenType, scale, isBoss: false });
        group = meshData.group;
      }

      // Setup animations for non-boss models if they exist
      if (group && group.animations && group.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(group);
        this.clips = {};
        group.animations.forEach(clip => {
            const name = clip.name.toLowerCase();
            if (name.includes('idle')) this.clips.idle = this.mixer.clipAction(clip);
            if (name.includes('run') || name.includes('walk')) this.clips.run = this.mixer.clipAction(clip);
            if (name.includes('attack')) this.clips.attack = this.mixer.clipAction(clip);
        });
        if (this.clips.idle) this.clips.idle.play();
      }

      this.enemyType = chosenType;
    }

    this.mesh = group;
    this.eyeL = eyeL || null; 
    this.eyeR = eyeR || null;
    this.armL = armL || null; 
    this.armR = armR || null;
    this.legL = legL || null; 
    this.legR = legR || null;
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
      if (this.clips && this.clips.run && !this.clips.run.isRunning()) {
        if (this.clips.idle) this.clips.idle.fadeOut(0.2);
        this.clips.run.reset().fadeIn(0.2).play();
      }
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
    if (this.eyeL && this.eyeL.material) {
        this.eyeL.material.color.setRGB(1 * flashK, 0.2, 0.2);
    }
    if (this.eyeR && this.eyeR.material) {
        this.eyeR.material.color.setRGB(1 * flashK, 0.2, 0.2);
    }

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
          // animation: arm swing or FBX attack
          if (this.clips && this.clips.attack) {
            this.clips.attack.reset().play();
          } else if (this.armL && this.armR) {
            this.armL.rotation.x = -1.2; this.armR.rotation.x = -1.2;
          }
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

    // Animation updates
    if (this.mixer) this.mixer.update(dt);

    // boss aura pulse
    if (this.aura) {
      this.aura.intensity = 1.2 + Math.sin(this.walkTime * 3) * 0.6;
    }

    // Spider leg animation
    if (this.enemyType === 'spider' && this.mesh.userData.legs) {
        const isMoving = this.state === STATE.CHASE || this.state === STATE.PATROL;
        if (isMoving) {
            this.mesh.userData.legs.children.forEach((leg, i) => {
                const phase = (i % 4) * Math.PI / 2;
                leg.rotation.x = Math.sin(this.walkTime * 12 + phase) * 0.4;
            });
        }
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
