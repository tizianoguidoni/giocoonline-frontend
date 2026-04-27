import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, PointerLockControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { assetManager } from '@/game/AssetManager';
import { Enemy } from '@/game/enemies';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Heart, Zap, Trophy, X, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ───────────────── Arena Environment ───────────────── */
function Environment() {
  return (
    <group>
      {/* Floor - Circular Stone Arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 64]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Outer Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[20, 25, 64]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Pillars around the arena */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 19;
        const z = Math.sin(angle) * 19;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 4, 0]} castShadow>
              <boxGeometry args={[1.5, 8, 1.5]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <pointLight position={[0, 8.5, 0]} color="#44aaff" intensity={2} distance={10} />
            <mesh position={[0, 8.2, 0]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color="#44aaff" transparent opacity={0.8} />
            </mesh>
          </group>
        );
      })}

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sky sunPosition={[100, 10, 100]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={1024} />
    </group>
  );
}

/* ───────────────── Player Controller ───────────────── */
function Player({ controlsRef }) {
  const { camera } = useThree();
  const keys = useRef({});
  const MOVE_SPEED = 6.5;

  useEffect(() => {
    camera.position.set(0, 1.6, 15);
    const onDown = (e) => { keys.current[e.code] = true; };
    const onUp = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [camera]);

  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked) return;
    const k = keys.current;
    const dir = new THREE.Vector3();
    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    front.y = 0; front.normalize();
    const right = new THREE.Vector3().crossVectors(front, new THREE.Vector3(0, 1, 0)).normalize();

    if (k['KeyW']) dir.add(front);
    if (k['KeyS']) dir.sub(front);
    if (k['KeyA']) dir.sub(right);
    if (k['KeyD']) dir.add(right);
    if (dir.length() > 0) dir.normalize();

    const move = dir.multiplyScalar(MOVE_SPEED * delta);
    const newPos = camera.position.clone().add(move);
    
    const dist = Math.sqrt(newPos.x * newPos.x + newPos.z * newPos.z);
    if (dist < 19.5) {
      camera.position.copy(newPos);
    }
  });

  return null;
}

export default function Arena3D({ bossData, onExit }) {
  const controlsRef = useRef();
  const [gameState, setGameState] = useState({
    playerHp: 100,
    bossHp: bossData?.hp || 2000,
    bossMaxHp: bossData?.hp || 2000,
    status: 'fighting'
  });
  const [bossInstance, setBossInstance] = useState(null);
  const [hitEffect, setHitEffect] = useState(false);

  useEffect(() => {
    const b = new Enemy('boss', 0, 0);
    b.hp = bossData?.hp || 2000;
    b.maxHp = bossData?.hp || 2000;
    setBossInstance(b);
    return () => {
       if (b.mesh) b.mesh.parent?.remove(b.mesh);
    };
  }, [bossData]);

  const handleAttack = () => {
    if (!bossInstance || gameState.status !== 'fighting') return;
    
    const damage = 40 + Math.floor(Math.random() * 30);
    bossInstance.takeDamage(damage);
    setGameState(prev => ({ 
      ...prev, 
      bossHp: bossInstance.hp,
      status: bossInstance.hp <= 0 ? 'won' : prev.status
    }));
    
    setHitEffect(true);
    setTimeout(() => setHitEffect(false), 100);
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">ARENA DEL BOSS</h2>
            <div className="flex items-center gap-3">
               <Skull className="w-5 h-5 text-red-500" />
               <span className="text-red-500 font-bold tracking-[0.2em]">{bossData?.name?.toUpperCase() || 'GUARDIANO'}</span>
            </div>
          </div>
          <button 
            onClick={() => onExit()}
            className="pointer-events-auto p-4 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mb-10">
           <div className="w-full max-w-4xl h-4 bg-black/60 rounded-full border border-red-500/30 overflow-hidden relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                initial={{ width: '100%' }}
                animate={{ width: `${(gameState.bossHp / gameState.bossMaxHp) * 100}%` }}
              />
           </div>
           <span className="text-red-500 text-xs font-bold tracking-[0.5em] animate-pulse uppercase">Sconfiggi {bossData?.name}</span>
        </div>

        <div className="flex justify-between items-end">
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                 <Heart className="w-6 h-6 text-red-500" />
                 <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Salute</p>
                    <p className="text-2xl font-black text-white">{gameState.playerHp}%</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
         <div className="relative w-8 h-8 border-2 border-red-500/40 rounded-full">
            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
         </div>
      </div>

      <AnimatePresence>
        {hitEffect && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-500 z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.status !== 'fighting' && (
          <div className="absolute inset-0 bg-black/90 z-[200] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#1a1a1a] border-2 border-yellow-500 p-12 rounded-[2rem] text-center">
               <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
               <h3 className="text-4xl font-black text-white mb-4">VITTORIA!</h3>
               <p className="text-gray-400 mb-8">Hai sconfitto il Boss.</p>
               <Button onClick={() => onExit()} className="w-full py-6 bg-yellow-500 text-black font-bold rounded-xl">
                 TORNA AL MENU
               </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Canvas shadows onPointerDown={(e) => {
        if (e.target.requestPointerLock) e.target.requestPointerLock();
        handleAttack();
      }}>
        <PerspectiveCamera makeDefault fov={65} position={[0, 1.6, 15]} />
        <Environment />
        <PointerLockControls ref={controlsRef} />
        <Player controlsRef={controlsRef} />
        {bossInstance && <primitive object={bossInstance.mesh} />}
      </Canvas>
    </div>
  );
}
