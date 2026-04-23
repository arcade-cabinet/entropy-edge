import {
  FloatingJoystick,
  GameOverScreen,
  GameViewport,
  OverlayButton,
  StartScreen,
} from "@/ui/shell";
import { PhaseTrait, ScoreTrait, TimerTrait } from "@/store/shared-traits";
import { useContainerSize } from "@/hooks/useContainerSize";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useRunSnapshotAutosave } from "@/hooks/useRunSnapshotAutosave";
import { recordRunResult } from "@/hooks/runtimeResult";
import {
  createInitialState,
  didLose,
  didWin,
  getEntropyCompletionCue,
  getEntropyRunSummary,
  isRunComplete,
  nextLevel,
  restartGame,
  startGame,
  tick,
} from "@/engine/simulation";
import type { EntropyState, Vec2 } from "@/engine/types";
import { EntropyTrait } from "@/store/traits";
import { entropyEntity, entropyWorld } from "@/store/world";
import type { GameSaveSlot, SessionMode } from "@/lib/sessionMode";
import { useTrait, WorldProvider } from "koota/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EdgeScene } from "./game/EdgeScene";
import { HUD } from "./game/HUD";

function useKeyboardMovementInput(): Vec2 {
  const [input, setInput] = useState<Vec2>({ x: 0, y: 0 });

  useEffect(() => {
    const pressed = new Set<string>();
    const update = () => {
      setInput({
        x:
          (pressed.has("arrowright") || pressed.has("d") ? 1 : 0) -
          (pressed.has("arrowleft") || pressed.has("a") ? 1 : 0),
        y:
          (pressed.has("arrowdown") || pressed.has("s") ? 1 : 0) -
          (pressed.has("arrowup") || pressed.has("w") ? 1 : 0),
      });
    };
    const handleDown = (event: KeyboardEvent) => {
      pressed.add(event.key.toLowerCase());
      update();
    };
    const handleUp = (event: KeyboardEvent) => {
      pressed.delete(event.key.toLowerCase());
      update();
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, []);

  return input;
}

function EntropyApp() {
  const mountRef = useRef<HTMLDivElement>(null);
  const initialState = useMemo(() => createInitialState(), []);

  const phaseData = (useTrait(entropyEntity, PhaseTrait) as { phase: string } | undefined) ?? {
    phase: "menu",
  };
  const phase = phaseData.phase;

  const state = (useTrait(entropyEntity, EntropyTrait) as EntropyState | undefined) ?? initialState;

  const scoreData = (useTrait(entropyEntity, ScoreTrait) as
    | { value: number; label: string }
    | undefined) ?? { value: 0, label: "SCORE" };

  const keyboardMovement = useKeyboardMovementInput();
  const [touchMovement, setTouchMovement] = useState<Vec2>({ x: 0, y: 0 });
  const movement =
    touchMovement.x !== 0 || touchMovement.y !== 0 ? touchMovement : keyboardMovement;
  useContainerSize(mountRef);

  const readState = useCallback(
    () => (entropyEntity.get(EntropyTrait) as EntropyState | undefined) ?? initialState,
    [initialState]
  );

  const writeState = useCallback((next: EntropyState) => {
    entropyEntity.set(EntropyTrait, next);
  }, []);

  useGameLoop(
    (deltaMs) => {
      if (phase !== "playing") return;
      const current = readState();
      const next = tick(current, deltaMs, movement);
      writeState(next);

      entropyEntity.set(ScoreTrait, { value: next.score, label: "SCORE" });
      entropyEntity.set(TimerTrait, {
        elapsedMs: next.elapsedMs,
        remainingMs: next.timeMs,
        label: "STABILITY",
      });

      if (didLose(next)) {
        entropyEntity.set(PhaseTrait, { phase: "gameover" });
      } else if (didWin(next)) {
        entropyEntity.set(PhaseTrait, { phase: "win" });
      }
    },
    [phase, movement.x, movement.y]
  );

  const isPlaying = phase === "playing";
  const summary = getEntropyRunSummary(state);
  const runComplete = isRunComplete(state);
  const completionCue = getEntropyCompletionCue(state);

  useRunSnapshotAutosave<EntropyState>({
    key: "entropy-edge:v1:save",
    paused: phase !== "playing",
    build: () => state,
  });

  return (
    <GameViewport ref={mountRef} background="#060d1a" data-browser-screenshot-mode="page">
      <EdgeScene state={state} isPlaying={isPlaying} />
      <RunResultEffect
        phase={phase}
        mode={state.sessionMode}
        score={summary.score}
        sector={summary.sector}
        rating={completionCue.rating}
      />

      {phase === "menu" ? (
        <StartScreen
          title="ENTROPY'S EDGE"
          subtitle="Ride the edge of reserve depletion through hazard sectors. Each modifier rewrites the calculus. Finish with a reserve strategy that held."
          primaryAction={{
            label: "Initialize Link",
            onClick: () => {
              const next = resolveEntropyStartState("standard", undefined, readState());
              writeState(next);
              entropyEntity.set(PhaseTrait, { phase: "playing" });
              entropyEntity.set(ScoreTrait, { value: next.score, label: "SCORE" });
              entropyEntity.set(TimerTrait, {
                elapsedMs: next.elapsedMs,
                remainingMs: next.timeMs,
                label: "STABILITY",
              });
            },
          }}
          glowColor="var(--color-signal)"
          glowRgb="255, 107, 26"
          background={[
            "radial-gradient(ellipse 80% 60% at center 40%, rgba(33, 212, 255, 0.14), transparent 65%)",
            "radial-gradient(ellipse 40% 40% at center 60%, rgba(255, 107, 26, 0.10), transparent 70%)",
            "linear-gradient(180deg, rgba(7, 8, 10, 0.85) 0%, rgba(7, 8, 10, 0.96) 100%)",
          ].join(", ")}
          displayClassName="ee-display"
          verbs={[
            { icon: "◇", text: "Secure anchors" },
            { icon: "⟆", text: "Build resonance" },
            { icon: "⌇", text: "Hold the edge" },
          ]}
        />
      ) : null}

      {phase === "playing" ? <HUD state={state} /> : null}
      {phase === "playing" ? (
        <FloatingJoystick
          accent="#67e8f9"
          label="Entropy movement joystick"
          onChange={(vector) => setTouchMovement({ x: vector.x, y: vector.y })}
        />
      ) : null}

      {phase === "win" ? (
        <GameOverScreen
          accent="var(--color-signal)"
          glowRgb="255, 107, 26"
          displayClassName="ee-display"
          background="radial-gradient(ellipse at center, rgba(33, 212, 255, 0.18), rgba(7, 8, 10, 0.96) 70%)"
          title={completionCue.title}
          subtitle={
            runComplete
              ? `${completionCue.message} ${completionCue.rating}. Score: ${summary.score} pts.`
              : `${completionCue.message} ${completionCue.stabilityCarrySeconds}s reserve carried forward. ${completionCue.nextAction}`
          }
          actions={
            <OverlayButton
              type="button"
              onClick={() => {
                writeState(
                  runComplete ? restartGame(readState().sessionMode) : nextLevel(readState())
                );
                entropyEntity.set(PhaseTrait, { phase: "playing" });
              }}
            >
              {runComplete ? "Stabilize Again" : "Proceed to Next Sector"}
            </OverlayButton>
          }
        />
      ) : null}

      {phase === "gameover" ? (
        <GameOverScreen
          accent="var(--color-warn)"
          glowRgb="255, 55, 95"
          displayClassName="ee-display"
          background="radial-gradient(ellipse at center, rgba(255, 55, 95, 0.2), rgba(7, 8, 10, 0.96) 70%)"
          title="Sector Collapsed"
          subtitle={`Stability reached zero. Total score: ${scoreData.value} pts. Total anchors secured: ${state.totalAnchors}.`}
          actions={
            <OverlayButton
              type="button"
              onClick={() => {
                writeState(restartGame(readState().sessionMode));
                entropyEntity.set(PhaseTrait, { phase: "playing" });
              }}
            >
              Restart Simulation
            </OverlayButton>
          }
        />
      ) : null}
    </GameViewport>
  );
}

function resolveEntropyStartState(
  mode: SessionMode,
  saveSlot: GameSaveSlot | undefined,
  current: EntropyState
): EntropyState {
  const snapshot = saveSlot?.snapshot;
  if (isEntropySnapshot(snapshot)) {
    const restored = snapshot as EntropyState;
    return {
      ...restored,
      phase: "playing",
      sessionMode: mode,
    };
  }

  return startGame(current, mode);
}

function isEntropySnapshot(snapshot: unknown): snapshot is EntropyState {
  const value = snapshot as Partial<EntropyState> | undefined;
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.level === "number" &&
      typeof value.playerGridX === "number" &&
      typeof value.playerGridZ === "number" &&
      typeof value.timeMs === "number" &&
      Array.isArray(value.fallingBlocks) &&
      Array.isArray(value.blockedCells)
  );
}

export default function Game() {
  return (
    <WorldProvider world={entropyWorld}>
      <EntropyApp />
    </WorldProvider>
  );
}

interface RunResultEffectProps {
  phase: string;
  mode: SessionMode;
  score: number;
  sector: number;
  rating: string;
}

function RunResultEffect({ phase, mode, score, sector, rating }: RunResultEffectProps) {
  useEffect(() => {
    if (phase === "win") {
      recordRunResult({
        mode,
        score,
        status: "completed",
        summary: `${rating}: sector ${sector}`,
        milestones: ["entropy-run-complete"],
      });
    } else if (phase === "gameover") {
      recordRunResult({
        mode,
        score,
        status: "failed",
        summary: `Collapsed in sector ${sector}`,
      });
    }
  }, [phase, mode, score, sector, rating]);
  return null;
}
