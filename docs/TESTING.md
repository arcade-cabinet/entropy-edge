---
title: Testing
updated: 2026-04-23
status: current
domain: quality
---

# Testing

## Lanes

| Lane                | When it runs | Config                     | Covers                                       |
| ------------------- | ------------ | -------------------------- | -------------------------------------------- |
| `pnpm test:node`    | dev + CI     | `vitest.config.ts`         | sim layer: rng, grid, shapes, stability, yuka |
| `pnpm test:dom`     | dev + CI     | `vitest.dom.config.ts`     | jsdom presentational + React hook tests       |
| `pnpm test:browser` | dev + CI     | `vitest.browser.config.ts` | real-Chromium WebGL + VoxelRenderer mount     |
| `pnpm test:e2e`     | CI only      | `playwright.config.ts`     | full user journeys (landing → claim → next)   |

## What to test

### Sim layer (node, fast)

- **rng**: seedrandom determinism, fork stability, named streams do
  not collide.
- **grid**: place single cell, place 2×2 cluster, remove cell,
  out-of-bounds rejection, collision rejection.
- **shapes**: every predicate in the grammar — positive and
  negative cases. Transform fires on completion, reverse-transform
  fires on cell removal.
- **stability**: load propagation, support calculation, stress
  flagging, collapse chain. Cantilever legal/illegal with and
  without brace.
- **placement**: hologram validity (green/amber/red) for every
  legal and illegal case.
- **objective**: every pattern in `patterns.json` generates,
  feasibility gate passes for known-good patterns and rejects known-
  bad patterns.
- **duel**: turn handoff, budget enforcement, claim condition, draw
  condition, monument marking.
- **yuka-agent**: goal tree fires priorities in order; "reinforce
  own stress" outranks "build upward"; opponent places legal moves
  only.
- **session**: modes set correct parameters; daily seed is stable
  for a UTC date.

### DOM layer

- Landing page renders title, tagline, verb chips, CTA.
- CTA click dispatches the expected event.
- HUD overlay renders tier / budget / turn indicator.
- Overlay pause / resume cycle.

### Browser layer

- VoxelRenderer mounts into a real WebGL context.
- Tileset loads without CORS errors.
- Chunk rebuild on setVoxel.
- Face-culling on adjacent opaque voxels.

### E2E lane

Golden path:

1. Load the landing page (cold).
2. Click "Enter the Lattice".
3. Observe voxel canvas paints within 600ms.
4. Tap-drag to place a 2×2 plate.
5. Observe rival plays its turn.
6. Complete Sector 1 claim.
7. Observe sector transition.
8. No console errors throughout.

## Coverage

No strict coverage percentage. Required: every public export of
`src/sim/**` has at least one unit test. Every pattern in
`patterns.json` has a feasibility test. Every Yuka priority has a
positive test and a "not-fired" test when a higher priority exists.

## Snapshot

`scripts/snapshot.mjs` runs Playwright on desktop (1280×800) and
mobile (390×844) viewports, captures landing + in-play screenshots,
and asserts zero console errors. Run manually via
`pnpm exec node scripts/snapshot.mjs`. CI runs this automatically.
