---
title: Agent Operating Protocols
updated: 2026-04-23
status: current
---

# Entropy Edge — Agent Protocols

See [`CLAUDE.md`](./CLAUDE.md) for the Claude-specific version.

## Contract

Every change must:

1. Keep `pnpm typecheck` green.
2. Keep `pnpm test` green (sim + dom).
3. Keep `pnpm build` green. Bundle ≤ 2.0 MB gzipped; JollyPixel +
   Three.js + Rapier is the budget anchor.
4. Preserve zero console errors on desktop (1280×800) + mobile-
   portrait (390×844) playthrough via `scripts/snapshot.mjs`.
5. Preserve the player-journey gate in [`STANDARDS.md`](./STANDARDS.md).
6. Sim stays engine-free — no import of `three`, `@jolly-pixel/*`,
   `@dimforge/*`, `react`, `react-dom`, or anything DOM-related from
   `src/sim/**`.

## Three-layer contract

- **Sim** (`src/sim/**`) is pure. Takes inputs, returns outputs.
  Deterministic under a seeded RNG. Unit-tested in Node.
- **ECS** (`src/ecs/**`) owns JollyPixel actors/components. Bridges
  sim outputs into engine state.
- **Render** (`src/render/**`) reads ECS component state and draws.
  Never mutates sim.

Violations of this contract are bugs, not stylistic preferences.

## Testing lanes

| Lane                 | Config                     | What it proves                         |
| -------------------- | -------------------------- | -------------------------------------- |
| `pnpm test:node`     | `vitest.config.ts`         | sim, shape grammar, stability, Yuka    |
| `pnpm test:dom`      | `vitest.dom.config.ts`     | jsdom presentational tests             |
| `pnpm test:browser`  | `vitest.browser.config.ts` | real-Chromium WebGL scene tests        |
| `pnpm test:e2e`      | `playwright.config.ts`     | full user journeys                     |

## Commit conventions

Conventional Commits. Types: `feat`, `fix`, `chore`, `docs`, `refactor`,
`perf`, `test`, `ci`, `build`. release-please reads these.

## Dependencies

Weekly dependabot, minor+patch grouped. Do NOT bump major versions
without a manual compat pass (`three`, `@jolly-pixel/*`,
`@dimforge/rapier3d-compat`, `react`, `capacitor`, `yuka`, `tone`).
