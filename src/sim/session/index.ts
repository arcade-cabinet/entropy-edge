import type { Rng } from '@/sim/rng';
import { generateObjective, type SectorObjective } from '@/sim/objective';

/**
 * Session modes shape the run. They tune parameters on top of the log-curve
 * difficulty spine; they do not replace it.
 */

export type SessionModeId = 'standard' | 'brutalist' | 'vertigo' | 'daily';

export interface SessionModeConfig {
  readonly id: SessionModeId;
  readonly label: string;
  readonly sectors: number;
  readonly description: string;
}

export const SESSION_MODES: Record<SessionModeId, SessionModeConfig> = {
  standard: {
    id: 'standard',
    label: 'Standard',
    sectors: 5,
    description: 'Default log-curve. Five sectors, balanced palette.',
  },
  brutalist: {
    id: 'brutalist',
    label: 'Brutalist',
    sectors: 4,
    description: 'Favors wide bases and massive plates. Four sectors.',
  },
  vertigo: {
    id: 'vertigo',
    label: 'Vertigo',
    sectors: 6,
    description: 'Tall narrow spires. Brace-heavy patterns.',
  },
  daily: {
    id: 'daily',
    label: 'Daily',
    sectors: 5,
    description: 'UTC-seeded run. Same structure for everyone today.',
  },
};

export interface Session {
  readonly mode: SessionModeConfig;
  readonly seed: string;
  readonly objectives: readonly SectorObjective[];
}

export function planSession(
  mode: SessionModeId,
  seed: string,
  rng: Rng
): Session {
  const cfg = SESSION_MODES[mode];
  const objectivesRng = rng.fork('objectives');
  const objectives: SectorObjective[] = [];
  for (let sector = 1; sector <= cfg.sectors; sector++) {
    objectives.push(generateObjective(sector, objectivesRng.fork(`sector-${sector}`)));
  }
  return { mode: cfg, seed, objectives };
}

export function dailySeed(now: Date = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `daily-${y}${m}${d}`;
}
