---
title: Testing
updated: 2026-04-23
status: current
domain: quality
---

# Testing

## Lanes

| Lane                 | When it runs | Config                     | Covers                                     |
| -------------------- | ------------ | -------------------------- | ------------------------------------------ |
| `pnpm test:node`     | dev + CI     | `vitest.config.ts`         | simulation, sector transitions, cue tables |
| `pnpm test:dom`      | dev + CI     | `vitest.dom.config.ts`     | jsdom presentational tests                 |
| `pnpm test:browser`  | dev + CI     | `vitest.browser.config.ts` | real-Chromium WebGL scene tests            |
| `pnpm test:e2e`      | CI only      | `playwright.config.ts`     | full user journeys                         |

## What to test

- **Engine invariants**: `simulation` is deterministic. Seeded
  inputs must produce the same sector transitions, score progression,
  and completion cue every run.
- **Palette lock**: any change to `src/theme/tokens.ts` gets a dom
  test asserting CSS vars are still exposed.
- **WebGL smoke**: a browser test mounts `<Game />` and asserts the
  canvas paints without throwing.
- **Player journey**: e2e journey spec (load → click Initialize Link
  → wait 5s → assert Sector 1 visible → return to menu).

## Coverage

Target 80% on `src/engine/` and `src/lib/`. R3F scene and HUD
covered by browser + e2e.

## Screenshots

E2E screenshots land in `test-results/` (gitignored). Headless
harness screenshots land in `/tmp/ee-*.png` via
`node scripts/snapshot.mjs`.
