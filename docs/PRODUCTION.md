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
| A      | Foundation — docs, deps, skeleton                               | in progress |
| B      | Sim — rng, grid, shape grammar, stability solver, yuka-agent    | pending     |
| C      | Render — JollyPixel wiring, custom BlockShapes, tileset         | pending     |
| D      | ECS — Actors, components, duel controller                       | pending     |
| E      | Seed + codename + URL share                                     | pending     |
| F      | Audio — Tone.js ambient + per-shape SFX                         | pending     |
| G      | Content pipeline — Zod schemas + compile-content                | pending     |
| H      | Polish — landing, icons, cold-60s playthrough, APK              | pending     |

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
- [ ] Delete old game-specific src (`src/engine`, `src/store`,
      `src/ui/game`, `src/ui/shell`, `src/hooks`, `src/lib`).
- [ ] Create new directory skeleton under `src/{sim,ecs,render,
      audio,data,platform,lib,hooks,ui}`.
- [ ] Stub `src/ui/Game.tsx` with a minimal canvas host.
- [ ] Stub `src/render/bridge/bootstrap.ts` with engine startup
      scaffolding.
- [ ] Add `config/raw/` and `scripts/compile-content.mjs` stub so
      the pre-script hooks do not fail.
- [ ] `pnpm install` succeeds with the new dep matrix.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build` produces a bundle (may be minimal; full engine
      wired in commit C).

## Commit B — Sim

Pure TypeScript. No engine, no DOM, no React.

- [ ] `src/sim/_shared/types.ts` — `Vec3`, `CellId`, `PlayerId`,
      `ShapeId`, domain types.
- [ ] `src/sim/rng/index.ts` — seedrandom wrapper with named forks.
- [ ] `src/sim/grid/index.ts` — integer lattice as
      `Map<"x,y,z", Cell>`. Place, remove, bounds check, collision
      check, 2×2 / 3×3 cell-group support.
- [ ] `src/sim/shapes/index.ts` — shape grammar: predicates,
      assembly, reverse-transform.
  - [ ] `plate2x2`, `plate3x3`, `plate4x4`
  - [ ] `wedge` (2×2 + center)
  - [ ] `pyramid` (3×3 + 2×2 + cap)
  - [ ] `ziggurat` (nested plates)
  - [ ] `lintel` (2 columns + 1 span)
  - [ ] `beam` (2 columns + N span, ≤3)
  - [ ] `arch` (2 columns + 2 diagonals, ≤5)
  - [ ] `trussBridge` (2 columns + chords + webs, ≤8)
  - [ ] `flyingButtress` (column + diagonal to ground)
  - [ ] `diagonalBrace`, `kBrace`, `crossBrace`, `corbel`
- [ ] `src/sim/stability/index.ts` — load/support/stress solver.
  - [ ] `computeLoad(grid)` — transitive weight upward
  - [ ] `computeSupport(grid)` — cells beneath within cantilever
        tolerance
  - [ ] `flagStress(load, support)` — returns stressed cell ids
  - [ ] `collapseChain(grid, seed)` — collapse propagation from a
        stress seed
- [ ] `src/sim/placement/index.ts` — legal-placement + hologram
      validity (green/amber/red).
- [ ] `src/sim/objective/index.ts` — pattern pool + feasibility gate.
- [ ] `src/sim/duel/index.ts` — turn loop, budget, claim condition,
      monument marking.
- [ ] `src/sim/session/index.ts` — session modes (standard /
      brutalist / vertigo / daily).
- [ ] `src/sim/yuka-agent/index.ts` — Yuka goal tree matching the
      design.
- [ ] Unit tests: `tests/unit/sim/**/*.test.ts`. Every public export
      has at least one test. Every shape predicate has positive +
      negative cases.

## Commit C — Render

- [ ] `src/render/bridge/bootstrap.ts` — Rapier init, Runtime
      creation, VoxelRenderer wiring, tileset load.
- [ ] `src/render/bridge/events.ts` — engine → React event bus for
      HUD updates.
- [ ] `src/render/shapes/` — custom `BlockShape` classes for
      shapes JollyPixel doesn't ship:
  - [ ] `PyramidBlock`
  - [ ] `ArchBlock`
  - [ ] `TrussBridgeBlock`
  - [ ] `FlyingButtressBlock`
  - [ ] `KBraceBlock`
  - [ ] `CrossBraceBlock`
- [ ] `src/render/layers/` — layer orchestrators:
  - [ ] `player-layer.ts`
  - [ ] `opponent-layer.ts`
  - [ ] `monument-layer.ts`
  - [ ] `hologram-layer.ts`
  - [ ] `debris-layer.ts` (Rapier rigid bodies)
- [ ] `src/render/tileset/` — PNG tileset + face-texture overrides
      for stress (red) / amber / stable (cyan).
- [ ] `src/render/camera/` — isometric-ish orbit camera with
      pointer pinch/orbit.
- [ ] Browser test: `tests/integration/render/voxel-mount.test.ts`
      mounts VoxelRenderer into real WebGL and places cells.

## Commit D — ECS

- [ ] `src/ecs/actors/PlayerAgent.ts`
- [ ] `src/ecs/actors/OpponentAgent.ts` — wraps sim yuka-agent.
- [ ] `src/ecs/actors/DuelController.ts` — drives turn loop,
      advances sim, emits events.
- [ ] `src/ecs/actors/SectorRoot.ts` — owns sector lifecycle.
- [ ] `src/ecs/components/` — BlockRef, CompositeShapeRef,
      StressState, MonumentFlag.
- [ ] `src/ecs/index.ts` — single export.
- [ ] Integration test: full sector runs end-to-end sim-only (no
      renderer) and claim fires correctly.

## Commit E — Seed + Codename

- [ ] `src/sim/rng/codename.ts` — noun/adjective combo generator
      from content pool.
- [ ] `src/sim/rng/seed.ts` — parses `?seed=<codename>` param and
      constructs seedrandom from codename.
- [ ] `src/ui/game/SeedBadge.tsx` — displays seed + copy-to-
      clipboard share.
- [ ] `src/sim/session/daily.ts` — daily seed from UTC date.

## Commit F — Audio

- [ ] `src/audio/ambient.ts` — Tone.js pad with low-pass filter
      cutoff tracking stability percentage.
- [ ] `src/audio/sfx.ts` — per-shape commit chords (wedge =
      suspended fourth, pyramid = major triad, truss = shell
      voicing, etc.).
- [ ] `src/audio/mixer.ts` — mute/unmute + master gain.
- [ ] `src/audio/index.ts` — public API.
- [ ] Rival commits use player palette shifted by a fifth.
- [ ] Stress drone + collapse crash.

## Commit G — Content pipeline

- [ ] `src/data/schemas.ts` — Zod schemas for every content file.
- [ ] `config/raw/progression.json`
- [ ] `config/raw/patterns.json` (per-band pattern pool)
- [ ] `config/raw/shapes.json` (shape grammar metadata)
- [ ] `config/raw/session-modes.json`
- [ ] `config/raw/codename-words.json`
- [ ] `config/raw/opponent-tuning.json`
- [ ] `scripts/compile-content.mjs` — validate → emit
      `config/compiled/content.ts`.
- [ ] `config/compiled/` in `.gitignore`.
- [ ] `src/data/index.ts` — re-exports compiled content.

## Commit H — Polish

- [ ] `src/ui/landing/Landing.tsx` — title, tagline, verb chips,
      CTA, framer-motion transitions.
- [ ] Landing identity icons (truss silhouette).
- [ ] Android/iOS app icons generated via
      `scripts/generate-mobile-icons.sh` (copy from mean-streets
      pattern).
- [ ] Capacitor portrait lock + splash screen.
- [ ] CSP meta in `index.html` allows `'unsafe-eval'` +
      `'wasm-unsafe-eval'` (Rapier WASM).
- [ ] Cold-60s playthrough audit passes on desktop + mobile
      viewports via `scripts/snapshot.mjs`.
- [ ] E2E `tests/e2e/duel.spec.ts` — landing → claim → next
      sector, no console errors.
- [ ] Balance pass: every pattern in `patterns.json` plays through
      with feasibility gate green.
- [ ] Version bumped and CHANGELOG.md updated.

## Quality gates (run before each commit's `git commit`)

1. `pnpm typecheck` — green
2. `pnpm lint` — green
3. `pnpm test` — green (once tests exist)
4. `pnpm build` — green, bundle ≤ 2.0 MB gzip
5. Player-journey gate in STANDARDS.md — all 7 checks green

## Triage queue

Empty. Issues found during implementation land here with `issue:`
prefix.
