import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { toast } from 'sonner';
import { getItemImage } from '@/data/itemImages';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

/* ════════════════════════════════════════
   CONSTANTS & CONFIGS
════════════════════════════════════════ */
const RARITY = {
  common:    { color: '#9CA3AF', hex: 0x9CA3AF, label: 'Comune',     glow: 'rgba(156,163,175,0.5)',  gradient: 'from-gray-500/20 to-gray-600/10', border: '#9CA3AF44' },
  uncommon:  { color: '#22C55E', hex: 0x22C55E, label: 'Non Comune', glow: 'rgba(34,197,94,0.5)',    gradient: 'from-green-500/20 to-green-600/10', border: '#22C55E44' },
  rare:      { color: '#3B82F6', hex: 0x3B82F6, label: 'Raro',       glow: 'rgba(59,130,246,0.5)',   gradient: 'from-blue-500/20 to-blue-600/10', border: '#3B82F644' },
  epic:      { color: '#A855F7', hex: 0xA855F7, label: 'Epico',      glow: 'rgba(168,85,247,0.5)',   gradient: 'from-purple-500/20 to-purple-600/10', border: '#A855F744' },
  legendary: { color: '#F59E0B', hex: 0xF59E0B, label: 'Leggendario',glow: 'rgba(245,158,11,0.6)',   gradient: 'from-amber-500/25 to-orange-600/10', border: '#F59E0B66' },
  admin:     { color: '#E63946', hex: 0xE63946, label: 'Admin',       glow: 'rgba(230,57,70,0.5)',    gradient: 'from-red-500/20 to-red-600/10', border: '#E6394644' },
};

const CATEGORIES = [
  { id: 'all',      label: 'Tutti',         icon: '⚡', filter: () => true },
  { id: 'weapon',   label: 'Armi',          icon: '⚔️', filter: i => ['sword','secondary'].includes(i.slot) || i.item_type === 'weapon' },
  { id: 'armor',    label: 'Armature',      icon: '🛡️', filter: i => ['helmet','armor','boots','gloves','legs'].includes(i.slot) || i.item_type === 'armor' },
  { id: 'consumable',label: 'Pozioni',      icon: '🧪', filter: i => i.item_type === 'consumable' },
  { id: 'gem',      label: 'Gemme/Mat.',    icon: '💎', filter: i => ['gem','material'].includes(i.item_type) },
  { id: 'quest',    label: 'Quest',         icon: '📜', filter: i => i.item_type === 'quest' },
];

const EQUIP_SLOTS = [
  { id: 'helmet',   label: 'Testa',         icon: '⛑️',  pos: [0, 2.1, 0] },
  { id: 'sword',    label: 'Arma Destra',   icon: '⚔️',  pos: [0.9, 1.1, 0] },
  { id: 'shield',   label: 'Arma Sinistra', icon: '🛡️',  pos: [-0.9, 1.1, 0] },
  { id: 'secondary',label: 'Accessorio',    icon: '🗡️',  pos: [0, 0.2, 0] },
];

const STAT_LABELS = {
  damage: 'Attacco', defense: 'Difesa', strength: 'Forza',
  intelligence: 'Intelligenza', agility: 'Agilità', hp_bonus: 'Bonus HP',
  crit_chance: 'Critico %', block: 'Blocco %', fire_damage: 'Danno Fuoco',
  ice_damage: 'Danno Ghiaccio', dark_damage: 'Danno Oscuro', holy_damage: 'Danno Sacro',
  lifesteal: 'Rubavita', all_damage: 'Tutto il Danno', mana: 'Mana',
  all_stats: 'Tutte le Stat', heal: 'Cura',
};

