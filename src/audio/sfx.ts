import * as Tone from 'tone';
import type { PlayerId, ShapeKind } from '@/sim';
import { ensureStarted, isMuted } from './mixer';

/**
 * SFX — per-shape chord stabs plus collapse / stress drone.
 *
 * Every composite shape has a harmonic identity: cubes are a muted tap,
 * plates a layered chord, wedges a suspended fourth, pyramids a major
 * triad, trusses a wide shell voicing (no third), braces a snap click,
 * collapses a noise crash.
 *
 * Rival commits use the same voicings shifted up a perfect fifth so they
 * read as "same family, different voice."
 */

const PLAYER_VOICINGS: Record<ShapeKind, readonly string[]> = {
  cube: ['A3'],
  plate2x2: ['A3', 'E4'],
  plate3x3: ['A3', 'E4', 'B4'],
  plate4x4: ['A2', 'A3', 'E4', 'B4'],
  wedge: ['A3', 'D4', 'E4'],
  pyramid: ['A3', 'C#4', 'E4'],
  ziggurat: ['A2', 'E3', 'A3', 'C#4', 'E4'],
  lintel: ['E3', 'B3'],
  beam: ['A3', 'B3', 'E4'],
  arch: ['A3', 'D4', 'A4'],
  trussBridge: ['A3', 'E4', 'A4', 'E5'],
  flyingButtress: ['A2', 'E3', 'A3'],
  diagonalBrace: ['E4'],
  kBrace: ['A3', 'D4'],
  crossBrace: ['A3', 'E4'],
  corbel: ['A3', 'B3'],
};

function shift(voicing: readonly string[], semitones: number): string[] {
  return voicing.map((note) => Tone.Frequency(note).transpose(semitones).toNote());
}

export interface Sfx {
  play(kind: ShapeKind, owner: PlayerId): Promise<void>;
  claim(): Promise<void>;
  collapse(): Promise<void>;
  stress(intensity: number): void;
  stop(): void;
}

export function createSfx(): Sfx {
  let pluck: Tone.PolySynth<Tone.Synth> | null = null;
  let crash: Tone.NoiseSynth | null = null;
  let stressDrone: Tone.Oscillator | null = null;
  let stressGain: Tone.Gain | null = null;
  let started = false;

  const ensure = async () => {
    if (started) return;
    await ensureStarted();
    pluck = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.008, decay: 0.22, sustain: 0.12, release: 0.6 },
      volume: -14,
    }).toDestination();
    crash = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 0.6, sustain: 0 },
      volume: -10,
    }).toDestination();
    stressGain = new Tone.Gain(0).toDestination();
    stressDrone = new Tone.Oscillator({ frequency: 55, type: 'sawtooth' }).connect(stressGain);
    stressDrone.start();
    started = true;
  };

  return {
    async play(kind, owner) {
      await ensure();
      if (!pluck || isMuted()) return;
      const voicing = owner === 'you' ? PLAYER_VOICINGS[kind] : shift(PLAYER_VOICINGS[kind], 7);
      pluck.triggerAttackRelease(Array.from(voicing), '16n');
    },
    async claim() {
      await ensure();
      if (!pluck || isMuted()) return;
      // A-major triad across two octaves — the "sector claimed" fanfare.
      pluck.triggerAttackRelease(['A3', 'C#4', 'E4', 'A4', 'C#5', 'E5'], '4n');
    },
    async collapse() {
      await ensure();
      if (!crash || isMuted()) return;
      crash.triggerAttackRelease('2n');
    },
    stress(intensity) {
      if (!stressGain) return;
      const v = Math.max(0, Math.min(1, intensity));
      stressGain.gain.rampTo(isMuted() ? 0 : v * 0.08, 0.3);
    },
    stop() {
      if (!started) return;
      stressDrone?.stop();
      stressDrone?.dispose();
      stressGain?.dispose();
      pluck?.dispose();
      crash?.dispose();
      pluck = null;
      crash = null;
      stressDrone = null;
      stressGain = null;
      started = false;
    },
  };
}
