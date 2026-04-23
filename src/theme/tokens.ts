/**
 * Entropy Edge palette — hazard-chromed graphite.
 *
 * See docs/DESIGN.md for rationale. Short version: the player is
 * running a reserve economy at the edge of failure. Graphite is safe
 * surface; signal orange is the warning channel; cyan beacon marks
 * anchors. The palette is deliberately monochrome + two signals.
 */

export const palette = {
  bg: "#07080a",
  graphite: "#0f1115",
  surface: "#1a1d24",
  signal: "#ff6b1a",
  beacon: "#21d4ff",
  fg: "#dce1e8",
  fgMuted: "#7a8190",
  warn: "#ff375f",
} as const;

export type PaletteKey = keyof typeof palette;
