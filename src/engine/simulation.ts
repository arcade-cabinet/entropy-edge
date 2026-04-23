import { getSessionPressureScale, normalizeSessionMode, type SessionMode } from "@/lib/sessionMode";
import type {
  EntropyCompletionCue,
  EntropyRoutePressure,
  EntropySectorCue,
  EntropyStabilityBand,
  EntropyState,
  FallingBlock,
  GridNode,
  Shockwave,
  Vec2,
} from "./types";

export const GRID_HALF = 5;
export const GRID_SIZE = GRID_HALF * 2 + 1;
export const RUN_SECTORS_REQUIRED = 3;
const COMBO_WINDOW_MS = 800;
const MOVE_COOLDOWN_MS = 200;
const BLOCK_SPAWN_HEIGHT = 18;
const TIME_BONUS_PER_ANCHOR_MS = 35_000;
const BASE_STABILITY_RESERVE_MS: Record<SessionMode, number> = {
  challenge: 55_000,
  cozy: 300_000,
  standard: 180_000,
};

const ANCHOR_SEQUENCE: Vec2[] = [
  { x: -4, y: -2 },
  { x: 3, y: -4 },
  { x: 4, y: 3 },
  { x: -3, y: 4 },
  { x: 0, y: -5 },
  { x: 5, y: 0 },
  { x: -5, y: 1 },
  { x: 1, y: 5 },
  { x: -2, y: -4 },
  { x: 4, y: -1 },
  { x: 2, y: 3 },
  { x: -4, y: 2 },
];

const BLOCKED_SEQUENCE: Vec2[] = [
  { x: -2, y: 1 },
  { x: 2, y: -1 },
  { x: -4, y: 0 },
  { x: 4, y: 1 },
  { x: 0, y: 4 },
  { x: 1, y: -4 },
  { x: -5, y: -3 },
  { x: 5, y: 4 },
  { x: -1, y: 3 },
  { x: 3, y: 2 },
];

