import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { INTERACTIVE_NPCS, AMBIENT_NPCS } from '../data/npcs';

/**
 * NPC ambientali e interattivi.
 * - Ambientali: camminano in cerchi predefiniti, si fermano, si siedono
 * - Interattivi: stanno fermi, hanno un'icona "!" sopra la testa, cliccabili
 *
 * Ottimizzazione: solo gli NPC entro un raggio dal player vengono animati attivamente.
 */

function NPCBody({ color = '#7a4d3a', hatColor = '#3a2a1a', headRef }) {
  return (
    <group>
      {/* Corpo */}
      <mesh castShadow position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.28, 0.85, 6, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Testa */}
      <mesh ref={headRef} castShadow position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.2, 14, 14]} />
        <meshStandardMaterial color="#d8b48a" roughness={0.9} />
      </mesh>
      {/* Cappello/capelli */}
      <mesh position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={hatColor} roughness={0.95} />
      </mesh>
      {/* Braccia (semplificate come piccoli cubi laterali) */}
      <mesh castShadow position={[-0.36, 0.95, 0]}>
        <boxGeometry args={[0.14, 0.7, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh castShadow position={[0.36, 0.95, 0]}>
        <boxGeometry args={[0.14, 0.7, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function AmbientNPC({ data, playerPos }) {
  const ref = useRef();
  const headRef = useRef();
  const t0 = useRef(data.phase);

  useFrame((state, dt) => {
    if (!ref.current) return;

    // LOD: aggiorna solo se vicino al player (entro 45m)
    const px = playerPos.current?.x ?? 0;
    const pz = playerPos.current?.z ?? 0;
    const dx = ref.current.position.x - px;
    const dz = ref.current.position.z - pz;
    if (dx * dx + dz * dz > 45 * 45) return;

    t0.current += dt * data.speed;
    const cx = data.startPos[0];
    const cz = data.startPos[2];

    if (data.behavior === 'walk') {
      const x = cx + Math.cos(t0.current) * data.pathRadius;
      const z = cz + Math.sin(t0.current) * data.pathRadius;
      const dx2 = x - ref.current.position.x;
      const dz2 = z - ref.current.position.z;
      ref.current.position.x = x;
      ref.current.position.z = z;
      ref.current.rotation.y = Math.atan2(dx2, dz2);
      // animazione camminata: bobbing
      ref.current.position.y = Math.abs(Math.sin(t0.current * 4)) * 0.08;
    } else if (data.behavior === 'sit') {
      ref.current.position.y = -0.35;
      ref.current.rotation.y = data.phase;
    } else {
      // idle - rotazione leggera della testa
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t0.current * 0.6) * 0.5;
      }
    }
  });

  return (
    <group ref={ref} position={data.startPos}>
      <NPCBody color={data.color} hatColor={data.hatColor} headRef={headRef} />
    </group>
  );
}

function InteractiveNPC({ data, playerPos, onTalk }) {
  const ref = useRef();
  const iconRef = useRef();
  const headRef = useRef();
  const isNear = useRef(false);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // bobbing dell'icona
    if (iconRef.current) {
      iconRef.current.position.y = 2.5 + Math.sin(t * 3) * 0.12;
    }
    // rotazione testa verso player se vicino
    const px = playerPos.current?.x ?? 0;
    const pz = playerPos.current?.z ?? 0;
    const dx = px - ref.current.position.x;
    const dz = pz - ref.current.position.z;
    const dist2 = dx * dx + dz * dz;
    if (dist2 < 25) {
      const angle = Math.atan2(dx, dz);
      ref.current.rotation.y += (angle - ref.current.rotation.y) * 0.08;
    }
    isNear.current = dist2 < 9;
  });

  return (
    <group ref={ref} position={data.position}>
      <NPCBody color={data.color} hatColor={data.hatColor} headRef={headRef} />
      {/* Icona ! sopra la testa */}
      <group ref={iconRef} position={[0, 2.5, 0]}>
        <Html center distanceFactor={9}>
          <button
            onClick={() => onTalk(data)}
            data-testid={`npc-${data.id}-btn`}
            style={{
              padding: '4px 10px',
              background: 'rgba(20,15,10,0.92)',
              color: '#ffd76a',
              border: '2px solid #c2933a',
              borderRadius: '50%',
              fontFamily: 'Cinzel, Georgia, serif',
              fontWeight: 'bold',
              fontSize: 18,
              width: 32,
              height: 32,
              cursor: 'pointer',
              userSelect: 'none',
              lineHeight: 1,
            }}
            title={data.name}
          >
            !
          </button>
        </Html>
      </group>
    </group>
  );
}

export default function NPCs({ playerRef, onTalk }) {
  const playerPos = useRef({ x: 0, z: 28 });

  useFrame(() => {
    if (playerRef.current) {
      playerPos.current.x = playerRef.current.position.x;
      playerPos.current.z = playerRef.current.position.z;
    }
  });

  return (
    <group>
      {AMBIENT_NPCS.map((d) => (
        <AmbientNPC key={d.id} data={d} playerPos={playerPos} />
      ))}
      {INTERACTIVE_NPCS.map((d) => (
        <InteractiveNPC key={d.id} data={d} playerPos={playerPos} onTalk={onTalk} />
      ))}
    </group>
  );
}
