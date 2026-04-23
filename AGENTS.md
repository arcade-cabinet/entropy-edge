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
2. Keep `pnpm test` green (engine + simulation tests).
3. Keep `pnpm build` green. Bundle ≤ 1.5 MB gzipped;
   Three.js + R3F is the budget anchor.
4. Preserve zero console errors on desktop (1280×800) + mobile-
   portrait (390×844) playthrough via `scripts/snapshot.mjs`.
5. Preserve the player-journey gate in [`STANDARDS.md`](./STANDARDS.md).

## Testing lanes

| Lane                 | Config                     | What it proves                         |
| -------------------- | -------------------------- | -------------------------------------- |
| `pnpm test:node`     | `vitest.config.ts`         | simulation, sector transitions, cues   |
| `pnpm test:dom`      | `vitest.dom.config.ts`     | jsdom presentational tests             |
| `pnpm test:browser`  | `vitest.browser.config.ts` | real-Chromium WebGL scene tests        |
| `pnpm test:e2e`      | `playwright.config.ts`     | full user journeys                     |

## Commit conventions

Conventional Commits. Types: `feat`, `fix`, `chore`, `docs`, `refactor`,
`perf`, `test`, `ci`, `build`. release-please reads these.

## Dependencies

Weekly dependabot, minor+patch grouped. Do NOT bump major versions
without a manual compat pass (three, @react-three/fiber,
@react-three/drei, koota, capacitor, react).