/* ════════════════════════════════════════
   3D CHARACTER VIEWER — full Three.js imperative
════════════════════════════════════════ */
function CharacterViewer3D({ equipment, previewItem, charClass = 'warrior' }) {
  const mountRef = useRef(null);
  const sceneRef = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const w = el.clientWidth || 340;
    const h = el.clientHeight || 520;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0010, 0.04);

    // Camera
    const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 4.2);
    camera.lookAt(0, 1.0, 0);

    // ── LIGHTING ──
    scene.add(new THREE.AmbientLight(0xffeedd, 0.6));

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 2.5);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 20;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.8);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xaa44ff, 1.2);
    rimLight.position.set(-2, 4, -5);
    scene.add(rimLight);

    const groundLight = new THREE.PointLight(0xff8844, 0.6, 5);
    groundLight.position.set(0, -0.5, 1);
    scene.add(groundLight);

    // ── PEDESTAL ──
    const mainGrp = new THREE.Group();
    scene.add(mainGrp);

    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1a1030, metalness: 0.9, roughness: 0.2,
      emissive: 0x220044, emissiveIntensity: 0.4,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.3, 0.15, 32), pedMat);
    pedestal.position.y = -1.25;
    pedestal.receiveShadow = true;
    mainGrp.add(pedestal);

    // Runes on pedestal
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const runeMat = new THREE.MeshBasicMaterial({ color: 0x8844ff, transparent: true, opacity: 0.8 });
      const rune = new THREE.Mesh(new THREE.CircleGeometry(0.06, 6), runeMat);
      rune.rotation.x = -Math.PI / 2;
      rune.position.set(Math.cos(a) * 0.85, -1.17, Math.sin(a) * 0.85);
      mainGrp.add(rune);
    }

    // Glow ring
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x9922ff, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.025, 12, 64), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.17;
    mainGrp.add(ring);

    // ── PARTICLES ──
    const pCount = 80;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 3.5;
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x9944ff, size: 0.04, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(pGeo, pMat);
    mainGrp.add(particles);

    // ── CHARACTER GROUP ──
    const charGrp = new THREE.Group();
    charGrp.position.y = -0.45;
    mainGrp.add(charGrp);

    // Body parts refs for animation / equipment update
    const bodyParts = buildCharacter(charGrp, equipment, charClass);
    sceneRef.current.bodyParts = bodyParts;
    sceneRef.current.charGrp = charGrp;
    sceneRef.current.mainGrp = mainGrp;
    sceneRef.current.ring = ring;
    sceneRef.current.particles = particles;

    // ── MOUSE ORBIT ──
    let isDragging = false;
    let prevX = 0;
    let rotY = 0;
    let targetRotY = 0;
    let zoomDist = 4.2;
    let targetZoom = 4.2;

    const onMouseDown = (e) => { isDragging = true; prevX = e.clientX; };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      targetRotY += (e.clientX - prevX) * 0.012;
      prevX = e.clientX;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e) => {
      targetZoom = Math.max(2.5, Math.min(6.0, targetZoom + e.deltaY * 0.005));
    };
    // Touch
    let prevTouchX = 0;
    const onTouchStart = (e) => { prevTouchX = e.touches[0].clientX; };
    const onTouchMove = (e) => {
      targetRotY += (e.touches[0].clientX - prevTouchX) * 0.012;
      prevTouchX = e.touches[0].clientX;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    // ── ANIMATION LOOP ──
    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = clock.getDelta();

      // Smooth orbit
      rotY += (targetRotY - rotY) * 0.08;
      mainGrp.rotation.y = rotY;

      // Smooth zoom
      zoomDist += (targetZoom - zoomDist) * 0.06;
      camera.position.z = zoomDist;

      // Breathing animation
      if (bodyParts.chest) {
        bodyParts.chest.scale.y = 1 + Math.sin(t * 1.4) * 0.025;
        bodyParts.chest.position.y = 0.85 + Math.sin(t * 1.4) * 0.008;
      }
      if (bodyParts.head) {
        bodyParts.head.position.y = 1.38 + Math.sin(t * 1.4) * 0.008;
        bodyParts.head.rotation.y = Math.sin(t * 0.4) * 0.06;
      }
      // Arm swing
      if (bodyParts.armL) bodyParts.armL.rotation.x = Math.sin(t * 0.7) * 0.05;
      if (bodyParts.armR) bodyParts.armR.rotation.x = -Math.sin(t * 0.7) * 0.05;
      // Hover float
      charGrp.position.y = -0.45 + Math.sin(t * 1.1) * 0.03;

      // Pedestal ring spin
      ring.rotation.z = t * 0.6;
      ring.material.opacity = 0.5 + Math.sin(t * 2) * 0.15;

      // Particles drift
      particles.rotation.y = t * 0.08;
      particles.position.y = Math.sin(t * 0.4) * 0.15;

      // Glow pulse on legendary
      if (bodyParts.glowLight) {
        bodyParts.glowLight.intensity = 0.6 + Math.sin(t * 3) * 0.3;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!el) return;
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [equipment, charClass]); // Re-build when equipment changes

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'grab', userSelect: 'none' }}
    />
  );
}

