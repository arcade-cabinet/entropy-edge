import { browserTestCanvasGlOptions } from "@/lib/testing";
import {
  cellKey,
  createSectorCells,
  GRID_HALF,
  GRID_SIZE,
  parseCellKey,
  RUN_SECTORS_REQUIRED,
} from "@/engine/simulation";
import type {
  EntropyState,
  FallingBlock,
  GridNode,
  Shockwave,
} from "@/engine/types";
import { Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const TILE_SIZE = 1;

function getAnchorRouteCells(state: EntropyState) {
  if (!state.targetNode) return [];

  const cells: Array<{ x: number; z: number; index: number }> = [];
  let x = state.playerGridX;
  let z = state.playerGridZ;
  let index = 0;

  while (x !== state.targetNode.gridX) {
    x += Math.sign(state.targetNode.gridX - x);
    cells.push({ index, x, z });
    index += 1;
  }

  while (z !== state.targetNode.gridZ) {
    z += Math.sign(state.targetNode.gridZ - z);
    cells.push({ index, x, z });
    index += 1;
  }

  return cells;
}

function SectorBackdrop({ state }: { state: EntropyState }) {
  const stability = state.timeMs < 15_000 ? "#ffcc00" : "#00e5ff";
  return (
    <group>
      <mesh receiveShadow position={[0, -0.47, 0]}>
        <boxGeometry args={[GRID_SIZE + 4.2, 0.18, GRID_SIZE + 4.2]} />
        <meshStandardMaterial
          color="#071827"
          emissive="#0e7490"
          emissiveIntensity={0.08}
          metalness={0.72}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0, -0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[GRID_HALF + 1.25, GRID_HALF + 1.7, 96]} />
        <meshBasicMaterial color={stability} transparent opacity={0.18} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`sector-horizon-${side}`} position={[side * (GRID_HALF + 1.95), 1.25, 0]}>
          <boxGeometry args={[0.1, 2.5, GRID_SIZE + 2.7]} />
          <meshStandardMaterial
            color="#082f49"
            emissive={side > 0 ? "#ff0055" : "#00e5ff"}
            emissiveIntensity={0.24}
            transparent
            opacity={0.78}
          />
        </mesh>
      ))}
    </group>
  );
}

