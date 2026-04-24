import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isMuted, onMuteChange, setMuted } from '@/audio';
import type { ProgressSnapshot } from '@/ecs';
import type { Codename, DuelState, SectorObjective } from '@/sim';
import { readSeedFromLocation, shareUrlForSeed, resolveSeed } from '@/sim';
import { Landing } from '@/ui/landing/Landing';

/**
 * Game — hosts the landing page, setup modal, then the voxel canvas + HUD overlay.
 *
 * JollyPixel + Rapier3D are lazy-loaded via dynamic import on CTA so the
 * cold landing bundle stays small and the first paint is fast.
 */

type Phase = 'landing' | 'setup' | 'playing';

export function Game() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [runId, setRunId] = useState(0);
  const [activeSeed, setActiveSeed] = useState<string | null>(null);

  // If there's already a seed in the URL, skip setup and go straight to playing
  useEffect(() => {
    const seed = readSeedFromLocation(window.location.search);
    if (seed && phase === 'landing') {
      setActiveSeed(seed);
      setPhase('playing');
    }
  }, [phase]);

  return (
    <AnimatePresence mode="wait">
      {phase === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Landing onEnter={() => setPhase('setup')} />
        </motion.div>
      ) : phase === 'setup' ? (
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <SetupPhase
            onStart={(seedSlug) => {
              setActiveSeed(seedSlug);
              setPhase('playing');
            }}
            onBack={() => setPhase('landing')}
          />
        </motion.div>
      ) : (
        <motion.div
          key={`playing-${runId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <Playing
            explicitSeed={activeSeed}
            onRestart={() => setRunId((n) => n + 1)}
            onExit={() => {
              setActiveSeed(null);
              window.history.replaceState(null, '', window.location.pathname);
              setPhase('landing');
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SetupPhase({ onStart, onBack }: { onStart: (seed: string) => void; onBack: () => void }) {
  const [codename, setCodename] = useState<Codename>(() => resolveSeed(null).codename);

  const rollNew = () => setCodename(resolveSeed(null).codename);

  return (
    <main
      style={{
        width: '100vw',
        height: '100svh',
        background: 'var(--color-bg, #07080a)',
        color: 'var(--color-fg, #dce1e8)',
        display: 'grid',
        placeItems: 'center',
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
          textAlign: 'center',
        }}
      >
        <div>
          <h2 className="ee-display" style={{ color: 'var(--color-signal, #ff6b1a)', fontSize: 32, margin: '0 0 16px 0', textTransform: 'uppercase' }}>
            Initialize Sector
          </h2>
          <p style={{ margin: 0, color: 'var(--color-fg-muted, #7a8190)', lineHeight: 1.5 }}>
            Every sector is procedurally generated from a codename seed. 
            The world's topography, goal height, and your rival's strategy are all locked to this phrase.
          </p>
        </div>

        <div style={{ padding: '24px', border: '1px solid rgba(33, 212, 255, 0.25)', borderRadius: 8, width: '100%', background: 'rgba(26, 29, 36, 0.4)' }}>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-beacon, #21d4ff)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
            Sector Codename
          </div>
          <div className="ee-display" style={{ fontSize: 28, color: 'var(--color-fg, #dce1e8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {codename.display}
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              onClick={rollNew}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-fg-muted, #7a8190)',
                color: 'var(--color-fg, #dce1e8)',
                padding: '8px 16px',
                borderRadius: 4,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              Reroll Coordinates
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              padding: '14px 24px',
              background: 'transparent',
              color: 'var(--color-fg-muted, #7a8190)',
              border: '1px solid rgba(122, 129, 144, 0.45)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onStart(codename.slug)}
            className="ee-display"
            style={{
              flex: 2,
              padding: '14px 24px',
              background: 'var(--color-signal, #ff6b1a)',
              color: '#0c0a0a',
              border: 'none',
              borderRadius: 4,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 28px rgba(255, 107, 26, 0.18)',
            }}
          >
            Deploy
          </button>
        </div>
      </div>
    </main>
  );
}

interface PlayingProps {
  explicitSeed: string | null;
  onRestart: () => void;
  onExit: () => void;
}

function Playing({ explicitSeed, onRestart, onExit }: PlayingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [objective, setObjective] = useState<SectorObjective | null>(null);
  const [codename, setCodename] = useState<Codename | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const seed = explicitSeed ?? readSeedFromLocation(window.location.search);
    let disposed = false;
    let disposer: (() => void) | null = null;
    (async () => {
      // Lazy-load the renderer entry so the landing bundle stays lean.
      const mod = await import('@/render/bridge/bootstrap');
      if (disposed) return;
      disposer = await mod.bootstrap({
        canvas,
        seed,
        onDuelChange: setDuelState,
        onObjective: setObjective,
        onProgress: setProgress,
        onCodename: (cn) => {
          setCodename(cn);
          const url = shareUrlForSeed(cn, window.location.origin, window.location.pathname);
          window.history.replaceState(null, '', url);
        },
      });
      if (disposed) disposer?.();
    })();
    return () => {
      disposed = true;
      disposer?.();
    };
  }, [explicitSeed]);

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
        <Hud state={duelState} objective={objective} codename={codename} progress={progress} />
      ) : null}
      <MuteToggle />
      {duelState && objective ? (
        <GameOverOverlay
          state={duelState}
          objective={objective}
          progress={progress}
          onRestart={onRestart}
          onExit={onExit}
        />
      ) : null}
    </main>
  );
}

function Hud({
  state,
  objective,
  codename,
  progress,
}: {
  state: DuelState;
  objective: SectorObjective;
  codename: Codename | null;
  progress: ProgressSnapshot | null;
}) {
  const banner = bannerForState(state, objective, progress);
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
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: banner.tone,
        }}
      >
        {banner.text}
      </div>
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
          tier={progress?.yourMaxTier ?? 0}
          tierTarget={objective.tierTarget}
          color="#ff6b1a"
        />
        <div style={{ textAlign: 'center', color: 'var(--color-fg-muted, #7a8190)' }}>
          {labelForStatus(state)}
        </div>
        <BudgetBadge
          label="Rival"
          remaining={state.rivalRemaining}
          total={objective.blockBudgetPerRound}
          tier={progress?.rivalMaxTier ?? 0}
          tierTarget={objective.tierTarget}
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
  tier,
  tierTarget,
  color,
}: {
  label: string;
  remaining: number;
  total: number;
  tier: number;
  tierTarget: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{ color: 'var(--color-fg, #dce1e8)', fontSize: 20 }}>
        {remaining}
        <span style={{ color: 'var(--color-fg-muted, #7a8190)', fontSize: 14 }}>/{total}</span>
      </span>
      <span
        style={{
          color: 'var(--color-fg-muted, #7a8190)',
          fontSize: 11,
          letterSpacing: '0.12em',
        }}
      >
        Tier {tier}/{tierTarget}
      </span>
    </div>
  );
}

function GameOverOverlay({
  state,
  objective,
  progress,
  onRestart,
  onExit,
}: {
  state: DuelState;
  objective: SectorObjective;
  progress: ProgressSnapshot | null;
  onRestart: () => void;
  onExit: () => void;
}) {
  const { status } = state;
  if (status.kind !== 'claimed' && status.kind !== 'drawn') return null;
  const youWon = status.kind === 'claimed' && status.winner === 'you';
  const rivalWon = status.kind === 'claimed' && status.winner === 'rival';
  const headline = youWon ? 'Sector Claimed' : rivalWon ? 'Rival Claimed' : 'Sector Held Open';
  const tone = youWon
    ? 'var(--color-monument, #2ee5b8)'
    : rivalWon
      ? 'var(--color-rival, #7d5cff)'
      : 'var(--color-fg-muted, #7a8190)';
  const roundsUsed = status.kind === 'claimed' ? status.round : objective.maxRounds;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        background: 'rgba(7, 8, 10, 0.82)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: '100%',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          color: 'var(--color-fg, #dce1e8)',
        }}
      >
        <h2
          className="ee-display"
          style={{
            margin: 0,
            fontSize: 'clamp(32px, 6vw, 48px)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: tone,
            lineHeight: 1,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-fg-muted, #7a8190)',
          }}
        >
          Sector {objective.sector} · {objective.patternName} · {roundsUsed}/{objective.maxRounds} rounds
        </p>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 24px',
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--color-fg, #dce1e8)',
          }}
        >
          <dt style={{ color: 'var(--color-signal, #ff6b1a)', textAlign: 'right' }}>You</dt>
          <dd style={{ margin: 0, textAlign: 'left' }}>
            tier {progress?.yourMaxTier ?? 0}/{objective.tierTarget} · {progress?.yourCellCount ?? 0} blocks
          </dd>
          <dt style={{ color: 'var(--color-rival, #7d5cff)', textAlign: 'right' }}>Rival</dt>
          <dd style={{ margin: 0, textAlign: 'left' }}>
            tier {progress?.rivalMaxTier ?? 0}/{objective.tierTarget} · {progress?.rivalCellCount ?? 0} blocks
          </dd>
        </dl>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onRestart}
            className="ee-display"
            style={{
              padding: '12px 26px',
              background: 'var(--color-signal, #ff6b1a)',
              color: '#0c0a0a',
              border: 'none',
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(255, 107, 26, 0.18)',
            }}
          >
            Deploy Next
          </button>
          <button
            type="button"
            onClick={onExit}
            style={{
              padding: '12px 22px',
              background: 'transparent',
              color: 'var(--color-fg-muted, #7a8190)',
              border: '1px solid rgba(122, 129, 144, 0.45)',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            End Mission
          </button>
        </div>
      </div>
    </motion.div>
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

interface Banner {
  readonly text: string;
  readonly tone: string;
}

function bannerForState(
  state: DuelState,
  objective: SectorObjective,
  progress: ProgressSnapshot | null
): Banner {
  if (state.status.kind === 'claimed') {
    return state.status.winner === 'you'
      ? { text: 'You claimed the sector', tone: 'var(--color-monument, #2ee5b8)' }
      : { text: 'Rival claimed the sector', tone: 'var(--color-rival, #7d5cff)' };
  }
  if (state.status.kind === 'drawn') {
    return { text: 'Sector held open — draw', tone: 'var(--color-fg-muted, #7a8190)' };
  }
  const roundsLeft = Math.max(0, objective.maxRounds - state.round + 1);
  const reached = progress?.yourMaxTier ?? 0;
  const remaining = Math.max(0, objective.tierTarget - reached);
  if (state.turn !== 'you') {
    return { text: 'Rival building…', tone: 'var(--color-rival, #7d5cff)' };
  }
  if (remaining === 0) {
    return { text: 'Hold connectivity to claim', tone: 'var(--color-beacon, #21d4ff)' };
  }
  return {
    text: `Build ${remaining} tier${remaining === 1 ? '' : 's'} up · ${roundsLeft} round${
      roundsLeft === 1 ? '' : 's'
    } left`,
    tone: 'var(--color-signal, #ff6b1a)',
  };
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
