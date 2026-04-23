---
title: Architecture
updated: 2026-04-23
status: current
domain: technical
---

# Architecture

## Stack

| Layer              | Choice                                          |
| ------------------ | ----------------------------------------------- |
| Rendering          | @react-three/fiber + @react-three/drei + three  |
| ECS                | Koota (entity/traits/world)                     |
| UI framework       | React 19                                        |
| State              | React hooks + Koota traits (via `useTrait`)     |
| Animation (chrome) | framer-motion                                   |
| Build              | Vite 8                                          |
| Test               | Vitest 4 (node / jsdom / browser) + Playwright  |
| Lint/format        | Biome 2.4                                       |
| Mobile wrap        | Capacitor 8                                     |

No Tailwind build. Identity lives in `src/theme/global.css` + inline
styles; a pinned utility subset lives in `src/theme/tw.css`.

## Data flow

```
user input (keyboard / touch joystick)
        ↓
  useKeyboardMovementInput / FloatingJoystick
        ↓
  useGameLoop tick(dt)
        ↓
  simulation.tick(state, dt, movement)
        ↓
  entropyEntity.set(EntropyTrait, next)
  entropyEntity.set(ScoreTrait, ...)
  entropyEntity.set(TimerTrait, ...)
        ↓
  useTrait subscribers re-render → EdgeScene + HUD
```

Traits are the single source of truth for phase and gameplay data.
React hooks read via `useTrait`; the game loop writes via
`entity.set(...)`. This keeps the WebGL scene, HUD, and overlays in
sync without prop-drilling.

## Files you'll edit most

- `src/engine/simulation.ts` — sector seed tables, modifier matrix,
  tick/route/surge logic, completion cues.
- `src/engine/types.ts` — `EntropyState` and friends.
- `src/ui/game/EdgeScene.tsx` — the R3F scene (grid + anchors +
  hazards + route lines + shockwaves + camera).
- `src/ui/game/HUD.tsx` — DOM stat row.
- `src/ui/Game.tsx` — phase orchestrator + movement + save.
- `src/store/traits.ts` + `store/world.ts` — Koota setup.
- `src/theme/*` — palette + CSS.

## Responsibilities

| Responsibility                 | Owner                            |
| ------------------------------ | -------------------------------- |
| Deterministic state advance    | `src/engine/simulation.ts`       |
| Phase / score / timer state    | Koota traits in `src/store/`     |
| 3D rendering                   | `src/ui/game/EdgeScene.tsx`      |
| HUD overlay                    | `src/ui/game/HUD.tsx`            |
| Save slot / last run           | `src/hooks/runtimeResult.ts` +   |
|                                | `useRunSnapshotAutosave`         |

Save keys: `entropy-edge:v1:save`, `entropy-edge:v1:last-run`,
`entropy-edge:v1:best-score`.

## Performance contract

- Target 60 FPS on mid-tier mobile (iPhone 12, Pixel 6).
- Grid size is 11×11 = 121 cells. Anchor count ≤ 5 per sector.
- Falling blocks cap at 12 active.
- If a frame drops below 50 FPS on mobile, reduce the ambient light
  shadow map size and drop the OrbitControls auto-rotate on playing.

## Build budget

- JS ≤ 1.5 MB gzipped (Three.js is the budget anchor). Currently
  ~355 KB gzip.
- CSS ≤ 50 KB (~16 KB).
- Fonts: Space Grotesk + Inter + JetBrains Mono, weights 400/500/600.
