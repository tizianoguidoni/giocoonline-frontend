import * as THREE from "three";

/**
 * RPG Monster Builder & Animator
 * Creates low-poly monsters with basic bone structure for animation.
 */

export type MonsterState = "idle" | "walk" | "attack" | "death";

export interface MonsterConfig {
  hp: number;
  dmg: number;
  speed: number;
  color: string;
}

const CONFIGS: Record<string, MonsterConfig> = {
  goblin: { hp: 30, dmg: 8, speed: 2.0, color: "#4a7a32" },
  skeleton: { hp: 45, dmg: 12, speed: 1.5, color: "#eeeadd" },
  slime: { hp: 20, dmg: 5, speed: 1.2, color: "#33cc66" },
  orc: { hp: 100, dmg: 20, speed: 1.0, color: "#4b5320" },
};

function createMaterial(color: string, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.75,
    transparent: opacity < 1,
    opacity,
  });
}

export function buildMonster(kind: string): THREE.Group {
  const group = new THREE.Group();
  const config = CONFIGS[kind] || CONFIGS.goblin;
  const mat = createMaterial(config.color, kind === "slime" ? 0.85 : 1);

  if (kind === "slime") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), mat);
    body.scale.set(1.2, 0.8, 1.2);
    body.name = "body";
    group.add(body);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    [1, -1].forEach(s => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 4), eyeMat);
      eye.position.set(0.2 * s, 0.1, 0.35);
      const pup = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), pupMat);
      pup.position.set(0.2 * s, 0.1, 0.44);
      group.add(eye, pup);
    });
  } else {
    // Shared Body structure for Goblin, Skeleton, Orc
    const isOrc = kind === "orc";
    const isSkelly = kind === "skeleton";

    const bodyGeo = isSkelly ? new THREE.BoxGeometry(0.4, 0.6, 0.2) : new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
    const body = new THREE.Mesh(bodyGeo, isSkelly ? createMaterial("#222") : mat);
    body.position.y = 0.6;
    body.name = "body";
    group.add(body);

    if (isSkelly) {
      const ribMat = createMaterial("#eeeadd");
      for (let i = 0; i < 3; i++) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.25), ribMat);
        rib.position.y = 0.45 + i * 0.15;
        body.add(rib);
      }
    }

    if (isOrc) {
       const plateMat = createMaterial("#555");
       const spL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), plateMat);
       spL.position.set(0.3, 0.3, 0);
       const spR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 4, 4), plateMat);
       spR.position.set(-0.3, 0.3, 0);
       body.add(spL, spR);
    }

    // Head
    const headGeo = isSkelly ? new THREE.BoxGeometry(0.3, 0.3, 0.3) : (isOrc ? new THREE.BoxGeometry(0.4, 0.35, 0.35) : new THREE.IcosahedronGeometry(0.25, 0));
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.4;
    head.name = "head";
    body.add(head);

    if (kind === "goblin") {
      const earMat = mat;
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), earMat);
      earL.position.set(0.2, 0.1, 0);
      earL.rotation.z = -Math.PI / 3;
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), earMat);
      earR.position.set(-0.2, 0.1, 0);
      earR.rotation.z = Math.PI / 3;
      head.add(earL, earR);
    }

    if (isOrc) {
      const toothMat = createMaterial("#fff");
      const t1 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), toothMat);
      t1.position.set(0.1, -0.1, 0.15);
      t1.rotation.x = Math.PI;
      const t2 = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), toothMat);
      t2.position.set(-0.1, -0.1, 0.15);
      t2.rotation.x = Math.PI;
      head.add(t1, t2);
    }

    // Eyes
    const eyeColor = isSkelly ? 0xff0000 : (isOrc ? 0xffa500 : 0xffff00);
    const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 2 });
    [-1, 1].forEach(s => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), eyeMat);
      eye.position.set(0.1 * s, 0.05, 0.2);
      head.add(eye);
    });

    // Arms & Legs
    const limbMat = isSkelly ? createMaterial("#eeeadd") : mat;
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), limbMat);
    armL.name = "armL"; armL.position.set(0.35, 0.2, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), limbMat);
    armR.name = "armR"; armR.position.set(-0.35, 0.2, 0);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), limbMat);
    legL.name = "legL"; legL.position.set(0.15, -0.4, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5), limbMat);
    legR.name = "legR"; legR.position.set(-0.15, -0.4, 0);
    body.add(armL, armR, legL, legR);

    // Weapon
    if (!isSkelly) {
      const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), createMaterial("#666"));
      weapon.name = "weapon";
      weapon.position.set(0, -0.2, 0.2);
      armR.add(weapon);
    }
  }

  group.userData = { config, kind };
  return group;
}

export function animateMonster(group: THREE.Group, state: MonsterState, t: number, phase: number) {
  const body = group.getObjectByName("body");
  if (!body) return;

  const kind = group.userData.kind;

  // Reset
  body.rotation.set(0, 0, 0);
  body.position.y = 0.6;
  if (kind === "slime") body.scale.set(1.2, 0.8, 1.2);

  if (state === "death") {
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.2;
    return;
  }

  if (kind === "slime") {
    const bounce = Math.abs(Math.sin(t * 6));
    body.scale.y = 0.8 + bounce * 0.4;
    body.scale.x = body.scale.z = 1.2 - bounce * 0.2;
    body.position.y = 0.4 + bounce * 0.3;
    return;
  }

  const armL = group.getObjectByName("armL");
  const armR = group.getObjectByName("armR");
  const legL = group.getObjectByName("legL");
  const legR = group.getObjectByName("legR");

  if (state === "walk") {
    const s = Math.sin(t * 8);
    if (legL) legL.rotation.x = s * 0.7;
    if (legR) legR.rotation.x = -s * 0.7;
    if (armL) armL.rotation.x = -s * 0.7;
    if (armR) armR.rotation.x = s * 0.7;
    body.position.y = 0.6 + Math.abs(s) * 0.1;
  }

  if (state === "attack") {
    const lunge = Math.sin(phase * Math.PI);
    body.position.z = lunge * 0.5;
    if (armR) armR.rotation.x = -1.5 * lunge;
  }

  if (state === "idle") {
    const breathe = Math.sin(t * 2) * 0.05;
    body.scale.y = 1 + breathe;
  }
}
