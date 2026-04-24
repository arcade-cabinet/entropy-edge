---
title: Production Plan
updated: 2026-04-23
status: current
domain: context
---

# Production Plan — Rebuild from POC

One branch (`feat/rebuild-from-poc`), one PR, commits A→H. This
document is the live checklist. Update it as commits land.

## PR chain

| Commit | Subject                                                         | Status      |
| ------ | --------------------------------------------------------------- | ----------- |
| A      | Foundation — docs, deps, skeleton                               | shipped     |
| B      | Sim — rng, grid, shape grammar, stability solver, yuka-agent    | shipped     |
| C      | Render — JollyPixel wiring, custom BlockShapes, tileset         | shipped     |
| D      | ECS — Actors, components, duel controller                       | shipped     |
| E      | Seed + codename + URL share                                     | shipped     |
| F      | Audio — Tone.js ambient + per-shape SFX                         | shipped     |
| G      | Content pipeline — Zod schemas + compile-content                | shipped     |
| H      | Polish — landing, icons, cold-60s playthrough, APK              | shipped     |

## Commit A — Foundation

- [x] `package.json` dependency swap. Remove `@react-three/fiber`,
      `@react-three/drei`, `@react-three/rapier`, `koota`. Add
      `@jolly-pixel/{engine,runtime,voxel.renderer}`,
      `@dimforge/rapier3d-compat`, `yuka`, `seedrandom`, `zod`,
      `tone`, `gsap` + type packages.
- [x] Pre-compile-content hooks in `package.json` scripts
      (`predev`, `prebuild`, `pretypecheck`, `pretest`).
- [x] Biome aligned to mean-streets standards.
- [x] Move `poc.html` → `docs/reference/poc.html`.
- [x] Rewrite `CLAUDE.md`, `AGENTS.md`, `README.md`, `STANDARDS.md`.
- [x] Rewrite `docs/DESIGN.md`, `docs/ARCHITECTURE.md`,
      `docs/TESTING.md`, `docs/STATE.md`, `docs/PRODUCTION.md`.
- [x] Delete old game-specific src (`src/engine`, `src/store`,
      `src/ui/game`, `src/ui/shell`, `src/hooks`, `src/lib`).
- [x] Create new directory skeleton under `src/{sim,ecs,render,
      audio,data,platform,lib,hooks,ui}`.
- [x] Stub `src/ui/Game.tsx` with a minimal canvas host.
- [x] Stub `src/render/bridge/bootstrap.ts` with engine startup
      scaffolding.
- [x] Add `config/raw/` and `scripts/compile-content.mjs` stub so
      the pre-script hooks do not fail.
- [x] `pnpm install` succeeds with the new dep matrix.
- [x] `pnpm typecheck` passes.
- [x] `pnpm build` produces a bundle (may be minimal; full engine
      wired in commit C).

## Commit B — Sim

Pure TypeScript. No engine, no DOM, no React.

- [x] `src/sim/_shared/types.ts` — `Vec3`, `CellId`, `PlayerId`,
      `ShapeId`, domain types.
- [x] `src/sim/rng/index.ts` — seedrandom wrapper with named forks.
- [x] `src/sim/grid/index.ts` — integer lattice as
      `Map<"x,y,z", Cell>`. Place, remove, bounds check, collision
      check, 2×2 / 3×3 cell-group support.
- [x] `src/sim/shapes/index.ts` — shape grammar: predicates,
      assembly, reverse-transform.
  - [x] `plate2x2`, `plate3x3`, `plate4x4`
  - [x] `wedge` (2×2 + center)
  - [x] `pyramid` (3×3 + 2×2 + cap)
  - [x] `ziggurat` (nested plates)
  - [x] `lintel` (2 columns + 1 span)
  - [x] `beam` (2 columns + N span, ≤3)
  - [x] `arch` (2 columns + 2 diagonals, ≤5)
  - [x] `trussBridge` (2 columns + chords + webs, ≤8)
  - [x] `flyingButtress` (column + diagonal to ground)
  - [x] `diagonalBrace`, `kBrace`, `crossBrace`, `corbel`
- [x] `src/sim/stability/index.ts` — load/support/stress solver.
  - [x] `computeLoad(grid)` — transitive weight upward
  - [x] `computeSupport(grid)` — cells beneath within cantilever
        tolerance
  - [x] `flagStress(load, support)` — returns stressed cell ids
  - [x] `collapseChain(grid, seed)` — collapse propagation from a
        stress seed
- [x] `src/sim/placement/index.ts` — legal-placement + hologram
      validity (green/amber/red).
- [x] `src/sim/objective/index.ts` — pattern pool + feasibility gate.
- [x] `src/sim/duel/index.ts` — turn loop, budget, claim condition,
      monument marking.
- [x] `src/sim/session/index.ts` — session modes (standard /
      brutalist / vertigo / daily).
- [x] `src/sim/yuka-agent/index.ts` — Yuka goal tree matching the
      design.
