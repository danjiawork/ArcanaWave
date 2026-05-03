import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text, useTexture, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const CARD_WIDTH = 1.2;
const CARD_HEIGHT = 2;
const TOTAL_CARDS = 22;

export type SceneState =
  | "IDLE"
  | "FAN"
  | "DRAWING"
  | "WAITING_REVEAL"
  | "REVEAL";

interface TarotSceneProps {
  state: SceneState;
  drawnCards: number[];
  onCardDrawn: (index: number) => void;
  tarotDeck: { name: string; meaning: string }[];
  onCardHover: (cardId: number | null) => void; // 新增：鼠标悬停回调
  isResetting: boolean; // 新增：指示是否正在重置
}

export function TarotScene({
  state,
  drawnCards,
  onCardDrawn,
  tarotDeck,
  onCardHover,
  isResetting,
}: TarotSceneProps) {
  const { viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const cardsRef = useRef<THREE.Group[]>([]);

  // Generate card data
  const cards = useMemo(() => {
    return Array.from({ length: TOTAL_CARDS }).map((_, i) => ({
      id: i,
      // Darker, more elegant colors for the front
      color: new THREE.Color().setHSL(Math.random(), 0.3, 0.2),
      name: tarotDeck[i].name,
      meaning: tarotDeck[i].meaning,
    }));
  }, [tarotDeck]);

  // Target positions for each card
  const targetPositions = useRef<THREE.Vector3[]>([]);
  const targetRotations = useRef<THREE.Euler[]>([]);
  const targetScales = useRef<THREE.Vector3[]>([]);

  // Initialize targets
  useEffect(() => {
    targetPositions.current = cards.map(() => new THREE.Vector3());
    targetRotations.current = cards.map(() => new THREE.Euler());
    targetScales.current = cards.map(() => new THREE.Vector3(1, 1, 1));
  }, [cards]);

  // Update targets based on state or resetting
  useEffect(() => {
    if (isResetting) {
      cards.forEach((_, i) => {
        targetPositions.current[i].set(0, 0, i * 0.01);
        targetRotations.current[i].set(0, 0, 0);
        targetScales.current[i].set(1, 1, 1);
      });
      return;
    }

    if (state === "IDLE") {
      // Stacked deck
      cards.forEach((_, i) => {
        targetPositions.current[i].set(0, 0, i * 0.01);
        targetRotations.current[i].set(0, 0, 0);
        targetScales.current[i].set(1, 1, 1);
      });
    } else if (state === "FAN" || state === "DRAWING") {
      // Fan shape
      const spreadAngle = Math.PI * 0.6; // 108 degrees spread
      const angleStep = spreadAngle / (TOTAL_CARDS - 1);
      const startAngle = Math.PI / 2 + spreadAngle / 2; // Centered around upwards (PI/2)

      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);

        if (isDrawn) {
          // Move drawn cards lower (y: -0.5) to avoid overlap with the top UI header
          const xOffset = (drawnIndex - 1) * 2;
          const isLatest = drawnIndex === drawnCards.length - 1;

          targetPositions.current[i].set(xOffset, -0.5, 2 + drawnIndex * 0.1);
          targetRotations.current[i].set(0, 0, 0);

          // Make the latest card pop
          const scale = isLatest && state === "DRAWING" ? 2.2 : 1.8;
          targetScales.current[i].set(scale, scale, scale);
        } else {
          // Lowered fan even more to provide clear space for drawn cards
          const angle = startAngle - i * angleStep;
          const radius = 5.5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius - radius - 3.5;

          targetPositions.current[i].set(x, y, i * 0.01);
          targetRotations.current[i].set(0, 0, angle - Math.PI / 2);

          if (state === "DRAWING") {
            targetScales.current[i].set(0.4, 0.4, 0.4);
          } else {
            targetScales.current[i].set(0.9, 0.9, 0.9); // Slightly smaller fan
          }
        }
      });
    } else if (state === "WAITING_REVEAL") {
      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);

        if (isDrawn) {
          const xOffset = (drawnIndex - 1) * 2.2;
          targetPositions.current[i].set(xOffset, -1, 2);
          targetRotations.current[i].set(0, 0, 0); // Keep face down
          targetScales.current[i].set(2, 2, 2);
        } else {
          targetPositions.current[i].set(0, -10, 0); // Hide others
        }
      });
    } else if (state === "REVEAL") {
      // Reveal all drawn cards
      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);

        if (isDrawn) {
          const xOffset = (drawnIndex - 1) * 2.5;
          targetPositions.current[i].set(xOffset, -1.5, 1.5);
          targetRotations.current[i].set(0, Math.PI, 0); // Flip
          targetScales.current[i].set(1.8, 1.8, 1.8);
        } else {
          // Hide others
          targetPositions.current[i].set(0, -10, 0);
        }
      });
    }
  }, [state, drawnCards, cards]);

  // Animation loop
  useFrame((r3fState, delta) => {
    const dt = Math.min(delta, 0.1);
    cardsRef.current.forEach((group, i) => {
      if (!group) return;

      // Lerp position, rotation, scale
      group.position.lerp(targetPositions.current[i], dt * 5);

      // Slerp rotation
      const targetQuat = new THREE.Quaternion().setFromEuler(
        targetRotations.current[i]
      );
      group.quaternion.slerp(targetQuat, dt * 5);

      group.scale.lerp(targetScales.current[i], dt * 5);

      // Add floating effect to drawn cards
      if (drawnCards.includes(i) && state !== "REVEAL") {
        group.position.y +=
          Math.sin(r3fState.clock.elapsedTime * 2 + i) * 0.005;
      }

      // Add subtle animation to idle cards
      if (state === "IDLE") {
        group.position.y +=
          Math.sin(r3fState.clock.elapsedTime * 0.5 + i) * 0.0005; // Subtle floating
        group.rotation.z +=
          Math.sin(r3fState.clock.elapsedTime * 0.3 + i) * 0.0001; // Subtle rotation
      }
    });
  });

  return (
    <group ref={groupRef}>
      {cards.map((card, i) => (
        <group
          key={card.id}
          ref={(el) => (cardsRef.current[i] = el as THREE.Group)}
        >
          {/* Back of card */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT, 32, 32]} />
            <meshStandardMaterial color="#0f0c29" side={THREE.FrontSide} />
            {/* Elegant gold pattern on the back */}
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[CARD_WIDTH * 0.85, CARD_HEIGHT * 0.85]} />
              <meshStandardMaterial
                color="#d4af37"
                wireframe
                transparent
                opacity={0.6}
              />
            </mesh>
            <mesh position={[0, 0, 0.002]}>
              <circleGeometry args={[0.3, 32]} />
              <meshStandardMaterial
                color="#d4af37"
                wireframe
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Backside Label for drawn cards */}
            {drawnCards.includes(card.id) && state !== "REVEAL" && (
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.2}
                color="#d4af37"
                anchorX="center"
                anchorY="middle"
              >
                {["过去", "现在", "未来"][drawnCards.indexOf(card.id)]}
              </Text>
            )}
          </mesh>

          {/* Front of card (revealed) */}
          <mesh
            position={[0, 0, -0.01]}
            rotation={[0, Math.PI, 0]}
            onPointerOver={() => state === "REVEAL" && onCardHover(card.id)}
            onPointerOut={() => state === "REVEAL" && onCardHover(null)}
          >
            <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT, 32, 32]} />
            <meshStandardMaterial color={card.color} side={THREE.FrontSide} />
            {/* Gold border on front */}
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[CARD_WIDTH * 0.9, CARD_HEIGHT * 0.9]} />
              <meshStandardMaterial
                color="#d4af37"
                wireframe
                transparent
                opacity={0.3}
              />
            </mesh>
            {state === "REVEAL" && (
              <>
                <Text
                  position={[0, 0.6, 0.01]}
                  fontSize={0.15}
                  color="#d4af37"
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={CARD_WIDTH * 0.8}
                >
                  {card.name}
                </Text>
                <Text
                  position={[0, 0, 0.01]}
                  fontSize={0.08}
                  color="#d4af37"
                  anchorX="center"
                  anchorY="middle"
                  maxWidth={CARD_WIDTH * 0.8}
                >
                  {card.meaning}
                </Text>
              </>
            )}
          </mesh>

          {/* Edge particles for drawn cards */}
          {drawnCards.includes(card.id) && state !== "REVEAL" && (
            <CardParticles cardColor={card.color} />
          )}
        </group>
      ))}
    </group>
  );
}

