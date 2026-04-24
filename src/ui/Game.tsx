import { useCallback, useEffect, useRef, useState } from 'react';
import { bootstrap } from '@/render/bridge/bootstrap';
import { isMuted, onMuteChange, setMuted } from '@/audio';
import type { Codename, DuelState, SectorObjective } from '@/sim';
import { readSeedFromLocation, shareUrlForSeed } from '@/sim';

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
  const [codename, setCodename] = useState<Codename | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seed = readSeedFromLocation(window.location.search);
    const teardownPromise = bootstrap({
      canvas,
      seed,
      onDuelChange: setDuelState,
      onObjective: setObjective,
      onCodename: (cn) => {
        setCodename(cn);
        // Reflect the resolved codename back into the URL so refresh replays it.
        const url = shareUrlForSeed(cn, window.location.origin, window.location.pathname);
        window.history.replaceState(null, '', url);
      },
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
      {duelState && objective ? (
        <Hud state={duelState} objective={objective} codename={codename} />
      ) : null}
      <MuteToggle />
    </main>
  );
}

function MuteToggle() {
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  useEffect(() => onMuteChange(setMutedState), []);
  return (
    <button
      type="button"
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={muted}
      onClick={() => setMuted(!muted)}
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        background: 'rgba(26, 29, 36, 0.75)',
        border: `1px solid ${muted ? 'var(--color-warn, #ff375f)' : 'rgba(33, 212, 255, 0.35)'}`,
        color: muted ? 'var(--color-warn, #ff375f)' : 'var(--color-beacon, #21d4ff)',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        pointerEvents: 'auto',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      {muted ? '×' : '♪'}
    </button>
  );
}

function Hud({
  state,
  objective,
  codename,
}: {
  state: DuelState;
  objective: SectorObjective;
  codename: Codename | null;
}) {
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
          alignItems: 'flex-start',
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
        {codename ? <SeedBadge codename={codename} /> : null}
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
        <BudgetBadge
          label="You"
          remaining={state.youRemaining}
          total={objective.blockBudgetPerRound}
          color="#ff6b1a"
        />
        <div style={{ textAlign: 'center', color: 'var(--color-fg-muted, #7a8190)' }}>
          {statusLabel}
        </div>
        <BudgetBadge
          label="Rival"
          remaining={state.rivalRemaining}
          total={objective.blockBudgetPerRound}
          color="#7d5cff"
        />
      </footer>
    </div>
  );
}

function SeedBadge({ codename }: { codename: Codename }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(() => {
    const url = shareUrlForSeed(codename, window.location.origin, window.location.pathname);
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {
        /* ignore clipboard failures */
      });
  }, [codename]);
  return (
    <div
      style={{
        pointerEvents: 'auto',
        textAlign: 'center',
        minWidth: 160,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <button
        type="button"
        onClick={onCopy}
        style={{
          pointerEvents: 'auto',
          cursor: 'pointer',
          background: 'rgba(26, 29, 36, 0.7)',
          border: '1px solid rgba(33, 212, 255, 0.35)',
          borderRadius: 4,
          padding: '6px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.1em',
          color: copied ? 'var(--color-monument, #2ee5b8)' : 'var(--color-beacon, #21d4ff)',
        }}
        aria-label={`Copy share URL for seed ${codename.display}`}
      >
        {copied ? 'copied ✓' : codename.display}
      </button>
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'var(--color-fg-muted, #7a8190)',
        }}
      >
        Seed · Tap to share
      </span>
    </div>
  );
}

function BudgetBadge({
  label,
  remaining,
  total,
  color,
}: {
  label: string;
  remaining: number;
  total: number;
  color: string;
}) {
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