- [x] Unit tests: `tests/unit/sim/**/*.test.ts`. Every public export
      has at least one test. Every shape predicate has positive +
      negative cases.

## Commit C — Render

- [x] `src/render/bridge/bootstrap.ts` — Rapier init, Runtime
      creation, VoxelRenderer wiring, tileset load.
- [x] `src/render/bridge/events.ts` — engine → React event bus for
      HUD updates.
- [x] `src/render/shapes/` — custom `BlockShape` classes for
      shapes JollyPixel doesn't ship:
  - [x] `PyramidBlock`
  - [x] `ArchBlock`
  - [x] `TrussBridgeBlock`
  - [x] `FlyingButtressBlock`
  - [x] `KBraceBlock`
  - [x] `CrossBraceBlock`
- [x] `src/render/layers/` — layer orchestrators:
  - [x] `player-layer.ts`
  - [x] `opponent-layer.ts`
  - [x] `monument-layer.ts`
  - [x] `hologram-layer.ts`
  - [x] `debris-layer.ts` (Rapier rigid bodies)
- [x] `src/render/tileset/` — PNG tileset + face-texture overrides
      for stress (red) / amber / stable (cyan).
- [x] `src/render/camera/` — isometric-ish orbit camera with
      pointer pinch/orbit.
- [x] Browser test: `tests/integration/render/voxel-mount.test.ts`
      mounts VoxelRenderer into real WebGL and places cells.

## Commit D — ECS

- [x] `src/ecs/actors/PlayerAgent.ts`
- [x] `src/ecs/actors/OpponentAgent.ts` — wraps sim yuka-agent.
- [x] `src/ecs/actors/DuelController.ts` — drives turn loop,
      advances sim, emits events.
- [x] `src/ecs/actors/SectorRoot.ts` — owns sector lifecycle.
- [x] `src/ecs/components/` — BlockRef, CompositeShapeRef,
      StressState, MonumentFlag.
- [x] `src/ecs/index.ts` — single export.
- [x] Integration test: full sector runs end-to-end sim-only (no
      renderer) and claim fires correctly.

## Commit E — Seed + Codename

- [x] `src/sim/rng/codename.ts` — noun/adjective combo generator
      from content pool.
- [x] `src/sim/rng/seed.ts` — parses `?seed=<codename>` param and
      constructs seedrandom from codename.
- [x] `src/ui/game/SeedBadge.tsx` — displays seed + copy-to-
      clipboard share.
- [x] `src/sim/session/daily.ts` — daily seed from UTC date.

## Commit F — Audio

- [x] `src/audio/ambient.ts` — Tone.js pad with low-pass filter
      cutoff tracking stability percentage.
- [x] `src/audio/sfx.ts` — per-shape commit chords (wedge =
      suspended fourth, pyramid = major triad, truss = shell
      voicing, etc.).
- [x] `src/audio/mixer.ts` — mute/unmute + master gain.
- [x] `src/audio/index.ts` — public API.
- [x] Rival commits use player palette shifted by a fifth.
- [x] Stress drone + collapse crash.

## Commit G — Content pipeline

- [x] `src/data/schemas.ts` — Zod schemas for every content file.
- [x] `config/raw/progression.json`
- [x] `config/raw/patterns.json` (per-band pattern pool)
- [x] `config/raw/shapes.json` (shape grammar metadata)
- [x] `config/raw/session-modes.json`
- [x] `config/raw/codename-words.json`
- [x] `config/raw/opponent-tuning.json`
- [x] `scripts/compile-content.mjs` — validate → emit
      `config/compiled/content.ts`.
- [x] `config/compiled/` in `.gitignore`.
- [x] `src/data/index.ts` — re-exports compiled content.

## Commit H — Polish

- [x] `src/ui/landing/Landing.tsx` — title, tagline, verb chips,
      CTA, framer-motion transitions.
- [x] Landing identity icons (truss silhouette).
- [x] Android/iOS app icons generated via
      `scripts/generate-mobile-icons.sh` (copy from mean-streets
      pattern).
- [x] Capacitor portrait lock + splash screen.
- [x] CSP meta in `index.html` allows `'unsafe-eval'` +
      `'wasm-unsafe-eval'` (Rapier WASM).
- [x] Cold-60s playthrough audit passes on desktop + mobile
      viewports via `scripts/snapshot.mjs`.
- [x] E2E `tests/e2e/duel.spec.ts` — landing → claim → next
      sector, no console errors.
- [x] Balance pass: every pattern in `patterns.json` plays through
      with feasibility gate green.
- [x] Version bumped and CHANGELOG.md updated.

## Quality gates (run before each commit's `git commit`)

1. `pnpm typecheck` — green
2. `pnpm lint` — green
3. `pnpm test` — green (once tests exist)
4. `pnpm build` — green, bundle ≤ 2.0 MB gzip
5. Player-journey gate in STANDARDS.md — all 7 checks green

## Triage queue

Empty. Issues found during implementation land here with `issue:`
prefix.
