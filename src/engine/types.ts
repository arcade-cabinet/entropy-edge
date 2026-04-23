import type { SessionMode } from "@/lib/sessionMode";

export interface Vec2 {
  x: number;
  y: number;
}

export interface GridNode {
  id: string;
  gridX: number;
  gridZ: number;
}

export interface FallingBlock {
  id: string;
  gridX: number;
  gridZ: number;
  worldY: number;
  velocity: number;
}

export interface Shockwave {
  id: string;
  x: number;
  z: number;
  scale: number;
  life: number;
}

export type EntropyStabilityBand = "stable" | "unstable" | "critical";
export type EntropyRoutePressure = "clear" | "falling" | "blocked" | "critical";

export interface EntropySectorCue {
  sectorLabel: string;
  objective: string;
  routeLabel: string;
  recommendedMove: string;
  targetDistance: number;
  targetBearing: string;
  stabilityBand: EntropyStabilityBand;
  pressure: EntropyRoutePressure;
  fallingThreats: number;
  blockedCells: number;
  nearestFallingDistance: number | null;
  nearestFallingKey: string | null;
  surgeReady: boolean;
}

export interface EntropyCompletionCue {
  message: string;
  nextAction: string;
  rating: string;
  sectorPulseCount: number;
  stabilityCarrySeconds: number;
  status: "sector" | "run";
  title: string;
}

export type EntropyPhase = "menu" | "playing" | "gameover" | "levelcomplete";

export interface EntropyState {
  phase: EntropyPhase;
  sessionMode: SessionMode;
  level: number;
  playerGridX: number;
  playerGridZ: number;
  targetNode: GridNode | null;
  anchorsRequired: number;
  anchorsSecuredThisLevel: number;
  totalAnchors: number;
  fallingBlocks: FallingBlock[];
  /** "x,z" keys of cells with landed blocks */
  blockedCells: string[];
  shockwaves: Shockwave[];
  /** countdown timer in milliseconds */
  timeMs: number;
  score: number;
  /** 0–1 resonance combo meter */
  resonance: number;
  isResonanceMax: boolean;
  /** elapsed time when the last anchor was secured */
  lastAnchorTimeMs: number;
  lastSurgeClearedKey: string | null;
  blockSpawnCooldownMs: number;
  moveCooldownMs: number;
  elapsedMs: number;
  cameraShake: number;
  eventCount: number;
}
