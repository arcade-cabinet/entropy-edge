---
title: State
updated: 2026-04-23
status: in-progress
domain: context
---

# State

## Current baseline

Initial cut extracted from `jbcom/arcade-cabinet` on 2026-04-23.
R3F scene is live: cyan-beacon grid, player sphere, magenta anchors,
red hazard blocks, route cue lines, shockwaves. HUD shows Sector,
Anchors, Score, Stability, Resonance, Route Cue. Joystick and
keyboard input both working.

- Node tests: 11 passing (simulation).
- Typecheck clean, build clean at ~1.26 MB JS (~355 KB gzip) +
  ~16 KB CSS + font files.
- Headless Chromium verified at 1280×800 and 390×844 portrait:
  landing → Initialize Link → playing → HUD updates → zero console
  errors.

## Remaining before 1.0

| Area                 | Status          | Next step                                                   |
| -------------------- | --------------- | ----------------------------------------------------------- |
| Audio                | not started     | Low graphite drone + surge chime + hazard click             |
| Icons                | placeholder     | Signal-orange anchor SVG favicon + Android icon pack        |
| E2E test             | not started     | Playwright journey spec                                     |
| GitHub Pages         | not deployed    | First release-please tag triggers                           |
| Portrait lock        | not locked      | Optional: lock to portrait via capacitor.config             |
| Daily seed           | not in engine   | `?seed=<YYYYMMDD>` query-param                              |
| Post-run trace       | stub            | Reserve-over-time line chart on the rating screen           |

## Known bugs / quirks

- Three.js compiles shaders via runtime code evaluation. CSP had to
  allow `'unsafe-eval'` + `'wasm-unsafe-eval'` in `script-src` for
  R3F to initialize. (2026-04-23)

## Decisions log

- 2026-04-23: Kept the R3F + drei + three stack from the cabinet.
  Alternative was switching to canvas 2D, which would have meant
  redrawing every mechanic. The 3D scene carries so much of the
  identity (camera diorama, beacon walls, shockwave beams) that
  flattening it would have lost the "hazard-chromed roguelite" feel.
- 2026-04-23: Extended `StartScreen` / `GameOverScreen` shells with
  `accent` / `glowRgb` / `background` / `displayClassName` props so
  the signal-orange palette could reuse the title-card rhythm from
  bioluminescent-sea / cosmic-gardener / enchanted-forest without a
  copy-paste fork.
- 2026-04-23: Extracted FloatingJoystick from the cabinet's atoms.tsx
  into `src/ui/shell/FloatingJoystick.tsx`. Simplified sensitivity
  (dropped `--cabinet-joystick-sensitivity` CSS var), accent now
  defaults to `var(--color-beacon)`.
- 2026-04-23: Replaced cabinet-runtime save-slot API with
  `localStorage["entropy-edge:v1:save"]` +
  `…:best-score` + `…:last-run`.
