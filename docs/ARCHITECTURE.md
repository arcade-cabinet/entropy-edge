---
title: Architecture
updated: 2026-04-23
status: current
domain: technical
---

# Architecture

## Stack

| Layer             | Choice                                                          |
| ----------------- | --------------------------------------------------------------- |
| Voxel renderer    | `@jolly-pixel/voxel.renderer` 1.4                               |
| ECS + actors      | `@jolly-pixel/engine` 2.5                                       |
| Runtime bootstrap | `@jolly-pixel/runtime` 3.3                                      |
| 3D                | `three` 0.183.2                                                 |
| Physics           | `@dimforge/rapier3d-compat` 0.19 (WASM, compat build)           |
| AI                | `yuka` 0.7 (goal-oriented behavior tree, steering)              |
| RNG               | `seedrandom` 3.0                                                |
| Validation        | `zod` 4.x                                                       |
| Audio             | `tone` 15.x                                                     |
| Animation (chrome)| `framer-motion` 11 (landing + overlay only, not canvas)         |
| UI framework      | `react` 19                                                      |
| Build             | `vite` 8                                                        |
| Test              | `vitest` 4 (node / jsdom / browser) + `playwright`              |
| Lint/format       | `biome` 2.4                                                     |
| Mobile wrap       | `capacitor` 8                                                   |

**Dropped from the prior extraction:** `@react-three/fiber`,
`@react-three/drei`, `@react-three/rapier`, `koota`.

## Three-layer contract

```
┌─────────────────────────────────────────────────────────────────┐
│  Sim (src/sim/**)                                               │
│    rng │ grid │ shapes │ stability │ placement │ objective       │
│    duel │ session │ yuka-agent │ _shared                         │
│    Pure TS. No three/react/@jolly-pixel/@dimforge imports.       │
└─────────────────┬───────────────────────────────────────────────┘
                  │ sim outputs (immutable data)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  ECS (src/ecs/**)                                               │
│    JollyPixel actors + components                                │
│    PlayerAgent │ OpponentAgent │ DuelController │ SectorRoot     │
│    Reads sim outputs, writes actor state. Never imports React.   │
└─────────────────┬───────────────────────────────────────────────┘
                  │ actor state (mutated per tick)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Render (src/render/**)                                         │
│    VoxelRenderer bridge │ custom BlockShapes │ tilesets          │
│    layers: player / opponent / monument / hologram / debris      │
│    Reads actor state read-only. Never mutates sim.               │
└─────────────────────────────────────────────────────────────────┘
```

Violations are bugs. The sim must stay unit-testable in Node.

## Data flow

```
pointer input (React capture on canvas)
    │
    ▼
src/sim/placement           → validity check
    │
    ▼
src/sim/shapes              → composite detection
    │
    ▼
src/sim/grid.placeCells()   → cells committed to lattice
    │
    ▼
src/sim/stability.solve()   → load / support / stress
    │
    ▼
src/sim/duel.advance()      → turn handoff
    │
    ▼
yuka-agent.plan()           → rival turn
    │
    ▼
src/ecs/DuelController      → actor state updated
    │
    ▼
src/render/bridge           → VoxelRenderer.setVoxel / save / load
    │
    ▼
@jolly-pixel/voxel.renderer → dirty chunks rebuilt, canvas drawn
```

## Engine wiring

### JollyPixel bootstrap

`src/render/bridge/bootstrap.ts` owns the engine startup:

```ts
import { Runtime, loadRuntime } from '@jolly-pixel/runtime';
import * as Rapier from '@dimforge/rapier3d-compat';
import { VoxelRenderer } from '@jolly-pixel/voxel.renderer';

await Rapier.init();
const runtime = new Runtime({ canvas });
const world = runtime.world;
const map = world.createActor('lattice').addComponentAndGet(VoxelRenderer, {
  chunkSize: 16,
  layers: ['player', 'opponent', 'monument'],
  blocks: blockDefinitions,
  rapier: { world: rapierWorld, colliderKind: 'box' },
});
await map.loadTileset({ id: 'default', src: 'tileset/entropy-edge.png', tileSize: 32 });
await loadRuntime(runtime);
```

### Sim ↔ ECS handoff

Sim outputs immutable `PlacementResult` and `StabilityResult`
objects. `DuelController` (an Actor) reads these and calls
`VoxelRenderer.setVoxel` / `VoxelRenderer.removeVoxel` on the
correct layer. Stress flags become per-face texture overrides via
VoxelRenderer's face texture API.

### Rapier integration

VoxelRenderer exposes `"box"` or `"trimesh"` colliders rebuilt per
dirty chunk. Stable structure = static colliders. On collapse, the
sim emits a `CollapseEvent` with the falling cell IDs; the ECS
removes those cells from the voxel layer and spawns dynamic rigid
bodies at their world positions. Rapier simulates the fall; React
UI never sees the physics frames.

## Directory layout

```
src/
  sim/                 pure TS
    rng/
    grid/
    shapes/
    stability/
    placement/
    objective/
    duel/
    session/
    yuka-agent/
    _shared/
  ecs/                 JollyPixel actors + components
  render/
    bridge/
    layers/
    shapes/            custom BlockShape classes
    tileset/
    index.ts
  audio/
    ambient.ts
    sfx.ts
    mixer.ts
    index.ts
  data/                compiled content re-exports
  platform/
    capacitor.ts
    storage.ts
    haptics.ts
  lib/
  hooks/
  theme/
  ui/
    landing/
    game/
    overlays/
```

## Content pipeline

`config/raw/*.json` is hand-edited. `scripts/compile-content.mjs`
validates each file against its Zod schema and emits
`config/compiled/content.ts` (gitignored). The pipeline runs in
`predev` / `prebuild` / `pretypecheck` / `pretest` hooks — the
compiled content is always present when TS compiles.

Pipeline files:

- `progression.json` — log-curve difficulty parameters
- `patterns.json` — pattern pool per difficulty band
- `shapes.json` — shape grammar metadata (palette, structural role)
- `session-modes.json` — session-mode tunings
- `codename-words.json` — noun / adjective pools
- `opponent-tuning.json` — Yuka behavior weights per band

## Determinism

- Everything random flows through a single `Rng` instance from
  `src/sim/rng`, itself seeded from `seedrandom`.
- Named sub-streams per subsystem: `rng.fork('objective')`,
  `rng.fork('opponent')`, `rng.fork('codename')`. Forking is stable
  under the same parent seed.
- Pattern selection, parameter rolls, codename selection, and
  opponent tiebreaks all use seeded streams.
- Physics is *not* deterministic. Collapse events are emitted as
  deterministic sim outputs; Rapier only simulates the visual fall,
  and the sim continues independently. A test replay runs sim-only.

## React / canvas separation

`src/main.tsx` mounts React only. The `<Game>` component hosts the
canvas element and calls the engine bootstrap. React owns:

- Landing page (framer-motion transitions)
- HUD overlays (tier gauge, budget counters, turn indicator, seed)
- Pause / settings / game-over modals
- End-of-sector claim panel

The canvas runs the engine loop independently. Sim messages flow
from engine → React via a lightweight event bus
(`src/render/bridge/events.ts`).

## Capacitor + mobile

- Portrait-locked via `@capacitor/screen-orientation` in
  `src/platform/capacitor.ts`.
- Preferences-backed storage via
  `@capacitor/preferences` (`src/platform/storage.ts`). Biome
  blocks `localStorage` / `sessionStorage`.
- Haptic feedback on shape-commit via `@capacitor/haptics`.
- Android debug APK built in CI; see `docs/DEPLOYMENT.md`.
