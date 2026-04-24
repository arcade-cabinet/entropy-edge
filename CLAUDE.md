---
title: Claude Code Instructions
updated: 2026-04-23
status: current
---

# Entropy Edge — Agent Instructions

## What This Is

A structural-duel roguelite. Two builders — you and a Yuka-driven
opponent — race to satisfy the same sector objective: reach a tier
target while holding connectivity thresholds at intermediate tiers.
Every placement is a voxel on the same shared lattice; every voxel
has load, every support has a footprint, and the stability solver
drops structures that can't carry themselves.

The game is **Scrabble with physics**. The opponent isn't trying to
stop you; it's trying to finish the same goal more efficiently. You
can build on each other's structures — anchor a brace to their
column, cap their tower, sit a platform across the gap between you.
Whoever satisfies the sector goal first claims it, and the blocks
that were load-bearing at claim-time become permanent monuments
that persist as the ground floor of the next sector.

A run is a single cumulative skyscraper of your duels.

## Critical Rules

1. **Sim is deterministic and engine-free.** `src/sim/**` is pure
   TypeScript: rng, grid, shape grammar, stability solver, objective
   generator, Yuka agent, session modes. No Three.js, no DOM, no
   React. Unit-testable in Node.
2. **JollyPixel is the engine.** `@jolly-pixel/voxel.renderer` owns
   the voxel chunks, face culling, tileset textures, save/load, and
   Rapier3D physics. `@jolly-pixel/engine` (ECS + Actors) replaces
   Koota entirely. `@jolly-pixel/runtime` bootstraps the canvas.
3. **React owns the UI chrome.** Landing, HUD overlays, settings,
   game-over screens are React. The canvas is a sibling to React;
   React does not re-render it.
4. **Three-layer contract.** `sim` (pure data) → `ecs` (JollyPixel
   actors/components) → `render` (queries read-only). Render never
   mutates sim; sim never imports React or Three.
5. **Pointer events only.** `pointerdown` / `pointermove` /
   `pointerup`. No `keydown`, no `mousedown`. Mobile-first across
   every input path including the camera orbit and size picker.
6. **Content is Zod-validated and compiled.** `config/raw/*.json` →
   Zod schema → `scripts/compile-content.mjs` →
   `config/compiled/content.ts` (gitignored). Compile runs in the
   `predev` / `prebuild` / `pretypecheck` / `pretest` hooks.
7. **Seed-driven determinism.** `seedrandom` with URL-shareable
   `?seed=<codename>`. Same seed + same inputs = same run.
8. **Biome, not ESLint. pnpm only.** `pnpm lint` runs Biome.
   `quoteStyle: single`. `noExplicitAny: error`. `noNonNullAssertion:
   warn`. No `package-lock.json`, no `yarn.lock`.
9. **Capacitor Android is portrait-locked** via
   `@capacitor/screen-orientation`.
10. **No storage globals.** Biome blocks `localStorage` /
    `sessionStorage`. Use `src/platform/storage.ts`
    (Capacitor-Preferences-backed).

## Commands

```bash
pnpm dev                 # Vite dev server (pre-runs compile-content)
pnpm build               # tsc + vite build
pnpm typecheck           # tsc -b --pretty false
pnpm lint                # Biome
pnpm test                # test:node + test:dom
pnpm test:browser        # real Chromium via @vitest/browser-playwright
pnpm test:e2e            # Playwright end-to-end
pnpm compile-content     # config/raw → config/compiled/content.ts
pnpm cap:sync            # build + cap sync (android)
pnpm cap:run:android     # pnpm cap:sync && cap run android
```

## Project Structure

```
src/
  sim/                     pure TS — no engine, no DOM, no React
    rng/                   seedrandom wrapper, named streams
    grid/                  integer lattice, Map<"x,y,z", Cell>
    shapes/                shape grammar: predicates, assembly, transforms
    stability/             load/support/stress solver
    placement/             legal-placement checks (hologram feedback)
    objective/             generator, feasibility gate, connectivity check
    duel/                  turn loop, win condition, monument claim
    session/               session modes, difficulty spine
    yuka-agent/            Yuka behavior tree (same goal as player)
    _shared/               Vec3, types

  ecs/                     JollyPixel Actors + Components
  render/                  canvas bridge, custom BlockShape classes, tilesets
    layers/                player / opponent / monument / hologram / debris
  audio/                   Tone.js ambient + SFX
  data/                    compiled content re-exports + Zod types
  platform/                capacitor + storage + haptics
  lib/                     generic helpers
  hooks/                   generic React hooks
  theme/                   tokens, global.css, tw.css
  ui/                      React UI chrome
    landing/               landing page + start CTA
    game/                  HUD overlays
    overlays/              pause, settings, game-over, share

config/raw/                Zod-validated content JSON (tracked)
config/compiled/           emitted content.ts (gitignored)
scripts/compile-content.mjs
tests/unit/                vitest node
tests/integration/         vitest dom
docs/                      PRODUCTION.md is the live PR-chain plan
```

## Design palette (locked)

See [`docs/DESIGN.md`](docs/DESIGN.md) for rationale.

```
--color-bg:        #07080a   void graphite (background)
--color-graphite:  #0f1115   voxel chunk base
--color-surface:   #1a1d24   HUD surfaces
--color-signal:    #ff6b1a   signal orange (title, CTA, your player)
--color-beacon:    #21d4ff   cyan beacon (stable edges, objective tier)
--color-rival:     #7d5cff   violet rival (opponent blocks, opponent monuments)
--color-fg:        #dce1e8   chrome white
--color-fg-muted:  #7a8190   muted chrome
--color-warn:      #ff375f   stress / collapse red
--color-amber:     #ffae00   unbraced-cantilever amber
--color-monument:  #2ee5b8   mint (your claimed monuments)
```

Display font: Space Grotesk (geometric uppercase).
Body font: Inter (HUD + body).
Mono font: JetBrains Mono (tier numerics, seed, score).

## Reference

- `docs/reference/poc.html` — the original 633-line proof of concept.
  Preserved for reference only; not served.
- `docs/PRODUCTION.md` — PR chain A→H with acceptance criteria.
- `docs/DESIGN.md` — gameplay identity, duel rules, shape grammar.
- `docs/ARCHITECTURE.md` — sim/ecs/render contract, engine wiring.
