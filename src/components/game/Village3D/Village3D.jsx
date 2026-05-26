import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';

import Ground from './components/Ground';
import Fountain from './components/Fountain';
import Houses from './components/Houses';
import Shops from './components/Shops';
import Trees from './components/Trees';
import Benches from './components/Benches';
import Lighting from './components/Lighting';
import Player from './components/Player';
import NPCs from './components/NPCs';
import ExitDoor from './components/ExitDoor';

import HUD from './ui/HUD';
import DialogUI from './ui/DialogUI';
import ShopUI from './ui/ShopUI';
import LoadingScreen from './ui/LoadingScreen';

/**
 * @typedef {Object} VillageSceneProps
 * @property {React.RefObject<import('three').Group>} playerRef - Ref to the player Group.
 * @property {boolean} isNight - Night atmospheric flag.
 * @property {boolean} nearExit - Is player near exit door.
 * @property {function(): void} triggerExit - Trigger exit sequence callback.
 * @property {function(string): void} setActiveShop - Open shop interface setter.
 * @property {function(Object): void} setActiveDialog - Open conversation setter.
 * @property {function(boolean): void} setNearExit - Set proximity to exit state.
 */

/**
 * Visual 3D scene elements inside the Canvas.
 * @param {VillageSceneProps} props
 * @returns {React.ReactElement}
 */
function VillageScene({
  playerRef,
  isNight,
  nearExit,
  triggerExit,
  setActiveShop,
  setActiveDialog,
  setNearExit
}) {
  return (
    <>
      {/* Sky procedurale (giorno) */}
      {!isNight && (
        <Sky
          distance={450000}
          sunPosition={[80, 50, 80]}
          inclination={0.49}
          azimuth={0.25}
          turbidity={6}
          rayleigh={1.5}
          mieCoefficient={0.005}
          mieDirectionalG={0.7}
        />
      )}
      {isNight && <color attach="background" args={['#040818']} />}

      <Lighting isNight={isNight} />

      <Ground />
      <Fountain position={[0, 0, 0]} />
      <Houses isNight={isNight} />
      <Shops onOpenShop={setActiveShop} />
      <Trees />
      <Benches />
      <NPCs playerRef={playerRef} onTalk={setActiveDialog} />
      <ExitDoor
        position={[0, 0, 32]}
        onExit={triggerExit}
        isNear={nearExit}
      />

      <Player
        playerRef={playerRef}
        exitPosition={[0, 0, 32]}
        onReachExit={setNearExit}
      />
    </>
  );
}

/**
 * Main 3D Village Core Hub component.
 * @param {Object} props
 * @param {function(): void} [props.onExit] - Callback when player exits the square.
 * @param {number} [props.initialGold] - Initial player balance.
 * @param {function(Object): void} [props.onPurchase] - Transaction completion event.
 * @returns {React.ReactElement}
 */
export default function Village3D({
  onExit,
  initialGold = 500,
  onPurchase,
}) {
  const playerRef = useRef();
  const [loading, setLoading] = useState(true);
  const [isNight, setIsNight] = useState(false);
  const [activeDialog, setActiveDialog] = useState(null);
  const [activeShop, setActiveShop] = useState(null);
  const [gold, setGold] = useState(initialGold);
  const [nearExit, setNearExit] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Dissolvenza di entrata
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, [setLoading]);

  const triggerExit = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onExit?.(), 700);
  }, [exiting, onExit]);

  // ESC chiude dialoghi/shop, E esce dalla piazza
  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.code === 'Escape') {
        setActiveDialog(null);
        setActiveShop(null);
      }
      if (e.code === 'KeyE' && nearExit && !activeShop && !activeDialog) {
        triggerExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nearExit, activeShop, activeDialog, triggerExit]);

  /** @param {Object} item */
  const handleBuy = (item) => {
    setGold((g) => g - item.price);
    onPurchase?.({ item, shopKey: activeShop, remainingGold: gold - item.price });
  };

  return (
    <div
      data-testid="village3d-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 4, 35], fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <VillageScene
            playerRef={playerRef}
            isNight={isNight}
            nearExit={nearExit}
            triggerExit={triggerExit}
            setActiveShop={setActiveShop}
            setActiveDialog={setActiveDialog}
            setNearExit={setNearExit}
          />
        </Suspense>
      </Canvas>

      <HUD
        isNight={isNight}
        onToggleDayNight={() => setIsNight((n) => !n)}
        gold={gold}
        onExit={triggerExit}
      />

      <DialogUI npc={activeDialog} onClose={() => setActiveDialog(null)} />

      {activeShop && (
        <ShopUI
          shopKey={activeShop}
          gold={gold}
          onClose={() => setActiveShop(null)}
          onBuy={handleBuy}
        />
      )}

      <LoadingScreen visible={loading} />

      {/* Dissolvenza di uscita */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          opacity: exiting ? 1 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.7s ease',
          zIndex: 300,
        }}
        data-testid="exit-fade"
      />
    </div>
  );
}