interface CardParticlesProps {
  cardColor: THREE.Color;
}

function CardParticles({ cardColor }: CardParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 50; // 减少粒子数量以提高性能和流畅度
  const velocities = useMemo(() => new Float32Array(particleCount * 3), []);

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // 粒子从卡牌中心附近随机发射
      pos[i * 3] = (Math.random() - 0.5) * CARD_WIDTH * 0.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * CARD_HEIGHT * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      // 初始速度
      velocities[i * 3] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return pos;
  }, [particleCount, velocities]);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const currentPositions = particlesRef.current.geometry.attributes.position
        .array as Float32Array;
      const dt = Math.min(delta, 0.05); // 限制 delta，防止帧率过低时粒子跳动

      for (let i = 0; i < particleCount; i++) {
        // 更新位置
        currentPositions[i * 3] += velocities[i * 3] * dt * 60;
        currentPositions[i * 3 + 1] += velocities[i * 3 + 1] * dt * 60;
        currentPositions[i * 3 + 2] += velocities[i * 3 + 2] * dt * 60;

        // 模拟摩擦力或衰减
        velocities[i * 3] *= 0.98;
        velocities[i * 3 + 1] *= 0.98;
        velocities[i * 3 + 2] *= 0.98;

        // 粒子超出卡牌范围时重置
        const x = currentPositions[i * 3];
        const y = currentPositions[i * 3 + 1];
        const z = currentPositions[i * 3 + 2];

        if (
          Math.abs(x) > CARD_WIDTH / 2 ||
          Math.abs(y) > CARD_HEIGHT / 2 ||
          Math.abs(z) > 0.1
        ) {
          currentPositions[i * 3] = (Math.random() - 0.5) * CARD_WIDTH * 0.5;
          currentPositions[i * 3 + 1] =
            (Math.random() - 0.5) * CARD_HEIGHT * 0.5;
          currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

          velocities[i * 3] = (Math.random() - 0.5) * 0.005;
          velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={cardColor}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
