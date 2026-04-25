import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  stoneBrickTexture, 
  woodPlankTexture, 
  darkWoodTexture, 
  plasterTexture 
} from "./textures";
import { buildMonster, animateMonster, MonsterState } from "./monsters";

/**
 * RPG House Scene
 * Interactive room with low-poly monsters and procedural textures.
 */

export const HouseScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chestOpen, setChestOpen] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- Core Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050508");
    scene.fog = new THREE.FogExp2("#050508", 0.05);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 5);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // --- Lighting ---
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xffaa44, 2, 15);
    pointLight.position.set(0, 2.5, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    // --- Room Construction ---
    const floorSize = 10;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({ map: woodPlankTexture(4), roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallH = 4;
    const wallMat = new THREE.MeshStandardMaterial({ map: plasterTexture(2), roughness: 0.9 });
    
    // Walls
    const wallNorth = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, wallH), wallMat);
    wallNorth.position.set(0, wallH / 2, -floorSize / 2);
    scene.add(wallNorth);

    const wallSouth = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, wallH), wallMat);
    wallSouth.position.set(0, wallH / 2, floorSize / 2);
    wallSouth.rotation.y = Math.PI;
    scene.add(wallSouth);

    const wallEast = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, wallH), wallMat);
    wallEast.position.set(floorSize / 2, wallH / 2, 0);
    wallEast.rotation.y = -Math.PI / 2;
    scene.add(wallEast);

    const wallWest = new THREE.Mesh(new THREE.PlaneGeometry(floorSize, wallH), wallMat);
    wallWest.position.set(-floorSize / 2, wallH / 2, 0);
    wallWest.rotation.y = Math.PI / 2;
    scene.add(wallWest);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(floorSize, floorSize),
      new THREE.MeshStandardMaterial({ map: darkWoodTexture(4), roughness: 1 })
    );
    ceiling.position.y = wallH;
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // --- Interactive Chest ---
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 0, 0);
    scene.add(chestGroup);

    const chestBase = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.5, 0.6),
      new THREE.MeshStandardMaterial({ color: "#5d4037", flatShading: true })
    );
    chestBase.position.y = 0.25;
    chestBase.castShadow = true;
    chestGroup.add(chestBase);

    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.5, -0.3);
    chestGroup.add(lidPivot);

    const chestLid = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.2, 0.6),
      new THREE.MeshStandardMaterial({ color: "#795548", flatShading: true })
    );
    chestLid.position.set(0, 0.1, 0.3);
    chestLid.castShadow = true;
    lidPivot.add(chestLid);

    // --- Monsters ---
    const monsters: THREE.Group[] = [];
    const kinds = ["goblin", "skeleton", "slime", "orc"];
    kinds.forEach((k, i) => {
      const m = buildMonster(k);
      m.position.set(-3 + i * 2, 0, -2);
      m.userData.state = "walk";
      scene.add(m);
      monsters.push(m);
    });

    // --- Controls State ---
    const keys = { w: false, a: false, s: false, d: false };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key.toLowerCase() in keys) (keys as any)[e.key.toLowerCase()] = true; };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key.toLowerCase() in keys) (keys as any)[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = () => {
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.intersectObjects([chestBase, chestLid], true);
      if (intersects.length > 0) {
        setChestOpen(prev => !prev);
      }
    };
    window.addEventListener("click", onClick);

    // --- Animation Loop ---
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.016;

      // Lid Animation
      const targetRot = chestOpen ? -Math.PI / 2 : 0;
      lidPivot.rotation.x = THREE.MathUtils.lerp(lidPivot.rotation.x, targetRot, 0.1);

      // Monster Animations
      monsters.forEach((m, i) => {
        animateMonster(m, m.userData.state as MonsterState, time, (time + i) % 1);
      });

      // Player Movement (Basic)
      const moveSpeed = 0.1;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      const side = new THREE.Vector3().crossVectors(camera.up, dir).normalize();

      if (keys.w) camera.position.addScaledVector(dir, moveSpeed);
      if (keys.s) camera.position.addScaledVector(dir, -moveSpeed);
      if (keys.a) camera.position.addScaledVector(side, moveSpeed);
      if (keys.d) camera.position.addScaledVector(side, -moveSpeed);

      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup ---
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("click", onClick);
      renderer.dispose();
    };
  }, [chestOpen]);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      <div style={{
        position: "absolute", top: 20, left: 20, color: "white", 
        fontFamily: "sans-serif", background: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 8
      }}>
        <h2 style={{ margin: 0 }}>Fantasy RPG Low-Poly</h2>
        <p>WASD per muoverti | Click sul baule per aprirlo</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {["Goblin", "Skeleton", "Slime", "Orc"].map(m => (
            <span key={m} style={{ padding: "4px 8px", background: "#444", borderRadius: 4, fontSize: 12 }}>{m}</span>
          ))}
        </div>
      </div>
      <div style={{
        position: "absolute", top: "50%", left: "50%", width: 10, height: 10,
        border: "2px solid white", borderRadius: "50%", transform: "translate(-50%, -50%)",
        pointerEvents: "none"
      }} />
    </div>
  );
};
