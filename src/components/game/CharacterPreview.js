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
    
    // Premium Lighting (Gold/Purple highlights)
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);
    
    const dirLight = new THREE.DirectionalLight(0xd4af37, 1.5); // Gold light
    dirLight.position.set(5, 5, 2);
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0x7b2cbf, 2, 10); // Purple rim
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    // Character Group
    const charGroup = new THREE.Group();
    scene.add(charGroup);
    
    let charModel, mixer, sword;

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
              sword.scale.setScalar(0.015);
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
              fallBackWeapon.scale.setScalar(0.5);
              fallBackWeapon.position.set(0.4, 0.8, 0.5);
              charModel.add(fallBackWeapon);
            }
          }
        }

        // Helmet placeholder (Crown if legendary, etc.)
        const hId = equipment.helmet?.item_id || equipment.helmet?.id;
        if (hId) {
          const headBone = charModel.getObjectByName('Head') || charModel.getObjectByName('head');
          const helmMat = new THREE.MeshStandardMaterial({ color: equipment.helmet?.rarity === 'legendary' ? 0xd4af37 : 0xaaaaaa, metalness: 0.8, roughness: 0.2 });
          const helmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16), helmMat);
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
          const shieldMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.5 });
          const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), shieldMat);
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
    
    // Fallback if no assetManager or model fails
    if (charGroup.children.length === 0) {
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
      const clothesMat = new THREE.MeshStandardMaterial({ color: 0x2d283e, roughness: 0.9 });
      
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), clothesMat);
      torso.position.y = 1.05;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), skinMat);
      head.position.y = 1.6;
      
      charGroup.add(torso, head);
      charGroup.position.y = -0.5;
    }
    
    // Subtle rotation
    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);
      
      // Slowly rotate character
      charGroup.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.2;
      
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
