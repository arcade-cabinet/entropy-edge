import * as Tone from 'tone';
import { ensureStarted, isMuted } from './mixer';

/**
 * Ambient pad — a synthesized AMSynth chord cycle with a low-pass filter
 * whose cutoff tracks "combined stability" (0..1). Stable structure
 * brightens the pad; collapsing structure dulls it.
 *
 * Voicing drifts with the current difficulty band so each band has its
 * own harmonic color:
 *   band 1 — open fifth (A2 + E3)
 *   band 2 — suspended fourth (A2 + D3)
 *   band 3 — minor ninth cluster (A2 + C3 + B3)
 *   band 4 — minor second cluster (A2 + Bb2 + E3)
 */

type DifficultyBand = 1 | 2 | 3 | 4;

const BAND_VOICINGS: Record<DifficultyBand, readonly string[]> = {
  1: ['A2', 'E3'],
  2: ['A2', 'D3'],
  3: ['A2', 'C3', 'B3'],
  4: ['A2', 'Bb2', 'E3'],
};

export interface Ambient {
  start(band: DifficultyBand): Promise<void>;
  setBand(band: DifficultyBand): void;
  /** 0 = collapsed / dull; 1 = stable / bright. */
  setStability(value: number): void;
  stop(): void;
}

export function createAmbient(): Ambient {
  let synth: Tone.PolySynth<Tone.AMSynth> | null = null;
  let filter: Tone.Filter | null = null;
  let reverb: Tone.Reverb | null = null;
  let currentBand: DifficultyBand = 1;
  let started = false;

  const scheduleChord = (time?: number) => {
    if (!synth || isMuted()) return;
    const voicing = BAND_VOICINGS[currentBand];
    synth.triggerAttackRelease(Array.from(voicing), '2n', time);
    Tone.getTransport().scheduleOnce(scheduleChord, '+2n');
  };

  return {
    async start(band) {
      if (started) return;
      await ensureStarted();
      filter = new Tone.Filter({ frequency: 900, type: 'lowpass', Q: 1.1 });
      reverb = new Tone.Reverb({ decay: 4.5, wet: 0.42 });
      synth = new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 1.7,
        envelope: { attack: 1.6, decay: 0.4, sustain: 0.7, release: 3 },
        modulationEnvelope: { attack: 0.9, decay: 0.25, sustain: 0.45, release: 2 },
        volume: -20,
      });
      synth.chain(filter, reverb, Tone.getDestination());
      currentBand = band;
      Tone.getTransport().bpm.value = 52;
      Tone.getTransport().start();
      scheduleChord();
      started = true;
    },
    setBand(band) {
      currentBand = band;
    },
    setStability(value) {
      if (!filter) return;
      const v = Math.max(0, Math.min(1, value));
      const cutoff = 320 + v * 2080; // 320 Hz → 2400 Hz
      filter.frequency.rampTo(cutoff, 0.4);
    },
    stop() {
      if (!started) return;
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
      synth?.releaseAll();
      synth?.dispose();
      filter?.dispose();
      reverb?.dispose();
      synth = null;
      filter = null;
      reverb = null;
      started = false;
    },
  };
}