function GridFloor({ state }: { state: EntropyState }) {
  const tiles: ReactElement[] = [];
  const targetKey = state.targetNode ? cellKey(state.targetNode.gridX, state.targetNode.gridZ) : "";
  const playerKey = cellKey(state.playerGridX, state.playerGridZ);
  const routeKeys = new Set(getAnchorRouteCells(state).map((cell) => cellKey(cell.x, cell.z)));

  for (const cell of createSectorCells()) {
    const isDark = (cell.x + cell.z) % 2 === 0;
    const isGuide = routeKeys.has(cell.key);
    const isTarget = cell.key === targetKey;
    const isPlayer = cell.key === playerKey;
    const isSurgeCleared = cell.key === state.lastSurgeClearedKey;
    const baseColor = isTarget
      ? "#4c1130"
      : isPlayer
        ? "#0e3f4b"
        : isSurgeCleared
          ? "#365314"
          : isGuide
            ? "#123850"
            : isDark
              ? "#172338"
              : "#102033";
    const emissive = isTarget
      ? "#ff0055"
      : isPlayer
        ? "#00e5ff"
        : isSurgeCleared
          ? "#a3e635"
          : isGuide
            ? "#22d3ee"
            : "#020617";

    tiles.push(
      <mesh key={cell.key} position={[cell.x, 0, cell.z]} receiveShadow>
        <boxGeometry args={[TILE_SIZE - 0.05, 0.12, TILE_SIZE - 0.05]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={
            isTarget || isPlayer
              ? 0.5
              : isSurgeCleared
                ? 0.42
                : isGuide
                  ? 0.24
                  : cell.unstable
                    ? 0.06
                    : 0
          }
          metalness={0.45}
          roughness={0.38}
        />
      </mesh>
    );
  }

  return <group>{tiles}</group>;
}

function RouteBeacons({ state }: { state: EntropyState }) {
  const routeCells = getAnchorRouteCells(state);
  if (routeCells.length === 0) return null;

  return (
    <group>
      {routeCells.map((cell) => {
        const progress = (cell.index + 1) / routeCells.length;
        return (
          <group key={`route-beacon-${cell.x}-${cell.z}`} position={[cell.x, 0.19, cell.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.2, 0.34, 32]} />
              <meshBasicMaterial
                color={progress > 0.82 ? "#ffcc00" : "#67e8f9"}
                transparent
                opacity={0.34 + progress * 0.24}
              />
            </mesh>
            <mesh position={[0, 0.16 + progress * 0.06, 0]}>
              <octahedronGeometry args={[0.1 + progress * 0.04, 0]} />
              <meshStandardMaterial
                color={progress > 0.82 ? "#ffcc00" : "#67e8f9"}
                emissive={progress > 0.82 ? "#ffcc00" : "#22d3ee"}
                emissiveIntensity={0.9}
                metalness={0.4}
                roughness={0.24}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function GridSeams() {
  const seams: ReactElement[] = [];

  for (let x = -GRID_HALF; x <= GRID_HALF; x++) {
    seams.push(
      <Line
        key={`seam-z-${x}`}
        points={[
          [x - 0.5, 0.085, -GRID_HALF - 0.48],
          [x - 0.5, 0.085, GRID_HALF + 0.48],
        ]}
        color="#7dd3fc"
        lineWidth={1}
        transparent
        opacity={0.22}
      />
    );
  }

  for (let z = -GRID_HALF; z <= GRID_HALF; z++) {
    seams.push(
      <Line
        key={`seam-x-${z}`}
        points={[
          [-GRID_HALF - 0.48, 0.085, z - 0.5],
          [GRID_HALF + 0.48, 0.085, z - 0.5],
        ]}
        color="#7dd3fc"
        lineWidth={1}
        transparent
        opacity={0.14}
      />
    );
  }

  return <group>{seams}</group>;
}

function GridBorder() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[GRID_SIZE + 1.1, 0.32, GRID_SIZE + 1.1]} />
        <meshStandardMaterial
          color="#082033"
          emissive="#0f3f55"
          emissiveIntensity={0.08}
          metalness={0.65}
          roughness={0.32}
        />
      </mesh>
      {[
        { id: "north", x: 0, z: -GRID_HALF - 0.76, w: GRID_SIZE + 1.6, d: 0.24 },
        { id: "south", x: 0, z: GRID_HALF + 0.76, w: GRID_SIZE + 1.6, d: 0.24 },
        { id: "west", x: -GRID_HALF - 0.76, z: 0, w: 0.24, d: GRID_SIZE + 1.6 },
        { id: "east", x: GRID_HALF + 0.76, z: 0, w: 0.24, d: GRID_SIZE + 1.6 },
      ].map((rail) => (
        <mesh key={rail.id} castShadow receiveShadow position={[rail.x, 0.26, rail.z]}>
          <boxGeometry args={[rail.w, 0.55, rail.d]} />
          <meshStandardMaterial color="#102c43" emissive="#0e7490" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

function BlockedCell({ cellKey }: { cellKey: string }) {
  const [xs, zs] = cellKey.split(",");
  const x = Number(xs);
  const z = Number(zs);
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.92, 1, 0.92]} />
        <meshStandardMaterial
          color="#251423"
          emissive="#b91c1c"
          emissiveIntensity={0.22}
          metalness={0.68}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 1.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.44, 4]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.58} />
      </mesh>
      <Line
        points={[
          [-0.38, 1.08, -0.38],
          [0.38, 1.08, 0.38],
        ]}
        color="#fecdd3"
        lineWidth={2}
        transparent
        opacity={0.5}
      />
      <Line
        points={[
          [-0.38, 1.08, 0.38],
          [0.38, 1.08, -0.38],
        ]}
        color="#fecdd3"
        lineWidth={2}
        transparent
        opacity={0.5}
      />
    </group>
  );
}

function FallingBlockMesh({ block }: { block: FallingBlock }) {
  const danger = Math.max(0.18, 1 - block.worldY / 18);
  return (
    <group>
      <mesh position={[block.gridX, 0.09, block.gridZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.64, 40]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.22 + danger * 0.36} />
      </mesh>
      <mesh position={[block.gridX, 0.11, block.gridZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.08 + danger * 0.14} />
      </mesh>
      <mesh castShadow position={[block.gridX, block.worldY, block.gridZ]}>
        <boxGeometry args={[0.88, 0.88, 0.88]} />
        <meshStandardMaterial
          color="#263349"
          emissive="#fb7185"
          emissiveIntensity={0.34 + danger * 0.44}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <Line
        points={[
          [block.gridX, 0.5, block.gridZ],
          [block.gridX, Math.max(0.6, block.worldY - 0.6), block.gridZ],
        ]}
        color="#fb7185"
        lineWidth={2}
        transparent
        opacity={0.42}
      />
    </group>
  );
}

function TargetNodeMesh({ node }: { node: GridNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 1.5;
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 5) * 0.08;
      ref.current.scale.setScalar(pulse);
    }
  });
  return (
    <group ref={ref} position={[node.gridX, 0, node.gridZ]}>
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.22, 64]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.34} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.28, 1.36, 64]} />
        <meshBasicMaterial color="#ff0055" transparent opacity={0.38} />
      </mesh>
      {/* Pillar */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 5, 8]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={1.2} />
      </mesh>
      {/* Core gem */}
      <mesh position={[0, 1.2, 0]}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={2} wireframe />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.8, 48]} />
        <meshBasicMaterial color="#ffcc00" transparent opacity={0.42} />
      </mesh>
      <pointLight color="#ff0055" intensity={3} distance={6} position={[0, 1.2, 0]} />
    </group>
  );
}

