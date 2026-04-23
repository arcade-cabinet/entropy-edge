import type { SessionMode } from "@/lib/sessionMode";

export type RunStatus = "completed" | "failed" | "abandoned";

export interface RunResult {
  mode: SessionMode;
  status: RunStatus;
  score: number;
  milestones?: readonly string[];
  stats?: Record<string, number | string | boolean>;
  summary?: string;
}

/**
 * The cabinet's `RuntimeResultRecorder` component hooked into a shared
 * runtime to persist results across games. In a standalone repo we just
 * write the latest result into localStorage so the UI can read it back
 * from game-over / landing screens.
 */
const KEY = "cosmic-gardener:v1:last-result";

export function recordRunResult(result: RunResult): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...result, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function readLastRunResult(): RunResult | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RunResult;
  } catch {
    return null;
  }
}

const BEST_KEY = "cosmic-gardener:v1:best-score";

export function getBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function recordBestScore(score: number): number {
  const best = getBestScore();
  if (score > best) {
    try {
      localStorage.setItem(BEST_KEY, String(score));
    } catch {
      // ignore
    }
    return score;
  }
  return best;
}