/* ── BUILD CHARACTER GEOMETRY ── */
function buildCharacter(group, equipment = {}, charClass = 'warrior') {
  // Clear group
  while (group.children.length > 0) group.remove(group.children[0]);

  // Class-based skin/armor tones
  const classColors = {
    warrior:  { skin: 0xd2a679, armor: 0x4a3828, metal: 0x888888 },
    guerriero:{ skin: 0xd2a679, armor: 0x4a3828, metal: 0x888888 },
    mage:     { skin: 0xc8a9d4, armor: 0x2d1b4e, metal: 0x7744aa },
    mago:     { skin: 0xc8a9d4, armor: 0x2d1b4e, metal: 0x7744aa },
    assassin: { skin: 0x9a8878, armor: 0x1a1a1a, metal: 0x333333 },
    assassino:{ skin: 0x9a8878, armor: 0x1a1a1a, metal: 0x333333 },
    healer:   { skin: 0xeac9a0, armor: 0x2a4a2a, metal: 0x88cc88 },
    curatore: { skin: 0xeac9a0, armor: 0x2a4a2a, metal: 0x88cc88 },
  };
  const cc = classColors[charClass] || classColors.warrior;

  // Determine rarity glow from equipped items
  let topRarity = 'common';
  const rarityOrder = ['legendary', 'admin', 'epic', 'rare', 'uncommon', 'common'];
  Object.values(equipment).forEach(item => {
    if (!item) return;
    if (rarityOrder.indexOf(item.rarity) < rarityOrder.indexOf(topRarity)) topRarity = item.rarity;
  });
  const rarCol = RARITY[topRarity]?.hex || 0x9ca3af;

  // Materials
  const skinMat  = new THREE.MeshStandardMaterial({ color: cc.skin,  roughness: 0.65, metalness: 0.05 });
  const armorMat = new THREE.MeshStandardMaterial({ color: cc.armor, roughness: 0.75, metalness: 0.3  });
  const metalMat = new THREE.MeshStandardMaterial({ color: cc.metal, roughness: 0.3,  metalness: 0.85 });
  const bootMat  = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.85, metalness: 0.1  });

  // — Torso
  const torsoGeo = new THREE.CylinderGeometry(0.22, 0.18, 0.62, 16);
  const chest = new THREE.Mesh(torsoGeo, armorMat);
  chest.position.y = 0.85; chest.castShadow = true;

  // Chest plate detail
  const plateGeo = new THREE.BoxGeometry(0.28, 0.3, 0.05);
  const plateMat = new THREE.MeshStandardMaterial({ color: rarCol, metalness: 0.9, roughness: 0.2 });
  const chestPlate = new THREE.Mesh(plateGeo, plateMat);
  chestPlate.position.set(0, 0.9, 0.22);
  group.add(chestPlate);

  // — Belt
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.06, 16), metalMat);
  belt.position.y = 0.58; belt.castShadow = true;

  // — Hips
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.18, 16), armorMat);
  hips.position.y = 0.45;

  // — Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.38;
  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.27, 0.25),
    [skinMat, skinMat, skinMat, skinMat, skinMat, skinMat]
  );
  headGroup.add(headMesh);

  // Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x88aaff });
  [-0.07, 0.07].forEach(x => {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8), eyeMat);
    eye.position.set(x, 0.04, 0.128);
    headGroup.add(eye);
  });
  // Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), skinMat);
  nose.position.set(0, -0.03, 0.135);
  headGroup.add(nose);

  // — Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 12), skinMat);
  neck.position.y = 1.22;

  // — Shoulders
  const makeShoulder = (side) => {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), armorMat);
    sh.position.set(side * 0.31, 1.1, 0); sh.castShadow = true;
    const shPlate = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), plateMat);
    shPlate.position.copy(sh.position);
    group.add(shPlate);
    return sh;
  };

  // — Arms
  const makeArm = (side) => {
    const armGrp = new THREE.Group();
    armGrp.position.set(side * 0.33, 1.0, 0);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 12), armorMat);
    upper.position.y = -0.19; upper.rotation.z = side * 0.18;
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), metalMat);
    elbow.position.y = -0.38;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.34, 12), armorMat);
    lower.position.y = -0.55; lower.rotation.z = side * 0.1;

    armGrp.add(upper, elbow, lower);
    return armGrp;
  };

  // — Hands
  const makeHand = (side) => {
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.07), skinMat);
    hand.position.set(side * 0.42, 0.64, 0.04);
    // Fingers
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.07, 6), skinMat);
      finger.position.set(side * 0.42 + (f - 1.5) * 0.025, 0.595, 0.04);
      finger.rotation.x = Math.PI / 8;
      group.add(finger);
    }
    return hand;
  };

  // — Legs
  const makeLeg = (side) => {
    const legGrp = new THREE.Group();
    legGrp.position.set(side * 0.10, 0.36, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.42, 12), armorMat);
    thigh.position.y = 0;
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), metalMat);
    knee.position.y = -0.24;
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.055, 0.38, 12), armorMat);
    shin.position.y = -0.44;

    legGrp.add(thigh, knee, shin);
    return legGrp;
  };

  // — Boots
  const makeBoot = (side) => {
    const bootGrp = new THREE.Group();
    bootGrp.position.set(side * 0.10, -0.12, 0.02);
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.14, 12), bootMat);
    ankle.position.y = 0;
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), bootMat);
    sole.position.set(0, -0.1, 0.03);
    const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 8), bootMat);
    toe.position.set(0, -0.08, 0.14);
    toe.rotation.x = Math.PI / 6;
    bootGrp.add(ankle, sole, toe);
    return bootGrp;
  };

  const shL = makeShoulder(1);
  const shR = makeShoulder(-1);
  const armL = makeArm(1);
  const armR = makeArm(-1);
  const handL = makeHand(1);
  const handR = makeHand(-1);
  const legL = makeLeg(1);
  const legR = makeLeg(-1);
  const bootL = makeBoot(1);
  const bootR = makeBoot(-1);

  group.add(chest, belt, hips, headGroup, neck, shL, shR, armL, armR, handL, handR, legL, legR, bootL, bootR);

  // ── EQUIPMENT VISUALS ──
  const eqSword = equipment.sword;
  const eqHelmet = equipment.helmet;
  const eqShield = equipment.shield;

  // Weapon (right hand)
  if (eqSword) {
    const wCol = RARITY[eqSword.rarity]?.hex || 0xcccccc;
    const swordGrp = new THREE.Group();

    // Handle
    const hMat = new THREE.MeshStandardMaterial({ color: 0x3d2510, roughness: 0.8 });
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 8), hMat);
    handle.position.y = 0.11;

    // Guard
    const gMat = new THREE.MeshStandardMaterial({ color: wCol, metalness: 0.9, roughness: 0.2 });
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.04), gMat);
    guard.position.y = 0.22;

    // Blade
    const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xe8e8e8, metalness: 1.0, roughness: 0.05, clearcoat: 1 });
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.75, 4), bladeMat);
    blade.position.y = 0.6; blade.scale.z = 0.18;

    // Magic edge
    if (['rare','epic','legendary','admin'].includes(eqSword.rarity)) {
      const edgeMat = new THREE.MeshBasicMaterial({ color: wCol, transparent: true, opacity: 0.7 });
      const edge = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.76, 4), edgeMat);
      edge.position.y = 0.6; edge.scale.z = 0.2;
      swordGrp.add(edge);
    }

    swordGrp.add(handle, guard, blade);
    swordGrp.rotation.set(Math.PI / 2.2, 0, 0.2);
    swordGrp.position.set(0.50, 0.62, 0.1);
    group.add(swordGrp);
  }

  // Helmet
  if (eqHelmet) {
    const hCol = RARITY[eqHelmet.rarity]?.hex || 0x888888;
    const helmMat = new THREE.MeshStandardMaterial({ color: hCol, metalness: 0.85, roughness: 0.25 });
    const helmGrp = new THREE.Group();
    helmGrp.position.set(0, 1.38, 0);

    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.28, 0.29), helmMat);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.11, 0.30),
      new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.95 }));
    visor.position.y = 0.045;

    helmGrp.add(crown, visor);
    // Crest for legendary
    if (eqHelmet.rarity === 'legendary') {
      const crestMat = new THREE.MeshStandardMaterial({ color: hCol, emissive: hCol, emissiveIntensity: 0.5, metalness: 0.9 });
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), crestMat);
      crest.position.y = 0.22;
      helmGrp.add(crest);
    }
    group.add(helmGrp);
  }

  // Shield (left hand)
  if (eqShield) {
    const sCol = RARITY[eqShield.rarity]?.hex || 0x888888;
    const shieldMat = new THREE.MeshPhysicalMaterial({ color: sCol, metalness: 0.7, roughness: 0.4 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.1 });

    const shGrp = new THREE.Group();
    const shBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.06, 0.55, 3), shieldMat);
    shBase.rotation.z = Math.PI; shBase.scale.set(1, 1, 0.18);
    const shRim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.07, 0.57, 3), rimMat);
    shRim.rotation.z = Math.PI; shRim.scale.set(1, 1, 0.08); shRim.position.z = 0.015;
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8),
      new THREE.MeshStandardMaterial({ color: sCol, emissive: sCol, emissiveIntensity: 0.3 }));
    emblem.position.z = 0.04; emblem.rotation.x = Math.PI;

    shGrp.add(shBase, shRim, emblem);
    shGrp.position.set(-0.50, 0.62, 0.1);
    shGrp.rotation.y = Math.PI / 5;
    group.add(shGrp);
  }

  // Legendary glow light
  let glowLight = null;
  if (topRarity === 'legendary' || topRarity === 'admin') {
    glowLight = new THREE.PointLight(rarCol, 0.8, 3);
    glowLight.position.set(0, 1.0, 1.0);
    group.add(glowLight);
  }

  return { chest, head: headGroup, armL, armR, glowLight };
}

