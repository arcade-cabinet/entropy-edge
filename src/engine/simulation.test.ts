import { describe, expect, test } from "vitest";
import {
  cellKey,
  chooseFallingBlockCell,
  createInitialBlockedCells,
  createInitialFallingBlocks,
  createSectorCells,
  didLose,
  didWin,
  findNearestBlockedCell,
  generateNode,
  getEntropyCompletionCue,
  getEntropyRunSummary,
  getEntropySectorCue,
  getStabilityBand,
  getTargetVector,
  isRunComplete,
  RUN_SECTORS_REQUIRED,
  startGame,
  tick,
} from "./simulation";

describe("entropy simulation", () => {
  test("starts a playable sector with a target anchor", () => {
    const state = startGame({} as never);

    expect(state.phase).toBe("playing");
    expect(state.sessionMode).toBe("standard");
    expect(state.targetNode).not.toBeNull();
    expect(state.anchorsRequired).toBe(3);
    expect(state.blockedCells.length).toBeGreaterThan(0);
    expect(state.fallingBlocks.length).toBeGreaterThan(0);
    expect(startGame({} as never)).toEqual(state);
  });

  test("uses couch-friendly standard reserves and opt-in challenge pressure", () => {
    const standard = startGame({} as never, "standard");
    const challenge = startGame({} as never, "challenge");
    const afterMinute = tick(standard, 60_000, { x: 0, y: 0 });

    expect(standard.timeMs).toBeGreaterThan(60_000);
    expect(challenge.timeMs).toBeLessThan(standard.timeMs);
    expect(didLose(afterMinute)).toBe(false);
  });

  test("secures an anchor when the player reaches the target cell", () => {
    const state = startGame({} as never);
    state.targetNode = { id: "target", gridX: 1, gridZ: 0 };

    const next = tick(state, 250, { x: 1, y: 0 });

    expect(next.playerGridX).toBe(1);
    expect(next.anchorsSecuredThisLevel).toBe(1);
    expect(next.totalAnchors).toBe(1);
    expect(next.score).toBeGreaterThan(0);
    expect(didWin(next)).toBe(false);
    expect(next.shockwaves[0].id).toBe("sw-1-1");
  });

  test("uses max resonance to clear the nearest landed block after securing an anchor", () => {
    const state = startGame({} as never);
    state.targetNode = { id: "target", gridX: 1, gridZ: 0 };
    state.blockedCells = ["2,0", "-5,-5"];
    state.isResonanceMax = true;
    state.resonance = 1;

    expect(findNearestBlockedCell(state.blockedCells, 1, 0)).toBe("2,0");

    const next = tick(state, 250, { x: 1, y: 0 });

    expect(next.lastSurgeClearedKey).toBe("2,0");
    expect(next.blockedCells).not.toContain("2,0");
  });

  test("reports loss only for depleted active sectors", () => {
    expect(didLose({ phase: "playing", timeMs: 0 } as never)).toBe(true);
    expect(didLose({ phase: "menu", timeMs: 0 } as never)).toBe(false);
  });

  test("treats the third stabilized sector as a full run completion", () => {
    const sectorComplete = {
      ...startGame({} as never),
      phase: "levelcomplete" as const,
      level: RUN_SECTORS_REQUIRED,
      score: 12_000,
      totalAnchors: 12,
    };

    expect(didWin(sectorComplete)).toBe(true);
    expect(isRunComplete({ ...sectorComplete, level: RUN_SECTORS_REQUIRED - 1 })).toBe(false);
    expect(isRunComplete(sectorComplete)).toBe(true);
    expect(getEntropyRunSummary(sectorComplete)).toMatchObject({
      score: 12_000,
      sector: RUN_SECTORS_REQUIRED,
      sectorsRequired: RUN_SECTORS_REQUIRED,
      totalAnchors: 12,
    });
    expect(getEntropyCompletionCue(sectorComplete)).toMatchObject({
      rating: "Calm Resonance",
      status: "run",
      title: "Cabinet Stabilized",
    });
  });

  test("builds sector completion cues from stability reserve and anchors", () => {
    const sectorComplete = {
      ...startGame({} as never),
      anchorsSecuredThisLevel: 4,
      phase: "levelcomplete" as const,
      timeMs: 145_000,
      totalAnchors: 7,
    };
    const cue = getEntropyCompletionCue(sectorComplete);

    expect(cue).toMatchObject({
      nextAction: "Carry the stability reserve into the next sector.",
      rating: "Held Field",
      sectorPulseCount: 4,
      stabilityCarrySeconds: 145,
      status: "sector",
      title: "Sector Stabilized",
    });
    expect(cue.message).toContain("Sector 1/3");
  });

  test("chooses deterministic anchors and blocked cell layouts", () => {
    const node = generateNode(["0,0"], 0, 0, 2, 4);
    const again = generateNode(["0,0"], 0, 0, 2, 4);
    const protectedKeys = ["0,0", cellKey(node.gridX, node.gridZ)];
    const blocked = createInitialBlockedCells(2, protectedKeys);
    const falling = createInitialFallingBlocks(2, [...protectedKeys, ...blocked]);

    expect(node).toEqual(again);
    expect(blocked).toHaveLength(5);
    expect(blocked).not.toContain(cellKey(node.gridX, node.gridZ));
    expect(falling.map((block) => block.id)).toEqual(["blk-seed-2-0", "blk-seed-2-1"]);
  });

  test("spawns falling blocks from available cells without randomness", () => {
    const state = startGame({} as never);
    const pick = chooseFallingBlockCell({ ...state, elapsedMs: 4_200, eventCount: 2 });
    const again = chooseFallingBlockCell({ ...state, elapsedMs: 4_200, eventCount: 2 });

    expect(pick).toEqual(again);
    expect(pick).not.toBeNull();
    expect(state.blockedCells).not.toContain(cellKey(pick?.x ?? 0, pick?.y ?? 0));
  });

  test("describes sector cells, target vector, and stability bands", () => {
    const cells = createSectorCells();
    const state = startGame({} as never);
    const vector = getTargetVector(state);

    expect(cells).toHaveLength(121);
    expect(cells.some((cell) => cell.unstable)).toBe(true);
    expect(vector.distance).toBeGreaterThanOrEqual(3);
    expect(vector.label).toContain("cells");
    expect(getStabilityBand(20_000)).toBe("stable");
    expect(getStabilityBand(8_000)).toBe("unstable");
    expect(getStabilityBand(3_000)).toBe("critical");
  });

  test("builds deterministic sector cues for route, pressure, and surge readability", () => {
    const state = startGame({} as never);
    state.targetNode = { id: "anchor", gridX: 4, gridZ: -2 };
    state.playerGridX = 1;
    state.playerGridZ = -2;
    state.fallingBlocks = [{ gridX: 2, gridZ: -2, id: "threat", velocity: 0, worldY: 8 }];
    state.blockedCells = ["-1,0", "0,4", "4,4"];

    const fallingCue = getEntropySectorCue(state);

    expect(fallingCue).toMatchObject({
      nearestFallingDistance: 1,
      nearestFallingKey: "2,-2",
      pressure: "falling",
      recommendedMove: "step east",
      routeLabel: "3 cells · E3",
      sectorLabel: `Sector 1/${RUN_SECTORS_REQUIRED}`,
      targetBearing: "E3",
    });
    expect(fallingCue.objective).toContain("falling cell");

    const surgeCue = getEntropySectorCue({
      ...state,
      fallingBlocks: [],
      isResonanceMax: true,
      resonance: 1,
    });
    expect(surgeCue.pressure).toBe("clear");
    expect(surgeCue.surgeReady).toBe(true);
    expect(surgeCue.objective).toContain("surge");

    const criticalCue = getEntropySectorCue({ ...state, fallingBlocks: [], timeMs: 3_000 });
    expect(criticalCue.pressure).toBe("critical");
    expect(criticalCue.stabilityBand).toBe("critical");
  });
});
