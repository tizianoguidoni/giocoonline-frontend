import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { assetManager } from '../../game/AssetManager';
import { buildViewmodelFor } from '../../game/weapons';

export function CharacterPreview({ equipment = {}, className = "", style = {} }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;
    
    const w = currentRef.clientWidth || 300;
    const h = currentRef.clientHeight || 300;
    
    const scene = new THREE.Scene();
    
    // Premium dark/transparent background
    scene.background = null; // Transparent to blend with CSS
    
    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 1.3, 4.5);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0); // Transparent background
    currentRef.appendChild(renderer.domElement);
    
    // RARITY COLORS MAP
    const RARITY_COLORS = {
      common: 0x9ca3af,
      uncommon: 0x22c55e,
      rare: 0x3b82f6,
      epic: 0xa855f7,
      legendary: 0xd4af37,
      admin: 0xe63946
    };

    // Determine highest rarity color
    let mainColor = RARITY_COLORS.common;
    const rarities = [equipment.sword?.rarity, equipment.helmet?.rarity, equipment.shield?.rarity].filter(Boolean);
    if (rarities.includes('admin')) mainColor = RARITY_COLORS.admin;
    else if (rarities.includes('legendary')) mainColor = RARITY_COLORS.legendary;
    else if (rarities.includes('epic')) mainColor = RARITY_COLORS.epic;
    else if (rarities.includes('rare')) mainColor = RARITY_COLORS.rare;
    else if (rarities.includes('uncommon')) mainColor = RARITY_COLORS.uncommon;

    // Premium Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambLight);
    
    const dirLight = new THREE.DirectionalLight(mainColor, 2.0); 
    dirLight.position.set(5, 8, 4);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x7b2cbf, 5, 10); // Intense Purple rim
    rimLight.position.set(-3, 3, -4);
    scene.add(rimLight);
    
    const floorLight = new THREE.PointLight(mainColor, 3, 5); 
    floorLight.position.set(0, -1.5, 0);
    scene.add(floorLight);

    // Character Group & Pedestal
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    
    // Magic glowing pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.1, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a1525, 
      metalness: 0.8, 
      roughness: 0.2,
      emissive: mainColor,
      emissiveIntensity: 0.2
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.2;
    mainGroup.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(1.2, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: mainColor });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -1.15;
    ring.rotation.x = Math.PI / 2;
    mainGroup.add(ring);

    // Particle Effects
    const particleCount = 50;
    const particlesGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 3;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      color: mainColor,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particleMesh = new THREE.Points(particlesGeo, particlesMat);
    mainGroup.add(particleMesh);

    const charGroup = new THREE.Group();
    mainGroup.add(charGroup);
    
    let charModel, mixer, sword;
    let animatedItems = []; // To store items for scale-up animation

    if (assetManager.isLoaded && assetManager.getCharacterModel) {
      charModel = assetManager.getCharacterModel();
      if (charModel) {
        // Setup Mixer for idle animation
        if (charModel.animations && charModel.animations.length > 0) {
          mixer = new THREE.AnimationMixer(charModel);
          const idleClip = charModel.animations.find(c => c.name.toLowerCase().includes('idle'));
          if (idleClip) mixer.clipAction(idleClip).play();
        }

        // Apply equipment visuals
        const wId = equipment.sword?.item_id || equipment.sword?.id;
        if (wId) {
          if (wId === 'shortsword' || wId === 'soulblade') {
            sword = assetManager.getSwordModel();
            if (sword) {
              sword.scale.setScalar(0.001); // Start small for animation
              animatedItems.push({ mesh: sword, targetScale: 0.015 });
              const rHand = charModel.getObjectByName('RightHand') || charModel.getObjectByName('hand_r');
              if (rHand) {
                  rHand.add(sword);
                  sword.rotation.set(Math.PI/2, 0, 0);
              } else {
                  charModel.add(sword);
                  sword.position.set(0.4, 1.1, 0.2);
              }
            }
          } else {
            const fallBackWeapon = buildViewmodelFor(wId);
            if (fallBackWeapon) {
              fallBackWeapon.scale.setScalar(0.001);
              animatedItems.push({ mesh: fallBackWeapon, targetScale: 0.5 });
              fallBackWeapon.position.set(0.4, 0.8, 0.5);
              charModel.add(fallBackWeapon);
            }
          }
        }

        // Helmet placeholder
        const hId = equipment.helmet?.item_id || equipment.helmet?.id;
        if (hId) {
          const headBone = charModel.getObjectByName('Head') || charModel.getObjectByName('head');
          const helmMat = new THREE.MeshStandardMaterial({ color: equipment.helmet?.rarity === 'legendary' ? 0xd4af37 : 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
          const helmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16), helmMat);
          helmMesh.scale.setScalar(0.001);
          animatedItems.push({ mesh: helmMesh, targetScale: 1.0 });
          if (headBone) {
            headBone.add(helmMesh);
            helmMesh.position.y += 0.1;
          } else {
            charModel.add(helmMesh);
            helmMesh.position.set(0, 1.7, 0);
          }
        }

        // Shield placeholder
        const sId = equipment.shield?.item_id || equipment.shield?.id;
        if (sId) {
          const lHand = charModel.getObjectByName('LeftHand') || charModel.getObjectByName('hand_l');
          const shieldMat = new THREE.MeshStandardMaterial({ color: mainColor, metalness: 0.5, roughness: 0.5 });
          const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), shieldMat);
          shieldMesh.scale.setScalar(0.001);
          animatedItems.push({ mesh: shieldMesh, targetScale: 1.0 });
          if (lHand) {
            lHand.add(shieldMesh);
          } else {
            charModel.add(shieldMesh);
            shieldMesh.position.set(-0.4, 1.1, 0.2);
          }
        }
        
        charModel.position.y = -0.5; // Center vertically
        charGroup.add(charModel);
      }
    } 
    
    // Fallback if no assetManager or model fails (Humanoid Mannequin)
    if (charGroup.children.length === 0) {
      // Skin material
      const textureLoader = new THREE.TextureLoader();
      const faceTexture = textureLoader.load('/icons/face.png');
      
      const skinMat = new THREE.MeshStandardMaterial({ 
        color: 0xd2b48c, // Skin tone
        roughness: 0.6,
        metalness: 0.1
      });

      const faceMat = new THREE.MeshStandardMaterial({
        map: faceTexture,
        roughness: 0.6,
        metalness: 0.1
      });
      
      // Leather Armor material
      const armorMat = new THREE.MeshStandardMaterial({ 
        color: 0x3d2b1f, // Dark leather brown
        roughness: 0.8,
        metalness: 0.3
      });

      // Iron detail material
      const ironMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.4 });
      
      // Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16), armorMat);
      torso.position.y = 0.9;
      
      // Belt
      const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16), ironMat);
      belt.position.y = 0.6;

      // Head
      // Use array of materials for sphere: map doesn't map perfectly on sphere, but better on box or specific uv.
      // A BoxGeometry with face on front is easier for pixel art / face texture
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), [
        skinMat, // right
        skinMat, // left
        skinMat, // top
        skinMat, // bottom
        faceMat, // front
        skinMat  // back
      ]);
      head.position.y = 1.35;
      
      // Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 16), skinMat);
      neck.position.y = 1.2;

      // Arms (Shoulders + Arms)
      const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), armorMat);
      shoulderL.position.set(0.25, 1.1, 0);
      const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 16), armorMat);
      armL.position.set(0.35, 0.9, 0);
      armL.rotation.z = Math.PI / 8;
      
      const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), armorMat);
      shoulderR.position.set(-0.25, 1.1, 0);
      const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 16), armorMat);
      armR.position.set(-0.35, 0.9, 0);
      armR.rotation.z = -Math.PI / 8;

      // Hands
      const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), skinMat);
      handL.position.set(0.45, 0.65, 0);
      const handR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), skinMat);
      handR.position.set(-0.45, 0.65, 0);

      // Legs
      const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 16), armorMat);
      legL.position.set(0.1, 0.35, 0);
      const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 16), armorMat);
      legR.position.set(-0.1, 0.35, 0);

      // Feet
      const footL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.15), ironMat);
      footL.position.set(0.1, 0.05, 0.02);
      const footR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.15), ironMat);
      footR.position.set(-0.1, 0.05, 0.02);

      charGroup.add(torso, belt, head, neck, shoulderL, shoulderR, armL, armR, handL, handR, legL, legR, footL, footR);
      charGroup.position.y = -0.5;

      // Re-apply equipment visuals to procedural mesh
      const wId = equipment.sword?.item_id || equipment.sword?.id;
      if (wId) {
        // Detailed Procedural Sword
        const swordGroup = new THREE.Group();
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const guardMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xe0e0e0, metalness: 1.0, roughness: 0.1, clearcoat: 1.0 });

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), handleMat);
        handle.position.y = 0.1;
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), guardMat);
        guard.position.y = 0.2;
        
        // Blade (flattened cone)
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.8, 4), bladeMat);
        blade.position.y = 0.6;
        blade.scale.set(1, 1, 0.2); // flatten

        // Magic core
        const coreMat = new THREE.MeshBasicMaterial({ color: mainColor });
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.04), coreMat);
        core.position.y = 0.2;
        core.position.z = 0.03;

        swordGroup.add(handle, guard, blade, core);
        swordGroup.scale.setScalar(0.001);
        animatedItems.push({ mesh: swordGroup, targetScale: 0.6 });
        // Place in right hand (which is left side of screen)
        swordGroup.position.set(0.45, 0.65, 0.1); 
        swordGroup.rotation.set(Math.PI/2.5, 0, 0);
        charGroup.add(swordGroup);
      }

      const hId = equipment.helmet?.item_id || equipment.helmet?.id;
      if (hId) {
        const helmMat = new THREE.MeshStandardMaterial({ color: equipment.helmet?.rarity === 'legendary' ? 0xd4af37 : 0x444444, metalness: 0.8, roughness: 0.3 });
        // Replace halo with a proper helmet shape
        const helmGroup = new THREE.Group();
        const helmBase = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.27, 0.27), helmMat);
        const helmVisor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), new THREE.MeshStandardMaterial({color: 0x111111, metalness: 0.9}));
        helmVisor.position.y = 0.05;
        helmGroup.add(helmBase, helmVisor);
        
        helmGroup.scale.setScalar(0.001);
        animatedItems.push({ mesh: helmGroup, targetScale: 1.0 });
        helmGroup.position.set(0, 1.35, 0); // On head
        charGroup.add(helmGroup);
      }

      const sId = equipment.shield?.item_id || equipment.shield?.id;
      if (sId) {
        // Detailed Procedural Shield
        const shieldGroup = new THREE.Group();
        const shieldBaseMat = new THREE.MeshPhysicalMaterial({ color: 0x2d283e, metalness: 0.6, roughness: 0.5 });
        const shieldRimMat = new THREE.MeshStandardMaterial({ color: mainColor, metalness: 0.9, roughness: 0.2 });
        
        // Kite shield shape
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.05, 0.7, 3), shieldBaseMat);
        base.rotation.z = Math.PI; // Point down
        base.scale.set(1, 1, 0.2); // Flatten
        
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.06, 0.72, 3), shieldRimMat);
        rim.rotation.z = Math.PI;
        rim.scale.set(1, 1, 0.1);
        rim.position.z = 0.02;

        const crest = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), shieldRimMat);
        crest.position.set(0, 0, 0.05);

        shieldGroup.add(base, rim, crest);
        shieldGroup.scale.setScalar(0.001);
        animatedItems.push({ mesh: shieldGroup, targetScale: 0.8 });
        shieldGroup.rotation.y = -Math.PI / 6;
        shieldGroup.position.set(-0.45, 0.65, 0.1); // On left arm
        charGroup.add(shieldGroup);
      }

    }
    
    // Subtle rotation and floating animation
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.elapsedTime;
      if (mixer) mixer.update(delta);
      
      // Animate equipment pop-in
      animatedItems.forEach(item => {
        if (item.mesh.scale.x < item.targetScale) {
          const newScale = Math.min(item.targetScale, item.mesh.scale.x + delta * 2.0);
          item.mesh.scale.setScalar(newScale);
        }
      });

      
      // Floating pedestal ring and particles
      ring.rotation.z = time * 0.5;
      ring.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
      
      particleMesh.rotation.y = time * 0.1;
      particleMesh.position.y = Math.sin(time * 0.5) * 0.2;

      // Slowly rotate and float character
      charGroup.rotation.y = Math.sin(time * 0.5) * 0.2;
      charGroup.position.y = Math.sin(time * 1.5) * 0.05; // Hovering
      
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!currentRef) return;
      renderer.setSize(currentRef.clientWidth, currentRef.clientHeight);
      camera.aspect = currentRef.clientWidth / currentRef.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (currentRef && renderer.domElement && currentRef.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [equipment]); // Re-render when equipment changes

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', ...style }} />;
}