/* ════════════════════════════════════════
   ITEM CARD
════════════════════════════════════════ */
function ItemCard({ item, selected, onClick, dragging, onDragStart, onDragEnd }) {
  const rar = RARITY[item.rarity] || RARITY.common;
  const isLeg = item.rarity === 'legendary';
  const isEpic = item.rarity === 'epic';

  return (
    <motion.div
      layoutId={`item-${item.id}`}
      onClick={() => onClick(item)}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('itemId', item.id); onDragStart?.(item); }}
      onDragEnd={onDragEnd}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      whileTap={{ scale: 0.96 }}
      style={{
        border: `1.5px solid ${selected ? rar.color : rar.border}`,
        boxShadow: selected ? `0 0 16px ${rar.glow}, inset 0 0 8px ${rar.glow}` : 'none',
        background: selected
          ? `radial-gradient(circle at center, ${rar.glow} 0%, #0d0b18 80%)`
          : 'rgba(255,255,255,0.03)',
        cursor: 'grab',
        position: 'relative',
        borderRadius: 8,
        aspectRatio: '1',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Legendary shimmer */}
      {isLeg && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(120deg, transparent 30%, rgba(245,158,11,0.25) 50%, transparent 70%)',
          animation: 'shimmer 2.5s infinite',
        }} />
      )}
      {/* Epic glow pulse */}
      {isEpic && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(circle at center, rgba(168,85,247,0.15) 0%, transparent 70%)',
          animation: 'epicPulse 2s ease-in-out infinite',
        }} />
      )}

      {/* Item image */}
      <img
        src={getItemImage(item.item_id || item.id)}
        alt={item.name}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: selected ? 1 : 0.7 }}
        onError={e => { e.target.style.display = 'none'; }}
        draggable={false}
      />

      {/* Rarity dot */}
      <div style={{
        position: 'absolute', top: 4, right: 4, width: 7, height: 7,
        borderRadius: '50%', background: rar.color,
        boxShadow: `0 0 6px ${rar.color}`,
        zIndex: 5,
      }} />

      {/* Quantity */}
      {item.quantity > 1 && (
        <span style={{
          position: 'absolute', bottom: 2, right: 3, fontSize: 9, fontWeight: 700,
          color: '#fff', background: 'rgba(0,0,0,0.7)', borderRadius: 3, padding: '1px 4px',
          zIndex: 5,
        }}>{item.quantity}</span>
      )}

      {/* Equipped star */}
      {item.equipped && (
        <div style={{
          position: 'absolute', top: 3, left: 3, fontSize: 10, zIndex: 5,
          filter: 'drop-shadow(0 0 3px gold)',
        }}>⭐</div>
      )}

      {/* Name on hover */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 2px 2px', zIndex: 6, transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
      >
        <span style={{
          fontSize: 8, color: '#fff', fontWeight: 600, textAlign: 'center',
          lineHeight: 1.2, opacity: 0, transition: 'opacity 0.15s',
          padding: '1px 2px',
        }}
          ref={el => { if (el) { el.style.opacity = 0; el.parentElement.addEventListener('mouseenter', () => el.style.opacity = 1); el.parentElement.addEventListener('mouseleave', () => el.style.opacity = 0); } }}
        >{item.name}</span>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   ITEM DETAIL PANEL
════════════════════════════════════════ */
function ItemDetail({ item, equippedInSlot, onEquip, onUnequip, onClose, equipping }) {
  if (!item) return null;
  const rar = RARITY[item.rarity] || RARITY.common;
  const hasStats = item.stats && Object.values(item.stats).some(v => typeof v === 'number');
  const equipped = equippedInSlot;

  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        background: 'linear-gradient(135deg, #0d0b18 0%, #1a1030 100%)',
        border: `1.5px solid ${rar.color}44`,
        borderRadius: 14,
        padding: '18px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: `0 0 30px ${rar.glow}`,
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'absolute', top: 10, right: 10,
        background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16,
      }}>✕</button>

      {/* Hero image */}
      <div style={{
        width: '100%', height: 120, borderRadius: 10,
        background: `radial-gradient(circle at center, ${rar.glow} 0%, #050310 70%)`,
        border: `1px solid ${rar.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <img
          src={getItemImage(item.item_id || item.id)}
          alt={item.name}
          style={{ height: 96, width: 96, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {/* Legendary animated border */}
        {item.rarity === 'legendary' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, transparent 30%, rgba(245,158,11,0.3) 50%, transparent 70%)',
            animation: 'shimmer 2s infinite',
          }} />
        )}
      </div>

      {/* Name + rarity */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: rar.color, textTransform: 'uppercase', marginBottom: 3 }}>
          ✦ {rar.label} {item.slot || item.item_type || ''}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 11, color: '#9988aa', marginTop: 5, fontStyle: 'italic', lineHeight: 1.5 }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Stats */}
      {hasStats && (
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '10px 12px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#666', textTransform: 'uppercase', marginBottom: 8 }}>
            Statistiche
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(item.stats).filter(([, v]) => typeof v === 'number').map(([k, v]) => {
              // Comparison with equipped
              const equippedVal = equipped?.stats?.[k] || 0;
              const diff = v - equippedVal;
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {STAT_LABELS[k] || k.replace(/_/g, ' ')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {equipped && diff !== 0 && (
                      <span style={{ fontSize: 9, color: diff > 0 ? '#22C55E' : '#E63946', fontWeight: 700 }}>
                        {diff > 0 ? `▲+${diff}` : `▼${diff}`}
                      </span>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 800, color: rar.color }}>+{v}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipped comparison notice */}
      {equipped && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 6, padding: '6px 10px',
          fontSize: 10, color: '#8888aa',
        }}>
          ⚔ Equipaggiato: <span style={{ color: RARITY[equipped.rarity]?.color || '#fff' }}>{equipped.name}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        {item.slot && !item.equipped && (
          <button
            onClick={() => onEquip(item)}
            disabled={equipping}
            style={{
              padding: '10px 0',
              background: `linear-gradient(135deg, ${rar.color}33 0%, ${rar.color}55 100%)`,
              border: `1px solid ${rar.color}`,
              borderRadius: 8, color: rar.color,
              fontWeight: 800, fontSize: 12, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              boxShadow: `0 0 15px ${rar.glow}`,
              transition: 'all 0.15s',
              opacity: equipping ? 0.5 : 1,
            }}
          >
            {equipping ? '⏳ ...' : `⚔ Equipaggia — ${(item.slot || '').toUpperCase()}`}
          </button>
        )}
        {item.equipped && (
          <button
            onClick={() => onUnequip(item.slot)}
            disabled={equipping}
            style={{
              padding: '10px 0',
              background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.5)',
              borderRadius: 8, color: '#E63946',
              fontWeight: 800, fontSize: 12, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              opacity: equipping ? 0.5 : 1,
            }}
          >
            {equipping ? '...' : '✕ Rimuovi'}
          </button>
        )}
        {item.item_type === 'consumable' && (
          <button style={{
            padding: '10px 0', background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.5)', borderRadius: 8,
            color: '#22C55E', fontWeight: 800, fontSize: 12, cursor: 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            🧪 Usa Oggetto
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════
   EQUIPMENT SLOT WIDGET
════════════════════════════════════════ */
function EquipSlotWidget({ slot, equipped, selected, onSelect, onDrop }) {
  const rar = equipped ? (RARITY[equipped.rarity] || RARITY.common) : null;

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e) => { e.preventDefault(); const itemId = e.dataTransfer.getData('itemId'); onDrop?.(itemId, slot.id); };

  return (
    <div
      onClick={() => onSelect(slot)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
        border: `1.5px solid ${selected ? (rar?.color || '#ffffff55') : 'rgba(255,255,255,0.08)'}`,
        background: selected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        boxShadow: selected && rar ? `0 0 12px ${rar.glow}` : 'none',
        transition: 'all 0.15s',
      }}
    >
      {/* Icon preview */}
      <div style={{
        width: 42, height: 42, borderRadius: 8, flexShrink: 0,
        border: `1px solid ${rar?.color || 'rgba(255,255,255,0.1)'}`,
        background: rar ? `radial-gradient(circle, ${rar.glow} 0%, #0a080f 70%)` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: equipped ? undefined : 18,
        overflow: 'hidden', position: 'relative',
      }}>
        {equipped
          ? <img src={getItemImage(equipped.item_id || equipped.id)} alt={equipped.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; }} />
          : <span style={{ opacity: 0.25 }}>{slot.icon}</span>
        }
        {equipped && rar && (
          <div style={{ position: 'absolute', bottom: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: rar.color }} />
        )}
      </div>

      {/* Labels */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#555', textTransform: 'uppercase' }}>
          {slot.label}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: rar?.color || '#444',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {equipped ? equipped.name : 'Vuoto'}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function InventorySystem3D() {
  const { character } = useAuth();
  const { inventory, fetchInventory } = useGame();
  const { refreshCharacter } = useAuth();

  const [equipment, setEquipment] = useState({});
  const [category, setCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [equipping, setEquipping] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEquipment();
    fetchInventory?.();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/equipment`);
      setEquipment(res.data.equipment || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleEquip = async (item) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/equip`, { item_id: item.id, slot: item.slot });
      toast.success(`${item.name} equipaggiato!`);
      await fetchEquipment(); await fetchInventory?.(); await refreshCharacter?.();
      setSelectedItem(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Errore equipaggiamento'); }
    finally { setEquipping(false); }
  };

  const handleUnequip = async (slot) => {
    setEquipping(true);
    try {
      await axios.post(`${API}/equipment/unequip/${slot}`);
      toast.success('Oggetto rimosso!');
      await fetchEquipment(); await fetchInventory?.(); await refreshCharacter?.();
      setSelectedItem(null); setSelectedSlot(null);
    } catch (e) { toast.error(e.response?.data?.detail || 'Errore'); }
    finally { setEquipping(false); }
  };

  const handleDropOnSlot = async (itemId, slot) => {
    const item = filteredItems.find(i => String(i.id) === String(itemId));
    if (!item || item.slot !== slot) { toast.error('Oggetto non compatibile con questo slot!'); return; }
    await handleEquip(item);
  };

  // Filter inventory
  const catDef = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const filteredItems = useMemo(() => {
    const all = inventory || [];
    return all.filter(catDef.filter).sort((a, b) => {
      const ro = { admin: 0, legendary: 1, epic: 2, rare: 3, uncommon: 4, common: 5 };
      return (ro[a.rarity] || 6) - (ro[b.rarity] || 6);
    });
  }, [inventory, category]);

  // Total gear stats
  const totalBonus = useMemo(() => {
    const bonus = {};
    Object.values(equipment).forEach(item => {
      if (!item?.stats) return;
      Object.entries(item.stats).forEach(([k, v]) => { if (typeof v === 'number') bonus[k] = (bonus[k] || 0) + v; });
    });
    return bonus;
  }, [equipment]);

  // Active item for detail panel (from inventory selection or slot selection)
  const detailItem = selectedItem || (selectedSlot ? equipment[selectedSlot.id] : null);
  const equippedInSlot = detailItem?.slot ? equipment[detailItem.slot] : null;

  const charClass = character?.char_class || 'warrior';

  return (
    <div style={{
      width: '100%', height: '88vh',
      background: 'linear-gradient(135deg, #07050f 0%, #0d0b1a 50%, #080612 100%)',
      borderRadius: 14,
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* CSS animations */}
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes epicPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes legendaryBorder { 0%,100%{box-shadow: 0 0 8px rgba(245,158,11,0.5)} 50%{box-shadow: 0 0 24px rgba(245,158,11,0.9)} }
        @keyframes floatUp { 0%{transform:translateY(0)} 50%{transform:translateY(-8px)} 100%{transform:translateY(0)} }
        .inv3d-scroll::-webkit-scrollbar{width:3px}
        .inv3d-scroll::-webkit-scrollbar-thumb{background:#ffffff18;border-radius:3px}
        .slot-drop-target:hover{background:rgba(255,255,255,0.08)!important}
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 350, height: 350, top: -80, left: -80, borderRadius: '50%', background: 'rgba(100,50,200,0.07)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, bottom: -60, right: -60, borderRadius: '50%', background: 'rgba(50,100,200,0.07)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, top: '40%', left: '35%', borderRadius: '50%', background: 'rgba(200,100,50,0.04)', filter: 'blur(50px)' }} />
      </div>

      {/* ── HEADER ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #B58E29)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#0B0914',
          }}>{character?.level || '?'}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{character?.name || 'Personaggio'}</div>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'capitalize' }}>
              {character?.race} · {character?.char_class}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          ⚔ Inventario 3D
        </div>

        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: '#F59E0B', fontWeight: 700 }}>🪙 {(character?.gold || 0).toLocaleString()}</span>
          <span style={{ color: '#EF4444', fontWeight: 700 }}>♥ {character?.hp}/{character?.max_hp}</span>
          <span style={{ color: '#3B82F6', fontWeight: 700 }}>✦ {character?.mana}/{character?.max_mana}</span>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 5 }}>

        {/* ═══ LEFT: Inventory Grid ═══ */}
        <div style={{
          width: 268, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.25)', flexShrink: 0,
        }}>
          {/* Category tabs */}
          <div style={{
            display: 'flex', overflowX: 'auto', gap: 3, padding: '8px 8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  flexShrink: 0, padding: '5px 8px',
                  borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  background: category === cat.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: category === cat.id ? '#fff' : '#444',
                  borderBottom: category === cat.id ? '2px solid #D4AF37' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ marginRight: 3 }}>{cat.icon}</span>
                <span style={{ display: category === cat.id ? 'inline' : 'none' }}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Count */}
          <div style={{ padding: '6px 12px 4px', fontSize: 9, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {catDef.label} — {filteredItems.length} oggetti
          </div>

          {/* Grid */}
          <div className="inv3d-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItem?.id === item.id}
                  onClick={(i) => { setSelectedItem(i); setSelectedSlot(null); }}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
              {filteredItems.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#333', fontSize: 12 }}>
                  {loading ? '⏳ Caricamento...' : 'Inventario vuoto'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: 3D Character Preview ═══ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 8px 8px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse at center 40%, rgba(80,40,160,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* 3D Viewer */}
          <div style={{ flex: 1, width: '100%', maxWidth: 320, borderRadius: 12, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            <CharacterViewer3D equipment={equipment} charClass={charClass} />
            {/* Drag hint */}
            <div style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.1em',
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              ← TRASCINA PER RUOTARE · SCROLL PER ZOOM →
            </div>
          </div>

          {/* Bottom stats bar */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 12px',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)',
            width: '100%', maxWidth: 380, flexShrink: 0, zIndex: 1,
          }}>
            {[
              { label: 'HP', v: character?.hp, max: character?.max_hp, col: '#EF4444', icon: '♥' },
              { label: 'MANA', v: character?.mana, max: character?.max_mana, col: '#3B82F6', icon: '✦' },
              { label: 'XP', v: character?.xp, max: character?.level * 100, col: '#A855F7', icon: '⚡' },
              { label: 'ATK', v: (character?.strength || 0) + (totalBonus.damage || 0), col: '#F59E0B', icon: '⚔' },
              { label: 'DEF', v: (character?.defense || 0) + (totalBonus.defense || 0), col: '#2A9D8F', icon: '🛡' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: s.col }}>{s.icon} {s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{s.v ?? '—'}</span>
                {s.max && (
                  <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}>
                    <div style={{ height: '100%', borderRadius: 1, background: s.col, width: `${Math.min(100, ((s.v || 0) / s.max) * 100)}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ RIGHT: Equipment Slots + Detail ═══ */}
        <div style={{
          width: 260, display: 'flex', flexDirection: 'column',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(0,0,0,0.25)', flexShrink: 0,
        }}>
          {/* Equipment slots */}
          <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
              Equipaggiamento
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {EQUIP_SLOTS.map(slot => (
                <EquipSlotWidget
                  key={slot.id}
                  slot={slot}
                  equipped={equipment[slot.id]}
                  selected={selectedSlot?.id === slot.id}
                  onSelect={(s) => { setSelectedSlot(s); setSelectedItem(null); }}
                  onDrop={handleDropOnSlot}
                />
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="inv3d-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px', position: 'relative' }}>
            <AnimatePresence mode="wait">
              {detailItem ? (
                <ItemDetail
                  key={detailItem.id}
                  item={detailItem}
                  equippedInSlot={detailItem.slot ? (equippedInSlot?.id !== detailItem.id ? equippedInSlot : null) : null}
                  onEquip={handleEquip}
                  onUnequip={handleUnequip}
                  onClose={() => { setSelectedItem(null); setSelectedSlot(null); }}
                  equipping={equipping}
                />
              ) : (
                <motion.div key="gear-summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Gear bonus summary */}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginBottom: 10 }}>
                    Bonus Equipaggiamento
                  </div>
                  {Object.entries(totalBonus).length > 0
                    ? Object.entries(totalBonus).map(([k, v]) => (
                        <div key={k} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {STAT_LABELS[k] || k.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: '#22C55E' }}>+{v}</span>
                        </div>
                      ))
                    : <p style={{ fontSize: 11, color: '#333', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                        Nessun equipaggiamento attivo.<br/>
                        <span style={{ fontSize: 9 }}>Seleziona un oggetto dall'inventario.</span>
                      </p>
                  }

                  {/* All character stats */}
                  <div style={{ marginTop: 16, fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: '#444', textTransform: 'uppercase', marginBottom: 8 }}>
                    Statistiche Personaggio
                  </div>
                  {[
                    { k: 'Forza', v: character?.strength, col: '#F59E0B' },
                    { k: 'Intelligenza', v: character?.intelligence, col: '#A855F7' },
                    { k: 'Agilità', v: character?.agility, col: '#2A9D8F' },
                    { k: 'Difesa', v: character?.defense, col: '#3B82F6' },
                    { k: 'Velocità', v: character?.speed || character?.agility, col: '#22C55E' },
                  ].map(s => (
                    <div key={s.k} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <span style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.k}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: s.col }}>{s.v ?? '—'}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shortcut hints */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 9, color: '#333', flexShrink: 0,
          }}>
            <span>DRAG → Slot per equipaggiare</span>
            <span>[ESC] Chiudi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
