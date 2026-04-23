import { useEffect, useRef } from "react";

interface AutosaveOptions<T> {
  /** Storage key — e.g. "cosmic-gardener:v1:save". */
  key: string;
  /** Called to build a snapshot when autosave fires. Return null to skip. */
  build: () => T | null;
  /** Autosave cadence in ms. Defaults to 2500. */
  intervalMs?: number;
  /** Skip autosave when this is true. */
  paused?: boolean;
}

/**
 * Periodically serializes whatever `build()` returns into localStorage.
 * Replaces the cabinet's `useRunSnapshotAutosave`.
 */
export function useRunSnapshotAutosave<T>({
  key,
  build,
  intervalMs = 2500,
  paused = false,
}: AutosaveOptions<T>): void {
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    if (paused) return undefined;
    const write = () => {
      try {
        const snapshot = buildRef.current();
        if (snapshot === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(snapshot));
        }
      } catch {
        // storage disabled or full — ignore
      }
    };
    const initial = window.setTimeout(write, 400);
    const interval = window.setInterval(write, intervalMs);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
      write(); // final flush
    };
  }, [key, intervalMs, paused]);
}
