import { getEntropySectorCue, getStabilityBand } from "@/engine/simulation";
import type { EntropyState } from "@/engine/types";

interface HUDProps {
  state: EntropyState;
}

export function HUD({ state }: HUDProps) {
  const timeSeconds = (state.timeMs / 1000).toFixed(1);
  const resonancePct = Math.round(state.resonance * 100);
  const stabilityBand = getStabilityBand(state.timeMs);
  const sectorCue = getEntropySectorCue(state);
  const stabilityColor =
    stabilityBand === "critical"
      ? "text-red-400"
      : stabilityBand === "unstable"
        ? "text-amber-400"
        : "text-slate-50";

  return (
    <div className="pointer-events-none absolute inset-0 z-50 grid grid-rows-[auto_1fr_auto] gap-3 p-3 text-slate-50 sm:p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-md border border-cyan-200/20 bg-slate-950/72 p-3 shadow-2xl shadow-cyan-950/25 backdrop-blur-md sm:max-w-[220px] sm:p-4">
          <div className="truncate text-[0.65rem] font-bold uppercase tracking-[0.24em] text-cyan-300">
            Entropy's Edge
          </div>
          <h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">{sectorCue.sectorLabel}</h2>
          <div className="mt-2 text-xs text-slate-200 sm:text-sm">
            Anchors: {state.anchorsSecuredThisLevel} / {state.anchorsRequired}
          </div>
          <div className="mt-1 text-xs text-slate-400">Total secured: {state.totalAnchors}</div>
          <div className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-cyan-100">
            {sectorCue.objective}
          </div>
        </div>

        <div className="min-w-0 justify-self-end rounded-md border border-cyan-200/20 bg-slate-950/72 p-3 text-right shadow-2xl shadow-cyan-950/25 backdrop-blur-md sm:min-w-[220px] sm:p-4">
          <div className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-slate-400">
            Score
          </div>
          <div className="mt-2 truncate text-2xl font-black text-cyan-300 sm:text-3xl">
            {state.score} pts
          </div>
          <div className="mt-2 text-xs text-slate-400 sm:text-sm">
            Stability <span className={`font-bold ${stabilityColor}`}>{timeSeconds}s</span>
          </div>
        </div>
      </div>

      <div />

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-md border border-cyan-200/20 bg-slate-950/72 p-3 shadow-2xl shadow-cyan-950/25 backdrop-blur-md sm:max-w-[280px] sm:p-4">
          <div className="mb-2 truncate text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-400">
            RESONANCE {resonancePct}%{state.isResonanceMax ? " / MAX" : ""}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{
                background: state.isResonanceMax
                  ? "linear-gradient(90deg, #ffcc00, #ff6600)"
                  : "linear-gradient(90deg, #00e5ff, #0080ff)",
                width: `${resonancePct}%`,
              }}
            />
          </div>
          {state.isResonanceMax ? (
            <div className="mt-2 truncate text-[0.65rem] font-bold uppercase tracking-[0.14em] text-amber-300">
              2x multiplier active
            </div>
          ) : null}
          {state.lastSurgeClearedKey ? (
            <div className="mt-1 truncate text-[0.65rem] font-bold uppercase tracking-[0.14em] text-cyan-200">
              Surge cleared cell {state.lastSurgeClearedKey}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 justify-self-end rounded-md border border-cyan-200/20 bg-slate-950/72 p-3 text-right text-xs shadow-2xl shadow-cyan-950/25 backdrop-blur-md sm:min-w-[220px] sm:p-4 sm:text-sm">
          <div className="font-semibold uppercase tracking-[0.12em] text-cyan-200">Route cue</div>
          <div className="mt-1 text-slate-400">
            {sectorCue.routeLabel} · {sectorCue.recommendedMove}
          </div>
          <div className="mt-1 text-slate-500">
            Pressure {sectorCue.pressure} · {sectorCue.fallingThreats} falling ·{" "}
            {sectorCue.blockedCells} blocked
          </div>
          {state.targetNode ? (
            <div className="mt-1 truncate font-semibold text-pink-400">
              Target: ({state.targetNode.gridX}, {state.targetNode.gridZ})
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