const FALLING_SEQUENCE: Vec2[] = [
  { x: -3, y: -3 },
  { x: 3, y: 3 },
  { x: -1, y: -5 },
  { x: 5, y: -2 },
  { x: -5, y: 4 },
  { x: 2, y: 5 },
  { x: -4, y: 3 },
  { x: 4, y: -4 },
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function cellKey(x: number, z: number): string {
  return `${x},${z}`;
}

export function parseCellKey(key: string): Vec2 {
  const [x, z] = key.split(",").map(Number);
  return { x: x ?? 0, y: z ?? 0 };
}

function createEventId(s: EntropyState, prefix: string): string {
  s.eventCount += 1;
  return `${prefix}-${s.level}-${s.eventCount}`;
}

export function generateNode(
  excludedKeys: string[],
  fromX: number,
  fromZ: number,
  level = 1,
  sequenceIndex = 0
): GridNode {
  const minDist = 3;
  const excluded = new Set(excludedKeys);
  const candidates = ANCHOR_SEQUENCE.filter((candidate) => {
    const dist = Math.abs(candidate.x - fromX) + Math.abs(candidate.y - fromZ);
    return dist >= minDist && !excluded.has(cellKey(candidate.x, candidate.y));
  });

  if (candidates.length > 0) {
    const index = (level * 3 + sequenceIndex * 5) % candidates.length;
    const node = candidates[index];
    return {
      gridX: node.x,
      gridZ: node.y,
      id: `node-${level}-${sequenceIndex}-${node.x}-${node.y}`,
    };
  }

  for (let ring = GRID_HALF; ring >= 0; ring--) {
    for (let x = -ring; x <= ring; x++) {
      for (let z = -ring; z <= ring; z++) {
        const isPerimeter = Math.abs(x) === ring || Math.abs(z) === ring;
        const dist = Math.abs(x - fromX) + Math.abs(z - fromZ);
        if (isPerimeter && dist >= minDist && !excluded.has(cellKey(x, z))) {
          return { id: `node-fb-${level}-${sequenceIndex}-${x}-${z}`, gridX: x, gridZ: z };
        }
      }
    }
  }

  return { id: `node-fb-${level}-${sequenceIndex}`, gridX: -GRID_HALF, gridZ: -GRID_HALF };
}

export function createInitialBlockedCells(level: number, protectedKeys: string[]): string[] {
  const protectedSet = new Set(protectedKeys);
  const count = Math.min(3 + level, 8);

  return BLOCKED_SEQUENCE.filter((cell) => !protectedSet.has(cellKey(cell.x, cell.y)))
    .slice(0, count)
    .map((cell) => cellKey(cell.x, cell.y));
}

export function createInitialFallingBlocks(level: number, protectedKeys: string[]): FallingBlock[] {
  const protectedSet = new Set(protectedKeys);
  const count = Math.min(1 + Math.ceil(level / 2), 5);

  return FALLING_SEQUENCE.filter((cell) => !protectedSet.has(cellKey(cell.x, cell.y)))
    .slice(0, count)
    .map((cell, index) => ({
      gridX: cell.x,
      gridZ: cell.y,
      id: `blk-seed-${level}-${index}`,
      velocity: 0,
      worldY: BLOCK_SPAWN_HEIGHT - index * 2.5,
    }));
}

export function createSectorCells() {
  const cells: Array<{ key: string; x: number; z: number; ring: number; unstable: boolean }> = [];

  for (let x = -GRID_HALF; x <= GRID_HALF; x++) {
    for (let z = -GRID_HALF; z <= GRID_HALF; z++) {
      const ring = Math.max(Math.abs(x), Math.abs(z));
      cells.push({
        key: cellKey(x, z),
        ring,
        unstable: ring >= GRID_HALF - 1 || (x * 7 + z * 11) % 9 === 0,
        x,
        z,
      });
    }
  }

  return cells;
}

export function getTargetVector(state: EntropyState) {
  if (!state.targetNode) {
    return { distance: 0, dx: 0, dz: 0, label: "Anchor synced" };
  }

  const dx = state.targetNode.gridX - state.playerGridX;
  const dz = state.targetNode.gridZ - state.playerGridZ;
  const distance = Math.abs(dx) + Math.abs(dz);

  return {
    distance,
    dx,
    dz,
    label: `${distance} cells to anchor`,
  };
}

export function getStabilityBand(timeMs: number): EntropyStabilityBand {
  if (timeMs < 5_000) return "critical";
  if (timeMs < 15_000) return "unstable";
  return "stable";
}

function getRouteBearing(dx: number, dz: number): string {
  if (dx === 0 && dz === 0) return "ANCHOR LOCK";

  const eastWest = dx === 0 ? "" : `${dx > 0 ? "E" : "W"}${Math.abs(dx)}`;
  const northSouth = dz === 0 ? "" : `${dz > 0 ? "S" : "N"}${Math.abs(dz)}`;

  return [eastWest, northSouth].filter(Boolean).join(" / ");
}

function getRecommendedMove(dx: number, dz: number): string {
  if (dx === 0 && dz === 0) return "hold anchor";

  if (Math.abs(dx) >= Math.abs(dz) && dx !== 0) {
    return dx > 0 ? "step east" : "step west";
  }

  return dz > 0 ? "step south" : "step north";
}

function getNearestFallingBlock(state: EntropyState): {
  distance: number;
  key: string;
} | null {
  if (state.fallingBlocks.length === 0) return null;

  return state.fallingBlocks.reduce<{ distance: number; key: string } | null>((nearest, block) => {
    const distance =
      Math.abs(block.gridX - state.playerGridX) + Math.abs(block.gridZ - state.playerGridZ);
    if (!nearest || distance < nearest.distance) {
      return { distance, key: cellKey(block.gridX, block.gridZ) };
    }
    return nearest;
  }, null);
}

export function getEntropySectorCue(state: EntropyState): EntropySectorCue {
  const targetVector = getTargetVector(state);
  const stabilityBand = getStabilityBand(state.timeMs);
  const nearestFalling = getNearestFallingBlock(state);
  const blockedCells = state.blockedCells.length;
  let pressure: EntropyRoutePressure = "clear";

  if (stabilityBand === "critical") {
    pressure = "critical";
  } else if (nearestFalling && nearestFalling.distance <= 2) {
    pressure = "falling";
  } else if (blockedCells >= 7 && !state.isResonanceMax) {
    pressure = "blocked";
  }

  let objective = "Follow the cyan beacons to the anchor.";
  if (!state.targetNode) {
    objective = "Sector stabilized. Carry reserve forward.";
  } else if (state.isResonanceMax) {
    objective = "Secure the anchor to discharge a surge.";
  } else if (pressure === "critical") {
    objective = "Use the shortest safe vector before collapse.";
  } else if (pressure === "falling") {
    objective = "Sidestep the falling cell, then take the route.";
  } else if (pressure === "blocked") {
    objective = "Chain anchors to build a route-clearing surge.";
  }

  return {
    blockedCells,
    fallingThreats: state.fallingBlocks.length,
    nearestFallingDistance: nearestFalling?.distance ?? null,
    nearestFallingKey: nearestFalling?.key ?? null,
    objective,
    pressure,
    recommendedMove: getRecommendedMove(targetVector.dx, targetVector.dz),
    routeLabel:
      targetVector.distance === 0
        ? "Anchor synchronized"
        : `${targetVector.distance} cells · ${getRouteBearing(targetVector.dx, targetVector.dz)}`,
    sectorLabel: `Sector ${state.level}/${RUN_SECTORS_REQUIRED}`,
    stabilityBand,
    surgeReady: state.isResonanceMax,
    targetBearing: getRouteBearing(targetVector.dx, targetVector.dz),
    targetDistance: targetVector.distance,
  };
}

function buildPlayingState(
  level: number,
  anchorsRequired: number,
  score: number,
  totalAnchors: number,
  mode: string | null | undefined = "standard"
): EntropyState {
  const sessionMode = normalizeSessionMode(mode);
  const node = generateNode(["0,0"], 0, 0, level, totalAnchors);
  const protectedKeys = ["0,0", cellKey(node.gridX, node.gridZ)];
  const blockedCells = createInitialBlockedCells(level, protectedKeys);
  const fallingBlocks = createInitialFallingBlocks(level, [...protectedKeys, ...blockedCells]);

  return {
    anchorsRequired,
    anchorsSecuredThisLevel: 0,
    blockedCells,
    blockSpawnCooldownMs: 3_000,
    cameraShake: 0,
    elapsedMs: 0,
    eventCount: 0,
    fallingBlocks,
    isResonanceMax: false,
    lastAnchorTimeMs: 0,
    lastSurgeClearedKey: null,
    level,
    moveCooldownMs: 0,
    phase: "playing",
    playerGridX: 0,
    playerGridZ: 0,
    resonance: 0,
    score,
    sessionMode,
    shockwaves: [],
    targetNode: node,
    timeMs: Math.max(30_000, BASE_STABILITY_RESERVE_MS[sessionMode] - (level - 1) * 8_000),
    totalAnchors,
  };
}

export function createInitialState(mode: string | null | undefined = "standard"): EntropyState {
  return { ...buildPlayingState(1, 3, 0, 0, mode), phase: "menu" };
}

export function startGame(
  prev: EntropyState,
  mode: string | null | undefined = prev?.sessionMode ?? "standard"
): EntropyState {
  return buildPlayingState(1, 3, 0, 0, mode);
}

export function nextLevel(prev: EntropyState): EntropyState {
  return buildPlayingState(
    prev.level + 1,
    prev.anchorsRequired + 1,
    prev.score,
    prev.totalAnchors,
    prev.sessionMode
  );
}

export function restartGame(mode: string | null | undefined = "standard"): EntropyState {
  return buildPlayingState(1, 3, 0, 0, mode);
}

function secureNode(s: EntropyState): void {
  if (!s.targetNode) return;

  s.totalAnchors += 1;
  s.anchorsSecuredThisLevel += 1;

  const multiplier = s.isResonanceMax ? 2 : 1;
  s.timeMs += TIME_BONUS_PER_ANCHOR_MS * multiplier;
  s.score += 1_000 * s.anchorsSecuredThisLevel * multiplier;
  s.cameraShake = 0.5;

  const timeSinceLast = s.elapsedMs - s.lastAnchorTimeMs;
  if (s.lastAnchorTimeMs > 0 && timeSinceLast < COMBO_WINDOW_MS * 6) {
    s.resonance = Math.min(1.0, s.resonance + 0.3);
  } else {
    s.resonance = 0.15;
  }
  if (s.resonance >= 1.0) s.isResonanceMax = true;
  s.lastAnchorTimeMs = s.elapsedMs;

  const nodeKey = `${s.targetNode.gridX},${s.targetNode.gridZ}`;
  s.blockedCells = s.blockedCells.filter((k) => k !== nodeKey);
  s.lastSurgeClearedKey = null;

  if (s.isResonanceMax) {
    const clearedKey = findNearestBlockedCell(s.blockedCells, s.playerGridX, s.playerGridZ);
    if (clearedKey) {
      s.blockedCells = s.blockedCells.filter((key) => key !== clearedKey);
      s.lastSurgeClearedKey = clearedKey;
      const cleared = parseCellKey(clearedKey);
      s.shockwaves.push({
        id: createEventId(s, "sw-surge"),
        life: 1.35,
        scale: 0.1,
        x: cleared.x,
        z: cleared.y,
      });
    }
  }

  const nodeX = s.targetNode.gridX;
  const nodeZ = s.targetNode.gridZ;
  s.fallingBlocks = s.fallingBlocks.filter((b) => !(b.gridX === nodeX && b.gridZ === nodeZ));

  const sw: Shockwave = {
    id: createEventId(s, "sw"),
    x: s.targetNode.gridX,
    z: s.targetNode.gridZ,
    scale: 0.1,
    life: 1.5,
  };
  s.shockwaves.push(sw);

  if (s.anchorsSecuredThisLevel >= s.anchorsRequired) {
    s.phase = "levelcomplete";
    s.targetNode = null;
  } else {
    const excluded = [...s.blockedCells, cellKey(s.playerGridX, s.playerGridZ)];
    s.targetNode = generateNode(excluded, s.playerGridX, s.playerGridZ, s.level, s.totalAnchors);
  }
}

export function chooseFallingBlockCell(s: EntropyState): Vec2 | null {
  const excluded = new Set<string>([
    ...s.blockedCells,
    cellKey(s.playerGridX, s.playerGridZ),
    ...(s.targetNode ? [cellKey(s.targetNode.gridX, s.targetNode.gridZ)] : []),
    ...s.fallingBlocks.map((b) => cellKey(b.gridX, b.gridZ)),
  ]);

  const candidates: Vec2[] = [];
  for (let x = -GRID_HALF; x <= GRID_HALF; x++) {
    for (let z = -GRID_HALF; z <= GRID_HALF; z++) {
      if (!excluded.has(cellKey(x, z))) {
        candidates.push({ x, y: z });
      }
    }
  }

  if (candidates.length === 0) return null;

  const bucket = Math.floor(s.elapsedMs / 1_000);
  const index = (s.level * 17 + s.totalAnchors * 7 + bucket + s.eventCount) % candidates.length;

  return candidates[index];
}

export function findNearestBlockedCell(
  blockedCells: string[],
  fromX: number,
  fromZ: number
): string | null {
  if (blockedCells.length === 0) return null;

  return blockedCells.reduce<string | null>((nearest, key) => {
    if (!nearest) return key;
    const current = parseCellKey(key);
    const best = parseCellKey(nearest);
    const currentDistance = Math.abs(current.x - fromX) + Math.abs(current.y - fromZ);
    const bestDistance = Math.abs(best.x - fromX) + Math.abs(best.y - fromZ);
    return currentDistance < bestDistance ? key : nearest;
  }, null);
}

function trySpawnBlock(s: EntropyState): void {
  const pick = chooseFallingBlockCell(s);
  if (!pick) return;

  const block: FallingBlock = {
    gridX: pick.x,
    gridZ: pick.y,
    id: createEventId(s, "blk"),
    velocity: 0,
    worldY: BLOCK_SPAWN_HEIGHT,
  };
  s.fallingBlocks.push(block);
}

export function tick(state: EntropyState, deltaMs: number, input: Vec2): EntropyState {
  if (state.phase !== "playing") return state;

  const s = structuredClone(state) as EntropyState;

  s.elapsedMs += deltaMs;
  const pressureScale = getSessionPressureScale(s.sessionMode);
  s.timeMs = Math.max(0, s.timeMs - deltaMs * pressureScale);
  s.cameraShake = Math.max(0, s.cameraShake - deltaMs * 0.003);

  // Movement
  s.moveCooldownMs = Math.max(0, s.moveCooldownMs - deltaMs);
  if (s.moveCooldownMs === 0 && (input.x !== 0 || input.y !== 0)) {
    const dx = input.x > 0 ? 1 : input.x < 0 ? -1 : 0;
    const dz = input.y > 0 ? 1 : input.y < 0 ? -1 : 0;
    const newX = clamp(s.playerGridX + dx, -GRID_HALF, GRID_HALF);
    const newZ = clamp(s.playerGridZ + dz, -GRID_HALF, GRID_HALF);
    const cellKey = `${newX},${newZ}`;
    if (!s.blockedCells.includes(cellKey)) {
      s.playerGridX = newX;
      s.playerGridZ = newZ;
      s.moveCooldownMs = MOVE_COOLDOWN_MS;
    }
  }

  // Check if player reached the target node
  if (
    s.targetNode &&
    s.playerGridX === s.targetNode.gridX &&
    s.playerGridZ === s.targetNode.gridZ
  ) {
    secureNode(s);
  }

  // Spawn falling blocks
  s.blockSpawnCooldownMs -= deltaMs;
  if (s.blockSpawnCooldownMs <= 0 && s.phase === "playing") {
    const interval = Math.max(1_200, (3_000 - s.level * 300) / pressureScale);
    s.blockSpawnCooldownMs = interval;
    trySpawnBlock(s);
  }

  // Update falling blocks
  for (const block of s.fallingBlocks) {
    block.velocity = Math.min(block.velocity + deltaMs * 0.04, 25);
    block.worldY -= block.velocity * deltaMs * 0.001;
  }

  // Land blocks
  for (let i = s.fallingBlocks.length - 1; i >= 0; i--) {
    const block = s.fallingBlocks[i];
    if (block.worldY <= 0) {
      const key = cellKey(block.gridX, block.gridZ);
      if (!s.blockedCells.includes(key)) {
        s.blockedCells.push(key);
        s.shockwaves.push({
          id: createEventId(s, "sw-land"),
          x: block.gridX,
          z: block.gridZ,
          scale: 0.1,
          life: 1.0,
        });
      }
      s.fallingBlocks.splice(i, 1);
    }
  }

  // Update shockwaves
  for (let i = s.shockwaves.length - 1; i >= 0; i--) {
    s.shockwaves[i].life -= deltaMs * 0.002;
    s.shockwaves[i].scale += deltaMs * 0.05;
    if (s.shockwaves[i].life <= 0) {
      s.shockwaves.splice(i, 1);
    }
  }

  // Resonance decay outside combo window
  const timeSinceAnchor = s.elapsedMs - s.lastAnchorTimeMs;
  if (s.lastAnchorTimeMs > 0 && timeSinceAnchor > COMBO_WINDOW_MS * 6) {
    s.resonance = Math.max(0, s.resonance - deltaMs * 0.0005);
  }
  if (s.resonance < 1.0) s.isResonanceMax = false;

  return s;
}

export function didLose(state: EntropyState): boolean {
  return state.timeMs <= 0 && state.phase === "playing";
}

export function didWin(state: EntropyState): boolean {
  return state.phase === "levelcomplete";
}

export function isRunComplete(state: EntropyState): boolean {
  return state.phase === "levelcomplete" && state.level >= RUN_SECTORS_REQUIRED;
}

export function getEntropyRunSummary(state: EntropyState) {
  return {
    anchorsThisSector: state.anchorsSecuredThisLevel,
    score: state.score,
    sector: state.level,
    sectorsRequired: RUN_SECTORS_REQUIRED,
    stabilitySeconds: Math.round(state.timeMs / 1000),
    totalAnchors: state.totalAnchors,
  };
}

export function getEntropyCompletionCue(state: EntropyState): EntropyCompletionCue {
  const summary = getEntropyRunSummary(state);
  const fullRun = isRunComplete(state);
  const stabilityCarrySeconds = Math.max(0, summary.stabilitySeconds);
  const rating =
    stabilityCarrySeconds >= 180
      ? "Calm Resonance"
      : stabilityCarrySeconds >= 90
        ? "Held Field"
        : "Emergency Latch";

  return {
    message: fullRun
      ? `${summary.sectorsRequired} sectors stabilized with ${summary.totalAnchors} anchors held.`
      : `Sector ${summary.sector}/${summary.sectorsRequired} stabilized with ${summary.anchorsThisSector} anchors.`,
    nextAction: fullRun
      ? "Restart the cabinet field with stricter routing."
      : "Carry the stability reserve into the next sector.",
    rating,
    sectorPulseCount: fullRun ? summary.sectorsRequired : summary.anchorsThisSector,
    stabilityCarrySeconds,
    status: fullRun ? "run" : "sector",
    title: fullRun ? "Cabinet Stabilized" : "Sector Stabilized",
  };
}
