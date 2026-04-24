import * as Tone from 'tone';

/**
 * Mixer — central mute + start gate for Tone.js.
 *
 * Tone requires a user gesture before audio can start; `ensureStarted()`
 * wraps Tone.start() so we can call it on first pointerdown. The module
 * holds singleton state for mute + master volume which every other audio
 * module reads from.
 */

let started = false;
let muted = false;
const mutedListeners = new Set<(v: boolean) => void>();

export async function ensureStarted(): Promise<void> {
  if (started) return;
  await Tone.start();
  Tone.getDestination().mute = muted;
  started = true;
}

export function isStarted(): boolean {
  return started;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  if (next === muted) return;
  muted = next;
  if (started) Tone.getDestination().mute = muted;
  for (const l of mutedListeners) l(muted);
}

export function onMuteChange(listener: (v: boolean) => void): () => void {
  mutedListeners.add(listener);
  return () => mutedListeners.delete(listener);
}