function PlayerSphere({ x, z, shake }: { x: number; z: number; shake: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, x, 0.25);
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, z, 0.25);
      const bob = Math.sin(clock.getElapsedTime() * 4) * 0.06;
      const deterministicShake = Math.sin(clock.getElapsedTime() * 37) * shake * 0.05;
      ref.current.position.y = 0.4 + bob + deterministicShake;
    }
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[x, 0.11, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.62, 48]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.46} />
      </mesh>
      <mesh ref={ref} castShadow position={[x, 0.4, z]}>
        <sphereGeometry args={[0.38, 24, 24]} />
        <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={1.1} />
        <pointLight color="#00e5ff" intensity={2.5} distance={5} />
      </mesh>
    </group>
  );
}

function ShockwaveMesh({ sw }: { sw: Shockwave }) {
  return (
    <mesh position={[sw.x, 0.1, sw.z]} rotation={[-Math.PI / 2, 0, 0]} scale={sw.scale}>
      <torusGeometry args={[1, 0.12, 8, 48]} />
      <meshBasicMaterial color="#ff0055" transparent opacity={Math.max(0, sw.life * 0.7)} />
    </mesh>
  );
}

function TargetGuide({ state }: { state: EntropyState }) {
  if (!state.targetNode) return null;

  return (
    <Line
      points={[
        [state.playerGridX, 0.18, state.playerGridZ],
        [state.targetNode.gridX, 0.18, state.targetNode.gridZ],
      ]}
      color="#00e5ff"
      dashed
      dashScale={0.8}
      gapSize={0.12}
      lineWidth={3}
      transparent
      opacity={0.72}
    />
  );
}

function SurgeClearMarker({ cellKey }: { cellKey: string | null }) {
  if (!cellKey) return null;

  const cleared = parseCellKey(cellKey);
  return (
    <group position={[cleared.x, 0.24, cleared.y]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[0.58, 0.86, 64]} />
        <meshBasicMaterial color="#a3e635" transparent opacity={0.46} />
      </mesh>
      <mesh scale={1.28}>
        <ringGeometry args={[0.58, 0.62, 64]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.34} />
      </mesh>
    </group>
  );
}

