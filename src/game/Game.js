// Main Game engine. Creates Three.js scene, orchestrates systems, runs the loop.
// Exposes a thin event-based API for the React UI (HUD, Merchant shop).

import * as THREE from 'three';
import { generateMaze, CELL, CELL_SIZE, cellToWorld } from './maze';
import { ZONES, zoneForCell, lerpColor, lerp } from './zones';
import {
  World, spawnKey, spawnGem, spawnMoney, buildParticles, updateParticles,
} from './world';
import { WeaponSystem, WEAPONS } from './weapons';
import { Enemy } from './enemies';
import { BlackMarketMerchant } from './merchant';
import { AudioSystem } from './audio';
import { SpellSystem, SPELLS, spawnPotion } from './spells';
import { enemySkinForZone, updateProps } from './props';

const PLAYER_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.3;
const PLAYER_SPEED = 4.2;
const PLAYER_SPRINT = 7.2;

export class Game {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.onEvent = onEvent || (() => {});

    // three core
    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(1);   // force 1 for perf on high-DPI screens
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0608, 3, 18);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 200);
    this.camera.position.set(0, PLAYER_HEIGHT, 0);
    this.scene.add(this.camera);

    // lights
    this.ambient = new THREE.AmbientLight(0x202028, 0.8);
    this.scene.add(this.ambient);

    // Torch (follows camera)
    this.torch = new THREE.SpotLight(0xffc888, 3.2, 22, Math.PI / 4.5, 0.55, 1.2);
    this.torch.castShadow = false;
    this.torch.position.set(0, 0, 0);
    this.torch.target.position.set(0, 0, -1);
    this.camera.add(this.torch);
    this.camera.add(this.torch.target);
    this.torchBaseIntensity = 3.2;

    // Secondary warm glow (body light)
    this.bodyLight = new THREE.PointLight(0xff9a5a, 0.35, 3);
    this.camera.add(this.bodyLight);

    // Input
    this.keys = {};
    this.mouseDown = false;
    this.yaw = 0; this.pitch = 0;

    // State
    this.running = false;
    this.paused = false;
    this.timeElapsed = 0;
    this.clock = new THREE.Clock();

    this.player = {
      hp: 100, maxHp: 100,
      pocketMoney: 50,
      bankMoney: 0,
      gems: 0,
      keys: new Set(),
      score: 0,
      damageCooldown: 0,
      bobTime: 0,
    };
    this._setupWorld();
    this._bindEvents();
    this._updateUI();
  }

  _setupWorld() {
    // Generate maze (35x35 with 7 rooms — balance size & perf)
    const mazeData = generateMaze({ width: 35, height: 35, roomCount: 7 });
    this.maze = mazeData;
    this.world = new World(this.scene, mazeData);

    // Place player at start cell
    const sp = cellToWorld(mazeData.startCell.x, mazeData.startCell.y, mazeData.grid);
    this.camera.position.set(sp.x, PLAYER_HEIGHT, sp.z);

    // Audio + Spells
    this.audio = new AudioSystem();
    this.spells = new SpellSystem(this.scene, this.camera, this);

    // Weapons
    this.weapons = new WeaponSystem(this.scene, this.camera);
    this.weapons.setWallMeshes(this.world.wallMeshes);

    // Particles (ambient dust, reduced count for perf)
    this.particles = buildParticles(this.scene, 0x886644, 120);

    // Place keys for rooms with doors
    this.pickups = []; // unified pickup list
    for (const r of mazeData.rooms) {
      if (!r.doorPos) continue;
      // drop the key somewhere in the maze, not inside its room
      let placed = false;
      let tries = 0;
      while (!placed && tries < 50) {
        tries++;
        const cx = 1 + 2 * Math.floor(Math.random() * ((mazeData.width - 1) / 2));
        const cy = 1 + 2 * Math.floor(Math.random() * ((mazeData.height - 1) / 2));
        if (mazeData.grid[cy][cx] !== CELL.FLOOR) continue;
        // avoid inside this room
        if (cx >= r.x && cx < r.x + r.w && cy >= r.y && cy < r.y + r.h) continue;
        const wp = cellToWorld(cx, cy, mazeData.grid);
        const keyId = r.type === 'boss' ? 'boss_key' : `key_${r.doorPos.x}_${r.doorPos.y}`;
        const color = r.type === 'boss' ? 0xff2040 : (r.type === 'merchant' ? 0xff8020 : 0xffc440);
        const k = spawnKey(this.scene, new THREE.Vector3(wp.x, 1, wp.z), keyId, color);
        this.pickups.push(k);
        placed = true;
      }
    }

    // Gems scattered in corridors (15)
    let gemCount = 0;
    let tries = 0;
    while (gemCount < 18 && tries < 300) {
      tries++;
      const cx = 1 + Math.floor(Math.random() * (mazeData.width - 2));
      const cy = 1 + Math.floor(Math.random() * (mazeData.height - 2));
      if (mazeData.grid[cy][cx] !== CELL.FLOOR) continue;
      // avoid spawn cell
      if (cx === mazeData.startCell.x && cy === mazeData.startCell.y) continue;
      const wp = cellToWorld(cx, cy, mazeData.grid);
      const gem = spawnGem(this.scene, new THREE.Vector3(wp.x, 1, wp.z));
      this.pickups.push(gem);
      gemCount++;
    }

    // Money piles (16)
    let moneyCount = 0;
    tries = 0;
    while (moneyCount < 18 && tries < 300) {
      tries++;
      const cx = 1 + Math.floor(Math.random() * (mazeData.width - 2));
      const cy = 1 + Math.floor(Math.random() * (mazeData.height - 2));
      if (mazeData.grid[cy][cx] !== CELL.FLOOR) continue;
      if (cx === mazeData.startCell.x && cy === mazeData.startCell.y) continue;
      const wp = cellToWorld(cx, cy, mazeData.grid);
      const m = spawnMoney(this.scene, new THREE.Vector3(wp.x, 1, wp.z), 15 + Math.floor(Math.random() * 25));
      this.pickups.push(m);
      moneyCount++;
    }

    // Mana potions (10)
    let potionCount = 0;
    tries = 0;
    while (potionCount < 10 && tries < 300) {
      tries++;
      const cx = 1 + Math.floor(Math.random() * (mazeData.width - 2));
      const cy = 1 + Math.floor(Math.random() * (mazeData.height - 2));
      if (mazeData.grid[cy][cx] !== CELL.FLOOR) continue;
      if (cx === mazeData.startCell.x && cy === mazeData.startCell.y) continue;
      const wp = cellToWorld(cx, cy, mazeData.grid);
      const p = spawnPotion(this.scene, new THREE.Vector3(wp.x, 1, wp.z), 40);
      this.pickups.push(p);
      potionCount++;
    }

    // Extra money in loot rooms (richer)
    for (const r of mazeData.rooms.filter(x => x.type === 'loot')) {
      const pileCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < pileCount; i++) {
        const cx = r.x + Math.floor(Math.random() * r.w);
        const cy = r.y + Math.floor(Math.random() * r.h);
        const wp = cellToWorld(cx, cy, mazeData.grid);
        const m = spawnMoney(this.scene, new THREE.Vector3(wp.x, 1, wp.z), 40 + Math.floor(Math.random() * 40));
        this.pickups.push(m);
      }
      if (Math.random() < 0.7) {
        const cx = r.x + Math.floor(r.w / 2);
        const cy = r.y + Math.floor(r.h / 2);
        const wp = cellToWorld(cx, cy, mazeData.grid);
        const g = spawnGem(this.scene, new THREE.Vector3(wp.x, 1, wp.z));
        this.pickups.push(g);
      }
    }

    // Enemies: patrols in corridors (10) + special enemies in loot rooms + boss in boss room
    this.enemies = [];
    const enemySpawns = [];
    while (enemySpawns.length < 16) {
      const cx = 3 + Math.floor(Math.random() * (mazeData.width - 6));
      const cy = 3 + Math.floor(Math.random() * (mazeData.height - 6));
      if (mazeData.grid[cy][cx] !== CELL.FLOOR) continue;
      if (Math.abs(cx - mazeData.startCell.x) + Math.abs(cy - mazeData.startCell.y) < 6) continue;
      enemySpawns.push({ cx, cy });
    }
    for (const s of enemySpawns) {
      const wp = cellToWorld(s.cx, s.cy, mazeData.grid);
      const zone = zoneForCell(s.cx, s.cy, mazeData.width, mazeData.height);
      this.enemies.push(new Enemy({
        scene: this.scene,
        spawnPos: new THREE.Vector3(wp.x, 0, wp.z),
        type: Math.random() < 0.25 ? 'stalker' : 'grunt',
        skin: enemySkinForZone(zone.id),
      }));
    }
    // Extra enemies in loot rooms
    for (const r of mazeData.rooms.filter(x => x.type === 'loot')) {
      const cx = r.x + Math.floor(r.w / 2);
      const cy = r.y + Math.floor(r.h / 2);
      const wp = cellToWorld(cx, cy, mazeData.grid);
      const zone = zoneForCell(cx, cy, mazeData.width, mazeData.height);
      this.enemies.push(new Enemy({
        scene: this.scene,
        spawnPos: new THREE.Vector3(wp.x, 0, wp.z),
        type: 'grunt',
        skin: enemySkinForZone(zone.id),
      }));
    }
    // Boss
    const bossRoom = mazeData.rooms.find(r => r.type === 'boss');
    if (bossRoom) {
      const cx = bossRoom.x + Math.floor(bossRoom.w / 2);
      const cy = bossRoom.y + Math.floor(bossRoom.h / 2);
      const wp = cellToWorld(cx, cy, mazeData.grid);
      this.boss = new Enemy({
        scene: this.scene,
        spawnPos: new THREE.Vector3(wp.x, 0, wp.z),
        type: 'boss',
      });
      this.enemies.push(this.boss);
    }

    // Merchant
    const merchantRoom = mazeData.rooms.find(r => r.type === 'merchant');
    if (merchantRoom) {
      const cx = merchantRoom.x + Math.floor(merchantRoom.w / 2);
      const cy = merchantRoom.y + Math.floor(merchantRoom.h / 2);
      const wp = cellToWorld(cx, cy, mazeData.grid);
      this.merchant = new BlackMarketMerchant({
        scene: this.scene,
        pos: new THREE.Vector3(wp.x, 0, wp.z),
      });
    }

    // Exit portal (emissive only, no extra light)
    const ep = cellToWorld(mazeData.exitCell.x, mazeData.exitCell.y, mazeData.grid);
    const portalMat = new THREE.MeshBasicMaterial({
      color: 0x20ff80, transparent: true, opacity: 0.8,
    });
    const portal = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.18, 10, 24), portalMat);
    portal.position.set(ep.x, 1.2, ep.z);
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);
    this.portal = portal;
    this.portalPos = new THREE.Vector3(ep.x, 1.2, ep.z);

    // Bank deposit zone (emissive only)
    const bp = cellToWorld(mazeData.startCell.x, mazeData.startCell.y, mazeData.grid);
    const bankMat = new THREE.MeshBasicMaterial({
      color: 0x40a0ff, transparent: true, opacity: 0.6,
    });
    const bank = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), bankMat);
    bank.rotation.x = -Math.PI / 2;
    bank.position.set(bp.x, 0.02, bp.z);
    this.scene.add(bank);
    this.bankPos = new THREE.Vector3(bp.x, 0, bp.z);
    this._depositCooldown = 0;
  }

  _bindEvents() {
    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyR') this.weapons.tryReload();
      if (e.code === 'KeyE') this._tryInteract();
      if (e.code === 'KeyZ') this._castSpell('fireball');
      if (e.code === 'KeyX') this._castSpell('heal');
      if (e.code === 'KeyC') this._castSpell('shield');
      if (e.code === 'Digit1') this.weapons.switchWeapon('shortsword');
      if (e.code === 'Digit2') this.weapons.switchWeapon('warhammer');
      if (e.code === 'Digit3') this.weapons.switchWeapon('runebow');
      if (e.code === 'Digit4') this.weapons.switchWeapon('magestaff');
      if (e.code === 'Digit5') this.weapons.switchWeapon('soulblade');
      if (e.code === 'KeyQ') this.weapons.nextWeapon();
      if (e.code === 'Escape') this._unlockPointer();
      this._updateUI();
    };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== this.canvas) return;
      const sens = 0.0022;
      this.yaw -= e.movementX * sens;
      this.pitch -= e.movementY * sens;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    };
    this._onMouseDown = (e) => {
      if (e.button === 0) this.mouseDown = true;
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this.mouseDown = false;
    };
    this._onResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('resize', this._onResize);
  }

  _unbindEvents() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('resize', this._onResize);
  }

  requestPointerLock() {
    this.canvas.requestPointerLock();
  }
  _unlockPointer() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }

  start() {
    this.running = true;
    this.clock.start();
    // Resume audio context (must be triggered by user gesture)
    this.audio && this.audio.resume();
    this._loop();
  }
  stop() {
    this.running = false;
    this._unbindEvents();
    this.renderer.dispose();
  }
  setPaused(p) { this.paused = p; }

  _loop = () => {
    if (!this.running) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.paused) this._update(dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this._loop);
  };

  _update(dt) {
    this.timeElapsed += dt;

    // --- Mouse look ---
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // --- Movement ---
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.add(forward);
    if (this.keys['KeyS']) move.sub(forward);
    if (this.keys['KeyD']) move.add(right);
    if (this.keys['KeyA']) move.sub(right);

    const sprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = sprinting ? PLAYER_SPRINT : PLAYER_SPEED;
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      this._moveWithCollision(move);
      this.player.bobTime += dt * (sprinting ? 10 : 7);
    }
    // head bob
    const bob = Math.sin(this.player.bobTime) * 0.04;
    this.camera.position.y = PLAYER_HEIGHT + (move.lengthSq() > 0 ? bob : 0);

    // --- Torch flickering ---
    const flick = 1 + (Math.sin(this.timeElapsed * 20) + Math.sin(this.timeElapsed * 7)) * 0.06;
    this.torch.intensity = this.torchBaseIntensity * flick;

    // --- Zone transition (fog + ambient) ---
    this._updateZone(dt);

    // --- Particles ---
    updateParticles(this.particles, dt, this.camera.position);

    // --- Weapons ---
    if (this.mouseDown) {
      const r = this.weapons.fire(this.enemies, (enemy, dmg, point) => this._onEnemyHit(enemy, dmg, point));
      if (r.fired) {
        const w = this.weapons.getCurrent();
        if (this.audio) { w.melee ? this.audio.sfxSwing() : this.audio.sfxShoot(); }
        this._updateUI();
      }
    }
    this.weapons.update(dt);

    // --- Spells ---
    this.spells && this.spells.update(dt, this.world.wallMeshes, this.enemies);

    // --- Ambient props animation ---
    updateProps(this.world.props, dt, this.timeElapsed);

    // --- Enemies ---
    this.player.damageCooldown = Math.max(0, this.player.damageCooldown - dt);
    for (const e of this.enemies) {
      const ePos = e.mesh.position;
      const nearby = this.world.getNearbyWalls(ePos.x, ePos.z);
      e.update(dt, {
        playerPos: this.camera.position,
        walls: nearby,
        allEnemies: this.enemies,
        onPlayerHit: (dmg) => this._onPlayerHit(dmg),
      });
    }
    // Remove dead enemies (after death anim)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.dead && e.deathTime > 3) {
        e.cleanup();
        this.enemies.splice(i, 1);
      }
    }

    // --- Merchant ---
    if (this.merchant) {
      this.merchant.update(dt, this.camera.position);
    }

    // --- Pickups ---
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const d2 = (p.position.x - this.camera.position.x) ** 2 + (p.position.z - this.camera.position.z) ** 2;
      p.rotation.y += dt * 1.4;
      p.position.y += Math.sin(this.timeElapsed * 3 + i) * dt * 0.2;
      if (d2 < 1.0) {
        this._collectPickup(p);
        this.scene.remove(p);
        p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
        this.pickups.splice(i, 1);
      }
    }

    // --- World updates (door animations) ---
    this.world.update(dt);

    // --- Portal ---
    if (this.portal) {
      this.portal.rotation.z += dt * 0.6;
      const dp = this.camera.position.distanceTo(this.portalPos);
      if (dp < 1.0 && !this._won) {
        this._won = true;
        this.onEvent({ type: 'win', score: this.player.score, time: this.timeElapsed });
      }
    }

    // --- Bank deposit ---
    this._depositCooldown = Math.max(0, this._depositCooldown - dt);
    if (this._depositCooldown === 0) {
      const dp = this.camera.position.distanceTo(this.bankPos);
      if (dp < 1.0 && this.player.pocketMoney > 0) {
        this.player.bankMoney += this.player.pocketMoney;
        const amt = this.player.pocketMoney;
        this.player.pocketMoney = 0;
        this._depositCooldown = 1.5;
        this.onEvent({ type: 'toast', text: `💰 Depositati ${amt}€ in banca` });
        this._updateUI();
      }
    }

    this._updateUI();
  }

  _moveWithCollision(delta) {
    const pos = this.camera.position;
    const next = pos.clone().add(delta);
    const nearby = this.world.getNearbyWalls(next.x, next.z);

    const testX = new THREE.Vector3(next.x, pos.y, pos.z);
    if (!this._hitsWall(testX, nearby)) pos.x = next.x;

    const testZ = new THREE.Vector3(pos.x, pos.y, next.z);
    if (!this._hitsWall(testZ, nearby)) pos.z = next.z;
  }

  _hitsWall(pos, walls) {
    const r = PLAYER_RADIUS;
    const list = walls || this.world.getNearbyWalls(pos.x, pos.z);
    for (const w of list) {
      const wp = w.position;
      const halfX = w.userData.halfX || CELL_SIZE / 2;
      const halfZ = w.userData.halfZ || CELL_SIZE / 2;
      const closestX = Math.max(wp.x - halfX, Math.min(pos.x, wp.x + halfX));
      const closestZ = Math.max(wp.z - halfZ, Math.min(pos.z, wp.z + halfZ));
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  _updateZone(dt) {
    const { grid, width, height } = this.maze;
    const cellX = Math.floor(this.camera.position.x / CELL_SIZE + width / 2);
    const cellY = Math.floor(this.camera.position.z / CELL_SIZE + height / 2);
    const cx = Math.max(0, Math.min(width - 1, cellX));
    const cy = Math.max(0, Math.min(height - 1, cellY));
    const z = zoneForCell(cx, cy, width, height);

    if (this._currentZone !== z) {
      this._targetZone = z;
      if (!this._currentZone) {
        this._currentZone = z;
        this.scene.fog.color.setHex(z.fogColor);
        this.scene.fog.near = z.fogNear;
        this.scene.fog.far = z.fogFar;
        this.ambient.color.setHex(z.ambient);
        this.ambient.intensity = z.ambientIntensity;
      } else {
        this._zoneTransitionT = 0;
      }
    }

    if (this._targetZone && this._currentZone !== this._targetZone) {
      this._zoneTransitionT = Math.min(1, (this._zoneTransitionT || 0) + dt * 0.8);
      const a = this._currentZone, b = this._targetZone, t = this._zoneTransitionT;
      this.scene.fog.color.setHex(lerpColor(a.fogColor, b.fogColor, t));
      this.scene.fog.near = lerp(a.fogNear, b.fogNear, t);
      this.scene.fog.far = lerp(a.fogFar, b.fogFar, t);
      this.ambient.color.setHex(lerpColor(a.ambient, b.ambient, t));
      this.ambient.intensity = lerp(a.ambientIntensity, b.ambientIntensity, t);
      if (t >= 1) {
        this._currentZone = b;
        this.audio && this.audio.setZone(b.id);
        this.onEvent({ type: 'zone', zone: b });
      }
    }

    // Initialize zone audio on first update
    if (this._currentZone && !this._audioStarted) {
      this._audioStarted = true;
      this.audio && this.audio.setZone(this._currentZone.id);
    }

    this._currentZoneExposed = this._currentZone;
  }

  _onEnemyHit(enemy, dmg, point) {
    enemy.takeDamage(dmg);
    this.audio && this.audio.sfxHit();
    if (enemy.dead) {
      this.player.score += enemy.scoreReward;
      this.player.pocketMoney += enemy.moneyReward;
      if (enemy.isBoss) {
        this.audio && this.audio.sfxBossRoar();
        this.onEvent({ type: 'toast', text: `👑 GUARDIANO ABBATTUTO! +${enemy.moneyReward}€` });
      }
      this._updateUI();
    } else {
      this.onEvent({ type: 'hit-marker' });
    }
  }

  _onPlayerHit(dmg) {
    if (this.player.damageCooldown > 0) return;
    // Apply shield reduction
    const reduction = this.spells ? this.spells.getShieldReduction() : 0;
    const finalDmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
    this.player.damageCooldown = 0.5;
    this.player.hp = Math.max(0, this.player.hp - finalDmg);
    this.audio && this.audio.sfxHurt();
    this.onEvent({ type: 'damage', dmg: finalDmg });
    if (this.player.hp <= 0 && !this._dead) {
      this._dead = true;
      this.audio && this.audio.sfxDeath();
      this.onEvent({ type: 'death' });
    }
    this._updateUI();
  }

  _collectPickup(p) {
    if (p.userData.isKey) {
      this.player.keys.add(p.userData.keyId);
      this.audio && this.audio.sfxPickup();
      this.onEvent({ type: 'toast', text: `🗝 Chiave raccolta` });
    } else if (p.userData.isGem) {
      this.player.gems += 1;
      this.player.score += 25;
      this.audio && this.audio.sfxPickup();
      this.onEvent({ type: 'toast', text: `💎 Gemma +25` });
    } else if (p.userData.isMoney) {
      const amt = p.userData.amount;
      this.player.pocketMoney += amt;
      this.audio && this.audio.sfxPickup();
      this.onEvent({ type: 'toast', text: `💰 +${amt}€ in tasca` });
    } else if (p.userData.isPotion) {
      const amt = p.userData.amount;
      if (this.spells) this.spells.restoreMana(amt);
      this.audio && this.audio.sfxPickup();
      this.onEvent({ type: 'toast', text: `🔮 +${amt} Mana` });
    }
    this._updateUI();
  }

  _tryInteract() {
    // Door
    const r = this.world.tryOpenDoor(this.camera.position, this.player.keys);
    if (r !== null) {
      if (r.ok) {
        this.player.keys.delete(r.keyUsed);
        this.audio && this.audio.sfxDoor();
        this.onEvent({ type: 'toast', text: r.bossDoor ? `🔓 Porta del Guardiano aperta!` : `🔓 Porta aperta` });
      } else {
        this.onEvent({ type: 'toast', text: r.bossDoor ? `🔒 Serve la Chiave del Guardiano` : `🔒 Chiave mancante` });
      }
      this._updateUI();
      return;
    }
    // Merchant
    if (this.merchant && this.merchant.canInteract(this.camera.position)) {
      this.onEvent({ type: 'open-merchant', catalog: this.merchant.getCatalog() });
      return;
    }
  }

  _castSpell(id) {
    if (!this.spells) return;
    const result = this.spells.cast(
      id,
      this.enemies,
      (enemy, dmg, point) => this._onEnemyHit(enemy, dmg, point),
      (amount) => {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
        this.onEvent({ type: 'toast', text: `❤ +${amount} HP` });
      },
      this.audio,
    );
    if (!result.ok && result.reason) {
      this.onEvent({ type: 'toast', text: `✗ ${result.reason}` });
    }
    this._updateUI();
  }

  buyWeapon(weaponId) {
    const catalog = this.merchant ? this.merchant.getCatalog() : [];
    const item = catalog.find(w => w.id === weaponId);
    if (!item) return { ok: false, reason: 'Articolo non disponibile' };
    if (this.weapons.owned.has(weaponId)) return { ok: false, reason: 'Già in possesso' };
    if (this.player.pocketMoney < item.price) return { ok: false, reason: `Servono ${item.price}€ in tasca` };
    this.player.pocketMoney -= item.price;
    this.weapons.ownWeapon(weaponId);
    this.weapons.switchWeapon(weaponId);
    this._updateUI();
    return { ok: true };
  }

  buyAmmo(weaponId) {
    const w = WEAPONS[weaponId];
    if (!w) return { ok: false };
    if (!this.weapons.owned.has(weaponId)) return { ok: false, reason: 'Non possiedi questa arma' };
    const cost = Math.max(10, Math.floor((w.price || 50) / 10));
    if (this.player.pocketMoney < cost) return { ok: false, reason: `Servono ${cost}€` };
    this.player.pocketMoney -= cost;
    this.weapons.reserve[weaponId] = (this.weapons.reserve[weaponId] || 0) + w.magazine * 2;
    this._updateUI();
    return { ok: true, cost };
  }

  withdraw(amount) {
    if (this.camera.position.distanceTo(this.bankPos) > 1.5) return { ok: false, reason: 'Torna al punto banca (cerchio blu)' };
    const a = Math.min(amount, this.player.bankMoney);
    if (a <= 0) return { ok: false, reason: 'Banca vuota' };
    this.player.bankMoney -= a;
    this.player.pocketMoney += a;
    this._updateUI();
    return { ok: true, amount: a };
  }

  // --- CHEATS (OWNER ONLY) ---
  cheatGiveMoney(amount) {
    this.player.pocketMoney += amount;
    this.player.bankMoney += amount;
    this.audio && this.audio.sfxPickup();
    this.onEvent({ type: 'toast', text: `✨ CHEAT: +${amount}€` });
    this._updateUI();
  }

  cheatUnlockAll() {
    Object.keys(WEAPONS).forEach(id => {
      this.weapons.ownWeapon(id);
    });
    this.onEvent({ type: 'toast', text: `⚔ CHEAT: Tutte le armi sbloccate` });
    this._updateUI();
  }

  cheatHeal() {
    this.player.hp = this.player.maxHp;
    if (this.spells) this.spells.restoreMana(100);
    this.onEvent({ type: 'toast', text: `❤ CHEAT: Salute e Mana ripristinati` });
    this._updateUI();
  }

  getState() {
    const w = this.weapons.getCurrent();
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      mana: this.spells ? Math.floor(this.spells.mana) : 0,
      maxMana: this.spells ? this.spells.maxMana : 100,
      shieldActive: this.spells ? this.spells.shieldActive : false,
      shieldTimer: this.spells ? this.spells.shieldTimer : 0,
      pocketMoney: this.player.pocketMoney,
      bankMoney: this.player.bankMoney,
      gems: this.player.gems,
      keys: Array.from(this.player.keys),
      score: this.player.score,
      time: this.timeElapsed,
      weapon: {
        id: w.id, name: w.name, icon: w.icon,
        ammo: this.weapons.ammo[w.id] || 0,
        magazine: w.magazine,
        reserve: this.weapons.reserve[w.id] || 0,
        reloading: this.weapons.reloadTimer > 0,
      },
      ownedWeapons: Array.from(this.weapons.owned),
      zone: this._currentZoneExposed ? this._currentZoneExposed.name : 'Dungeon',
      enemiesAlive: this.enemies.filter(e => !e.dead).length,
      bossAlive: this.boss ? !this.boss.dead : false,
      bossHp: this.boss ? Math.max(0, this.boss.hp) : 0,
      bossMaxHp: this.boss ? this.boss.maxHp : 0,
      bossVisible: this.boss ? (!this.boss.dead && this.camera.position.distanceTo(this.boss.mesh.position) < 18) : false,
    };
  }

  _updateUI() {
    this.onEvent({ type: 'state', state: this.getState() });
  }

  // Data for minimap
  getMinimapData() {
    return {
      grid: this.maze.grid,
      playerCellX: Math.floor(this.camera.position.x / CELL_SIZE + this.maze.width / 2),
      playerCellY: Math.floor(this.camera.position.z / CELL_SIZE + this.maze.height / 2),
      yaw: this.yaw,
      rooms: this.maze.rooms,
      exitCell: this.maze.exitCell,
      enemies: this.enemies.filter(e => !e.dead).map(e => ({
        x: Math.floor(e.mesh.position.x / CELL_SIZE + this.maze.width / 2),
        y: Math.floor(e.mesh.position.z / CELL_SIZE + this.maze.height / 2),
        boss: e.isBoss,
      })),
    };
  }

  // ─── ADMIN METHODS ───────────────────────────────────────────────────────────

  /** Teleport the player to a world-space coordinate */
  teleportTo(worldX, worldZ) {
    this.camera.position.x = worldX;
    this.camera.position.z = worldZ;
    this.camera.position.y = 1.6;
  }

  /** Teleport to a maze cell (col, row) */
  teleportToCell(cx, cy) {
    const wp = { x: (cx - this.maze.width / 2) * CELL_SIZE, z: (cy - this.maze.height / 2) * CELL_SIZE };
    this.teleportTo(wp.x, wp.z);
  }

  /** Give money to the player */
  cheatGiveMoney(amount = 5000) {
    this.player.pocketMoney += amount;
    this.player.score += amount;
    this._updateUI();
  }

  /** Fully heal the player */
  cheatHeal() {
    this.player.hp = this.player.maxHp;
    this.player.mana = this.player.maxMana;
    this._updateUI();
  }

  /** Toggle god mode (no damage) */
  cheatGodMode() {
    this._godMode = !this._godMode;
    return this._godMode;
  }

  /** Kill all enemies in the maze */
  cheatKillAll() {
    for (const e of this.enemies) {
      if (!e.dead) e.die();
    }
    this._updateUI();
  }

  /** Set player speed multiplier */
  cheatSetSpeed(multiplier) {
    this._speedMult = Math.max(0.1, Math.min(10, multiplier));
  }

  /** Get current player position as cell coords */
  getPlayerCell() {
    return {
      cx: Math.floor(this.camera.position.x / CELL_SIZE + this.maze.width / 2),
      cy: Math.floor(this.camera.position.z / CELL_SIZE + this.maze.height / 2),
      worldX: this.camera.position.x,
      worldZ: this.camera.position.z,
    };
  }

  /** Get maze dimensions */
  getMazeDimensions() {
    return { width: this.maze.width, height: this.maze.height };
  }
}
