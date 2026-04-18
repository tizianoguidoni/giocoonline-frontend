// NPC: Black Market Merchant. Static NPC in a special room.
// Sells weapons at half price, accepts only pocket money.

import * as THREE from 'three';
import { WEAPONS } from './weapons';

function buildMerchantMesh() {
  const group = new THREE.Group();

  const robeMat = new THREE.MeshStandardMaterial({
    color: 0x1a0a14,
    roughness: 0.85,
    emissive: 0x220814,
    emissiveIntensity: 0.18,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a24,
    roughness: 0.9,
    emissive: 0x080404,
    emissiveIntensity: 0.1,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4a540,
    roughness: 0.3,
    metalness: 0.8,
    emissive: 0x6a4008,
    emissiveIntensity: 0.4,
  });

  // Robed body (cone shape)
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.5, 14, 1, true), robeMat);
  robe.position.y = 0.75;
  group.add(robe);

  // Hood
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.6), robeMat);
  hood.position.y = 1.55;
  group.add(hood);

  // Face (dark)
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), skinMat);
  face.position.y = 1.45;
  face.position.z = 0.04;
  group.add(face);

  // Glowing eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(-0.06, 1.48, 0.17);
  eyeR.position.set(0.06, 1.48, 0.17);
  group.add(eyeL, eyeR);

  // Lantern (gold) hanging
  const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), goldMat);
  lantern.position.set(0.35, 1.2, 0.15);
  group.add(lantern);

  // Warm glow light (static — only for merchant)
  const glow = new THREE.PointLight(0xffaa44, 0.9, 5);
  glow.position.set(0.35, 1.2, 0.15);
  group.add(glow);

  return { group, eyeL, eyeR, lantern, glow };
}

export class BlackMarketMerchant {
  constructor({ scene, pos }) {
    this.scene = scene;
    const { group, eyeL, eyeR, lantern, glow } = buildMerchantMesh();
    this.mesh = group;
    this.mesh.position.copy(pos);
    this.eyeL = eyeL; this.eyeR = eyeR;
    this.lantern = lantern; this.glow = glow;
    scene.add(this.mesh);

    // Floating "?" indicator
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44, transparent: true, opacity: 0.9, depthTest: false
    });
    const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), indicatorMat);
    indicator.position.y = 2.2;
    indicator.renderOrder = 999;
    this.mesh.add(indicator);
    this.indicator = indicator;

    this.radius = 2.4; // interaction radius
    this.time = 0;
  }

  canInteract(playerPos) {
    return this.mesh.position.distanceTo(playerPos) < this.radius;
  }

  update(dt, playerPos) {
    this.time += dt;
    // face player
    const dx = playerPos.x - this.mesh.position.x;
    const dz = playerPos.z - this.mesh.position.z;
    const a = Math.atan2(dx, dz);
    this.mesh.rotation.y += (a - this.mesh.rotation.y) * Math.min(1, dt * 3);

    // lantern bob
    this.lantern.position.y = 1.2 + Math.sin(this.time * 2) * 0.03;
    this.glow.position.y = this.lantern.position.y;
    this.glow.intensity = 1.2 + Math.sin(this.time * 3.5) * 0.25;

    // indicator pulse
    this.indicator.position.y = 2.2 + Math.sin(this.time * 2.5) * 0.12;
    this.indicator.material.opacity = this.canInteract(playerPos) ? 1 : 0.6;
    this.indicator.scale.setScalar(this.canInteract(playerPos) ? 1.3 : 1);
  }

  // Discounted prices (half)
  getCatalog() {
    return Object.values(WEAPONS)
      .filter(w => w.id !== 'shortsword')
      .map(w => ({ ...w, price: Math.floor(w.price / 2) }));
  }
}
