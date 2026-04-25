import * as THREE from 'three';
import { assetManager } from './AssetManager';

export const ENEMY_TYPES = {
  slime: { hp: 50, speed: 1.2, damage: 5, xp: 20, gold: 10, color: 0x44ff44 },
  goblin: { hp: 80, speed: 2.5, damage: 12, xp: 45, gold: 25, color: 0x228b22 },
  wolf: { hp: 120, speed: 4.5, damage: 18, xp: 70, gold: 40, color: 0x8b4513 },
  skeleton: { hp: 100, speed: 2.0, damage: 15, xp: 80, gold: 50, color: 0xeeeeee },
  orc_warrior: { hp: 250, speed: 1.8, damage: 30, xp: 150, gold: 120, color: 0x4a5d23 },
  boss: { hp: 2000, speed: 1.5, damage: 60, xp: 1000, gold: 2000, color: 0x8b0000 },
};

export class Enemy {
  constructor(type, x, z) {
    this.type = type;
    this.config = ENEMY_TYPES[type];
    this.hp = this.config.hp;
    this.maxHp = this.config.hp;
    this.speed = this.config.speed;
    this.damage = this.config.damage;
    this.dead = false;
    this.radius = 0.4;
    
    this.position = new THREE.Vector3(x, 0, z);
    this.velocity = new THREE.Vector3();
    
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    // Map enemy types to available FBX models
    if (type === 'goblin' || type === 'slime' || type === 'wolf') {
      const model = assetManager.getGoblinModel();
      if (model) {
        this.mesh = model;
        // Scale variation
        if (type === 'slime') this.mesh.scale.multiplyScalar(0.7);
        if (type === 'wolf') this.mesh.scale.multiplyScalar(1.2);
        
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const clips = assetManager.getAnimations('goblin');
        if (clips && clips.length > 0) {
          this.mixer.clipAction(clips[0]).play();
        }
        
        // Add health bar helper
        this._addHealthBar();
      } else {
        this.mesh = this._buildProceduralMesh(type);
      }
    } else if (type === 'boss' || type === 'orc_warrior' || type === 'skeleton') {
      const isBoss = type === 'boss';
      const model = isBoss ? assetManager.getBossModel() : assetManager.getGruntModel();
      
      if (model) {
        this.mesh = model;
        if (type === 'skeleton') this.mesh.scale.multiplyScalar(0.9);
        if (isBoss) this.mesh.scale.multiplyScalar(2.0); // Make boss bigger
        
        this.mixer = new THREE.AnimationMixer(this.mesh);
        const clips = assetManager.getAnimations(isBoss ? 'boss' : 'grunt');
        if (clips && clips.length > 0) {
          this.mixer.clipAction(clips[0]).play();
        }
        this._addHealthBar();
      } else {
        this.mesh = this._buildProceduralMesh(type);
      }
    } else {
      this.mesh = this._buildProceduralMesh(type);
    }

    this.mesh.position.copy(this.position);
    this.mesh.userData = { type: 'enemy', instance: this };
  }

  _addHealthBar() {
    const barGeo = new THREE.PlaneGeometry(0.8, 0.08);
    const barMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    this.healthBar = new THREE.Mesh(barGeo, barMat);
    this.healthBar.position.y = 1.8;
    this.mesh.add(this.healthBar);
  }

  _buildProceduralMesh(type) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: ENEMY_TYPES[type].color });
    // Make it look slightly better than just a sphere
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 4, 8), bodyMat);
    body.position.y = 0.6;
    group.add(body);
    
    // Add glowing eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eye1 = new THREE.Mesh(new THREE.SphereGeometry(0.05), eyeMat);
    eye1.position.set(0.15, 0.8, 0.25);
    const eye2 = new THREE.Mesh(new THREE.SphereGeometry(0.05), eyeMat);
    eye2.position.set(-0.15, 0.8, 0.25);
    group.add(eye1, eye2);
    
    return group;
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    
    // Visual feedback
    if (this.mesh) {
      const originalColors = [];
      this.mesh.traverse(c => {
        if (c.isMesh) {
          originalColors.push({ mesh: c, color: c.material.color.clone() });
          c.material.color.set(0xffffff); // Flash white
        }
      });
      setTimeout(() => {
        originalColors.forEach(item => item.mesh.material.color.copy(item.color));
      }, 100);
    }

    // Update health bar
    if (this.healthBar) {
      const scale = Math.max(0, this.hp / this.maxHp);
      this.healthBar.scale.x = scale;
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.dead = true;
    if (this.mesh) {
      // Simple death animation: fall and fade
      new Promise(resolve => {
        const startY = this.mesh.position.y;
        const startRot = this.mesh.rotation.x;
        let t = 0;
        const anim = () => {
          t += 0.05;
          this.mesh.position.y = startY - t * 0.5;
          this.mesh.rotation.x = startRot + t * 1.5;
          if (t < 1) requestAnimationFrame(anim);
          else resolve();
        };
        anim();
      });
    }
  }

  update(dt, playerPos, maze) {
    if (this.dead) return;

    if (this.mixer) this.mixer.update(dt);

    const dist = this.position.distanceTo(playerPos);
    
    // AI: Simple follow if close enough
    if (dist < 15 && dist > 1.2) {
      const dir = playerPos.clone().sub(this.position).normalize();
      dir.y = 0;
      
      const move = dir.multiplyScalar(this.speed * dt);
      const nextPos = this.position.clone().add(move);
      
      // Basic collision with maze
      if (!maze.isWall(nextPos.x, nextPos.z)) {
        this.position.copy(nextPos);
      }
      
      // Look at player
      this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
    }

    this.mesh.position.copy(this.position);
    
    // Billboard health bar
    if (this.healthBar) {
      this.healthBar.lookAt(playerPos);
    }
  }
}