function SectorStabilizationEffect({ state }: { state: EntropyState }) {
  if (state.phase !== "levelcomplete") return null;

  const runComplete = state.level >= RUN_SECTORS_REQUIRED;
  const pulseCount = runComplete ? RUN_SECTORS_REQUIRED : state.anchorsSecuredThisLevel;
  const color = runComplete ? "#fef08a" : "#67e8f9";
  const pulses = Array.from({ length: Math.max(1, pulseCount) }, (_, index) => ({
    id: `stable-pulse-${state.level}-${state.totalAnchors}-${index}`,
    index,
  }));

  return (
    <group>
      {[0, 1, 2].map((index) => (
        <mesh
          key={`stable-ring-${index}`}
          position={[0, 0.34 + index * 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1 + index * 0.42}
        >
          <torusGeometry args={[GRID_HALF + 0.78 + index * 0.36, 0.06, 8, 96]} />
          <meshBasicMaterial color={color} transparent opacity={0.46 - index * 0.1} />
        </mesh>
      ))}
      {pulses.map((pulse) => {
        const angle = (pulse.index / Math.max(1, pulseCount)) * Math.PI * 2;
        const radius = GRID_HALF + 1.15;
        return (
          <group
            key={pulse.id}
            position={[Math.cos(angle) * radius, 1.3, Math.sin(angle) * radius]}
          >
            <mesh>
              <octahedronGeometry args={[0.32, 0]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.4}
                metalness={0.2}
                roughness={0.18}
              />
            </mesh>
            <pointLight color={color} intensity={1.7} distance={7} />
          </group>
        );
      })}
      <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[GRID_HALF + 0.35, 96]} />
        <meshBasicMaterial color={runComplete ? "#facc15" : "#22d3ee"} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function ResonanceBands({ state }: { state: EntropyState }) {
  const strength = state.isResonanceMax ? 1 : state.resonance;
  if (strength <= 0.04) return null;

  return (
    <group position={[state.playerGridX, 0.16, state.playerGridZ]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((index) => (
        <mesh key={`resonance-band-${index}`} scale={1 + index * 0.44 + strength * 0.3}>
          <ringGeometry args={[0.82 + index * 0.28, 0.92 + index * 0.28, 64]} />
          <meshBasicMaterial
            color={state.isResonanceMax ? "#ffcc00" : "#00e5ff"}
            transparent
            opacity={Math.max(0.06, strength * (0.34 - index * 0.07))}
          />
        </mesh>
      ))}
    </group>
  );
}

function RiftPillars() {
  return (
    <group>
      {[
        { id: "left-a", x: -6.4, z: -4.2, h: 4.8, color: "#00e5ff" },
        { id: "left-b", x: -6.4, z: 3.4, h: 3.8, color: "#00e5ff" },
        { id: "right-a", x: 6.4, z: -3.6, h: 4.5, color: "#ff0055" },
        { id: "right-b", x: 6.4, z: 4.2, h: 3.4, color: "#ff0055" },
      ].map((pillar) => (
        <group key={pillar.id} position={[pillar.x, 0, pillar.z]}>
          <mesh castShadow position={[0, pillar.h / 2, 0]}>
            <cylinderGeometry args={[0.09, 0.13, pillar.h, 8]} />
            <meshStandardMaterial
              color="#06111c"
              emissive={pillar.color}
              emissiveIntensity={0.22}
              metalness={0.8}
              roughness={0.24}
            />
          </mesh>
          <pointLight
            color={pillar.color}
            intensity={0.8}
            distance={5}
            position={[0, pillar.h, 0]}
          />
        </group>
      ))}
    </group>
  );
}

function AutoOrbitCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.07;
    const radius = 17;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = 13;
  });
  return null;
}

function ResponsivePlayingCamera({ enabled }: { enabled: boolean }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!enabled) return;

    const isPortrait = size.height > size.width;
    camera.position.set(isPortrait ? 0 : 13, isPortrait ? 18 : 12, isPortrait ? 18 : 13);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = isPortrait ? 62 : 46;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(0, 0.5, 0);
  }, [camera, enabled, size.height, size.width]);

  return null;
}

interface EdgeSceneProps {
  state: EntropyState;
  isPlaying: boolean;
}

export function EdgeScene({ state, isPlaying }: EdgeSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows
      camera={{ position: [13, 12, 13], fov: 46 }}
      style={{ width: "100%", height: "100%" }}
      data-testid="entropy-edge-canvas"
      gl={browserTestCanvasGlOptions}
    >
      <color attach="background" args={["#06101d"]} />
      <fog attach="fog" args={["#06101d", 20, 58]} />
      <ambientLight intensity={0.54} />
      <directionalLight
        position={[8, 18, 6]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 8, 0]} color="#00b3cc" intensity={1.55} distance={25} />
      <ResponsivePlayingCamera enabled={isPlaying} />

      <SectorBackdrop state={state} />
      <GridBorder />
      <GridFloor state={state} />
      <GridSeams />
      <RiftPillars />
      <TargetGuide state={state} />
      <RouteBeacons state={state} />
      <ResonanceBands state={state} />
      <SurgeClearMarker cellKey={state.lastSurgeClearedKey} />
      <SectorStabilizationEffect state={state} />

      {state.blockedCells.map((key) => (
        <BlockedCell key={key} cellKey={key} />
      ))}

      {state.fallingBlocks.map((block) => (
        <FallingBlockMesh key={block.id} block={block} />
      ))}

      {state.targetNode ? <TargetNodeMesh node={state.targetNode} /> : null}

      {state.shockwaves.map((sw) => (
        <ShockwaveMesh key={sw.id} sw={sw} />
      ))}

      <PlayerSphere x={state.playerGridX} z={state.playerGridZ} shake={state.cameraShake} />

      {isPlaying ? (
        <OrbitControls
          enablePan={false}
          maxPolarAngle={1.3}
          minDistance={14}
          maxDistance={26}
          target={[0, 0.5, 0]}
        />
      ) : (
        <AutoOrbitCamera />
      )}
    </Canvas>
  );
}
