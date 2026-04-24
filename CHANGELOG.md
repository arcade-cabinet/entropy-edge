# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Full rebuild from `poc.html`.** The initial extraction targeted
  a sphere-on-grid reserve roguelite that did not match the POC. The
  game is now a Scrabble-style structural voxel duel: two builders
  race the same tier-connectivity objective on a shared lattice while
  a stability solver judges every placement, collapsing overloaded
  structures as Rapier debris. Whoever claims the sector keeps the
  load-bearing cells as monuments that persist as the ground of the
  next sector.
- **Engine pivot** to `@jolly-pixel/voxel.renderer` 1.4 +
  `@jolly-pixel/engine` 2.5 + `@jolly-pixel/runtime` 3.3 +
  `@dimforge/rapier3d-compat` 0.19 (WASM). Dropped R3F, drei, R3F-
  rapier, Koota.
- **Input** pivoted to pointer-only (no keyboard handlers anywhere
  in game code) — tap-to-build, mobile-first.
- **Deterministic codename seeds.** `?seed=sharp-kernel` replays an
  exact run; the HUD shows the codename and a tap-to-share URL badge.
- **Log-curve difficulty spine** with 8 patterns across 4 bands —
  straight-ascent, first-platform, twin-peaks, pyramid-base,
  stepping-stones, cathedral, skyline, flying-buttress. All roll
  deterministically from the seed with a feasibility gate.
- **Synthesized audio.** Tone.js ambient pad whose filter cutoff
  tracks combined stability; per-shape commit SFX (cubes/plates/
  wedge/pyramid/lintel/beam/arch/truss/buttress/brace/corbel) with a
  fifth transposition for rival voicings. Circular mute toggle in
  the HUD.
- **Content pipeline.** `config/raw/*.json` → Zod schema validation
  → `config/compiled/content.ts`. Runs as a predev / prebuild /
  pretypecheck / pretest hook.
- **Code-split bundle.** Cold landing is 354 KB / 114 KB gz. JollyPixel
  (229 KB gz), Rapier (842 KB gz), Tone (61 KB gz), Three (bundled in
  main) lazy-load via dynamic import on CTA.
- **Polish.** Framer-motion landing with title, tagline, verb chips,
  and the "Enter the Lattice" CTA. Braced-truss favicon. Capacitor
  portrait lock via `@capacitor/screen-orientation` and preferences-
  backed storage replacing any localStorage use.

### Tests

- 56 sim-layer unit tests across rng (including seed/codename round-
  trips), grid, shape grammar, stability solver, placement, objective
  generation, Yuka agent, duel turn loop, and compiled content schema.
- Playwright golden-path E2E in `e2e/duel.spec.ts` — landing → CTA →
  HUD paint → tap places cube → zero console errors.
