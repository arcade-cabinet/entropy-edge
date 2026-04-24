import { useEffect, useRef, useState } from 'react';
import { bootstrap } from '@/render/bridge/bootstrap';
import type { DuelState, SectorObjective } from '@/sim';

/**
 * Game — hosts the voxel canvas + the HUD overlay.
 *
 * React owns the canvas element and the DOM UI chrome. JollyPixel owns the
 * render loop and ECS. Sim-state flows from the engine into React via an
 * onDuelChange callback so the HUD stays in lockstep with the duel.
 */
export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [objective, setObjective] = useState<SectorObjective | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seed = new URLSearchParams(window.location.search).get('seed') ?? undefined;
    const teardownPromise = bootstrap({
      canvas,
      seed,
      onDuelChange: setDuelState,
      onObjective: setObjective,
    });
    return () => {
      teardownPromise.then((dispose) => dispose());
    };
  }, []);

  return (
    <main
      style={{
        width: '100vw',
        height: '100svh',
        background: 'var(--color-bg, #07080a)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {duelState && objective ? <Hud state={duelState} objective={objective} /> : null}
    </main>
  );
}

function Hud({ state, objective }: { state: DuelState; objective: SectorObjective }) {
  const statusLabel = labelForStatus(state);
  return (
    <div
      className="ee-display"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: 'var(--color-fg, #dce1e8)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
          fontSize: 13,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <div>
          <div style={{ color: 'var(--color-signal, #ff6b1a)', fontWeight: 600 }}>
            Sector {objective.sector}
          </div>
          <div style={{ color: 'var(--color-fg-muted, #7a8190)' }}>{objective.telegraph}</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
          <div>Tier target {objective.tierTarget}</div>
          <div style={{ color: 'var(--color-fg-muted, #7a8190)' }}>
            Round {state.round} / {objective.maxRounds}
          </div>
        </div>
      </header>
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      >
        <BudgetBadge label="You" remaining={state.youRemaining} total={objective.blockBudgetPerRound} color="#ff6b1a" />
        <div style={{ textAlign: 'center', color: 'var(--color-fg-muted, #7a8190)' }}>{statusLabel}</div>
        <BudgetBadge label="Rival" remaining={state.rivalRemaining} total={objective.blockBudgetPerRound} color="#7d5cff" />
      </footer>
    </div>
  );
}

function BudgetBadge({ label, remaining, total, color }: { label: string; remaining: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ color: 'var(--color-fg, #dce1e8)', fontSize: 20 }}>
        {remaining}
        <span style={{ color: 'var(--color-fg-muted, #7a8190)', fontSize: 14 }}>/{total}</span>
      </span>
    </div>
  );
}

function labelForStatus(state: DuelState): string {
  switch (state.status.kind) {
    case 'ongoing':
      return state.turn === 'you' ? 'Your Turn — Tap to Build' : 'Rival Thinking';
    case 'claimed':
      return `${state.status.winner === 'you' ? 'You' : 'Rival'} claimed sector`;
    case 'drawn':
      return 'Sector held open';
    case 'pending':
      return 'Initializing';
    default:
      return '';
  }
}
