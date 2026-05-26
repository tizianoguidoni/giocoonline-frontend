import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * @typedef {Object} KeyboardKeys
 * @property {boolean} [KeyW]
 * @property {boolean} [ArrowUp]
 * @property {boolean} [KeyS]
 * @property {boolean} [ArrowDown]
 * @property {boolean} [KeyA]
 * @property {boolean} [ArrowLeft]
 * @property {boolean} [KeyD]
 * @property {boolean} [ArrowRight]
 * @property {boolean} [ShiftLeft]
 * @property {boolean} [ShiftRight]
 */

/**
 * Custom hook to handle keyboard inputs and pointer lock mechanism.
 * @param {import('@react-three/fiber').GLRenderer} dom - The Canvas DOM element.
 * @param {React.MutableRefObject<number>} yaw - Ref for yaw angle.
 * @param {React.MutableRefObject<number>} pitch - Ref for pitch angle.
 * @returns {React.MutableRefObject<KeyboardKeys>} The ref containing active keys.
 */
function useKeyboardControls(dom, yaw, pitch) {
  const keys = useRef({});
  const pointerLocked = useRef(false);

  useEffect(() => {
    if (!dom) return;

    /** @param {KeyboardEvent} e */
    const onKeyDown = (e) => {
      keys.current[e.code] = true;
    };

    /** @param {KeyboardEvent} e */
    const onKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    /** @param {MouseEvent} e */
    const onMouseMove = (e) => {
      if (!pointerLocked.current) return;
      yaw.current -= e.movementX * 0.0025;
      pitch.current -= e.movementY * 0.0025;
      pitch.current = Math.max(-1.2, Math.min(0.6, pitch.current));
    };

    const onClick = () => {
      if (!pointerLocked.current && dom.requestPointerLock) {
        dom.requestPointerLock();
      }
    };

    const onLockChange = () => {
      pointerLocked.current = document.pointerLockElement === dom;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('click', onClick);
    document.addEventListener('pointerlockchange', onLockChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('click', onClick);
      document.removeEventListener('pointerlockchange', onLockChange);
    };
  }, [dom, yaw, pitch]);

  return keys;
}

/**
 * Sub-component that renders the player's 3D meshes.
 * @returns {React.ReactElement} The visual elements of the player.
 */
function PlayerMesh() {
  return (
    <>
      {/* Corpo */}
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.32, 0.9, 8, 16]} />
        <meshStandardMaterial color="#3a5a8a" roughness={0.7} />
      </mesh>
      {/* Testa */}
      <mesh castShadow position={[0, 1.75, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#e6c8a8" roughness={0.85} />
      </mesh>
      {/* Capelli */}
      <mesh position={[0, 1.85, 0]}>
        <sphereGeometry args={[0.24, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a2515" />
      </mesh>
      {/* Mantello */}
      <mesh castShadow position={[0, 1.1, -0.15]}>
        <coneGeometry args={[0.55, 1.4, 8, 1, true]} />
        <meshStandardMaterial color="#8a2a2a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

const SPEED = 5;
const RUN_MULT = 1.7;
const PLAYER_RADIUS = 0.35;
const VILLAGE_BOUND = 33;

/**
 * Player component handling movement, collision, camera orbit, and exit logic.
 * @param {Object} props
 * @param {React.RefObject<THREE.Group>} props.playerRef - Ref to the player Group.
 * @param {number[]} [props.exitPosition] - Coordinate array of the exit door.
 * @param {function(boolean): void} [props.onReachExit] - Callback when player is near exit.
 * @returns {React.ReactElement}
 */
export default function Player({ playerRef, exitPosition, onReachExit }) {
  const { camera, gl } = useThree();
  const yaw = useRef(Math.PI);   // Spawn rivolto verso la fontana (-Z)
  const pitch = useRef(-0.15);

  const keys = useKeyboardControls(gl.domElement, yaw, pitch);

  useFrame((_state, dt) => {
    if (!playerRef.current) return;

    const k = keys.current;

    // Resolves nested ternaries for W/S/Up/Down
    let forward = 0;
    if (k['KeyW'] || k['ArrowUp']) {
      forward = 1;
    } else if (k['KeyS'] || k['ArrowDown']) {
      forward = -1;
    }

    // Resolves nested ternaries for A/D/Left/Right
    let strafe = 0;
    if (k['KeyD'] || k['ArrowRight']) {
      strafe = 1;
    } else if (k['KeyA'] || k['ArrowLeft']) {
      strafe = -1;
    }

    const running = k['ShiftLeft'] || k['ShiftRight'];
    const speed = SPEED * (running ? RUN_MULT : 1) * dt;

    const dir = new THREE.Vector3(
      Math.sin(yaw.current) * forward + Math.cos(yaw.current) * strafe,
      0,
      Math.cos(yaw.current) * forward - Math.sin(yaw.current) * strafe
    );
    if (dir.lengthSq() > 0) {
      dir.normalize().multiplyScalar(speed);
    }

    const next = playerRef.current.position.clone().add(dir);
    next.x = Math.max(-VILLAGE_BOUND, Math.min(VILLAGE_BOUND, next.x));
    next.z = Math.max(-VILLAGE_BOUND, Math.min(VILLAGE_BOUND, next.z));

    // Collisione fontana (cilindro raggio 3.4 al centro)
    const distFountain = Math.hypot(next.x, next.z);
    if (distFountain < 3.4 + PLAYER_RADIUS) {
      const a = Math.atan2(next.z, next.x);
      next.x = Math.cos(a) * (3.4 + PLAYER_RADIUS);
      next.z = Math.sin(a) * (3.4 + PLAYER_RADIUS);
    }

    playerRef.current.position.copy(next);
    playerRef.current.rotation.y = yaw.current;

    // Camera in terza persona dietro al player
    const camDist = 6;
    const offset = new THREE.Vector3(
      -Math.sin(yaw.current) * camDist * Math.cos(pitch.current),
      3.0 - pitch.current * 2.5,
      -Math.cos(yaw.current) * camDist * Math.cos(pitch.current)
    );
    camera.position.copy(playerRef.current.position).add(offset);
    camera.lookAt(
      playerRef.current.position.x,
      playerRef.current.position.y + 1.4,
      playerRef.current.position.z
    );

    // Trigger uscita
    if (exitPosition && onReachExit) {
      const d = playerRef.current.position.distanceTo(
        new THREE.Vector3(exitPosition[0], 0, exitPosition[2])
      );
      onReachExit(d < 2.2);
    }
  });

  return (
    <group ref={playerRef} position={[0, 0, 24]}>
      <PlayerMesh />
    </group>
  );
}
