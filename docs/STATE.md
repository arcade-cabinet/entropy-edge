---
title: State
updated: 2026-04-24
status: completed
domain: context
---

# State

## Current baseline

**Branch:** `feat/rebuild-from-poc`.

**Pivot:** the initial extraction from `jbcom/arcade-cabinet` was
the *wrong game*. An 11×11 grid player-sphere-dodging-falling-blocks
roguelite has been removed. The real game — a structural voxel duel
that matches `docs/reference/poc.html` — is being rebuilt from
scratch on the JollyPixel stack.

**Engine pivot:** dropped `@react-three/fiber`, `@react-three/drei`,
`@react-three/rapier`, and `koota`. Adopted
`@jolly-pixel/voxel.renderer`, `@jolly-pixel/engine`,
`@jolly-pixel/runtime`, `@dimforge/rapier3d-compat`, `yuka`,
`seedrandom`, `zod`, `tone`, `gsap`.

**Design pivot:** from "reach-the-anchor with monument persistence"
to "Scrabble-with-physics structural duel":

- Both players satisfy the *same* sector objective (tier target +
  connectivity thresholds) rather than racing to a physical anchor.
- Rival is goal-oriented (not adversarial) — same palette, same
  budget, different position.
- Collapse = lost progress, no explicit score penalty.
- Shape grammar composes on placement (wedge, pyramid, lintel,
  arch, truss, buttress, K-brace, cross-brace, corbel).
- Log-curve difficulty spine with pattern-pool bands.
- Monuments persist for both builders across sectors.

## Production plan

The A→H PR chain lives in [`PRODUCTION.md`](./PRODUCTION.md). Single
branch, sequential commits, one PR.

## Remaining before 1.0

The full A→H PR chain is shipped and the game is now production-ready.

| Area                | Status       | PR   |
| ------------------- | ------------ | ---- |
| Docs + skeleton     | shipped      | A    |
| Sim + shape grammar | shipped      | B    |
| Renderer wiring     | shipped      | C    |
| ECS + actors        | shipped      | D    |
| Seed + codename     | shipped      | E    |
| Audio               | shipped      | F    |
| Content pipeline    | shipped      | G    |
| Polish + landing    | shipped      | H    |

## Decisions log

- 2026-04-24: Finished the production polish runbook. Checked off all tasks in `HANDOFF-PRD.md`.
- 2026-04-24: Migrated integration browser test to Playwright via `vitest.browser.config.ts` using `vitest/browser` and `bootstrap` to take automated screenshots.
- 2026-04-23: Adopted `@jolly-pixel/voxel.renderer` after
  discovering it provides chunked voxel world + Rapier physics
  hooks + tileset face overrides + JSON save/load + Tiled importer
  out of the box. Alternative was hand-rolling on raw three.js,
  which would cost ~4x implementation time and still leave us
  without the chunk-dirty optimization. The early-adopter risk is
  accepted.
- 2026-04-23: Dropped Koota in favor of `@jolly-pixel/engine` ECS.
  Koota's React adapter is only needed when React drives the
  render; here React only owns UI chrome and JollyPixel owns the
  canvas/ECS loop, so there is no adapter to replace.
- 2026-04-23: Opposing agency reframed as Scrabble-style, not
  adversarial. Rival's Yuka tree targets the same goal as the
  player. Designed for legibility: the player never has to guess at
  rival intent.
- 2026-04-23: Collapse has no explicit score penalty. The lost
  tiers-held factor is the natural penalty. Rival-caused collapse
  is a legal move.
- 2026-04-23: Difficulty spine is logarithmic, not linear. Pattern
  pools per difficulty band; feasibility gate runs on every
  generated goal.
- 2026-04-23: Biome aligned to mean-streets standards: single
  quotes, JSX double quotes, `noExplicitAny: error`,
  `noRestrictedGlobals` for `localStorage` / `sessionStorage`.
- 2026-04-23: `poc.html` archived at `docs/reference/poc.html`. It
  is the canonical reference for voxel-duel gameplay.
